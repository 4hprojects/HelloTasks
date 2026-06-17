# HelloTasks Build Tracker

**Brief Approved:** 2026-06-16
**Build Started:** 2026-06-16
**Current Phase:** UI Polish Complete — All pages redesigned 2026-06-18

---

## How to Use

- Set `Started` when the first task in a phase begins.
- Set `Completed` when all tasks in a phase are checked off.
- Status values: `Not Started` | `In Progress` | `Done` | `Blocked`

---

## Phase Summary

| Phase | Name | Status | Started | Completed |
|---|---|---|---|---|
| 0 | Read Context | Done | 2026-06-16 | 2026-06-16 |
| 1 | Base App | Done | 2026-06-16 | 2026-06-16 |
| 2 | Folder Structure | Done | 2026-06-16 | 2026-06-16 |
| 3 | Theme and Layout | Done | 2026-06-16 | 2026-06-16 |
| 4 | MongoDB Connection | Done | 2026-06-16 | 2026-06-16 |
| 5 | MongoDB Authentication | Done | 2026-06-16 | 2026-06-16 |
| 6 | Supabase Storage Ready | Done | 2026-06-16 | 2026-06-16 |
| 7 | Resend Email Ready | Done | 2026-06-16 | 2026-06-16 |
| 8 | First Run Verification | Done | 2026-06-16 | 2026-06-16 |
| 9 | UI Polish | Done | 2026-06-17 | 2026-06-18 |

---

## Phase 0: Read Context

**Status:** Done | **Started:** 2026-06-16 | **Completed:** 2026-06-16

- [x] `CLAUDE.md`
- [x] `PROJECT-BRIEF.md`
- [x] `PROJECT-CONTEXT.md`
- [x] `DATABASE-STRATEGY.md`
- [x] `IMPLEMENTATION-GUIDE.md`
- [x] `DECISIONS.md`
- [x] `BUILD-TRACKER.md`
- [x] `docs/active/user-setup-checklist.md`
- [x] `docs/active/service-setup-tracker.md`

---

## Phase 1: Base App

**Status:** Done | **Started:** 2026-06-16 | **Completed:** 2026-06-16

- [x] Create `package.json`
- [x] Create `server.js`
- [x] Configure Express
- [x] Configure EJS
- [x] Serve static files from `public/`
- [x] Add base route (GET /)
- [x] Add dashboard route (GET /dashboard)
- [x] Add 404 error page
- [x] Add 500 error page

---

## Phase 2: Folder Structure

**Status:** Done | **Started:** 2026-06-16 | **Completed:** 2026-06-16

- [x] `config/`
- [x] `models/`
- [x] `routes/`
- [x] `controllers/`
- [x] `middleware/`
- [x] `services/`
- [x] `utils/`
- [x] `views/`
- [x] `views/layouts/`
- [x] `views/partials/`
- [x] `views/auth/`
- [x] `views/dashboard/`
- [x] `views/errors/`
- [x] `public/css/`
- [x] `public/js/`
- [x] `public/assets/`

---

## Phase 3: Theme and Layout

**Status:** Done | **Started:** 2026-06-16 | **Completed:** 2026-06-16

- [x] `views/layouts/main.ejs`
- [x] `views/partials/topbar.ejs`
- [x] `views/partials/sidebar.ejs`
- [x] `views/partials/flash-messages.ejs`
- [x] `public/css/base.css`
- [x] `public/css/theme.css`
- [x] `public/css/layout.css`
- [x] `public/css/forms.css`
- [x] `public/css/buttons.css`
- [x] `public/css/components.css`
- [x] `public/css/responsive.css`
- [x] `public/js/main.js`

---

## Phase 4: MongoDB Connection

**Status:** Done | **Started:** 2026-06-16 | **Completed:** 2026-06-16

- [x] Create `config/db.js`
- [x] Load `MONGO_URI` from `.env`
- [x] Connect using Mongoose
- [x] Add connection success log
- [x] Add connection error log

---

## Phase 5: MongoDB Authentication

**Status:** Done | **Started:** 2026-06-16 | **Completed:** 2026-06-16

MongoDB auth required. Do not use Supabase Auth.

- [x] Create `models/User.js`
- [x] Add `fullName`, `email`, `passwordHash`, `globalRole`, `accountStatus`, timestamps
- [x] Create `routes/authRoutes.js`
- [x] Create `controllers/authController.js`
- [x] Register route (GET + POST /register)
- [x] Login route (GET + POST /login)
- [x] Logout route (GET /logout)
- [x] Hash passwords with bcrypt
- [x] Compare passwords with bcrypt
- [x] Configure express-session
- [x] Store sessions with connect-mongo
- [x] Create `middleware/authMiddleware.js` (isAuthenticated)
- [x] Create current user middleware (attaches req.user)
- [x] Create role middleware (checkRole)
- [x] Protect dashboard route

---

## Phase 6: Supabase Storage Ready

