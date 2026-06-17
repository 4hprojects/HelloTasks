# Environment Variables

All variables are defined in `.env` (local) and in Render's environment settings (production). See `.env.example` in the repo root for the template.

## App

| Variable | Required | Example | Notes |
|---|---|---|---|
| `APP_NAME` | Yes | `HelloTasks` | Used in email subjects and footers |
| `APP_ENV` | Yes | `production` | `development` or `production` |
| `PORT` | Yes | `3000` | Render sets this automatically |
| `APP_URL` | Yes | `https://hellotasks.online` | Used in email links — no trailing slash |

## Database

| Variable | Required | Example | Notes |
|---|---|---|---|
| `MONGO_URI` | Yes | `mongodb+srv://...` | MongoDB Atlas connection string |
| `SESSION_SECRET` | Yes | random string | Used to sign session cookies — keep long and random |

## Supabase Storage

| Variable | Required | Example | Notes |
|---|---|---|---|
| `SUPABASE_URL` | Yes | `https://xxx.supabase.co` | Project URL from Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJ...` | Server-side only — never expose to the browser |
| `SUPABASE_STORAGE_BUCKET` | Yes | `attachments` | Bucket name created in Supabase Storage |

## Email

| Variable | Required | Example | Notes |
|---|---|---|---|
| `RESEND_API_KEY` | Yes | `re_...` | API key from Resend dashboard |
| `EMAIL_FROM` | Yes | `noreply@hellotasks.online` | Must match your verified Resend sending domain |

## Seed Script

| Variable | Required | Notes |
|---|---|---|
| `SEED_ADMIN_EMAIL` | Yes (for seed) | Email for the first Super Admin — run `npm run seed` once |
| `SEED_ADMIN_PASSWORD` | Yes (for seed) | Password for the first Super Admin |

## Cloudflare Turnstile

| Variable | Required | Notes |
|---|---|---|
| `CLOUDFLARE_TURNSTILE_SITE_KEY` | Optional | Public key — shown in auth form widget |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Optional | Server-side key — used for token verification |

Turnstile is optional in development. When both keys are absent, the bot check is skipped. Set them in production for bot protection on login, register, and forgot-password.
