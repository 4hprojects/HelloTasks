# Feature: Multiple Assignees

**Category:** Task Enhancements
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Allow more than one team member to be assigned to a single task. All assignees can update the task status, receive assignment notifications, and see the task in their personal task views. The task show page displays all assignees as an avatar group.

## Value

Some tasks genuinely require two people — a developer and a designer working on the same feature, or two QA reviewers checking a critical release. Forcing a single-assignee model means either the second person is invisible in the workflow, or you must create duplicate tasks. Multiple assignees reflects how real teams actually divide work.

## Technical Approach

### Model Changes

Change in `models/Task.js` from:

```js
assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
```

To:

```js
assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
```

Keep `assignee` as a deprecated field or run a migration to move existing single-assignee values into the array.

### Routes

No new routes. The task create/edit forms post to existing endpoints.

### Controllers

- `createTask` / `updateTask`: read `req.body.assignees` (multi-select value, an array) instead of `req.body.assignee`
- `listTasks`: update filter query — `{ assignees: userId }` works with MongoDB array fields
- Send assignment notification to all assignees on task create/reassign
- `buildWeeklyReportData` in `adminController.js`: update the "assigned" stat to count distinct tasks with the current user in `assignees`

### Views

- `views/tasks/new.ejs` / `edit.ejs` — change the assignee `<select>` to a multi-select (or a custom multi-select using checkboxes)
- `views/tasks/show.ejs` — show assignee avatar group instead of single avatar
- `views/tasks/list.ejs` — show avatar group in the Assignee column
- `views/projects/kanban.ejs` — show avatar group on kanban cards (truncated with "+N" if more than 2)

## Files to Modify

- `models/Task.js` — change `assignee` to `assignees` array
- `controllers/taskController.js` — update all reads/writes of `assignee`
- `controllers/adminController.js` — update aggregation stats
- `views/tasks/new.ejs`, `edit.ejs`, `show.ejs`, `list.ejs`
- `views/projects/kanban.ejs`
- Any notification logic that references `task.assignee`

## Dependencies

None. Self-contained model change.

## Notes

- This is a breaking change to the Task model field name. All existing tasks will have an empty `assignees` array unless a migration is run to copy `assignee → assignees[0]`.
- For the multi-select UI in EJS without a framework, use a `<select multiple>` with `Ctrl+click`, or a custom checkbox list that submits `assignees[]` as an array of IDs.
- The due date reminder cron job queries by `task.assignee` — this must be updated to iterate over `task.assignees`.
- Keep the display simple: show a maximum of 3 avatars on cards and list rows, with a "+N more" badge.
