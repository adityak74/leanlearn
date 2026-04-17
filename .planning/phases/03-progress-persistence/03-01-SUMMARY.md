---
phase: 03-progress-persistence
plan: 01
subsystem: DB
tags: [schema, migrations, d1]
requires: []
provides: [activity-tracking-schema]
affects: [course-progress]
tech-stack: [drizzle, d1, sqlite]
key-files: [app/db/schema.ts, migrations/0002_solid_lethal_legion.sql]
decisions:
  - Move seed.sql to scripts/ directory to avoid D1 migration conflicts with existing data.
metrics:
  duration: 15m
  completed_date: 2024-04-17
---

# Phase 03 Plan 01: Schema & DB Layer Summary

Implemented the database schema and migration for activity completion tracking and course progress calculation.

## Substantive Changes
- Updated `app/db/schema.ts` with `activity_completion` and `course_progress` tables.
- Defined relations between users, courses, activities, and the new progress tracking tables.
- Generated and applied migration `0002_solid_lethal_legion.sql` to the local D1 database.
- Fixed camelCase naming in `account` table fields (`refreshToken` -> `refresh_token`, etc.) for consistency with the rest of the schema.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration blocked by seed.sql**
- **Found during:** Task 1
- **Issue:** `wrangler d1 migrations apply` attempted to run `seed.sql` which failed due to UNIQUE constraint violations on existing seed data.
- **Fix:** Moved `seed.sql` from `migrations/` to `scripts/seed.sql`.
- **Commit:** a95f088

## Self-Check: PASSED
- [x] Schema updated in `app/db/schema.ts`
- [x] Migration file generated in `migrations/`
- [x] Tables `activity_completion` and `course_progress` exist in local D1 database
- [x] Commits made with proper prefix
