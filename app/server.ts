import { Hono } from "hono";
import { reactRouter } from "hono-react-router-adapter";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
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
  const db = drizzle(c.env.DB, { schema });
  const allCourses = await db.query.courses.findMany({
    where: (courses, { eq }) => eq(courses.published, true),
  });
  return c.json(allCourses);
});

app.get("/api/course/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = drizzle(c.env.DB, { schema });

  const course = await db.query.courses.findFirst({
    where: (courses, { eq }) => eq(courses.slug, slug),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
        with: {
          activities: {
            orderBy: (activities, { asc }) => [asc(activities.sortOrder)],
          },
        },
      },
    },
  });

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  return c.json(course);
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
