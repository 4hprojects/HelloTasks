# Project Context

## Project Name

HelloTasks

## Purpose

HelloTasks is a private task management tool for 4HProjects and the Hello Ecosystem.

It provides:

- Project creation and team member management
- Role-based access control (Super Admin, Project Lead, Quality Manager, Developer, Viewer)
- Kanban-style task board with 7 columns
- Full task lifecycle (Draft → Assigned → In Progress → Review → Approved → Done)
- QA review workflow (approve, reject, return for refinement)
- Confidential task support with masked locked cards
- File uploads via Supabase Storage (images converted to WebP)
- In-app notifications and basic reporting
- Manual weekly email reports

## Main Goal

Organize Hello Ecosystem project work from task assignment to completion, reduce missed refinements, and support structured QA review.

## Status

Project brief approved 2026-06-16. Build in progress. See BUILD-TRACKER.md for current phase.

## Important Decisions

- MongoDB is used for authentication and all app data.
- Supabase Auth is not used.
- Supabase is used for storage and selected relational support only.
- EJS is used for views.
- Vanilla JavaScript is used for frontend behaviour.
- Custom CSS is used for styling.
- Open registration — Super Admin assigns roles after signup.
- See DECISIONS.md for all resolved feature decisions.
