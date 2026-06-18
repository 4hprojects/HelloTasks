# Feature: Task Watchers / Followers

**Category:** Task Enhancements
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Any project member can "watch" a task to receive notifications about it without being assigned to it. Watchers get notified when the task status changes, when a new comment is posted, or when the task is completed or blocked. A "Watch / Unwatch" toggle button appears on the task detail page.

The task show page shows a count of watchers (e.g., "3 watching").

## Value

Project leads, QA managers, or stakeholders often need to stay informed about a task without being its assignee. Currently, they only receive notifications if they are the assignee or are @mentioned. The watcher pattern is the standard solution to this in Jira, GitHub, and Asana — it lets anyone opt in to task updates without cluttering the assignment field.

## Technical Approach

### Model Changes

Add to `models/Task.js`:

```js
watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
```

### Routes

```
POST /projects/:projectId/tasks/:taskId/watch   — add current user to watchers
POST /projects/:projectId/tasks/:taskId/unwatch — remove current user from watchers
```

Both are XHR-capable (return JSON for in-page toggle) or redirect back to task show.

### Controllers

- `watchTask`: `Task.findByIdAndUpdate(..., { $addToSet: { watchers: userId } })`
- `unwatchTask`: `Task.findByIdAndUpdate(..., { $pull: { watchers: userId } })`
- In `createComment`, `updateStatus`, and other notification dispatch points: send notifications to `task.watchers` (excluding the actor and the assignee, who already get their own notifications)

### Views

- `views/tasks/show.ejs` — "Watch" button in the task hero actions section. Toggle to "Unwatch" when the current user is already watching. Show watcher count next to the button.

## Files to Modify

- `models/Task.js` — add `watchers` array
- `controllers/taskController.js` — add `watchTask`, `unwatchTask` functions; update notification dispatch to include watchers
- `routes/taskRoutes.js` — add watch/unwatch routes
- `views/tasks/show.ejs` — watch button and count
- `utils/notificationService.js` (or equivalent) — update to send watcher notifications

## Dependencies

None. Works with the existing notification system.

## Notes

- Auto-watch behavior: should a task creator automatically become a watcher? Reasonable default, but make it configurable via notification preferences.
- The assignee is never added to `watchers` — they already receive all task notifications. Avoid double-notifying.
- Watcher notifications should respect the user's notification preference settings (when that feature is built).
- On task archive or deletion, watcher notifications should stop silently — no need to notify watchers of an archive event.
