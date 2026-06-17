# Security Checklist

## Authentication

- [x] Passwords hashed with bcrypt (cost factor 12)
- [x] Sessions stored in MongoDB via connect-mongo
- [x] Session cookie is `httpOnly: true`
- [x] Session cookie is `secure: true` in production (set via `APP_ENV=production`)
- [x] Session secret loaded from env — not hardcoded
- [x] Password reset tokens are single-use with 1-hour expiry
- [x] Invite tokens expire after 72 hours
- [x] Suspended accounts cannot log in

## Authorization

- [x] All routes behind `isAuthenticated` middleware
- [x] Project routes check `requireProjectMember`
- [x] Task routes use `loadTask` + project membership check
- [x] Admin routes restricted to `super_admin` / `system_admin`
- [x] Role-based status transitions enforced server-side
- [x] Confidential tasks return locked view to unauthorized users
- [x] File deletes check ownership before removing from Supabase

## Input Handling

- [x] External URL field validates `http://` or `https://` prefix server-side
- [x] Comment @mention rendering: content HTML-escaped before inserting mention spans
- [x] EJS uses `<%= %>` (auto-escaped) by default — `<%-` only used where content is pre-escaped in controller
- [x] File uploads validated by MIME type and size in `uploadService.js`

## Secrets

- [x] Supabase service role key used server-side only — never passed to views or frontend JS
- [x] No secrets committed to the repository
- [x] `.env` is in `.gitignore`

## Bot Protection

- [x] Cloudflare Turnstile on login, register, forgot-password (when keys are set)
- [x] Cloudflare proxy enabled on DNS records (hides origin IP)

## Deployment

- [ ] `APP_ENV=production` set in Render
- [ ] Cloudflare SSL/TLS set to Full (strict)
- [ ] Always Use HTTPS enabled in Cloudflare
- [ ] Render app not publicly accessible on `.onrender.com` URL after custom domain (optional — consider Cloudflare Access or allowlisting if needed)
