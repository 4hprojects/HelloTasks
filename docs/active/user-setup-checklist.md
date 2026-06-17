# User Setup Checklist

This checklist is for the human user.

While the AI agent prepares the project brief, documentation, starter structure, login, theme, and base system, the user should complete these external setup tasks.

## 1. Project Identity

- [ ] Confirm project name
- [ ] Confirm project slug
- [ ] Confirm one-sentence description
- [ ] Confirm domain or subdomain
- [ ] Prepare logo or app icon if available
- [ ] Confirm primary colour and accent colour
- [ ] Confirm target users
- [ ] Confirm MVP scope

## 2. GitHub

- [ ] Create GitHub repository
- [ ] Add repository description
- [ ] Add README
- [ ] Add `.gitignore`
- [ ] Add `.env.example`
- [ ] Create `main` branch
- [ ] Create `dev` branch if needed
- [ ] Add collaborators if needed

## 3. MongoDB Atlas

MongoDB is required because it handles authentication and main app data.

- [ ] Create MongoDB Atlas project
- [ ] Create cluster
- [ ] Create database
- [ ] Create database user
- [ ] Configure network access
- [ ] Copy connection string
- [ ] Add connection string to `.env` as `MONGO_URI`
- [ ] Test connection locally

## 4. Supabase

Supabase is used for storage and selected relational support.

- [ ] Create Supabase project
- [ ] Create storage bucket
- [ ] Decide if bucket is public or private
- [ ] Copy Supabase URL
- [ ] Copy anon key
- [ ] Copy service role key
- [ ] Add values to `.env`
- [ ] Test upload later
- [ ] Document bucket purpose

## 5. Resend

Use Resend for email.

- [ ] Create Resend account
- [ ] Add sending domain
- [ ] Add DNS records
- [ ] Verify domain
- [ ] Create API key
- [ ] Add `RESEND_API_KEY` to `.env`
- [ ] Add `EMAIL_FROM` to `.env`
- [ ] Test email sending later

## 6. Render

Use Render for hosting.

- [ ] Create Render account
- [ ] Create new web service
- [ ] Connect GitHub repository
- [ ] Set build command
- [ ] Set start command
- [ ] Add environment variables
- [ ] Deploy first version
- [ ] Check logs
- [ ] Test live Render URL

Recommended commands:

```txt
Build Command: npm install
Start Command: npm start
```

## 7. Cloudflare and Domain

- [ ] Buy or prepare domain
- [ ] Add domain to Cloudflare
- [ ] Update nameservers
- [ ] Add DNS records
- [ ] Enable SSL/TLS
- [ ] Set HTTPS redirect
- [ ] Configure www/non-www redirect
- [ ] Enable basic security settings
- [ ] Set up Turnstile if needed
- [ ] Add Turnstile keys to `.env`

## 8. Environment Variables

Fill these values (see `.env.example` in the repo root):

```env
APP_NAME=HelloTasks
APP_ENV=production
PORT=3000
APP_URL=https://hellotasks.online

MONGO_URI=
SESSION_SECRET=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=attachments

RESEND_API_KEY=
EMAIL_FROM=noreply@hellotasks.online

SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=

CLOUDFLARE_TURNSTILE_SITE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
```
