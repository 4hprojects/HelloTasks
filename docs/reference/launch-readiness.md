# Launch Readiness Checklist

Use this before going live at hellotasks.online.

## Code

- [x] All MVP features built and pushed to `main`
- [x] No hardcoded secrets in the codebase
- [x] `.env.example` up to date
- [x] `npm run dev` starts cleanly locally
- [x] Seed script works (`npm run seed`)

## Services

- [ ] MongoDB Atlas cluster created and connection string copied
- [ ] Supabase project created, `attachments` bucket created
- [ ] Resend domain verified, API key copied
- [ ] Render web service connected to GitHub repo
- [ ] All environment variables set in Render
- [ ] Cloudflare Turnstile widget created, keys copied

## Deployment

- [ ] First Render deploy succeeded (check Render logs)
- [ ] App loads at Render `.onrender.com` URL
- [ ] `npm run seed` run once on production (creates Super Admin)
- [ ] Log in as Super Admin successfully

## Domain and DNS

- [ ] `hellotasks.online` added to Cloudflare
- [ ] CNAME record pointing to Render service
- [ ] SSL/TLS set to Full (strict) in Cloudflare
- [ ] Always Use HTTPS enabled
- [ ] www → non-www redirect working
- [ ] App loads at `https://hellotasks.online`

## Email

- [ ] Password reset email arrives correctly
- [ ] Invitation email arrives correctly
- [ ] Task assignment email arrives correctly
- [ ] `EMAIL_FROM` domain matches verified Resend domain

## Bot Protection

- [ ] Turnstile widget visible on login, register, forgot-password
- [ ] Submitting forms without completing Turnstile shows error

## Final Checks

- [ ] Register a test user → pending status shown
- [ ] Super Admin activates test user → activation email received
- [ ] Test user logs in → dashboard loads
- [ ] Create a project → appears in project list
- [ ] Create a task, assign it → assignee gets email
- [ ] Upload a file → appears on task, stored in Supabase
- [ ] Submit task for review → QM receives email
- [ ] Weekly report triggered from admin panel → email received
