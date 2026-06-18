# Feature: Subtasks

**Category:** Task Enhancements
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~1 day

## Description

Subtasks are true nested tasks under a parent task. Unlike checklist items (which are simple text checkboxes with no workflow), subtasks are full task records — each with their own status, assignee, priority, due date, and comments. A parent task shows a progress indicator based on how many subtasks are completed.

Users can create subtasks from the task detail page. Each subtask links back to its parent and is also visible in the project task list (optionally collapsed under the parent row).

## Value

Checklist items handle simple to-do lists, but they cannot be assigned to different people, tracked through the QA workflow, or filtered independently. Subtasks unlock proper delegation of work within a complex task — e.g., a "Launch Page" task can have subtasks for "Write copy", "Design mockup", "QA review", each assigned to different team members.

## Technical Approach

### Model Changes

Add a `parentTask` field to `models/Task.js`:

```js
parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null }
```

Add a virtual or computed `subtaskCount` and `completedSubtaskCount` for progress display. Alternatively, compute via aggregation when loading the parent.

### Routes

No new routes required. Subtasks are created via the existing `POST /projects/:projectId/tasks` route with a `parentTask` field passed in the form body. Add:

```
GET /projects/:projectId/tasks/:taskId  — task show page, loads subtasks via query
```

### Controllers

- `createTask`: accept and save `parentTask` from `req.body`
- `showTask`: query `Task.find({ parentTask: task._id })` to load subtasks for display
- `deleteTask` / `archiveTask`: cascade to subtasks (soft-delete all subtasks when parent is deleted/archived)

### Views

- `views/tasks/show.ejs` — add a "Subtasks" section below the checklist. Show progress bar (`completedCount / totalCount`). "Add subtask" button opens a quick-create form inline or navigates to the new task form pre-filled with `parentTask`.
- `views/tasks/list.ejs` — optionally indent or badge subtasks under their parent in the project task list.
- `views/tasks/new.ejs` / `edit.ejs` — add a hidden `parentTask` input when creating from the parent task page.

## Files to Modify

- `models/Task.js` — add `parentTask` field
- `controllers/taskController.js` — update `createTask`, `showTask`, `deleteTask`, `archiveTask`
- `views/tasks/show.ejs` — subtasks section
- `views/tasks/list.ejs` — indented subtask display
- `views/tasks/new.ejs` — hidden parentTask input

## Dependencies

None. Can be built on top of the existing task system without changes to projects or users.

## Notes

- Limit nesting to one level (no sub-subtasks) to keep complexity manageable.
- Subtasks should inherit the project and visibility settings of their parent.
- When computing project task stats on the dashboard, decide whether to count subtasks separately or only count parent tasks.
- The Kanban board should not show subtasks as separate cards — they should only appear in the task detail view and the list view (optionally).
