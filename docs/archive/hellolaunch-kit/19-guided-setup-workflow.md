# 19 - Guided Setup Workflow

## Purpose

HelloLaunch is a guided setup workflow where the user and AI agent work in parallel.

## Full Workflow

```txt
1. User opens HelloLaunch folder
2. User opens START-HERE.md
3. User copies the guided intake prompt
4. User pastes prompt into preferred AI tool
5. AI asks project intake questions one section at a time
6. User answers questions
7. AI creates PROJECT-BRIEF.md
8. User reviews PROJECT-BRIEF.md
9. AI revises brief if needed
10. User approves brief
11. AI generates project-specific docs
12. AI generates agent build plan
13. User completes external setup checklist
14. AI creates starter app files
15. User fills .env
16. User runs npm install
17. User runs npm run dev
18. AI helps verify first run
19. Project moves to MVP development
```

## Human Responsibilities

The user handles project decisions, GitHub, MongoDB, Supabase, Resend, Render, Cloudflare, domain setup, environment values, and final approval of the project brief.

## AI Agent Responsibilities

The AI handles asking questions, summarizing answers, creating the project brief, finding gaps, creating documentation, creating starter app structure, creating login foundation, creating theme foundation, and helping verify first run.

## Required Approval Gate

The AI must stop after creating `PROJECT-BRIEF.md`.

The user must review it before coding starts.
