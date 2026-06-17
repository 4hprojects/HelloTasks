# MongoDB Auth Standard

HelloTasks uses custom MongoDB-based authentication. Supabase Auth is not used.

## How It Works

1. User registers with email + password.
2. Password is hashed with `bcrypt` (cost factor 12) and stored as `passwordHash` on the User document.
3. On login, `user.comparePassword(password)` runs `bcrypt.compare`.
4. On success, `req.session.userId` is set.
5. `attachUser` middleware (runs on every request) reads `req.session.userId` and attaches the full User document to `req.user`.
6. `isAuthenticated` middleware redirects to `/login` if `req.user` is not set.

## User Model Fields

| Field | Type | Notes |
|---|---|---|
| `fullName` | String | Required |
| `email` | String | Unique, lowercase |
| `passwordHash` | String | bcrypt hash |
| `globalRole` | String | `system_admin`, `owner`, `manager`, `project_lead`, `quality_manager`, `member`, `developer`, `viewer` |
| `accountStatus` | String | `pending`, `active`, `suspended` |
| `passwordResetToken` | String | Set on forgot-password, cleared on use |
| `passwordResetExpires` | Date | 1-hour expiry |
| `inviteToken` | String | Set on invite, cleared on accept |
| `inviteExpires` | Date | 72-hour expiry |

## Session Storage

Sessions are stored in MongoDB via `connect-mongo`. The session document references `req.session.userId` to identify the logged-in user.

Session cookie settings:
- `httpOnly: true` — not accessible from JavaScript
- `secure: true` in production — HTTPS only
- `maxAge`: 7 days

## Role Checks

`middleware/authMiddleware.js` exports:
- `isAuthenticated` — redirects if no session
- `checkRole(...roles)` — returns 403 if `req.user.globalRole` is not in the allowed list
- `attachUser` — runs on every request, populates `req.user`

Project-level role checks are handled in `middleware/projectMiddleware.js` via `requireProjectMember`, which sets `req.projectRole` based on the user's role in `project.members[]`.
