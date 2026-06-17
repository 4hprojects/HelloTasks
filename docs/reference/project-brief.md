# PROJECT-BRIEF.md

## Project Name

HelloTasks

## Project Slug

hellotasks

## One-Sentence Description

HelloTasks is a private-first task management tool for 4HProjects and the Hello Ecosystem that organizes tasks, team assignments, quality checking, monitoring, documentation, and reports.

## Project Type

Private app for the Hello Ecosystem at launch, with future scalability for public users managing their own projects.

## Problem Statement

HelloTasks solves the problem of scattered task management, missed refinements, unclear workflow status, weak quality checking, and unstructured team assignment. The initial problem is experienced by the developer and Hello Ecosystem team when project ideas, small observations, pending refinements, QA notes, and implementation plans are not organized in one reliable workflow.

If this problem is not solved, project work may remain scattered, small improvements may be forgotten, documentation may be harder to prepare, and team monitoring may become inconsistent.

## Target Users

- Developers
- Quality managers
- Project leads
- Team managers
- Assigned project members
- Future public users who manage their own projects

## User Roles

| Role | Description | Main Permissions | Restrictions |
|---|---|---|---|
| Super Admin | Global system administrator for HelloTasks. | Manage all users, projects, roles, settings, reports, and system-level access. | Should not be treated as a project-only user. |
| Project Lead | Main project owner or project administrator. | Create projects, approve members, assign tasks, edit project tasks, view project reports, approve final completion, manage project access. | Cannot access projects they are not assigned or authorized to manage. |
| Quality Manager | Reviewer responsible for checking task quality and workflow completeness. | Review tasks, approve or reject QA items, return tasks for refinement, add QA notes, view project reports. | Cannot manage global users or system settings. Cannot override Super Admin settings. |
| Developer | Main task implementer. | View assigned projects, create tasks when allowed, update assigned tasks, upload files, add comments, mark work as ready for review. | Cannot approve their own final task completion. Cannot view confidential tasks unless granted access. |
| Viewer | Optional read-only role for assigned project access. | View approved projects, tasks, and reports based on RBAC. | Cannot create, edit, approve, reject, delete, or upload unless permission is granted. |

## Core Workflow

1. Project Lead creates a project.
2. Project Lead, Quality Manager, or Developer creates tasks with priority, deadline, assignee, description, checklist, visibility flag, and required files if needed.
3. Developer works on assigned tasks and updates task progress.
4. Developer adds notes, comments, files, screenshots, links, or supporting documents.
5. Developer marks the task as ready for review.
6. Quality Manager reviews the task and either approves it, rejects it, or returns it for refinement.
7. If returned, the assigned developer refines the task or completes additional subtasks.
8. Quality Manager approval completes the task by default. If a Project Lead marks a task as requiring lead approval, an additional Project Lead sign-off is needed before the task is marked completed.
9. Task is marked completed when the work is finished, reviewed, and accepted.
10. Blocked tasks are paused due to a dependency or issue. Confidential tasks are restricted by a visibility flag and shown as masked locked cards to users without access.

## Task Status Flow

- Draft
- Assigned
- In Progress
- Ready for Review
- Returned for Refinement
- Approved
- Completed
- Blocked
- Archived

Note: Blocked is a status meaning work is paused due to a dependency or issue. Confidential is a visibility flag, not a status. A task can be In Progress and Confidential at the same time. Confidential tasks appear on the Kanban board as masked locked cards to users without access.

## Kanban Board Column Mapping

| Column | Task Statuses Shown |
|---|---|
| Draft | Draft |
| Assigned | Assigned |
| In Progress | In Progress |
| Review | Ready for Review, Returned for Refinement |
| Approved | Approved |
| Done | Completed |
| Blocked | Blocked |

Archived tasks are not shown on the board. They appear in a separate archive view. Confidential tasks appear as masked locked cards on the board for users with project access but without task-level access.

## Main Modules

- Dashboard
- Projects
- Kanban Board
- Task Management
- Task Review and QA
- User Management
- Role and Permission Management
- Reports
- Notifications
- File Uploads
- Admin Settings
- Public Pages, later

## MVP Scope

### Included in MVP

