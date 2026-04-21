# Phase 4: Certification & Completion - Research

**Researched:** 2025-05-22
**Domain:** Certification, Database Schema, Print-Optimized UI
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-CERT-01 | Automated issuance at 100% progress. | Integrated into `course.$slug.tsx` action logic; `certificates` table defined in Drizzle. |
| REQ-CERT-02 | Printable HTML certificate view. | CSS `@media print` patterns researched; dedicated route `/certificate/:id` proposed. |
| REQ-UI-04 | Conditional "View Certificate" button. | UI integration patterns for Dashboard and CourseView sidebar researched. |
</phase_requirements>

## Summary

This phase focuses on rewarding learners with a verifiable (database-backed) certificate upon course completion. Research confirms that the most robust approach for this project is to use a dedicated `certificates` table in D1, triggered automatically by the existing progress calculation logic. For the printable view, browser-native `@media print` CSS combined with absolute units (`mm`) is recommended over complex server-side PDF generation, as it aligns with the "lean" architecture and minimizes external dependencies.

**Primary recommendation:** Use an automated database trigger (via the `course.$slug.tsx` action) to issue certificates when progress reaches 100%, and provide a dedicated, CSS-print-optimized route for viewing and printing.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Certificate Persistence | Database (D1) | — | Permanent record of achievement. |
| Completion Logic | API / Backend (Action) | — | Securely validates 100% progress before issuance. |
| Automated Issuance | API / Backend (Action) | — | Hooked into the activity completion workflow. |
| Print-Optimized View | Browser / Client | Frontend Server | Leverages browser's native print engine with CSS @media print. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | 0.45.2 | Schema management | Project standard for D1 interaction. |
| Hono | 4.12.14 | Backend API | Project standard for Cloudflare Workers. |
| React Router | 7.14.1 | Routing & UI | Project standard for frontend. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Native Crypto | — | UUID Generation | Used for unique certificate IDs. |
| CSS Media Queries | — | Print Optimization | Used for @media print styles. |

**Installation:**
No new packages required.

## Architecture Patterns

### Certificate Issuance Flow
1. User marks activity as complete.
2. `action` in `course.$slug.tsx` calculates `progressPercent`.
3. If `progressPercent === 100`, the action checks for an existing certificate.
4. If none exists, it inserts a new record into the `certificates` table.
5. The UI (Dashboard/CourseView) fetches the certificate status and displays a "View Certificate" button.

### Recommended Project Structure
```
app/
├── db/
│   └── schema.ts           # Add certificates table
├── routes/
│   ├── certificate.$id.tsx # New route for printable view
│   ├── dashboard.tsx       # Integrate View Certificate button
│   └── course.$slug.tsx    # Integrate View Certificate button & Issuance logic
```

### Pattern 1: Print-Optimized CSS
**What:** Using absolute units and print-specific media queries.
**When to use:** For documents that must be printed in a specific format (A4/Letter).
**Example:**
```css
/* Source: [VERIFIED: web search] */
@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .no-print {
    display: none !important;
  }
  .certificate-page {
    width: 297mm;
    height: 210mm;
    page-break-inside: avoid;
  }
}
```

### Anti-Patterns to Avoid
- **Server-Side PDF Generation:** Overly complex for this phase. Browser-native printing is sufficient and easier to maintain.
- **Client-Side Triggering:** Never issue certificates purely on the client. Issuance must happen in a server action to prevent spoofing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF Export | Custom PDF rendering | Browser `window.print()` | Browsers have highly optimized PDF export engines. |
| Unique IDs | Custom counters | `crypto.randomUUID()` | Prevents ID collisions and guessing. |

## Common Pitfalls

### Pitfall 1: Missing Print Backgrounds
**What goes wrong:** Background colors and images don't appear in the print preview.
**Why it happens:** Browsers disable backgrounds by default to save ink.
**How to avoid:** Use `print-color-adjust: exact;` in CSS.

### Pitfall 2: Race Conditions in Progress
**What goes wrong:** Multiple "Mark as Complete" clicks could trigger multiple issuance attempts.
**Why it happens:** Concurrent requests to the action.
**How to avoid:** Use a `unique` constraint on `(user_id, course_id)` in the `certificates` table and handle "conflict" or check existence before insert.

## Code Examples

### Drizzle Schema for Certificates
```typescript
// Source: [VERIFIED: Drizzle Docs]
export const certificates = sqliteTable("certificates", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  issuedAt: integer("issued_at", { mode: "timestamp" }).notNull(),
});
```

### Issuance Logic in Action
```typescript
// Inside completion action
if (progressPercent === 100) {
  const existing = await db.query.certificates.findFirst({
    where: (c, { and, eq }) => and(eq(c.userId, user.id), eq(c.courseId, courseId))
  });
  if (!existing) {
    await db.insert(schema.certificates).values({
      id: crypto.randomUUID(),
      userId: user.id,
      courseId: courseId,
      issuedAt: new Date(),
    });
  }
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Browser `window.print()` is acceptable for the user | Don't Hand-Roll | Low - Standard for simple certificate requirements. |
| A2 | User name should be pulled from `user` table at view time | Summary | Low - Common for simple apps; name changes reflect on old certificates. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Cloudflare D1 | Data layer | ✓ | — | — |
| Hono | API routes | ✓ | 4.12.14 | — |
| React Router | Frontend | ✓ | 7.14.1 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended) |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-CERT-01 | Issuance at 100% | Integration | `npm test tests/certificates.test.ts` | ❌ Wave 0 |
| REQ-CERT-02 | Print view rendering | Smoke | `npm test tests/ui.test.ts` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] No test framework installed. Recommended: `npm install -D vitest @testing-library/react`.
- [ ] No `tests/` directory found.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Yes | Ensure user can only view certificates where `userId === session.userId`. |
| V5 Input Validation | Yes | Validate `certificateId` in the route param. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| ID Guessing | Information Disclosure | Use UUIDs instead of auto-incrementing integers. |
| Unauthorized View | Information Disclosure | Server-side authorization check in the route loader. |

## Sources

### Primary (HIGH confidence)
- Drizzle ORM Documentation - Schema definitions.
- Hono Documentation - Middleware and Context.
- React Router v7 Documentation - Loaders and Actions.
- MDN Web Docs - `@media print` and CSS units.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Built on existing project patterns.
- Architecture: HIGH - Issuance logic is straightforward expansion of progress logic.
- Pitfalls: MEDIUM - Print CSS varies slightly across browsers but well-documented.

**Research date:** 2025-05-22
**Valid until:** 2025-06-22
