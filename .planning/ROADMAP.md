# Roadmap - leanlearn

## Phase 1: Foundation (Cloudflare-Native Core)
**Goal:** Establish the foundational architecture with React Router v7, Hono, Cloudflare D1, and Better Auth.

**Plans:** 3 plans
- [ ] 01-01-PLAN.md — Project scaffolding with RRv7 and Hono.
- [ ] 01-02-PLAN.md — Auth backend with D1 and Better Auth config.
- [ ] 01-03-PLAN.md — Auth UI and protected route integration.

**Success Criteria:** User can sign in with Google and see their session info on a protected route.

## Phase 2: Learning Architecture & Schema
- [ ] Define D1 Schema for `courses`, `chapters`, and `activities`.
- [ ] Create seed scripts for the initial Hypermemory course.
- [ ] Implement Hono loaders/actions for course data.
- [ ] Build Course UI (Sidebar navigation + Main content area).
- [ ] **Success Criteria:** User can browse chapters and activities of the seeded course.

## Phase 3: Progress & Persistence
- [ ] Add `activity_completion` and `course_progress` tables to D1.
- [ ] Implement `POST /api/activity/:id/complete` in Hono.
- [ ] Logic to calculate and update `course_progress` on activity completion.
- [ ] Add Progress Bar and completion status to UI.
- [ ] **Success Criteria:** Activity completion persists in D1 and updates the progress bar in real-time.

## Phase 4: Certification & Completion
- [ ] Create `certificates` table in D1.
- [ ] Implement automated certificate generation logic at 100% progress.
- [ ] Build Print-optimized HTML Certificate View.
- [ ] Add "View Certificate" button (conditionally rendered) to course page.
- [ ] **Success Criteria:** Reaching 100% unlocks a printable certificate with learner metadata.

## Phase 5: Polish & Deployment
- [ ] Learner Profile page showing course progress and earned certificates.
- [ ] Finalize `wrangler.toml` for Cloudflare Pages/Workers deployment.
- [ ] Performance audit and CSS polish for the "Lean" experience.
- [ ] **Success Criteria:** Application is live on Cloudflare with functional auth and certificates.