- Open user registration and login using MongoDB
- Session-based authentication using express-session and connect-mongo
- Role-based access control for Super Admin, Project Lead, Quality Manager, Developer, and Viewer
- Protected dashboard
- Project creation and project member access
- Kanban-style task board with 7 columns mapped to task statuses
- Task creation by Project Lead, Quality Manager, and Developer
- Task assignment, editing, and status updates
- Task priority and due date fields
- Confidential task visibility flag with masked locked card display
- Task comments or notes
- Ready-for-review workflow
- QA approval, rejection, and returned-for-refinement workflow
- Optional Project Lead sign-off flag for tasks requiring lead approval
- Permanent delete and archive for tasks, both requiring confirmation
- Basic task file uploads through Supabase Storage
- External shared URL field on tasks with server-side format validation (must be http or https)
- Image upload conversion to WebP
- MongoDB file metadata records
- Basic notification records inside the app
- Resend email setup for key email events
- Password reset email
- Invitation email
- Approval or rejection email
- Dashboard summary report for project progress and task status
- Weekly report as email body, manually triggered by Project Lead or Super Admin
- Search and filters for tasks and projects
- Admin settings page
- First-run Super Admin seed script
- First-run verification checklist

### Excluded for Now

- Public pages and marketing site
- Paid subscriptions
- Multi-tenant billing
- Advanced analytics
- Automated scheduled weekly email reports
- Real-time sockets
- Mobile app
- AI task generation
- AI report generation
- Complex external integrations
- Supabase Auth

### First Working Version Expected Output

The first working version should allow an authenticated user to log in, access a protected dashboard, create a project, add project members, create tasks, assign tasks, update task status on a Kanban board, upload basic files, submit a task for review, approve or return the task, and view basic reports.

### MVP Success Criteria

The MVP is successful when HelloTasks can organize actual Hello Ecosystem project work from assignment to completion, show what is pending or blocked, support QA review, and reduce missed refinements or scattered project notes.

## Database Strategy

### MongoDB

MongoDB is used for:

- User authentication
- User accounts
- Password hashes
- Sessions
- Roles and permissions
- Projects
- Project members
- Tasks
- Subtasks or checklists
- Comments
- QA reviews
- Status history
- Notifications
- Reports metadata
- Activity logs
- Audit trails
- File metadata
- App settings
- Flexible project-specific records

### Supabase

Supabase is used for:

- Storage buckets
- Image uploads
- WebP files
- File URLs
- Signed URLs
- Selected relational support only if needed later

Supabase Auth is not used as the primary authentication system.

### Supabase Relational Support

For MVP, Supabase relational support is not required. MongoDB should handle the main app records first to keep the system simple.

Possible future Supabase relational support:

- Lookup tables
- Public category lists
- Lightweight analytics tables
- Structured reporting tables

## Authentication Strategy

Authentication uses MongoDB-based custom authentication.

Supabase Auth is not used as the primary authentication system.

Expected auth features:

- Register
- Login
- Logout
- Password hashing with bcrypt
- Sessions with express-session
- Session storage with connect-mongo
- Protected routes
- Current user middleware
- Role middleware
- Project-level RBAC
- Password reset email through Resend
- Optional Cloudflare Turnstile on auth forms

## File Storage Strategy

Users can upload images and documents.

### Allowed File Types

- Images: JPG, JPEG, PNG, WebP
- Documents: PDF, DOC, DOCX
- Spreadsheets: XLS, XLSX, CSV
- Presentations: PPT, PPTX
- Text files: TXT, MD
- Archives: ZIP, optional only when needed

### File Size Rules

- Images: 5MB max before WebP conversion
- Documents: 10MB max
- ZIP files: 20MB max, optional
- Larger files should be added as external shared URLs instead of being uploaded directly

### File Visibility

- Public files may use public URLs.
- Private files should use signed URLs.
- Task files should only be visible to users who can access the project or task.
- Confidential task files should use signed URLs only.
- Developers can view files in their assigned tasks.
- Quality Managers and Project Leads can view files in projects they manage.
- Super Admin can view files when needed for support or audit.

### MongoDB File Metadata

MongoDB should store:

- Original filename
- Stored filename
- File type
- MIME type
- File size
- Storage provider
- Supabase bucket
- File path
- Public URL or signed URL flag
- Uploaded by
- Linked project ID
- Linked task ID
- Upload date
- WebP conversion status
- Visibility setting
- External shared URL, if used

## Email Requirements

HelloTasks uses Resend for email.

### Email Events

- New user invitation
- Account approval or access approval
- Password reset
- Task assigned
- Task reassigned
- Task marked ready for review
- Task approved
- Task rejected
- Task returned for refinement
- Task comment mention
- Due date reminder
- Manual weekly report or summary

### Email Recipients

- Assigned Developer: task assignment, returned task, rejected task, due date reminder
- Quality Manager: task ready for review, QA-related comments or updates
- Project Lead: task completed, task rejected, project progress summary, access or role changes
- User: invitation, password reset, account approval

### Weekly Reports

