import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("profile", "routes/profile.tsx"),
  route("course/:slug", "routes/course.$slug.tsx"),
  route("certificate/:id", "routes/certificate.$id.tsx"),
] satisfies RouteConfig;
