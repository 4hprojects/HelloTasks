# Project Intake Questionnaire

Use this file before starting any new Hello ecosystem project.

The AI assistant should ask these questions one section at a time.

## Section 1: Basic Project Identity

1. What is the project name?
2. What is the short name or slug?
3. Is this part of the Hello ecosystem?
4. What domain or subdomain will it use?
5. Is this a public app, private app, or mixed app?
6. What is the one-sentence description of the project?
7. Is this for personal use, internal use, public users, clients, students, or teams?

## Section 2: Problem and Purpose

1. What problem does the project solve?
2. Who experiences this problem?
3. What happens if this problem is not solved?
4. What should the project make easier?
5. What is the main value of the project?
6. What is the expected outcome for users?

## Section 3: Target Users

1. Who will use the system?
2. Who will manage the system?
3. Who will create records?
4. Who will review or approve records?
5. Who will only view records?
6. Are there external users, internal users, or both?

## Section 4: User Roles and Permissions

1. Does the project need login?
2. What user roles are needed?
3. What can each role do?
4. What can each role not do?
5. Who can manage users?
6. Who can approve or reject records?
7. Who can upload files?
8. Who can view reports?
9. What pages should be protected?
10. What pages should remain public?

Important fixed rule:

```txt
Authentication uses MongoDB.
Do not use Supabase Auth as the primary authentication system.
```

## Section 5: Core Workflow

1. What is the main process from start to finish?
2. What does the first user do?
3. What does the second user do?
4. What needs review or approval?
5. What status changes are needed?
6. What does “done” mean in this system?
7. What happens when something is rejected or returned?
8. What happens when something is blocked?

## Section 6: Main Modules

1. Does it need a dashboard?
2. Does it need user management?
3. Does it need role management?
4. Does it need reports?
5. Does it need search or filters?
6. Does it need notifications?
7. Does it need file uploads?
8. Does it need public pages?
9. Does it need admin settings?
10. What are the main pages?

## Section 7: Data and Database

1. What data should be stored in MongoDB?
2. What records are flexible or document-like?
3. What records need logs?
4. What records need audit trails?
5. What files should be stored in Supabase Storage?
6. Does the project need selected relational support in Supabase?
7. Are there lookup tables or structured reference data?
8. What data should never be public?

## Section 8: Uploads and Storage

1. Will users upload images?
2. Will users upload documents?
3. What file types are allowed?
4. Should uploaded images convert to WebP?
5. What is the maximum file size?
6. Should files be public or private?
7. Who can view uploaded files?
8. Should files use public URLs or signed URLs?
9. What metadata should be stored in MongoDB?

## Section 9: Email and Notifications

1. Does the system need email?
2. What events should trigger email?
3. Who receives each email?
4. Does it need password reset email?
5. Does it need invitation email?
6. Does it need approval or rejection email?
7. Does it need weekly reports or summaries?

## Section 10: UI and Branding

1. What is the preferred theme?
2. What colours should be used?
3. Should it follow the Hello ecosystem style?
4. Does it need a logo or icon?
5. Should it be mobile-friendly?
6. Should it be more professional, friendly, academic, medical, or developer-focused?
7. What dashboard style is preferred?

## Section 11: Deployment and Services

1. Will it be deployed on Render?
2. What domain will be used?
3. Will Cloudflare manage DNS?
4. Does it need Cloudflare Turnstile?
5. Does it need Resend?
6. Does it need Supabase Storage?
7. Does it need MongoDB Atlas?
8. What environment variables are needed?

## Section 12: MVP Scope

1. What features must be included in version 1?
2. What features should be delayed?
3. What is not part of the MVP?
4. What is the first working version expected to do?
5. What can be added after launch?
6. What would make the MVP successful?
