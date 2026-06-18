# Feature: Recurring Tasks

**Category:** Task Enhancements
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1 day

## Description

Recurring tasks automatically regenerate on a set schedule (daily, weekly, monthly, or custom). When a recurring task is completed, the system creates a fresh copy of it with the status reset to `draft` (or `assigned` if an assignee is set) for the next cycle.

Users set the recurrence pattern when creating or editing a task. The original task acts as the template; each cycle produces a new task record.

## Value

Many projects have repeating work — weekly standup notes, monthly reports, recurring QA checks, regular content updates. Without recurring tasks, someone must manually re-create these tasks every cycle, which is error-prone and easy to forget. Recurring tasks automate the regeneration and keep the cadence consistent.

## Technical Approach

### Model Changes

Add to `models/Task.js`:

```js
recurrence: {
  enabled: { type: Boolean, default: false },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: null },
  nextOccurrence: { type: Date, default: null },
  sourceTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null }
}
```

`sourceTaskId` links each generated instance back to the original template task.

### Routes

No new routes. Recurrence is configured via existing task create/edit forms.

### Controllers

No controller changes needed for setting recurrence — handled via the existing task form.

New cron job logic (add to `jobs/` folder or extend `dueDateReminder.js`):

- Run daily at a set time (e.g., 00:05)
- Query `Task.find({ 'recurrence.enabled': true, 'recurrence.nextOccurrence': { $lte: new Date() }, status: 'completed' })`
- For each match: clone the task fields (title, description, priority, assignee, checklist, etc.), create a new Task with status `draft`, set `recurrence.sourceTaskId` to original, advance `nextOccurrence` by the frequency
- Update `nextOccurrence` on the original/template task

### Views

- `views/tasks/new.ejs` / `edit.ejs` — add a "Recurrence" section: toggle checkbox + frequency select (Daily / Weekly / Monthly)
- `views/tasks/show.ejs` — show recurrence badge if task is recurring. Show "Part of recurring series" if task is a generated instance.

## Files to Modify

- `models/Task.js` — add `recurrence` sub-object
- `views/tasks/new.ejs` — recurrence toggle + frequency picker
- `views/tasks/edit.ejs` — same
- `views/tasks/show.ejs` — recurrence indicator
- `jobs/` — new `recurringTasks.js` cron job (or extend existing job file)
- `server.js` — register the new cron job

## Dependencies

Requires `node-cron` (already installed for `dueDateReminder.js`).

## Notes

- Only trigger regeneration when the task is `completed`. If the task is abandoned/archived, do not regenerate automatically.
- Editing the template task should not retroactively change already-generated instances.
- Show a "recurring" icon on kanban cards and task list rows for recurring tasks.
- Monthly recurrence should handle month-end edge cases (e.g., "every 31st" — use end-of-month clamping).
- Consider a max history limit — don't keep indefinitely old instances. An optional archive after N cycles keeps the project task list clean.
