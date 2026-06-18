# Feature: Burndown Chart

**Category:** Reporting & Analytics
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1 day

## Description

A burndown chart visualizes the rate at which tasks are completed over time compared to an ideal linear pace. The X axis is time (days or weeks), the Y axis is the number of remaining tasks (or story points). Two lines are drawn: the ideal burndown (straight line from total to zero) and the actual burndown (computed from historical completion data).

Available per project at `/projects/:id/reports/burndown`, and optionally per sprint when the Sprints feature is built.

## Value

A burndown chart answers the key agile question: "Are we on track to finish by the deadline?" If the actual line is above the ideal line, the team is behind. If it is below, they are ahead. Without a burndown view, teams can only guess at their trajectory. This is the primary chart in Jira and Azure DevOps for sprint health.

## Technical Approach

### Model Changes

Add `completedAt` to Task model (if not already added by Task Completion Report feature):

```js
completedAt: { type: Date, default: null, index: true }
```

### Routes

```
GET /projects/:projectId/reports/burndown    — burndown chart view
```

Accepts `?from=YYYY-MM-DD&to=YYYY-MM-DD` for date range.

### Controllers

```js
async function showBurndown(req, res) {
  const { from, to } = req.query;
  const startDate = from ? new Date(from) : project.createdAt;
  const endDate   = to   ? new Date(to)   : new Date();

  // Total tasks created by start date (the "starting inventory")
  const totalAtStart = await Task.countDocuments({
    project: projectId,
    createdAt: { $lte: startDate }
  });

  // Daily completions within range
  const completions = await Task.aggregate([
    { $match: { project: projectId, completedAt: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
      count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]);

  // Build chart data array: [{ date, remaining, ideal }]
  // ...
}
```

### Views

New `views/reports/burndown.ejs`:

- Date range picker
- SVG line chart rendered server-side (inline SVG in EJS):
  - Two `<polyline>` elements: ideal (dashed) and actual (solid)
  - X axis: date labels
  - Y axis: remaining task count
- Legend
- Summary: "X tasks remaining, Y tasks completed in this period"

## Files to Modify

- `models/Task.js` — add `completedAt` field (if not done by Task Completion Report)
- `controllers/taskController.js` — set `completedAt` on status change to `completed`
- `controllers/reportController.js` — add `showBurndown` handler
- `routes/reportRoutes.js` — add route
- `views/reports/burndown.ejs` — new view with inline SVG chart

## Dependencies

- `completedAt` field on Task (shared with Task Completion Report feature).
- Sprints feature would make this chart more meaningful (per-sprint burndown), but it works as a project-level chart without sprints.

## Notes

- Inline SVG is the right approach here — no external charting library needed for a simple two-line chart. Compute points in the controller and pass as an array to EJS.
- The ideal line is: starting tasks - (completed_per_day * day_number). It is a straight line, easily computed.
- Task additions after the start date (newly created tasks) complicate the burndown. Handle by showing them as a separate "scope change" annotation or by recomputing the ideal line after each addition.
- A story-point burndown (Y axis = story points) is a future enhancement, dependent on the Story Points feature.
