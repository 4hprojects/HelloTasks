# Project Brief Summary

## HelloTasks

**Slug:** hellotasks
**Domain:** hellotasks.online
**Status:** MVP complete — ready for deployment

### Description

Private task management tool for 4HProjects and the Hello Ecosystem. Organizes tasks, team assignments, QA review, file uploads, and project reporting in one workflow.

### Stack

```txt
Backend:      Node.js + Express
Views:        EJS + express-ejs-layouts
Frontend:     Vanilla JavaScript + Custom CSS
Database:     MongoDB Atlas + Mongoose
Auth:         Custom MongoDB auth (bcrypt + express-session + connect-mongo)
Files:        Supabase Storage (WebP via multer + sharp)
Email:        Resend
Scheduler:    node-cron (due date reminders)
Hosting:      Render
DNS/Security: Cloudflare + Turnstile
```

### Critical Rules

- MongoDB is used for authentication. Supabase Auth is not used.
- Supabase is used for file storage only.
- No React, Vue, Angular, TypeScript, Tailwind, or Bootstrap.

### Required Services

| Service | Purpose | Status |
|---|---|---|
| GitHub | Repository | Done |
| MongoDB Atlas | Auth and app database | Needs setup |
| Supabase | Storage bucket `attachments` | Needs setup |
| Resend | Email with verified domain | Needs setup |
| Render | Node.js hosting | Needs setup |
| Cloudflare | DNS, SSL, Turnstile | Needs setup |
| hellotasks.online | Public domain | Needs DNS config |

### First Run Commands

```bash
npm install
npm run dev        # local dev at http://localhost:3000
npm run seed       # create first Super Admin (run once)
```
