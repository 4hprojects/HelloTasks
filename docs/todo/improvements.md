# HelloTasks — Improvement Backlog

Full codebase audit completed 2026-06-18. Items are grouped by area and ranked within each group.

---

## Security

| Priority | Item |
|---|---|
| ~~Critical~~ | ~~Add `helmet.js` middleware in server.js~~ ✅ Done 2026-06-18 |
| ~~Critical~~ | ~~Add rate limiting on auth routes~~ ✅ Done 2026-06-18 |
| ~~Critical~~ | ~~Add CSRF protection on all state-changing forms~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Sanitize comment content before saving~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Validate External URL field with URL parsing~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add `sameSite: 'lax'` to session cookie~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add account lockout after N failed login attempts~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Fix `res.redirect('back')` in notificationController.js~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Invalidate old password reset token when a new one is requested~~ ✅ Done 2026-06-18 (already correct — overwrite on reissue) |
| ~~Medium~~ | ~~Validate file type by extension independently of MIME type — MIME can be spoofed~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Add HTTPS redirect middleware in production (check `APP_ENV=production`)~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Validate confidential file access in fileController — any authenticated user can currently access file URLs directly~~ ✅ Done 2026-06-18 |

---

## Performance & Database

| Priority | Item |
|---|---|
| ~~High~~ | ~~Add indexes to Task model~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add indexes to Project model~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add indexes to User model~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add indexes to Comment model~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add indexes to FileRecord model~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add pagination to global task list (`/tasks`)~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add pagination to notifications list~~ ✅ Done 2026-06-18 |
| Medium | Add pagination to user list — currently loads all users |
| Medium | Add pagination to comments on task show page — currently loads all comments |
| Medium | Refactor dashboard to use a single aggregation pipeline instead of 7 separate queries |
| Medium | Extract repeated "assignable users" query in taskController into a shared helper — called 4+ times identically |
| Low | Refactor weekly report to use MongoDB aggregation instead of client-side JS filtering |

---

## UI/UX

### Auth Pages

| Priority | Item |
|---|---|
| ~~High~~ | ~~Add `autofocus` to the first field on login, register, forgot-password~~ ✅ Done 2026-06-18 |
| Medium | Show a success confirmation page/message after password reset completes (currently just redirects) |
| Medium | Add client-side email format validation on register and forgot-password before submit |
| Low | Add "Remember me" checkbox on login |

### Tasks

| Priority | Item |
|---|---|
| ~~High~~ | ~~Make task list table responsive on mobile~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Make kanban board horizontally scrollable on mobile — currently unusable~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add file upload progress indicator — no feedback during upload~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Allow checking off checklist items directly from task show page (currently read-only, must go to edit)~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Show a hint near the comment textarea explaining `@Name` mention support~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Replace browser `confirm()` dialogs with styled custom modal for delete/archive actions~~ ✅ Done 2026-06-18 |
| Medium | Add visual grouping (divider or label) between required and optional fields on task form |
| Low | Add drag-and-drop to kanban board for status changes |
| Low | Add bulk actions on task list (select multiple, change status/priority) |
| Low | Add task duplication feature |

### Projects

| Priority | Item |
|---|---|
| ~~High~~ | ~~Make project member table responsive on mobile~~ ✅ Done 2026-06-18 |
| Medium | Add results count to project list filter bar ("Showing X of Y projects") |
| Medium | Add archive option for projects (soft delete, not permanent delete) |
| Medium | Add client-side email validation on the "Invite by Email" form before submit |
| Low | Add keyboard navigation to the member add tab toggle |

### Users & Admin

| Priority | Item |
|---|---|
| Medium | Show invite expiry date in user list for pending accounts |
| Medium | Show "Last active" timestamp on user list for account management |
| Medium | Add a dry-run preview step before sending weekly report email |
| Low | Add copy-to-clipboard for invite link in the invite flow |

### Notifications

| Priority | Item |
|---|---|
| Medium | Auto-dismiss flash messages after a few seconds (with manual close still available) |
| Low | Add ARIA live region to notification badge so screen readers announce new notifications |

### General / Cross-Cutting

| Priority | Item |
|---|---|
| ~~High~~ | ~~Implement loading spinner on button click for async actions~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Replace all browser `confirm()` destructive action dialogs with a consistent styled modal~~ ✅ Done 2026-06-18 |
| Medium | Add consistent empty-state CTAs across all list views (some have them, some don't) |
| Low | Add sticky column headers to long tables |

---

## Backend Quality

| Priority | Item |
|---|---|
| ~~High~~ | ~~Validate required environment variables at startup~~ ✅ Done 2026-06-18 |
| ~~High~~ | ~~Add Morgan HTTP request logging middleware to server.js~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Centralise email HTML into reusable template functions or a templates/ folder — currently inlined in multiple controllers~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Add audit logging for critical actions: delete task, delete project, remove member, change user role~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Standardise role checking to always use utils/roles.js — some controllers still hardcode role name arrays~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Add cascade delete hooks: deleting a project should clean up its tasks, comments, files, and notifications~~ ✅ Done 2026-06-18 |
| ~~Medium~~ | ~~Validate that task assignee is a member of the project before saving~~ ✅ Done 2026-06-18 |
| Low | Replace magic numbers with named constants: 72h invite expiry, 100 notification limit, 8:00 AM cron time |
| Low | Add request correlation IDs to log entries for tracing errors in production |

---

## Out of Scope (Post-MVP)

These were identified but are explicitly post-MVP and should not be prioritised now:

- Async email queue (Bull/RabbitMQ) — overkill until volume justifies it
- API documentation / JSDoc
- Real-time updates (WebSockets)
- Advanced analytics
- CSV/PDF export
- AI features
- Mobile app
