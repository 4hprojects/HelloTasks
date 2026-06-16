# Decisions

## Project

- Project name is HelloTasks.
- HelloTasks is a private task management tool for 4HProjects and the Hello Ecosystem.
- Project brief approved on 2026-06-16.

## Stack Decisions

- MongoDB is the standard authentication database.
- Supabase Auth is not the primary authentication system.
- Supabase is used for storage, WebP uploads, file URLs, signed URLs, and selected relational support.
- EJS is used for views.
- Vanilla JavaScript is used for frontend behaviour.
- Custom CSS is used for styling.
- Node.js and Express are used for backend.
- Resend is used for email.
- Render is used for hosting.
- Cloudflare is used for DNS and security.

## Feature Decisions (Resolved 2026-06-16)

- Registration is open. Anyone can register. Super Admin assigns roles after registration.
- Developers can create tasks in addition to updating assigned tasks.
- Quality Manager approval completes a task by default. Project Lead sign-off is only required when the task is flagged for lead approval.
- Confidential tasks are shown as masked locked cards on the Kanban board.
- Both permanent delete and archive are available for tasks. Both require a confirmation dialog.
- Weekly reports are a dashboard summary and a manually triggered email body. No PDF for MVP.
- Public pages are excluded from MVP. Internal workflow ships first.
- External shared URLs are stored as links with server-side http/https format validation only.
- Blocked is a task status (work paused). Confidential is a visibility flag (separate concerns).
- First Super Admin is created via seed script using SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.
- Kanban has 7 columns: Draft, Assigned, In Progress, Review, Approved, Done, Blocked.
