---
phase: 04-certification-completion
plan: 01
subsystem: Certification
tags: [schema, drizzle, d1, issuance]
requires: [REQ-CERT-01]
provides: [certificates-table, automated-issuance]
affects: [app/db/schema.ts, app/routes/course.$slug.tsx]
tech-stack: [drizzle, sqlite, cloudflare-d1]
key-files: [app/db/schema.ts, app/routes/course.$slug.tsx]
decisions:
  - Using certificates table linked to users and courses with UUID primary keys.
  - Automated issuance triggered in the course action when progress hits 100%.
metrics:
  duration: 15m
  completed_date: "2026-04-17"
---

# Phase 04 Plan 01: Certification Schema & Issuance Logic Summary

## Substantive Changes

- Added `certificates` table to Drizzle schema in `app/db/schema.ts`.
- Implemented `certificatesRelations` to link certificates with `user` and `courses`.
- Updated `userRelations` and `coursesRelations` to include the `certificates` many relationship.
- Generated and applied D1 migration `0003_lovely_stingray.sql`.
- Modified the `action` function in `app/routes/course.$slug.tsx` to automatically issue a certificate when a user reaches 100% progress.
- Added a check to prevent duplicate certificate issuance for the same user and course.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: tampering | app/routes/course.$slug.tsx | Certificate issuance is handled entirely server-side in the action to prevent client-side manipulation. |
| threat_flag: info_disclosure | app/db/schema.ts | Certificates use UUID v4 as primary keys to prevent enumeration of certificate IDs. |

## Self-Check: PASSED
