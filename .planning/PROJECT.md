# leanlearn

A very lean course platform deployed on Cloudflare stack, featuring Google sign-in via Better Auth, course progress tracking, and automated certificate issuance.

## Context
- **Stack:** Cloudflare Workers, Hono, Cloudflare D1, Better Auth.
- **Architecture:** Inspired by `cloudflare/templates` (specifically `react-router-hono-fullstack-template`).
- **Framework:** React Router v7 (Full-stack) with Hono as the server entry point.
- **Inspiration:** LearnHouse (course structure, completion criteria, certificates).
- **Core Value:** Minimalist, fast, and automated learning platform for single courses.

## Strategy
- **Frontend/Fullstack:** React Router v7 (Vite-based) for UI and routing.
- **Backend:** Hono on Cloudflare Workers (Single Worker pattern).
- **Auth:** Better Auth (Google sign-in only for MVP), integrated as Hono middleware.
- **Database:** Cloudflare D1 (Auth tables + Learning state).
- **Migrations:** Managed via `wrangler d1 migrations` (following `d1-template`).
- **Logic:** Progress = completed required activities / total required activities. Certificates issued at 100%.

## Technical Requirements
- Single worker deployment (`_worker.js` or entry point) handling both API and UI.
- Hono middleware for session validation via Better Auth.
- D1 bindings accessed via Hono context (`c.env.DB`).
- CSS-based certificate generation for lean performance.
