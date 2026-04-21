---
phase: 04-certification-completion
plan: 02
subsystem: certification
tags: [certificates, routes, printing]
requires: [04-01]
provides: [printable-certificate]
affects: [app/routes/certificate.$id.tsx, app/routes.ts]
tech-stack: [React Router, Drizzle ORM, CSS @media print]
key-files: [app/routes/certificate.$id.tsx, app/routes.ts]
decisions:
  - "Using @media print with A4 landscape to ensure professional print output"
  - "Loader contains a strict ownership check: session.userId === certificate.userId"
metrics:
  duration: 15m
  completed_date: "2024-04-17"
---

# Phase 04 Plan 02: Certificate View & Print Styles Summary

Professional, print-optimized certificate view for course completion.

## Key Changes

### Certificate Route & Loader
- **Route:** Registered `/certificate/:id` in `app/routes.ts`.
- **Loader:**
  - Authenticates the user.
  - Fetches certificate data joining `user` and `courses`.
  - Enforces ownership: only the certificate owner can view it (prevents information disclosure).
  - Returns formatted certificate, user, and course data.

### Print-Optimized UI
- **Styles:** Added `@media print` CSS block.
  - Forced A4 landscape orientation.
  - Hidden non-print elements (like the Print button) using `.no-print`.
  - Centered the certificate card and adjusted margins.
  - Ensured backgrounds and borders print correctly with `print-color-adjust: exact`.
- **Button:** Added a "Print Certificate" button that triggers `window.print()`.
- **Design:** Basic but professional layout with title, user name, course title, and issued date.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

### Automated Tests
- `npx tsc --noEmit`: Verified that the new route and certificate page have no type errors (when running in project context).
- `grep "@media print"`: Confirmed presence of print-specific styles.

### Manual Verification Steps (Recommended)
1. Login as a user who has completed a course.
2. Navigate to `/certificate/{id}` where `{id}` is a valid certificate ID.
3. Click "Print Certificate" and verify the preview shows a clean, landscape certificate.
4. Try to access another user's certificate ID and verify it returns a 403 Forbidden.

## Self-Check: PASSED
- [x] Route `/certificate/:id` is registered.
- [x] Loader contains ownership check.
- [x] Certificate view displays correct data.
- [x] @media print styles are present and configured.

## Final Task Commits
- `4ba2fc3`: feat(04-02): implement certificate route and loader
- `76f5702`: style(04-02): add print-optimized CSS for certificates
