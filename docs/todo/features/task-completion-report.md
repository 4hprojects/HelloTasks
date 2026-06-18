# Feature: Task Completion Report

**Category:** Reporting & Analytics
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A report showing how many tasks each team member completed within a selected time period (this week, this month, this quarter, or a custom date range). Results are displayed as a table and an optional bar chart. Project leads and admins use this to evaluate productivity and measure output.

Available at `/reports/task-completion` (global) or linked from the admin reports section.

## Value

Project leads need to understand team output over time — not just what is currently in progress, but what was actually delivered. The weekly report captures a snapshot, but the task completion report provides a historical, filterable view. It is useful for performance reviews, sprint retrospectives, and identifying who is carrying the most load.

## Technical Approach

### Model Changes

None. Uses `status === 'completed'` and the `updatedAt` timestamp (or a dedicated `completedAt` field if added).

Consider adding an indexed `completedAt` field to Task for accurate completion time tracking:

```js
completedAt: { type: Date, default: null, index: true }
```

Set `completedAt = new Date()` in `updateStatus` when status changes to `completed`.

### Routes

```
GET /reports/task-completion    — report view
```

Accepts query params: `?from=YYYY-MM-DD&to=YYYY-MM-DD&project=`

### Controllers

New `reportController.js` (or extend `adminController.js`):

```js
Task.aggregate([
  { $match: {
    status: 'completed',
    completedAt: { $gte: fromDate, $lte: toDate },
    ...(projectId ? { project: projectId } : {})
  }},
  { $group: {
    _id: '$assignee',
    completedCount: { $sum: 1 },
    avgDaysToComplete: { $avg: { $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 86400000] } }
  }},
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $sort: { completedCount: -1 } }
])
```

### Views

New `views/reports/task-completion.ejs`:

- Date range picker (from / to) and project filter
- Results table: user avatar, name, completed count, avg days to complete
- Visual bar chart (CSS bar per row, proportional to max count)
- Total row at the bottom

## Files to Modify

- `models/Task.js` — add `completedAt` field
- `controllers/taskController.js` — set `completedAt` on status change to `completed`
- `controllers/reportController.js` — new controller (or extend admin)
- `routes/reportRoutes.js` — new route file, or add to admin routes
- `views/reports/task-completion.ejs` — new view
- `server.js` — register report routes

## Dependencies

None critical. `completedAt` field improves accuracy over using `updatedAt`.

## Notes

- `updatedAt` is not a reliable proxy for completion time — a task can be updated many times. Adding `completedAt` as a dedicated field is worth the small model change.
- Respect RBAC: project leads see their projects only, admins see all.
- The "avg days to complete" metric reveals efficiency trends — tasks consistently taking 10+ days signals a workflow problem.
