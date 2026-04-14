# Phase 01: Foundation - Research

**Researched:** 2024-11-20
**Domain:** Better Auth v1, Hono, Cloudflare Workers, D1, React Router v7
**Confidence:** HIGH

## Summary

This research covers the integration of Better Auth (latest/v1) with Hono on Cloudflare Workers using D1 for persistence and Google OAuth for authentication. It also outlines the unified project structure for Hono and React Router v7 on Cloudflare Pages using `hono-react-router-adapter`.

**Primary recommendation:** Use `hono-react-router-adapter` to wrap the React Router v7 application in a Hono server, enabling unified middleware (like Better Auth) and easy access to Cloudflare bindings via Hono context.

## User Constraints (from CONTEXT.md)

*No CONTEXT.md found. Using requirements from REQUIREMENTS.md and ROADMAP.md.*

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `better-auth` | Latest | Authentication | Modern, framework-agnostic, works on the edge. |
| `hono` | ^4.0.0 | API Framework | Lightweight, edge-native, great for Workers. |
| `react-router` | ^7.0.0 | Frontend Framework | Evolution of Remix, optimized for Cloudflare. |
| `drizzle-orm` | Latest | ORM | Type-safe, D1 compatible, required for Better Auth adapter. |
| `hono-react-router-adapter` | Latest | Integration | Bridges Hono middleware with React Router v7. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `@better-auth/cli` | Latest | Schema Generation | For generating database migrations. |
| `drizzle-kit` | Latest | Migrations | Managing D1 schema changes. |

**Installation:**
```bash
npm install better-auth hono drizzle-orm hono-react-router-adapter
npm install -D @react-router/dev @react-router/cloudflare @better-auth/cli drizzle-kit @hono/vite-dev-server
```

## Architecture Patterns

### Recommended Project Structure
```
.
├── app/
│   ├── routes/             # React Router v7 routes
│   ├── root.tsx            # RR Root component
│   ├── server.ts           # Hono Server Entry (Better Auth logic here)
│   └── db/
│       └── schema.ts       # Drizzle Schema (Tables for Auth + Business Logic)
├── public/                 # Static assets
├── package.json
├── react-router.config.ts
├── vite.config.ts          # Vite config with Hono & RR plugins
└── wrangler.jsonc          # Cloudflare configuration
```

### Pattern 1: Request-Scoped Auth Initialization
Cloudflare D1 bindings are only available within the request context. Do not use a global auth singleton.

```typescript
// app/server.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";

export const getAuth = (c: Context) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(c.env.DB), {
      provider: "sqlite",
      schema,
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
```

### Pattern 2: Hono Middleware for Auth
Mount Better Auth handlers and provide session context to loaders.

```typescript
const app = new Hono<{ Bindings: Env }>();

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = getAuth(c);
  return auth.handler(c.req.raw);
});

app.use("*", async (c, next) => {
  const auth = getAuth(c);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
});
```

## D1 Schema for Better Auth

Better Auth requires the following tables in SQLite/D1. Verified via CLI patterns [VERIFIED: better-auth.com].

```typescript
// app/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id),
});

export const account = sqliteTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
});
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth Handlers | Custom redirect logic | Better Auth `socialProviders` | Handles state, PKCE, and callback security automatically. |
| Session Validation | Manual cookie parsing | Better Auth `api.getSession` | Handles JWT/Cookie validation, rotation, and D1 lookups. |
| Background Tasks | Raw `waitUntil` logic | `advanced.runInBackground` | Better Auth provides a clean hook for edge background task execution. |

## Common Pitfalls

### Pitfall 1: Missing `waitUntil`
**What goes wrong:** Sessions don't persist or cleanup fails silently.
**Why it happens:** Cloudflare kills the Worker as soon as the response is sent.
**How to avoid:** Always wrap Better Auth's background tasks in `c.executionCtx.waitUntil` via the `advanced.runInBackground` hook.

### Pitfall 2: Local vs. Production `BETTER_AUTH_URL`
**What goes wrong:** OAuth redirects fail with "Mismatch URI".
**Why it happens:** Better Auth uses this URL to construct redirect targets.
**How to avoid:** Use `.dev.vars` for local (`http://localhost:8787`) and `wrangler.toml` secret or environment variable for production.

### Pitfall 3: D1 Binding Scope
**What goes wrong:** `TypeError: Cannot read property 'prepare' of undefined`.
**Why it happens:** Attempting to initialize Drizzle/Better Auth outside of the Hono request handler.
**How to avoid:** Factory pattern (`getAuth(c)`) within the request lifecycle.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Cloudflare D1 | Persistence | ✓ | — | — |
| Google Cloud Console | OAuth | — | — | Needs manual setup (Client ID/Secret) |
| wrangler | Deployment | ✓ | Latest | — |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Better Auth Google Provider |
| V3 Session Management | yes | Better Auth Session Storage in D1 |
| V4 Access Control | yes | Hono Middleware `c.get('session')` |
| V5 Input Validation | yes | Zod (for any additional API inputs) |

### Known Threat Patterns for better-auth

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Session Hijacking | Information Disclosure | Better Auth secure cookies + IP/User-Agent tracking |
| CSRF | Tampering | Better Auth built-in CSRF protection on POST requests |

## Sources

### Primary (HIGH confidence)
- `better-auth.com` docs - Hono & Cloudflare integration details.
- `hono.dev` docs - Cloudflare Workers & Context Storage.
- `github.com/yusukebe/hono-react-router-adapter` - RRv7 integration pattern.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are active and well-documented.
- Architecture: HIGH - Pattern is standard for Hono/Workers.
- Pitfalls: HIGH - Documented in community issues and docs.

**Research date:** 2024-11-20
**Valid until:** 2024-12-20
