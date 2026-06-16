# Agent Build Checklist

This checklist is for the AI agent.

The agent should not start coding until the project brief is approved.

## Phase 0: Read Context

Before coding, read:

- START-HERE.md
- PROJECT-BRIEF.md
- CLAUDE.md
- PROJECT-CONTEXT.md
- DATABASE-STRATEGY.md
- IMPLEMENTATION-GUIDE.md
- TASKS.md
- DECISIONS.md

## Phase 1: Base App

- [ ] Create `package.json`
- [ ] Create `server.js`
- [ ] Configure Express
- [ ] Configure EJS
- [ ] Serve static files
- [ ] Add base route
- [ ] Add dashboard route
- [ ] Add 404 page
- [ ] Add 500 page

## Phase 2: Folder Structure

Create:

```txt
config/
models/
routes/
controllers/
middleware/
services/
utils/
views/
views/layouts/
views/partials/
views/auth/
views/dashboard/
views/errors/
public/css/
public/js/
public/assets/
docs/
```

## Phase 3: Theme and Layout

- [ ] Create `views/layouts/main.ejs`
- [ ] Create topbar partial
- [ ] Create sidebar partial
- [ ] Create flash messages partial
- [ ] Create base CSS
- [ ] Create theme CSS
- [ ] Create layout CSS
- [ ] Create forms CSS
- [ ] Create buttons CSS
- [ ] Create components CSS
- [ ] Create responsive CSS
- [ ] Create main frontend JavaScript

## Phase 4: MongoDB Connection

- [ ] Create `config/db.js`
- [ ] Load `MONGO_URI` from `.env`
- [ ] Connect using Mongoose
- [ ] Add connection success and error logs

## Phase 5: MongoDB Authentication

MongoDB auth is required.

Do not use Supabase Auth.

- [ ] Create `models/User.js`
- [ ] Add `fullName`
- [ ] Add `email`
- [ ] Add `passwordHash`
- [ ] Add `globalRole`
- [ ] Add `accountStatus`
- [ ] Add timestamps
- [ ] Create register route
- [ ] Create login route
- [ ] Create logout route
- [ ] Hash passwords with bcrypt
- [ ] Compare passwords with bcrypt
- [ ] Use express-session
- [ ] Store sessions with connect-mongo
- [ ] Add auth middleware
- [ ] Add current user middleware
- [ ] Add role middleware
- [ ] Protect dashboard route

## Phase 6: Supabase Storage Ready

Supabase is for storage and selected relational support.

- [ ] Create `config/supabase.js`
- [ ] Use backend service role key only on server
- [ ] Create `services/uploadService.js`
- [ ] Add multer setup
- [ ] Add sharp WebP conversion
- [ ] Add upload-to-Supabase function
- [ ] Return file URL and metadata
- [ ] Do not implement Supabase Auth

## Phase 7: Resend Email Ready

- [ ] Create `services/emailService.js`
- [ ] Load `RESEND_API_KEY`
- [ ] Load `EMAIL_FROM`
- [ ] Create reusable sendEmail function

## Phase 8: First Run Verification

- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Confirm app loads
- [ ] Confirm CSS loads
- [ ] Confirm register works
- [ ] Confirm login works
- [ ] Confirm dashboard is protected
- [ ] Confirm logout works
- [ ] Confirm MongoDB user record exists

## Final Rule

After coding, the agent must summarize:

- Files created
- Files modified
- Features implemented
- What the user must configure
- How to test
- What remains incomplete
