import { Hono } from "hono";
import { reactRouter } from "hono-react-router-adapter";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "./db/schema";

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

type Variables = {
  user: any;
  session: any;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Better Auth factory
export const getAuth = (c: { env: Bindings; executionCtx: ExecutionContext }) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(c.env.DB), {
      provider: "sqlite",
      schema: schema,
    }),
    secret: c.env.BETTER_AUTH_SECRET,
    baseURL: c.env.BETTER_AUTH_URL,
    socialProviders: {
      google: {
        clientId: c.env.GOOGLE_CLIENT_ID,
        clientSecret: c.env.GOOGLE_CLIENT_SECRET,
      },
    },
    advanced: {
      runInBackground: (fn) => {
        c.executionCtx.waitUntil(fn());
      },
    },
  });
};

// Session Middleware
app.use("*", async (c, next) => {
  const auth = getAuth(c);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
  }

  await next();
});

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = getAuth(c);
  return auth.handler(c.req.raw);
});

// Course API routes
app.get("/api/me/courses", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  
  const allCourses = await db.query.courses.findMany({
    where: (courses, { eq }) => eq(courses.published, true),
    with: {
      progresses: user ? {
        where: (progress, { eq }) => eq(progress.userId, user.id),
      } : undefined,
    },
  });

  const coursesWithProgress = allCourses.map((course: any) => {
    const progress = course.progresses?.[0];
    const { progresses, ...courseData } = course;
    return {
      ...courseData,
      progressPercent: progress?.progressPercent ?? 0,
      completedAt: progress?.completedAt ?? null,
    };
  });

  return c.json(coursesWithProgress);
});

app.get("/api/course/:slug", async (c) => {
  const user = c.get("user");
  const slug = c.req.param("slug");
  const db = drizzle(c.env.DB, { schema });

  const course = await db.query.courses.findFirst({
    where: (courses, { eq }) => eq(courses.slug, slug),
    with: {
      progresses: user ? {
        where: (progress, { eq }) => eq(progress.userId, user.id),
      } : undefined,
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
        with: {
          activities: {
            orderBy: (activities, { asc }) => [asc(activities.sortOrder)],
            with: {
              completions: user ? {
                where: (completion, { eq }) => eq(completion.userId, user.id),
              } : undefined,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const progress = (course as any).progresses?.[0];
  const chaptersWithCompletion = course.chapters.map((chapter: any) => ({
    ...chapter,
    activities: chapter.activities.map((activity: any) => {
      const { completions, ...activityData } = activity;
      return {
        ...activityData,
        completed: completions && completions.length > 0,
      };
    }),
  }));

  const { progresses, chapters, ...courseData } = course as any;
  return c.json({
    ...courseData,
    progressPercent: progress?.progressPercent ?? 0,
    completedAt: progress?.completedAt ?? null,
    chapters: chaptersWithCompletion,
  });
});

// Activity Completion API
app.post("/api/activity/:id/complete", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const activityId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  // 1. Find the activity and its course
  const activity = await db.query.activities.findFirst({
    where: (activities, { eq }) => eq(activities.id, activityId),
    with: {
      chapter: true,
    },
  });

  if (!activity) {
    return c.json({ error: "Activity not found" }, 404);
  }

  const courseId = activity.chapter.courseId;

  // 2. Mark activity as complete
  const existingCompletion = await db.query.activityCompletion.findFirst({
    where: (ac, { and, eq }) =>
      and(eq(ac.userId, user.id), eq(ac.activityId, activityId)),
  });

  if (!existingCompletion) {
    await db.insert(schema.activityCompletion).values({
      id: crypto.randomUUID(),
      userId: user.id,
      activityId: activityId,
      completedAt: new Date(),
    });
  }

  // 3. Calculate progress
  // Fetch all required activities for the course
  const allRequiredActivities = await db
    .select({ id: schema.activities.id })
    .from(schema.activities)
    .innerJoin(
      schema.chapters,
      eq(schema.activities.chapterId, schema.chapters.id)
    )
    .where(
      and(
        eq(schema.chapters.courseId, courseId),
        eq(schema.activities.required, true)
      )
    );

  const totalRequired = allRequiredActivities.length;

  // Fetch completed required activities for this user/course
  const completedRequiredActivities = await db
    .select({ id: schema.activities.id })
    .from(schema.activityCompletion)
    .innerJoin(
      schema.activities,
      eq(schema.activityCompletion.activityId, schema.activities.id)
    )
    .innerJoin(
      schema.chapters,
      eq(schema.activities.chapterId, schema.chapters.id)
    )
    .where(
      and(
        eq(schema.activityCompletion.userId, user.id),
        eq(schema.chapters.courseId, courseId),
        eq(schema.activities.required, true)
      )
    );

  const completedRequired = completedRequiredActivities.length;
  const progressPercent = totalRequired > 0 
    ? Math.round((completedRequired / totalRequired) * 100) 
    : 100;

  // 4. Update course progress
  const existingProgress = await db.query.courseProgress.findFirst({
    where: (cp, { and, eq }) =>
      and(eq(cp.userId, user.id), eq(cp.courseId, courseId)),
  });

  if (existingProgress) {
    await db
      .update(schema.courseProgress)
      .set({
        progressPercent,
        updatedAt: new Date(),
        completedAt: progressPercent === 100 ? new Date() : null,
      })
      .where(eq(schema.courseProgress.id, existingProgress.id));
  } else {
    await db.insert(schema.courseProgress).values({
      id: crypto.randomUUID(),
      userId: user.id,
      courseId: courseId,
      progressPercent,
      updatedAt: new Date(),
      completedAt: progressPercent === 100 ? new Date() : null,
    });
  }

  return c.json({ success: true, progressPercent });
});

// API routes
app.get("/api/health", (c) => c.json({ status: "ok" }));

// The React Router handler
app.use(
  "*",
  reactRouter({
    // @ts-expect-error - virtual module
    build: () => import("virtual:react-router/server-build"),
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    getLoadContext: (c) => ({
      user: c.get("user"),
      session: c.get("session"),
      env: c.env,
    }),
  })
);

export default app;
