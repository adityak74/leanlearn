# Phase 05: Polish & Deployment - Research

**Researched:** 2024-05-22
**Domain:** Learner Profile, Cloudflare Deployment, Performance & UI Polish
**Confidence:** HIGH

## Summary

This phase finalizes the `leanlearn` application by adding a dedicated Learner Profile page, optimizing the application for performance, and ensuring a production-ready deployment on Cloudflare. The technical foundation (Hono, RRv7, D1, Better Auth) is stable. The focus shifts from feature building to "Lean" experience refinement—cleaner CSS, faster loads, and robust deployment configuration.

**Primary recommendation:** Use React Router v7 loaders for the Profile page to fetch aggregated statistics and certificate history in parallel. Adopt a "Vanilla CSS" system with CSS variables for a maintainable "Lean" design language.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Learner Profile View | Browser / Client | Frontend Server | React rendering of user stats fetched via RRv7 loaders. |
| Profile Data Fetching | Frontend Server | API / Backend | Hono/RRv7 loader queries D1 via Drizzle ORM. |
| Global UI Styling | Browser / Client | — | Vanilla CSS for lightweight, consistent look and feel. |
| Deployment Pipeline | Infrastructure | — | Wrangler configuration and Cloudflare Pages/Workers deployment. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Router | 7.14.1 | Routing & Fullstack | Modern SSR/SPA framework with native Cloudflare support. |
| Hono | 4.12.12 | Server Framework | Ultra-fast worker-native web framework. |
| Drizzle ORM | 0.45.2 | Database ORM | Type-safe, lightweight, works perfectly with D1. |
| Better Auth | 1.6.3 | Authentication | Handles session and Google OAuth with D1 storage. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Cloudflare D1 | — | SQL Database | Serverless SQLite for Cloudflare Workers. |
| Wrangler | 3.114.17 | CLI Tool | Deployment and local development. |
| Vitest | — | Testing | Recommended for unit/integration tests (Gap). |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla CSS | Tailwind | Tailwind adds a build step and utility bloat; Vanilla CSS is "Leaner" for this specific project. |
| Lucide React | SVG Icons | Inline SVGs or an icon font are lighter if only a few icons are used. |

**Installation:**
```bash
# Recommended for testing gap
npm install -D vitest @testing-library/react
```

## Architecture Patterns

### System Architecture Diagram
(Simplified data flow)
User -> Cloudflare Edge -> Hono Worker -> React Router Loader -> Drizzle -> D1 Database
                                   <- HTML/Data <-           <- Result <-

### Recommended Project Structure
```
app/
├── styles/          # NEW: Global CSS and theme variables
│   └── app.css
├── routes/
│   ├── profile.tsx  # NEW: Learner Profile page
│   └── ...
└── components/      # NEW: Shared UI components (Button, Card, Layout)
```

### Pattern 1: Parallel Data Fetching in Loaders
**What:** Use `Promise.all` to fetch multiple independent data sources (user info, progress, certificates) in a single loader.
**When to use:** Every time a route needs data from multiple tables.
**Example:**
```typescript
// app/routes/profile.tsx
export async function loader({ context }: LoaderFunctionArgs) {
  const { user, env } = context;
  const db = drizzle(env.DB, { schema });
  
  const [progresses, certs] = await Promise.all([
    db.query.courseProgress.findMany({ where: eq(schema.courseProgress.userId, user.id) }),
    db.query.certificates.findMany({ where: eq(schema.certificates.userId, user.id) })
  ]);
  
  return { user, stats: { progresses, certs } };
}
```

### Anti-Patterns to Avoid
- **Inline Style Bloat:** Continuing to use inline styles for every component makes maintenance difficult and increases HTML size.
- **Sequential Awaiting:** Awaiting D1 queries one after another instead of using `Promise.all` increases TTFB.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom OAuth flow | Better Auth | Security, session management, and D1 support are handled out-of-box. |
| DB Migrations | Manual SQL scripts | Drizzle Kit | Version control for schema changes. |
| PDF Generation | Complex PDF libs | Browser Print | For certificates, CSS `@media print` is faster and "Leaner". |

## Common Pitfalls

### Pitfall 1: Missing `database_id`
**What goes wrong:** Production deployment fails or connects to the wrong database.
**How to avoid:** Ensure `wrangler.jsonc` is updated with the actual D1 `database_id` created via `npx wrangler d1 create`.

### Pitfall 2: Better Auth URL Mismatch
**What goes wrong:** Google OAuth redirect fails because the production URL doesn't match `BETTER_AUTH_URL`.
**How to avoid:** Set `BETTER_AUTH_URL` environment variable to the production domain (e.g., `https://leanlearn.pages.dev`).

### Pitfall 3: Flash of Unstyled Content (FOUC)
**What goes wrong:** Styles load after HTML when using `dangerouslySetInnerHTML` for CSS.
**How to avoid:** Use the `<Links />` component in `root.tsx` to include the global CSS file in the `<head>`.

## Code Examples

### Global CSS Variables
```css
/* app/styles/app.css */
:root {
  --primary: #0070f3;
  --success: #10b981;
  --neutral: #f3f4f6;
  --text: #111827;
  --font-main: 'Inter', sans-serif;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Functions | Workers Assets | Late 2024 | Faster cold starts, unified Worker/Pages config. |
| Remix | React Router v7 | 2024 | Merger of Remix and RR, single dependency. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cloudflare Pages with Workers Assets is preferred | State of the Art | Deployment might need legacy Pages setup. |
| A2 | No CSS framework is desired | Standard Stack | User might actually want Tailwind but forgot to ask. |

## Open Questions

1. **Custom Domain:** Does the user have a custom domain for deployment, or will they use `*.pages.dev`?
   - Recommendation: Use `*.pages.dev` for MVP and set `BETTER_AUTH_URL` accordingly.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Wrangler | Deployment | ✓ | 3.114.17 | — |
| D1 Database | Storage | ✓ | — | — |
| Node.js | Runtime | ✓ | 20.x+ | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` (Pending) |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-UI-05 | Profile displays correct course counts | Integration | `npx vitest profile` | ❌ Wave 0 |
| REQ-STACK-04| Deployment configuration is valid | Smoke | `npx wrangler deploy --dry-run` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Better Auth Google Provider |
| V4 Access Control | Yes | RRv7 Loaders check `context.user` |
| V5 Input Validation | Yes | Zod (not yet used, but recommended) |

### Known Threat Patterns for Cloudflare/D1

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Information Disclosure | Information Disclosure | Ensure `context.env` secrets are not logged or exposed. |
| Unauthorized Access | Elevation of Privilege | Validate session in every protected loader. |

## Sources

### Primary (HIGH confidence)
- React Router v7 Docs - Deployment and Loaders
- Better Auth Docs - Cloudflare Workers setup
- Cloudflare Wrangler Docs - D1 and Pages configuration

### Secondary (MEDIUM confidence)
- `hono-react-router-adapter` GitHub README - Deployment patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Core technologies are well-documented.
- Architecture: HIGH - RRv7 patterns are established.
- Pitfalls: MEDIUM - Cloudflare deployment can vary based on account setup.

**Research date:** 2024-05-22
**Valid until:** 2024-06-22