Weekly reports are manual for MVP. A Project Lead or Super Admin can generate or send the weekly project summary when needed.

## UI/UX Theme

HelloTasks should use a professional project management dashboard style that still feels friendly, academic, and easy for non-technical users.

### Visual Style

- Follow Hello ecosystem style
- Mobile-friendly layout
- Clean dashboard cards
- Clear task priorities
- Simple charts
- Useful notification summaries
- Kanban-first task management
- Modals for creating and updating task status

### Suggested Colors

| Purpose | Color | Hex |
|---|---|---|
| Primary Blue | Deep professional blue | `#1E40AF` |
| Accent Green | Clean progress green | `#16A34A` |
| Light Blue Background | Soft dashboard background | `#EFF6FF` |
| Light Green Accent | Success or completed state | `#DCFCE7` |
| Neutral Text | Dark slate | `#0F172A` |
| Secondary Text | Slate gray | `#64748B` |
| Border | Light gray | `#E2E8F0` |
| Warning | Amber | `#F59E0B` |
| Error | Red | `#DC2626` |

### Dashboard Elements

- Total projects
- My assigned tasks
- Tasks due soon
- Tasks ready for review
- Blocked or confidential tasks
- Recently completed tasks
- Priority task list
- Simple project progress chart
- Notification summary
- Kanban board shortcut

## Deployment Requirements

- Hosting: Render
- Domain: hellotasks.online
- DNS and security: Cloudflare
- Bot protection: Cloudflare Turnstile
- Email: Resend
- Storage: Supabase Storage
- Main database: MongoDB Atlas
- Authentication: MongoDB custom auth
- Version control: GitHub

## Required Services

| Service | Purpose | Required |
|---|---|---|
| GitHub | Version control | Yes |
| MongoDB Atlas | Auth and main app database | Yes |
| Supabase | File storage and selected relational support | Yes |
| Resend | Email sending | Yes |
| Render | Hosting | Yes |
| Cloudflare | DNS, SSL, security, Turnstile | Yes |
| Domain | Public access | Yes |

## Environment Variables

```env
APP_NAME=HelloTasks
APP_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

MONGO_URI=
SESSION_SECRET=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=

RESEND_API_KEY=
EMAIL_FROM=

CLOUDFLARE_TURNSTILE_SITE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=

SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

Production values:

```env
APP_ENV=production
BASE_URL=https://hellotasks.online
```

## User Setup Checklist

- [ ] Confirm project name
- [ ] Confirm project slug
- [ ] Confirm one-sentence description
- [ ] Confirm domain or subdomain
- [ ] Prepare logo or app icon if available
- [ ] Confirm primary colour and accent colour
- [ ] Confirm target users
- [ ] Confirm MVP scope
- [ ] Create GitHub repository
- [ ] Add repository description
- [ ] Add README
- [ ] Add `.gitignore`
- [ ] Add `.env.example`
- [ ] Create `main` branch
- [ ] Create `dev` branch if needed
- [ ] Add collaborators if needed
- [ ] Create MongoDB Atlas project
- [ ] Create MongoDB cluster
- [ ] Create MongoDB database
- [ ] Create MongoDB database user
- [ ] Configure MongoDB network access
- [ ] Copy MongoDB connection string
- [ ] Add connection string to `.env` as `MONGO_URI`
- [ ] Create Supabase project
- [ ] Create Supabase storage bucket
- [ ] Decide if bucket is public or private
- [ ] Copy Supabase URL
- [ ] Copy Supabase anon key
- [ ] Copy Supabase service role key
- [ ] Add Supabase values to `.env`
- [ ] Create Resend account
- [ ] Add sending domain to Resend
- [ ] Add DNS records for Resend
- [ ] Verify Resend domain
- [ ] Create Resend API key
- [ ] Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env`
- [ ] Create Render account
- [ ] Create Render web service
- [ ] Connect GitHub repository to Render
- [ ] Set Render build command: `npm install`
- [ ] Set Render start command: `npm start`
- [ ] Add environment variables to Render
- [ ] Add domain to Cloudflare
- [ ] Update nameservers if needed
- [ ] Add DNS records
- [ ] Enable SSL/TLS
- [ ] Set HTTPS redirect
- [ ] Configure www/non-www redirect if needed
- [ ] Enable Cloudflare Turnstile
- [ ] Add Turnstile keys to `.env`
- [ ] Run first local test

## Agent Build Checklist

