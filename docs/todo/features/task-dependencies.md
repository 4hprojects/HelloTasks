# Feature: Task Dependencies

**Category:** Task Enhancements
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Task dependencies let users mark one task as "blocked by" another task. When task A blocks task B, task B cannot be moved to "In Progress" until task A is completed. The dependency chain is visible on both task detail pages.

Users with manager-level access can add/remove dependencies from the task edit or detail page.

## Value

Many real-world tasks have ordering constraints — you cannot write documentation before the feature is built, or deploy before QA passes. Without explicit dependencies, these constraints live in someone's head or in comments. Dependencies make the blocking relationship visible, automatically enforce it in the workflow, and help identify bottlenecks at a glance.

## Technical Approach

### Model Changes

Add to `models/Task.js`:

```js
blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
```

Optionally add `blocks` as a virtual (computed by querying other tasks' `blockedBy` arrays).

### Routes

Add dedicated dependency management endpoints:

```
POST /projects/:projectId/tasks/:taskId/dependencies        — add a dependency
DELETE /projects/:projectId/tasks/:taskId/dependencies/:depId — remove a dependency
```

### Controllers

- Add `addDependency` and `removeDependency` controller functions
- In `updateStatus`: before allowing a move to `in_progress`, check that all tasks in `blockedBy` have status `completed`. Return an error if not.
- Populate `blockedBy` when loading the task for `showTask`

### Views

- `views/tasks/show.ejs` — "Blocked by" section listing dependent tasks with their current status and a link to each. "Add dependency" dropdown (search existing project tasks).
- `views/tasks/edit.ejs` — same dependency management UI.
- `views/projects/kanban.ejs` — show a lock icon on blocked task cards that have unresolved dependencies.

## Files to Modify

- `models/Task.js` — add `blockedBy` array
- `controllers/taskController.js` — add `addDependency`, `removeDependency`, update `updateStatus` guard
- `routes/taskRoutes.js` — add dependency routes
- `views/tasks/show.ejs` — blocked-by section
- `views/tasks/edit.ejs` — dependency management
- `views/projects/kanban.ejs` — dependency lock indicator

## Dependencies

None beyond the existing task system. Works independently of subtasks.

## Notes

- Prevent circular dependencies (task A blocked by B, B blocked by A). Validate on save by checking if the target task already has the current task in its `blockedBy` chain.
- Only check direct dependencies (one level). Deep dependency graph traversal is unnecessary for MVP of this feature.
- Cross-project dependencies are out of scope — only allow linking tasks within the same project.
- When a blocking task is completed, consider sending a notification to the assignee of the dependent task ("Task X is no longer blocked — Task Y was completed").
