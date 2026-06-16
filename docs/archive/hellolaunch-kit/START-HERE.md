# START HERE

Welcome to **HelloLaunch**.

This folder is your guided starter kit for creating a new Hello ecosystem project.

HelloLaunch helps you:

- Define what the project is
- Ask the right setup questions before coding
- Create a project brief for review
- Prepare AI coding instructions
- Guide Claude, Codex, Copilot, or ChatGPT
- Create user setup checklists
- Create agent build checklists
- Start development with fewer missed steps

## What HelloLaunch Is

HelloLaunch is not the final application.

It is the setup system used before building applications such as:

- HelloTasks
- HelloRun modules
- HelloUniversity modules
- HelloDental
- HelloWorks
- Future Hello ecosystem apps
- Client systems using the Hello project structure

## Standard Hello Stack

All generated projects should follow this standard unless you intentionally change it.

```txt
Backend: Node.js + Express
Views: EJS
Frontend Behaviour: Vanilla JavaScript
Styling: Custom CSS
Main Database: MongoDB + Mongoose
Authentication: MongoDB-based custom auth
Password Hashing: bcrypt
Sessions: express-session + connect-mongo
Storage: Supabase Storage
Image Processing: multer + sharp, convert images to WebP
Email: Resend
Hosting: Render
DNS and Security: Cloudflare
```

## Important Rule

MongoDB is the standard authentication database for all Hello ecosystem projects.

Do not use Supabase Auth as the primary authentication system.

Supabase is used for:

- Storage buckets
- WebP uploads
- File URLs
- Signed URLs
- Selected relational support
- Optional lookup data

## First Step

Open this folder in VS Code.

### Windows or Mac

Open VS Code, then choose:

```txt
File > Open Folder
```

Select the `hellolaunch-guided-starter-kit` folder.

### Terminal

If you are already inside the folder, run:

```bash
code .
```

## Second Step

Choose the AI tool you want to use:

- Claude
- Codex
- Copilot
- ChatGPT

Then open:

```txt
PROMPTS.md
```

Copy the prompt under:

```txt
Prompt 1: Start Guided Project Intake
```

Paste it into your preferred AI tool.

## What Happens Next

The AI should not code immediately.

The AI should first ask you project intake questions one section at a time.

The flow should be:

```txt
1. AI asks project intake questions
2. You answer the questions
3. AI summarizes your answers into PROJECT-BRIEF.md
4. You review PROJECT-BRIEF.md
5. AI revises the brief if needed
6. You approve the project brief
7. AI creates project-specific docs and setup checklist
8. AI creates the agent build plan
9. You complete external service setup
10. AI starts building the base system
```

## Files You Should Read First

Read these in order:

```txt
START-HERE.md
PROMPTS.md
PROJECT-INTAKE.md
PROJECT-BRIEF-TEMPLATE.md
PROJECT-REVIEW-CHECKLIST.md
USER-SETUP-CHECKLIST.md
AGENT-BUILD-CHECKLIST.md
```

## What You Should Not Do Yet

Do not start coding immediately.

Do not create random files yet.

Do not ask the AI to build the app before the project brief is reviewed.

Do not let the AI change the stack unless you decide to.

## Fast Start

Copy this into your AI tool:

```txt
Read START-HERE.md, PROMPTS.md, PROJECT-INTAKE.md, PROJECT-BRIEF-TEMPLATE.md, PROJECT-REVIEW-CHECKLIST.md, USER-SETUP-CHECKLIST.md, AGENT-BUILD-CHECKLIST.md, CLAUDE.md, PROJECT-CONTEXT.md, DATABASE-STRATEGY.md, IMPLEMENTATION-GUIDE.md, TASKS.md, and DECISIONS.md.

Start the HelloLaunch guided project intake.

Ask me the project intake questions one section at a time.

After I answer all sections, create PROJECT-BRIEF.md using the template.

Stop after creating PROJECT-BRIEF.md and ask me to review it.

Do not generate code yet.
```

## Your Goal

Your first goal is not to build the app.

Your first goal is to clearly define what the app is.

A clear project brief prevents wrong assumptions, missed requirements, and wasted AI coding time.
