# Requirements - leanlearn

## 1. User Authentication
- **ID:** AUTH
- [x] **REQ-AUTH-01:** Google Sign-In only (via Better Auth).
- [x] **REQ-AUTH-02:** Session Management in Cloudflare D1.
- [x] **REQ-AUTH-03:** Route protection via Hono middleware.

## 2. Course Structure
- **ID:** COURSE
- [x] **REQ-COURSE-01:** Hierarchy: Course > Chapters > Activities.
- [x] **REQ-COURSE-02:** Text/HTML and Video activity types.
- [x] **REQ-COURSE-03:** Required activities flag.

## 3. Progress Tracking
- **ID:** PROGRESS
- [x] **REQ-PROGRESS-01:** Activity-level completion.
- [x] **REQ-PROGRESS-02:** (completed required) / (total required) calculation.
- [x] **REQ-PROGRESS-03:** Persistence in D1.

## 4. Certification
- **ID:** CERT
- [x] **REQ-CERT-01:** Automated issuance at 100% progress.
- [x] **REQ-CERT-02:** Printable HTML certificate view.

## 5. User Interface
- **ID:** UI
- [x] **REQ-UI-01:** Login Screen with Google button.
- [x] **REQ-UI-02:** Dashboard with course progress.
- [x] **REQ-UI-03:** Sidebar-based Course View.
- [x] **REQ-UI-04:** Conditional "View Certificate" button.

## 6. Technical Stack
- **ID:** STACK
- [x] **REQ-STACK-01:** Cloudflare Pages + Workers (Hono).
- [x] **REQ-STACK-02:** Better Auth + D1 + Drizzle.
- [x] **REQ-STACK-03:** React Router v7.
