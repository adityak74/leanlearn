# Requirements - leanlearn

## 1. User Authentication
- **ID:** AUTH
- **REQ-AUTH-01:** Google Sign-In only (via Better Auth).
- **REQ-AUTH-02:** Session Management in Cloudflare D1.
- **REQ-AUTH-03:** Route protection via Hono middleware.

## 2. Course Structure
- **ID:** COURSE
- **REQ-COURSE-01:** Hierarchy: Course > Chapters > Activities.
- **REQ-COURSE-02:** Text/HTML and Video activity types.
- **REQ-COURSE-03:** Required activities flag.

## 3. Progress Tracking
- **ID:** PROGRESS
- **REQ-PROGRESS-01:** Activity-level completion.
- **REQ-PROGRESS-02:** (completed required) / (total required) calculation.
- **REQ-PROGRESS-03:** Persistence in D1.

## 4. Certification
- **ID:** CERT
- **REQ-CERT-01:** Automated issuance at 100% progress.
- **REQ-CERT-02:** Printable HTML certificate view.

## 5. User Interface
- **ID:** UI
- **REQ-UI-01:** Login Screen with Google button.
- **REQ-UI-02:** Dashboard with course progress.
- **REQ-UI-03:** Sidebar-based Course View.
- **REQ-UI-04:** Conditional "View Certificate" button.

## 6. Technical Stack
- **ID:** STACK
- **REQ-STACK-01:** Cloudflare Pages + Workers (Hono).
- **REQ-STACK-02:** Better Auth + D1 + Drizzle.
- **REQ-STACK-03:** React Router v7.
