# Claude Instructions

This project is **HelloTasks** — a task management tool for the Hello Ecosystem.

The project brief has been approved. Do not restart guided intake.

## First Action

Before writing any code, read the following files in order:

1. `docs/reference/project-brief.md`
2. `docs/reference/project-context.md`
3. `docs/reference/database-strategy.md`
4. `docs/reference/implementation-guide.md`
5. `docs/active/decisions.md`
6. `docs/active/build-tracker.md`
7. `docs/active/user-setup-checklist.md`

## Build Flow

Follow the phases in `docs/active/build-tracker.md` in order.

Update `docs/active/build-tracker.md` as each phase starts and completes.

## Stack

Use:

- Node.js
- Express
- EJS
- Vanilla JavaScript
- Custom CSS
- MongoDB with Mongoose
- MongoDB-based custom authentication
- bcrypt for password hashing
- express-session with connect-mongo
- Supabase Storage for files
- Supabase for selected relational support only
- Resend for emails
- Render for hosting
- Cloudflare for DNS and security

## Do Not Use

Do not use:

- React
- Vue
- Angular
- Tailwind
- Bootstrap
- TypeScript unless explicitly requested
- Supabase Auth as the primary authentication system

## Authentication Rule

MongoDB is the standard authentication database for all Hello ecosystem projects.

Supabase Auth must not replace MongoDB auth.

## Database Rule

Use MongoDB for:

- User auth
- User accounts
- Password hashes
- Sessions
- App data
- Logs
- Notes
- Dynamic records

Use Supabase for:

- Storage buckets
- WebP uploads
- File URLs
- Signed URLs
- Selected relational support

## Coding Rules

- Use EJS views.
- Use vanilla JavaScript for frontend behaviour.
- Use custom CSS for styling.
- Follow the existing folder structure.
- Keep code simple and readable.
- Check existing files before creating new ones.
- Update documentation when major decisions change.