**Status:** Done | **Started:** 2026-06-16 | **Completed:** 2026-06-16

Storage only. Do not use Supabase Auth.

- [x] Create `config/supabase.js` (service role key, server-side only)
- [x] Create `services/uploadService.js`
- [x] Add multer for file handling
- [x] Add sharp for WebP conversion (images only)
- [x] Add upload-to-Supabase function
- [x] Return file URL + metadata from upload

---

## Phase 7: Resend Email Ready

**Status:** Done | **Started:** 2026-06-16 | **Completed:** 2026-06-16

- [x] Create `services/emailService.js`
- [x] Load `RESEND_API_KEY` and `EMAIL_FROM` from `.env`
- [x] Create reusable `sendEmail(to, subject, html)` function

---

## Phase 8: First Run Verification

**Status:** Done | **Started:** 2026-06-16 | **Completed:** 2026-06-16

See `docs/active/first-run-verification.md` for full steps.

- [x] `npm install` — no errors
- [x] `npm run dev` — server starts on port 3000
- [x] App loads at http://localhost:3000
- [x] CSS loads correctly
- [x] Register works and creates MongoDB user record
- [x] Login works and creates session
- [x] Dashboard is protected (redirects when not logged in)
- [x] Logout destroys session

**First Run Result:**

```
Status: Passed
Date: 2026-06-16
Issues Found: None
```

---

## Post-Phase 8 Remaining MVP Work

After Phase 8 passes, the following areas remain:

- [x] Seed script for first Super Admin (`npm run seed`) — Done 2026-06-16
- [x] Project model and CRUD — Done 2026-06-16
- [x] Project member access (RBAC) — Done 2026-06-16
- [x] Task model (all fields: priority, deadline, confidential flag, assignee, status) — Done 2026-06-16
- [x] Task status workflow (9 statuses) — Done 2026-06-16
- [x] Kanban board (7 columns) — Done 2026-06-16
- [x] Task create/edit forms — Done 2026-06-16
- [x] QA review workflow (approve / return for refinement) — Done 2026-06-16
- [x] Optional Project Lead sign-off flag on tasks — Done 2026-06-16
- [x] External URL field on tasks with http/https format validation — Done 2026-06-16
- [x] Permanent delete and archive (both with confirmation dialog) — Done 2026-06-16
- [x] Confidential task locked card display on Kanban — Done 2026-06-16
- [x] Task comments and notes — Done 2026-06-16
- [x] File uploads attached to tasks (images → WebP, documents) — Done 2026-06-16
- [x] Notification model, utils, and wiring into task/comment workflows — Done 2026-06-16
- [x] Notification list view with mark-read / mark-all-read — Done 2026-06-16
- [x] Unread badge in topbar — Done 2026-06-16
- [x] User management views (list + edit) — Done 2026-06-16
- [x] Dashboard real data (stats + assigned tasks table) — Done 2026-06-16
- [x] Password reset via Resend (forgot-password → email → reset link) — Done 2026-06-16
- [x] Invitation email (super_admin invites user → email → accept-invite → set password) — Done 2026-06-16
- [x] Admin settings page (app name, support email, open registration toggle, report note) — Done 2026-06-16
- [x] Weekly report — manually triggered HTML email to all active Super Admins + Project Leads — Done 2026-06-16
- [x] Search and filters for tasks and projects — Done 2026-06-16

---

---

## Phase 9: UI Polish

**Status:** Done | **Started:** 2026-06-17 | **Completed:** 2026-06-18

Full redesign of every user-facing page. Consistent design patterns applied across the app.

**Design patterns introduced:**
- Hero cards (`task-show-hero`, `proj-show-hero`) — surface card with priority/status colour `border-left`
- Two-column form layout (`task-form-layout`) — main fields left, sticky properties sidebar right
- Live card preview (`proj-form-preview`) — project new/edit sidebar updates avatar + badge as you type
- Vertical timeline (`task-timeline`) — coloured dots + connecting line for status history
- Icon page headers (`task-form-header`, `auth-card-icon`) — icon circle + title + subtitle
- Kanban hero bar — compact project context + actions above kanban board
- Invite steps block (`invite-steps`) — numbered step list

**Pages completed:**

- [x] Auth: login, register, forgot-password, reset-password, accept-invite
- [x] Dashboard
- [x] Notifications
- [x] Projects: list, show, new, edit, kanban
- [x] Tasks: all-tasks (global), project list, show, new, edit, locked (confidential)
- [x] Users: list, show, invite
- [x] Admin: settings
- [x] Errors: 403, 404, 500

---

## Agent Build Summary

```
Files Created: 25
Features Implemented: Base app, full folder structure, Hello Ecosystem theme and layout,
  MongoDB connection, MongoDB auth (register/login/logout/sessions/roles/middleware),
  Supabase Storage service, Resend email service
User Must Configure: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env before running seed script
How to Test: npm run dev → http://localhost:3000
What Remains: See Post-Phase 8 list above
```
