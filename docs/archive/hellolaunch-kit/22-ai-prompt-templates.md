# HelloLaunch AI Prompts

Use these prompts with Claude, Codex, Copilot, ChatGPT, or another AI coding assistant.

## Prompt 1: Start Guided Project Intake

Copy and paste this first.

```txt
You are helping me start a new project using the HelloLaunch process.

Read these files first if they are available in the project folder:

- START-HERE.md
- PROJECT-INTAKE.md
- PROJECT-BRIEF-TEMPLATE.md
- PROJECT-REVIEW-CHECKLIST.md
- USER-SETUP-CHECKLIST.md
- AGENT-BUILD-CHECKLIST.md
- CLAUDE.md
- PROJECT-CONTEXT.md
- DATABASE-STRATEGY.md
- IMPLEMENTATION-GUIDE.md
- TASKS.md
- DECISIONS.md

Start the guided project intake.

Ask me the project intake questions one section at a time.

Do not ask all questions at once.

After I answer all sections, summarize my answers into a Markdown file called PROJECT-BRIEF.md.

The project brief must include:

1. Project name
2. One-sentence description
3. Problem statement
4. Target users
5. User roles
6. Core workflow
7. Main modules
8. MVP scope
9. Database strategy
10. Authentication strategy
11. File storage strategy
12. Email requirements
13. UI/UX theme
14. Deployment requirements
15. User setup checklist
16. Agent build checklist
17. Open questions
18. AI assumptions

Important rules:

- MongoDB is the standard authentication database.
- Do not use Supabase Auth as the primary authentication system.
- Use Supabase only for storage, WebP uploads, file URLs, signed URLs, and selected relational support.
- Use Node.js, Express, EJS, vanilla JavaScript, custom CSS, MongoDB, Mongoose, Resend, Render, and Cloudflare.
- Do not use React, Vue, Angular, Tailwind, Bootstrap, or TypeScript unless I explicitly request it.

After creating PROJECT-BRIEF.md, stop and ask me to review it.

Do not generate code yet.
```

## Prompt 2: Review and Improve Project Brief

Use this after the AI creates `PROJECT-BRIEF.md`.

```txt
Review PROJECT-BRIEF.md for missing details, unclear assumptions, incomplete workflows, role conflicts, database confusion, and MVP scope issues.

Check that:

- MongoDB is used for authentication.
- Supabase Auth is not used.
- Supabase is only used for storage, file URLs, WebP uploads, signed URLs, and selected relational support.
- The roles are clear.
- The MVP scope is realistic.
- The user setup checklist is complete.
- The agent build checklist is complete.
- The project can be built with Node.js, Express, EJS, vanilla JavaScript, custom CSS, MongoDB, Mongoose, Resend, Render, and Cloudflare.

Ask me questions for anything unclear.

Do not generate code yet.
```

## Prompt 3: Generate Project-Specific Documentation

Use this only after you approve `PROJECT-BRIEF.md`.

```txt
Using the approved PROJECT-BRIEF.md, generate the project-specific documentation files.

Create Markdown content for:

- README.md
- PROJECT-CONTEXT.md
- DATABASE-STRATEGY.md
- IMPLEMENTATION-GUIDE.md
- TASKS.md
- DECISIONS.md
- docs/00-project-overview.md
- docs/01-product-concept.md
- docs/02-user-roles-and-permissions.md
- docs/03-core-workflow.md
- docs/04-system-architecture.md
- docs/05-database-design.md
- docs/06-api-routes.md
- docs/07-ui-ux-theme.md
- docs/08-mvp-scope.md
- docs/09-development-roadmap.md
- docs/10-future-features.md
- docs/11-open-questions-and-decisions.md
- docs/12-implementation-guide.md

Follow HelloLaunch standards.

Do not generate app code yet.
```

## Prompt 4: Generate Starter App Structure

Use this after the project-specific docs are reviewed.

```txt
Using the approved PROJECT-BRIEF.md and project documentation, generate the starter app structure.

Use:

- Node.js
- Express
- EJS
- Vanilla JavaScript
- Custom CSS
- MongoDB with Mongoose
- MongoDB-based authentication
- bcrypt
- express-session
- connect-mongo
- Supabase Storage configuration
- multer and sharp for WebP upload workflow
- Resend email service placeholder
- Render-ready scripts
- Cloudflare-ready environment variables

Do not use React, Vue, Angular, Tailwind, Bootstrap, TypeScript, or Supabase Auth.

Create:

- server.js
- package.json
- .env.example
- config/db.js
- config/supabase.js
- models/User.js
- routes/authRoutes.js
- controllers/authController.js
- middleware/authMiddleware.js
- middleware/roleMiddleware.js
- services/emailService.js
- services/uploadService.js
- views/layouts/main.ejs
- views/partials/topbar.ejs
- views/partials/sidebar.ejs
- views/partials/flash-messages.ejs
- views/auth/login.ejs
- views/auth/register.ejs
- views/dashboard/index.ejs
- views/errors/404.ejs
- views/errors/500.ejs
- public/css/base.css
- public/css/theme.css
- public/css/layout.css
- public/css/components.css
- public/css/forms.css
- public/css/buttons.css
- public/css/responsive.css
- public/js/main.js

After generating, summarize what was created and what the user must configure manually.
```

## Prompt 5: Verify First Run

Use this after the starter app is created and `.env` is filled.

```txt
Help me verify the first run of this project.

Check:

- npm install
- npm run dev
- MongoDB connection
- EJS rendering
- Static CSS and JS loading
- Register page
- Login page
- Logout
- Protected dashboard
- Session persistence
- Supabase configuration
- Resend configuration
- Error pages

If an error appears, diagnose it step by step.

Do not change the stack.
Do not introduce React, Tailwind, Bootstrap, TypeScript, or Supabase Auth.
```
