# Feature: Task Activity Feed

**Category:** Collaboration & Communication
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A chronological timeline on the task detail page showing every action taken on the task: status changes, assignee changes, priority changes, checklist completions, field edits, file uploads, and new comments. Each entry shows who did what and when.

The existing `statusHistory` array captures status changes. This feature extends coverage to all edits and creates a unified activity timeline view replacing the separate "Status History" and "Comments" sections.

## Value

Without an activity feed, it is unclear what happened to a task — who changed the priority, when was it reassigned, why did it go from Approved back to In Progress. The activity feed provides full transparency and accountability. It is the primary debugging tool when a task's history is questioned, and it is one of the features most noticed by users switching from GitHub Issues or Jira.

## Technical Approach

### Model Changes

Extend or replace the existing `statusHistory` array with a more general activity log. Options:

**Option A** (preferred): Add a separate `ActivityLog` model (or reuse existing AuditLog if it has the right shape):

```js
const ActivitySchema = new mongoose.Schema({
  task:    { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  actor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['status_changed','assignee_changed','priority_changed','field_edited','comment_added','file_uploaded','checklist_updated','created'] },
  detail:  { type: mongoose.Schema.Types.Mixed },  // { from: 'draft', to: 'in_progress' } etc.
  createdAt: { type: Date, default: Date.now, index: true }
});
```

**Option B**: Keep `statusHistory` but add activity log entries alongside comments in a unified view.

### Routes

No new routes. Activity feed is loaded as part of `showTask`.

### Controllers

- In `showTask`: load `ActivityLog.find({ task: taskId }).populate('actor').sort({ createdAt: 1 }).lean()`
- In `updateTask`, `updateStatus`, `updateAssignee`, etc.: create an ActivityLog entry on each save

### Views

- `views/tasks/show.ejs` — replace separate "Status History" timeline with a unified "Activity" timeline interleaved with comments:
  - Each activity entry: avatar dot + description text + timestamp
  - Visual design: vertical line connecting dots (existing `.task-timeline` CSS pattern)
  - Comments appear in the same feed as activity entries, ordered by timestamp

## Files to Modify

- `models/ActivityLog.js` — new model (or extend existing AuditLog)
- `controllers/taskController.js` — write activity log entries on status, assignee, priority, field changes
- `controllers/commentController.js` — write activity log entry on comment create
- `views/tasks/show.ejs` — unified activity + comment timeline

## Dependencies

None. Extension of existing task system.

## Notes

- Do not log every field edit as a separate entry if bulk-editing — group changes within the same save into one activity entry.
- Keep the activity feed lean — do not log internal system fields or metadata changes.
- For comment entries in the feed: show the comment text inline in the timeline. Full comment (with edit/delete) stays in the comments section above or below.
- Paginate if a task has more than 50 activity entries (common for long-lived tasks).
