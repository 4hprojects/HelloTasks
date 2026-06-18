# Feature: Team Announcements

**Category:** Collaboration & Communication
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Project leads and managers can post a one-way announcement to all project members. Announcements appear at the top of the project detail page as a highlighted banner and are sent as an email to all active project members. Each announcement has a title, body text, and an optional link. Old announcements are archived and viewable in an announcement history log on the project page.

## Value

Currently, the only way to communicate with all project members in HelloTasks is to add a comment on a specific task. There is no project-wide broadcast channel. Announcements fill this gap for important updates: "We are moving to a new sprint cadence from Monday", "The deadline has changed to June 30th", "New QA requirements now apply to all tasks." These messages need to reach everyone immediately, not be buried in a task thread.

## Technical Approach

### Model Changes

New `models/Announcement.js`:

```js
const AnnouncementSchema = new mongoose.Schema({
  project:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true, trim: true, maxlength: 150 },
  body:     { type: String, required: true },
  link:     { type: String, default: '' },
  pinned:   { type: Boolean, default: true },
  archivedAt: { type: Date, default: null }
}, { timestamps: true });
```

### Routes

```
POST   /projects/:projectId/announcements           — create announcement
DELETE /projects/:projectId/announcements/:id       — delete / archive
PATCH  /projects/:projectId/announcements/:id/unpin — unpin from top
```

### Controllers

- `createAnnouncement`:
  - Save the announcement
  - Send email to all active project members using Resend (new email template)
  - Create an in-app notification for each member
- `deleteAnnouncement`: soft-delete (set `archivedAt`)
- `unpinAnnouncement`: set `pinned = false`

### Views

- `views/projects/show.ejs` — show pinned announcements as a highlighted banner at the top of the page (above the member panel). Include a dismiss button that calls `unpinAnnouncement` for managers.
- Optional `views/projects/announcements.ejs` — full history page with all announcements
- New announcement form: modal or inline form (title + body + optional link + submit)

## Files to Modify

- `models/Announcement.js` — new model
- `controllers/announcementController.js` — new controller
- `routes/projectRoutes.js` — add announcement routes
- `views/projects/show.ejs` — announcement banner
- `services/emailTemplates.js` — announcement email template
- `services/emailService.js` — send to project members

## Dependencies

None. Self-contained feature.

## Notes

- Announcements are not a chat system — they are one-way broadcasts. Do not add replies to announcements (that turns it into a forum, which is out of scope).
- Pin only the most recent announcement by default. Older ones go to history.
- Announcement emails should have an "unsubscribe from project announcements" link — this maps to the Notification Preferences feature when built.
- Limit announcements to manager roles and above. Developers should not be able to broadcast to the whole project.
