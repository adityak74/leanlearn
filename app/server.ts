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

const app = new Hono<{ Bindings: Bindings }>();

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

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = getAuth(c);
  return auth.handler(c.req.raw);
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
  })
);

export default app;
