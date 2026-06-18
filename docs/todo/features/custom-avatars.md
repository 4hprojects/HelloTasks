# Feature: Custom Avatars

**Category:** User & Access Management
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Users can upload a profile photo to replace the default letter avatar. The uploaded image is converted to WebP, stored in Supabase Storage, and the URL is saved in the user's profile. The avatar appears everywhere the user's letter avatar currently appears: task cards, comments, member lists, and the topbar.

## Value

Letter avatars are functional but impersonal. A profile photo humanises the team — it is easier to associate work with a real face than with a single letter, especially in a team where multiple people share the same first initial. It also makes the user list and task cards feel more like a real team tool.

## Technical Approach

### Model Changes

Add to `models/User.js`:

```js
avatarUrl:     { type: String, default: null },
avatarPath:    { type: String, default: null }  // Supabase storage path for deletion
```

### Routes

```
POST /account/avatar    — upload new avatar
DELETE /account/avatar  — remove avatar (revert to letter avatar)
```

### Controllers

- `uploadAvatar`:
  - Accept file via `multer` (memory storage)
  - Validate: image only (jpg/jpeg/png/webp), max 2MB
  - Convert to WebP using `sharp` (already installed): resize to 200×200, circular crop optional
  - Upload to Supabase Storage in a `avatars/` folder using existing `uploadService`
  - Save `avatarUrl` and `avatarPath` to the user record
  - Delete the previous avatar from Supabase if one existed (`supabase.storage.from(bucket).remove([oldPath])`)

- `removeAvatar`: remove the stored file from Supabase, clear `avatarUrl` and `avatarPath` from the user.

### Views

- Account settings page (`views/account/settings.ejs` or user edit page) — avatar upload section:
  - Current avatar preview (photo or letter avatar)
  - "Upload photo" button — file input
  - "Remove photo" button (only shown if avatar exists)
  - Max 2MB hint

- Everywhere `user.fullName.charAt(0)` is rendered as an avatar letter: check `user.avatarUrl` first and render `<img>` if set, otherwise fall back to the letter avatar. This affects:
  - `views/partials/topbar.ejs`
  - `views/tasks/show.ejs` (comments)
  - `views/projects/show.ejs` (member list)
  - `views/users/list.ejs`

## Files to Modify

- `models/User.js` — add `avatarUrl`, `avatarPath`
- `controllers/accountController.js` — add `uploadAvatar`, `removeAvatar`
- `routes/accountRoutes.js` — add avatar routes
- `views/account/settings.ejs` — avatar upload UI
- All views rendering user letter avatars — add `avatarUrl` fallback
- `public/css/base.css` — `.user-avatar img` style for photo avatars

## Dependencies

- Supabase Storage already configured — use existing `uploadService.js`.
- `sharp` already installed for WebP conversion.

## Notes

- The Supabase bucket for avatars should be public (or use signed URLs with a long TTL) so avatar images load fast without auth overhead.
- Use a separate `avatars/` path prefix in the bucket to keep avatars separate from task file uploads.
- Resize and crop to a square on upload. A 200×200px WebP is sufficient for all display sizes.
- Consider caching the avatar URL on the session or in a res.locals middleware so every page render doesn't need to re-query the user for their `avatarUrl`.
