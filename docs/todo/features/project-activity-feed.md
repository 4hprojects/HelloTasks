# Feature: Project Activity Feed

**Category:** Collaboration & Communication
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A project-level activity feed on the project detail page showing recent actions across all tasks in the project: new tasks created, status changes, comments added, members added/removed, and file uploads. Displayed as a reverse-chronological list, showing the last 50 actions by default.

## Value

The project detail page currently shows a static snapshot (member list, task stats). The activity feed makes the project page feel alive — project leads can see what has happened recently without drilling into individual tasks. It answers "what has changed in this project in the past 24 hours?" — essential for managing an active team.

## Technical Approach

### Model Changes

Uses the same `ActivityLog` model from the Task Activity Feed feature, which already stores a `project` reference. No additional model changes needed.

### Routes

No new routes. Activity feed is loaded as part of `showProject`.

### Controllers

In `showProject`: add a query to load recent project activity:

```js
const recentActivity = await ActivityLog.find({ project: req.project._id })
  .populate('actor', 'fullName')
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();
```

### Views

- `views/projects/show.ejs` — add an "Activity" panel below the task stats panel (right column):
  - Compact list: actor avatar, action description, task link, time ago
  - "View all activity" link for a full paginated page

Optional: new `views/projects/activity.ejs` for the full paginated activity log.

## Files to Modify

- `controllers/projectController.js` — add activity query to `showProject`
- `views/projects/show.ejs` — activity feed panel

## Dependencies

- Task Activity Feed feature must be built first — this shares the same `ActivityLog` model and write points.

## Notes

- Summarize activity entries concisely: "Jane moved 'Fix login bug' to In Progress", "John added a comment on 'Update docs'".
- For confidential tasks, mask the task title in the project activity feed for users who don't have access to that task.
- Keep the feed compact — 3–5 lines visible by default with a "show more" toggle.
- Member add/remove events should also be logged here, even though they are not task events. Write them in the project controller when membership changes.
