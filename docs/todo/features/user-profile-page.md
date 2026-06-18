# Feature: User Profile Page

**Category:** User & Access Management
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A per-user profile page accessible within the app at `/users/:userId/profile`. It shows the user's name, avatar, role, account status, a short bio, and a summary of their recent activity (tasks completed, tasks in progress, recent comments). Other team members can view public profiles. Users can edit their own bio and display name.

## Value

The current user list shows only basic account information. A profile page makes team members feel like real people in the system — colleagues can get context on who someone is, what they're working on, and their contribution history. It also provides a natural home for self-service account settings (bio, display name, avatar, notification preferences) rather than having these scattered across settings pages.

## Technical Approach

### Model Changes

Add to `models/User.js`:

```js
bio:         { type: String, default: '', maxlength: 300 },
displayName: { type: String, default: '' }  // Optional nickname/short name
```

### Routes

```
GET  /users/:userId/profile       — view user profile (any authenticated user)
GET  /account/profile             — edit own profile
POST /account/profile             — save bio, displayName, avatar
```

### Controllers

- `showUserProfile`:
  - Load user by ID (public fields only — no passwordHash, no session data)
  - Load recent stats: tasks completed this month, open tasks, projects they're a member of
  - Render profile view

- `editProfile` / `updateProfile`:
  - Only allows editing `bio`, `displayName` (and avatar via separate upload route)
  - Role, email, and account status are not editable here — those stay in the admin user management flow

### Views

New `views/users/profile.ejs`:

- Hero section: avatar, name, role badge, account status, join date
- Bio section: editable text for own profile
- Stats section: tasks completed this month, open tasks, projects
- Recent activity: last 10 task status changes or comments

New `views/account/profile-edit.ejs`:
- Form to edit `bio`, `displayName`, and trigger avatar upload

## Files to Modify

- `models/User.js` — add `bio`, `displayName`
- `controllers/userController.js` — add `showUserProfile`
- `controllers/accountController.js` — add `editProfile`, `updateProfile`
- `routes/userRoutes.js` — add profile route
- `routes/accountRoutes.js` — add profile edit routes
- `views/users/profile.ejs` — new view
- `views/account/profile-edit.ejs` — new view
- `views/users/list.ejs` — link user names to their profile

## Dependencies

- Custom Avatars feature is a natural complement — profile page is where the avatar is shown most prominently.

## Notes

- Respect privacy: only show data the viewing user has access to. If a user is not a member of any shared project with the viewer, limit what is shown.
- Super Admin can view all user profiles for account management purposes.
- The "bio" field should allow basic formatting (line breaks) but no HTML — sanitize on save.
- The profile edit page is the natural place to also link to 2FA setup and notification preferences when those features are built.