- [ ] Create `package.json`
- [ ] Create `server.js`
- [ ] Configure Express
- [ ] Configure EJS
- [ ] Serve static files
- [ ] Add base route
- [ ] Add dashboard route
- [ ] Add 404 page
- [ ] Add 500 page
- [ ] Create folder structure
- [ ] Create `config/db.js`
- [ ] Connect MongoDB using Mongoose
- [ ] Create `models/User.js`
- [ ] Add MongoDB authentication
- [ ] Hash passwords with bcrypt
- [ ] Compare passwords with bcrypt
- [ ] Use express-session
- [ ] Store sessions with connect-mongo
- [ ] Add auth middleware
- [ ] Add current user middleware
- [ ] Add role middleware
- [ ] Protect dashboard route
- [ ] Create project model
- [ ] Create project member access model or embedded structure
- [ ] Create task model
- [ ] Create task comments or notes model/embedded structure
- [ ] Create task status history
- [ ] Create QA review workflow
- [ ] Create notification model
- [ ] Create audit log model
- [ ] Create file metadata model
- [ ] Create dashboard views
- [ ] Create Kanban board view
- [ ] Create task modals
- [ ] Create user management views
- [ ] Create role management logic
- [ ] Create reports view
- [ ] Create admin settings view
- [ ] Create `config/supabase.js`
- [ ] Use backend service role key only on server
- [ ] Create `services/uploadService.js`
- [ ] Add multer setup
- [ ] Add sharp WebP conversion
- [ ] Add upload-to-Supabase function
- [ ] Return file URL and metadata
- [ ] Do not implement Supabase Auth
- [ ] Create `services/emailService.js`
- [ ] Load `RESEND_API_KEY`
- [ ] Load `EMAIL_FROM`
- [ ] Create reusable sendEmail function
- [ ] Add Cloudflare Turnstile verification helper
- [ ] Add `.env.example`
- [ ] Add custom CSS theme
- [ ] Add responsive CSS
- [ ] Add frontend vanilla JavaScript
- [ ] Create seed script for first Super Admin
- [ ] Add SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to .env.example
- [ ] Add first-run verification guide

## Resolved Decisions

| Decision | Resolution |
|---|---|
| Registration | Open registration. Anyone can register. Super Admin assigns roles after registration. |
| Developer task creation | Developers can create tasks in addition to updating assigned tasks. |
| Task completion approval | Quality Manager approval completes a task by default. Project Lead sign-off is required only when the task is flagged for lead approval. |
| Confidential tasks | Shown as masked locked cards on the Kanban board. Users without task-level access see the card but cannot read the content. |
| Task deletion | Both permanent delete and archive are available. Both require a confirmation dialog. |
| Weekly reports | Dashboard summary and manually triggered email body. No PDF for MVP. |
| Public pages | Excluded from MVP. Internal workflow ships first. Public pages added later. |
| External shared URLs | Stored as links. Server-side validation enforces http or https format only. |
| Blocked vs Confidential | Blocked is a task status. Confidential is a visibility flag. Separate concerns. |
| First Super Admin | Created via seed script using SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from env. |
| Kanban columns | 7 columns: Draft, Assigned, In Progress, Review, Approved, Done, Blocked. |

## AI Assumptions

- HelloTasks starts with open registration. Anyone can register. Role assignment is managed by Super Admin after registration.
- Future public-user expansion is planned but public pages and marketing site are not part of the first MVP.
- MongoDB is the main database for authentication, app data, logs, audit trails, and task records.
- Supabase is used only for file storage, WebP uploads, file URLs, signed URLs, and possible selected relational support later.
- Supabase Auth will not be used.
- Project access is controlled through RBAC and project membership.
- Blocked is a task status meaning work is paused due to a dependency or issue.
- Confidential is a visibility flag on a task, not a status. Confidential tasks are shown as masked locked cards on the Kanban board to users without task-level access.
- Developers can create tasks in addition to updating assigned tasks.
- Quality Manager approval completes a task by default. Project Lead sign-off is only required when the task is flagged for lead approval.
- Permanent delete and archive are both available for tasks. Both require a confirmation step.
- External shared URLs on tasks are stored as links and validated server-side for http or https format only.
- Weekly reports are manual for MVP. Project Lead or Super Admin triggers an email body report or views a dashboard summary.
- WebP conversion applies to images only.
- Large files should be linked externally to reduce cloud storage cost.
- The first Super Admin is created via a seed script using SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from the environment.
- The first UI should focus on dashboard, Kanban board, task modals, and reports.
- The stack is Node.js, Express, EJS, vanilla JavaScript, custom CSS, MongoDB, Mongoose, Resend, Render, Cloudflare, and Supabase Storage.

## Review Status

```txt
All open questions resolved. Ready for final user approval.
```

## User Approval

```txt
Approved: Yes
Approved by: User
Date: 2026-06-16
```
