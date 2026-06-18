# Feature: Status Auto-progression

**Category:** Automation
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

When a user checks off the last item in a task's checklist, the task status automatically advances to "Ready for Review" (if the task was `in_progress` or `assigned`). This eliminates the extra step of manually changing the status after completing all checklist items.

A small banner or toast confirms the auto-advancement so users are not surprised by the change.

## Value

A common workflow friction point: a developer completes every item on the task checklist but then forgets to change the status to "Ready for Review." The QA manager never sees it, the task stalls, and someone has to manually remind the developer. Auto-progression on full checklist completion removes this friction and keeps the workflow moving without requiring an extra deliberate action.

## Technical Approach

### Model Changes

Add a per-task toggle to control this behaviour:

```js
autoProgressOnChecklistComplete: { type: Boolean, default: true }
```

This lets users opt out if needed (e.g., for tasks with a checklist that doesn't represent "done").

### Routes

The existing checklist update route already handles checklist item toggling. No new routes.

### Controllers

In the controller that handles checklist item updates (likely in `taskController.js`, the `updateChecklistItem` or equivalent function):

After saving the updated checklist item:

```js
const allDone = task.checklist.every(item => item.completed);
const autoStatuses = ['assigned', 'in_progress'];

if (allDone && task.autoProgressOnChecklistComplete && autoStatuses.includes(task.status)) {
  task.status = 'ready_for_review';
  task.statusHistory.push({ status: 'ready_for_review', changedBy: req.user._id, note: 'Auto-advanced: all checklist items completed' });
  await task.save();
  // Trigger the same notifications as a manual status change to ready_for_review
}
```

### Views

- `views/tasks/edit.ejs` — add a checkbox: "Automatically advance to Review when checklist is complete" (defaults on).
- `views/tasks/show.ejs` — when the auto-progression fires (detectable via XHR response), show a toast: "All items done — task moved to Ready for Review."

## Files to Modify

- `models/Task.js` — add `autoProgressOnChecklistComplete` field
- `controllers/taskController.js` — add auto-progression logic after checklist item update
- `views/tasks/edit.ejs` — opt-out checkbox
- `views/tasks/show.ejs` — toast notification on auto-advance

## Dependencies

None. Works with the existing checklist and status system.

## Notes

- Only auto-advance if the task is in an appropriate "working" status (`assigned` or `in_progress`). Do not auto-advance from `blocked`, `draft`, or `returned_for_refinement`.
- If a task requires Project Lead approval (`requiresLeadApproval`), auto-progression still only goes to `ready_for_review` — the lead approval step comes after QA, not here.
- The auto-advance note in `statusHistory` makes it auditable — it clearly shows the change was automatic.
- If a user un-checks a checklist item after auto-progression (e.g., they realised something isn't done), the status is NOT automatically reverted. Reversion must be manual to avoid confusing loops.
