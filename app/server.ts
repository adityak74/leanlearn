import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { createMiddleware } from "hono/factory";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "./db/schema";
import * as dotenv from "dotenv";

// Load .dev.vars in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".dev.vars" });
}

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  NODE_ENV?: string;
};

type Variables = {
  user: any;
  session: any;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

import { getDb } from "./db/db.server";
import { serveStatic } from "@hono/node-server/serve-static";

// Helper to get env variable with fallback
const getEnv = (c: { env: Bindings }, key: keyof Bindings): any => {
  return c.env?.[key] || (process.env as any)[key];
};

// Better Auth factory
export const getAuth = (c: { env: Bindings; executionCtx: ExecutionContext }) => {
  const db = getDb(c.env);
  
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    secret: getEnv(c, "BETTER_AUTH_SECRET"),
    baseURL: getEnv(c, "BETTER_AUTH_URL"),
    socialProviders: {
      google: {
        clientId: getEnv(c, "GOOGLE_CLIENT_ID"),
        clientSecret: getEnv(c, "GOOGLE_CLIENT_SECRET"),
      },
    },
    advanced: {
      runInBackground: (fn: any) => {
        if (c.executionCtx?.waitUntil) {
          c.executionCtx.waitUntil(fn());
        } else {
          fn();
        }
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
  const db = getDb(c);
  
  const allCourses = await db.query.courses.findMany({
    where: (courses, { eq }) => eq(courses.published, true),
    with: {
      progresses: user ? {
        where: (progress, { eq }) => eq(progress.userId, user.id),
      } : undefined,
    },
  });

  const coursesWithProgress = allCourses.map((course: any) => {
    const progress = (course as any).progresses?.[0];
    const { progresses, ...courseData } = course as any;
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
  const db = getDb(c);

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
      const { completions, ...activityData } = activity as any;
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
  const db = getDb(c);

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

// Static assets caching middleware
app.use("/assets/*", async (c, next) => {
  await next();
  c.header("Cache-Control", "public, max-age=31536000, immutable");
});

// Serve static files
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./build/client" }));
}

// The React Router handler implemented as the catch-all
app.all("*", async (c) => {
  const build = await import("virtual:react-router/server-build");
  const mode = c.env?.NODE_ENV || "development";
  const handler = createRequestHandler(build, mode);
  const loadContext = {
    user: c.get("user"),
    session: c.get("session"),
    env: c.env || {},
  };
  
  return handler(c.req.raw, loadContext);
});

export default app;
