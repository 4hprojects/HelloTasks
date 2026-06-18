# Feature: Time Tracking

**Category:** Task Enhancements
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1 day

## Description

Time tracking lets team members log the actual hours spent working on a task. Each log entry records the user, duration, date, and an optional note. A running total of logged hours is shown on the task detail page. Users can either start/stop a live timer or manually enter hours after the fact.

The task detail page shows a "Log Time" section with the total hours logged, a breakdown by contributor, and a form to add a new entry.

## Value

Time tracking provides visibility into where hours are actually going. It enables billing accountability, helps identify tasks that took far longer than estimated, and feeds accurate data into reporting. For teams managing client work or sprint capacity, actual time data is essential for future planning.

## Technical Approach

### Model Changes

New model `models/TimeLog.js`:

```js
const TimeLogSchema = new mongoose.Schema({
  task:    { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hours:   { type: Number, required: true, min: 0.05 },
  date:    { type: Date, default: Date.now },
  note:    { type: String, default: '' }
}, { timestamps: true });
```

### Routes

```
POST   /projects/:projectId/tasks/:taskId/time        — log time entry
DELETE /projects/:projectId/tasks/:taskId/time/:logId — delete a log entry (own entries only, or manager)
```

### Controllers

New `timeController.js` (or add to `taskController.js`):

- `logTime`: validate hours > 0, create TimeLog record, return redirect to task show
- `deleteTimeLog`: check ownership (user can only delete their own logs; managers can delete any)

In `showTask`: aggregate `TimeLog.find({ task: taskId })` and compute total hours.

### Views

- `views/tasks/show.ejs` — "Time Logged" section below comments:
  - Total hours badge
  - Breakdown table: user, date, hours, note, delete button (own only)
  - "Log Time" form: hours number input, date picker, note text input, submit button
  - Optional: start/stop timer button (frontend JS, stores start time in `localStorage`, computes elapsed on stop and pre-fills the form)

## Files to Modify

- `models/TimeLog.js` — new model
- `controllers/timeController.js` — new controller (or extend `taskController.js`)
- `routes/taskRoutes.js` — add time routes
- `views/tasks/show.ejs` — time logging section
- `server.js` or route registration — if using a separate controller file

## Dependencies

- Optional but highly complementary: Time Estimate feature (for estimated vs. actual comparison)

## Notes

- The live timer is purely frontend — it reads `Date.now()` on start and stop, computes the difference in hours, and pre-fills the manual log form. No server-side timer state is needed.
- Round logged time to 2 decimal places (e.g., 1.25 hrs = 1h 15min).
- Show an "estimated vs. actual" comparison on the task page if `estimatedHours` is set.
- For reporting, `TimeLog` can be aggregated by project, user, or date range to produce billing or effort summaries.
- Viewers should not be able to log time. Restrict to developers and above.
