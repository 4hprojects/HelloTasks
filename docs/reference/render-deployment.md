# Render Deployment

HelloTasks is hosted on Render as a Node.js web service.

## First Deploy

1. Go to [render.com](https://render.com) and create an account or sign in.
2. Click **New → Web Service**.
3. Connect your GitHub repository (`4hprojects/HelloTasks`).
4. Set the following:

| Field | Value |
|---|---|
| Name | `hellotasks` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free or Starter |

5. Add all environment variables from `.env.example` under **Environment**.
6. Click **Create Web Service**.

## Environment Variables to Set in Render

Copy all values from your local `.env` into Render's environment settings:

- `APP_NAME`, `APP_ENV=production`, `APP_URL=https://hellotasks.online`
- `MONGO_URI`
- `SESSION_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
- `CLOUDFLARE_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET_KEY`

Do not set `PORT` — Render injects it automatically.

## Custom Domain

1. In Render, go to your service → **Settings → Custom Domains**.
2. Add `hellotasks.online`.
3. Render provides a CNAME target — add it in Cloudflare DNS (see `domain-and-cloudflare.md`).

## Auto Deploy

Render auto-deploys whenever you push to `main`. No manual trigger needed after the first deploy.

## Seed Script

After first deploy, run the seed script once to create the Super Admin:

```bash
# In Render dashboard → your service → Shell
node scripts/seed.js
```

Or trigger it locally against the production MONGO_URI if shell access is not available.

## Logs

Render streams logs in real time under **Logs** in your service dashboard. Check here for startup errors, email failures, and cron job output.
