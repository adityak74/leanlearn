import { Hono } from "hono";
import { reactRouter } from "hono-react-router-adapter";

const app = new Hono();

// You can add API routes here
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
