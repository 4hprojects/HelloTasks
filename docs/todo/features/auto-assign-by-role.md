# Feature: Auto-assign by Role

**Category:** Automation
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A project-level configuration option that automatically assigns newly created tasks to a specific project member based on their role. For example, a project can be configured to auto-assign all new tasks to the project lead, or to a specific developer.

The auto-assignment is overridable — users can always change the assignee manually after the task is created.

## Value

For small projects or solo-developer projects, every task has the same assignee. Re-selecting the same person every single time is tedious. Auto-assign removes that repetition. It is also useful for triage workflows where all incoming tasks are first assigned to a lead who then redistributes them.

## Technical Approach

### Model Changes

Add to `models/Project.js`:

```js
autoAssignToRole: { type: String, enum: ['project_lead', 'developer', 'none'], default: 'none' },
autoAssignToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
```

`autoAssignToRole` assigns to the first project member found with that role. `autoAssignToUser` pins to a specific person. If both are set, `autoAssignToUser` takes priority.

### Routes

No new routes. Settings are saved via the existing project edit form POST.

### Controllers

- `createTask`: after building the task object, check `req.project.autoAssignToUser` or `autoAssignToRole`. If set and `req.body.assignee` is blank, resolve the user and set `task.assignee` automatically.
- `updateProject` / `editProject`: save the new auto-assign config fields.

### Views

- `views/projects/edit.ejs` — add an "Auto-assign new tasks" section:
  - Radio: "No auto-assign", "Assign to specific user", "Assign to first member with role"
  - Conditional select for user (dropdown of project members) or role (dropdown of roles)

## Files to Modify

- `models/Project.js` — add `autoAssignToRole`, `autoAssignToUser` fields
- `controllers/taskController.js` — auto-assign logic in `createTask`
- `controllers/projectController.js` — save config in `updateProject`
- `views/projects/edit.ejs` — auto-assign settings UI

## Dependencies

None. Works with existing task and project models.

## Notes

- Auto-assignment only triggers when the task form's assignee field is left blank. It does not override an explicit assignee selection.
- If the configured auto-assign user is later removed from the project, the auto-assign should gracefully fall back to "no assignee" rather than error.
- When auto-assignment fires, the usual "task assigned" notification email should still be sent to the auto-assigned user.
- For role-based assignment: if multiple members share the role (e.g., two developers), assign to the one with the fewest open tasks (load-balanced) or just the first one alphabetically. Keep it simple initially.
