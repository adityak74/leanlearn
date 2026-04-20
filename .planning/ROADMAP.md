# Roadmap - leanlearn

## Phase 1: Foundation (Cloudflare-Native Core)
**Goal:** Establish the foundational architecture with React Router v7, Hono, Cloudflare D1, and Better Auth.

**Plans:** 3 plans
- [x] 01-01-PLAN.md — Project scaffolding with RRv7 and Hono.
- [x] 01-02-PLAN.md — Auth backend with D1 and Better Auth config.
- [x] 01-03-PLAN.md — Auth UI and protected route integration.

**Success Criteria:** User can sign in with Google and see their session info on a protected route.

## Phase 2: Learning Architecture & Schema
- [x] 02-01-PLAN.md — Define D1 Schema for courses, chapters, and activities.
- [x] 02-02-PLAN.md — Create seed scripts and Hono loaders.
- [x] 02-03-PLAN.md — Build Course UI (Sidebar + Content).
- [x] **Success Criteria:** User can browse chapters and activities of the seeded course.

## Phase 3: Progress & Persistence
- [x] 03-01-PLAN.md — Add activity_completion and course_progress tables.
- [x] 03-02-PLAN.md — Implement completion logic and progress calculation.
- [x] 03-03-PLAN.md — Add Progress Bar and completion status to UI.
- [x] **Success Criteria:** Activity completion persists in D1 and updates the progress bar in real-time.

## Phase 4: Certification & Completion
**Goal:** Reaching 100% unlocks a printable certificate with learner metadata.

**Plans:** 3 plans
- [x] 04-01-PLAN.md — Certification Schema & Issuance Logic.
- [x] 04-02-PLAN.md — Certificate View & Print Styles.
- [x] 04-03-PLAN.md — UI Integration.

**Success Criteria:** Reaching 100% unlocks a printable certificate with learner metadata.

## Phase 5: Polish & Deployment
**Goal:** Finalize profile page, deployment config, and performance audit.

**Plans:** 3 plans
- [ ] 05-01-PLAN.md — Profile Page & "Lean" UI System.
- [ ] 05-02-PLAN.md — Quality Assurance & Performance.
- [ ] 05-03-PLAN.md — Cloudflare Production Deployment.

**Success Criteria:** Application is live on Cloudflare with functional auth and certificates.
