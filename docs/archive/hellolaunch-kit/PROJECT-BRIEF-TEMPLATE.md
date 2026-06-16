# PROJECT-BRIEF.md Template

The AI should generate this file after the project intake questions are answered.

The user must review and approve this before coding starts.

---

# PROJECT-BRIEF.md

## Project Name

[Project name]

## Project Slug

[project-slug]

## One-Sentence Description

[Short project summary]

## Project Type

[Public app, private app, mixed app, internal tool, client system, etc.]

## Problem Statement

[Explain the problem the project solves.]

## Target Users

- [User type 1]
- [User type 2]
- [User type 3]

## User Roles

| Role | Description | Main Permissions | Restrictions |
|---|---|---|---|
| Admin |  |  |  |
| Manager |  |  |  |
| Member |  |  |  |
| Viewer |  |  |  |

## Core Workflow

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Step 4]
5. [Step 5]

## MVP Scope

### Included in MVP

- [Feature 1]
- [Feature 2]
- [Feature 3]

### Excluded for Now

- [Future feature 1]
- [Future feature 2]
- [Future feature 3]

## Database Strategy

### MongoDB

MongoDB is used for:

- User authentication
- User accounts
- Password hashes
- Sessions
- App records
- Logs
- Flexible data
- Project-specific records

### Supabase

Supabase is used for:

- File storage
- WebP uploads
- File URLs
- Signed URLs if needed
- Selected relational support if needed

## Authentication Strategy

Authentication uses MongoDB-based custom auth.

Supabase Auth is not used as the primary authentication system.

Expected auth features:

- Register
- Login
- Logout
- Password hashing with bcrypt
- Sessions with express-session
- Session storage with connect-mongo
- Protected routes
- Role middleware

## File Upload Strategy

[Explain file uploads if needed.]

## Email Strategy

[Explain email needs.]

## UI/UX Theme

[Theme summary]

## Deployment Strategy

- Hosting: Render
- DNS and security: Cloudflare
- Email: Resend
- Storage: Supabase Storage
- Main database: MongoDB
- Authentication: MongoDB custom auth

## Required Services

| Service | Purpose | Required |
|---|---|---|
| GitHub | Version control | Yes |
| MongoDB Atlas | Auth and app database | Yes |
| Supabase | Storage and selected relational support | Yes |
| Resend | Email | Yes/No |
| Render | Hosting | Yes |
| Cloudflare | DNS and security | Yes |
| Domain | Public access | Yes/No |

## User Setup Checklist

- [ ] Create GitHub repository
- [ ] Create MongoDB database
- [ ] Create Supabase project
- [ ] Create Supabase bucket
- [ ] Create Resend account and API key
- [ ] Create Render web service
- [ ] Add domain to Cloudflare
- [ ] Fill `.env`
- [ ] Run first local test

## Agent Build Checklist

- [ ] Create base Express app
- [ ] Configure EJS
- [ ] Add custom CSS theme
- [ ] Connect MongoDB
- [ ] Build MongoDB auth
- [ ] Add protected dashboard
- [ ] Add role middleware
- [ ] Add Supabase config
- [ ] Add WebP upload service placeholder
- [ ] Add Resend email service placeholder
- [ ] Add error pages
- [ ] Add documentation files

## Open Questions

- [Question 1]
- [Question 2]

## AI Assumptions

- [Assumption 1]
- [Assumption 2]

## Review Status

```txt
Pending user review
```

## User Approval

```txt
Approved: No
Approved by:
Date:
```
