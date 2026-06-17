# HelloTasks

Private task management tool for 4HProjects and the Hello Ecosystem.

HelloTasks organizes tasks, team assignments, quality checking, monitoring, and project reporting from a single dashboard.

## What HelloTasks Does

- Project creation and team member management
- Kanban-style task board (7 columns)
- Task assignment, priority, and due date tracking
- QA review workflow (approve, reject, return for refinement)
- Role-based access control (Super Admin, Project Lead, Quality Manager, Developer, Viewer)
- Confidential task support (masked locked cards)
- File uploads (images converted to WebP, documents stored in Supabase)
- In-app notifications
- Dashboard summary reports
- Manual weekly reports via email
- Admin settings and user management

## Stack

```txt
Backend:        Node.js + Express
Views:          EJS
Frontend:       Vanilla JavaScript
Styling:        Custom CSS
Database:       MongoDB + Mongoose
Auth:           MongoDB custom auth (bcrypt + express-session + connect-mongo)
File Storage:   Supabase Storage
Image Process:  multer + sharp (WebP conversion)
Email:          Resend
Hosting:        Render
DNS/Security:   Cloudflare
```

## Getting Started

### Prerequisites

Fill in your `.env` file based on `.env.example` before running the app.

Required services:

- MongoDB Atlas (connection string)
- Supabase (project URL, anon key, service role key, storage bucket)
- Resend (API key, sending domain)
- Cloudflare Turnstile (site key, secret key)

### Run Locally

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### First Super Admin

Run the seed script once to create the first Super Admin account:

```bash
npm run seed
```

Requires `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in your `.env`.

## Project Docs

| File | Purpose |
|---|---|
| [docs/reference/project-brief.md](docs/reference/project-brief.md) | Full project specification (approved) |
| [docs/active/decisions.md](docs/active/decisions.md) | Key decisions and resolved questions |
| [docs/active/build-tracker.md](docs/active/build-tracker.md) | Build phase progress and timestamps |
| [docs/reference/database-strategy.md](docs/reference/database-strategy.md) | MongoDB and Supabase usage rules |
| [docs/reference/implementation-guide.md](docs/reference/implementation-guide.md) | Folder structure and coding standards |
| [docs/active/](docs/active/) | Active checklists for setup and verification |
| [docs/reference/](docs/reference/) | Technical reference docs |

## Deployment

- Hosting: Render
- Domain: hellotasks.online
- DNS and security: Cloudflare
- Bot protection: Cloudflare Turnstile
