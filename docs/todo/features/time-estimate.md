# Feature: Time Estimate

**Category:** Task Enhancements
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~1 hr

## Description

A simple numeric field on each task representing the estimated hours of work required. Set during task creation or editing. Displayed on the task detail page, task list, and optionally used in workload calculations.

## Value

Time estimates let project leads plan capacity — if a developer has 40 tasks estimated at 2 hours each, that signals a capacity problem immediately. Estimates also enable tracking of actual vs. estimated time when paired with the Time Tracking feature, and provide useful data for sprint planning and project health scores.

## Technical Approach

### Model Changes

Add to `models/Task.js`:

```js
estimatedHours: { type: Number, default: null, min: 0 }
```

### Routes

No new routes. Saved via existing task create/edit form POST.

### Controllers

- `createTask` / `updateTask`: read and validate `req.body.estimatedHours`. Parse as float. Reject negative values.
- `listTasks`: optionally include in task list data (already populated if part of the Task model).

### Views

- `views/tasks/new.ejs` / `edit.ejs` — add an "Estimated Hours" number input in the properties sidebar (right column of the two-column form layout).
- `views/tasks/show.ejs` — display estimated hours in the properties sidebar if set.
- `views/tasks/list.ejs` — optionally show as a column (hidden by default on mobile).

## Files to Modify

- `models/Task.js` — add `estimatedHours` field
- `controllers/taskController.js` — read and validate on create/update
- `views/tasks/new.ejs` — add input
- `views/tasks/edit.ejs` — add input with existing value
- `views/tasks/show.ejs` — display value

## Dependencies

None. Standalone field addition.

## Notes

- This feature becomes significantly more useful when combined with Time Tracking (to compare estimated vs. actual).
- Also feeds into the Workload / Capacity View feature, which can sum estimated hours per user.
- Accept decimal values (e.g., 0.5 for 30 minutes, 1.5 for 90 minutes).
- Show as "X hrs" in the UI. If less than 1, show "X min" (converted from decimal hours).
