# Feature: Workload / Capacity View

**Category:** Views & Visualization
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A per-user breakdown showing how many open tasks are assigned to each team member, optionally weighted by estimated hours. Displayed as a bar chart or table — one row per user, showing their task count and total estimated hours across all (or a specific) project.

Project leads use this to identify overloaded or underutilised team members before assigning new tasks.

Available scoped to a project (`/projects/:id/workload`) or globally for admins (`/workload`).

## Value

Without a workload view, task assignment is effectively blind — a project lead must mentally track who has what. One developer may have 20 tasks, another may have 2, and there's no quick way to see this imbalance. The workload view makes capacity visible at a glance, preventing burnout and identifying capacity for new work.

## Technical Approach

### Model Changes

None. Uses existing `assignee` and `estimatedHours` fields.

### Routes

```
GET /projects/:projectId/workload    — project workload view
GET /workload                        — global workload (admins only)
```

### Controllers

- `showWorkload` (project-scoped):
  ```js
  Task.aggregate([
    { $match: { project: projectId, assignee: { $ne: null }, status: { $nin: ['completed','archived'] } } },
    { $group: {
      _id: '$assignee',
      taskCount: { $sum: 1 },
      totalHours: { $sum: { $ifNull: ['$estimatedHours', 0] } },
      overdueCount: { $sum: { $cond: [{ $lt: ['$dueDate', new Date()] }, 1, 0] } }
    } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $sort: { taskCount: -1 } }
  ])
  ```

### Views

New `views/projects/workload.ejs`:

- Table or horizontal bar chart per user
- Columns: user name/avatar, open task count, estimated hours total, overdue count
- Visual bar: a CSS-width bar showing task count relative to the highest-loaded person
- Clicking a user row could link to the task list filtered by that assignee
- Optional: a "team average" benchmark row at the top

## Files to Modify

- `controllers/projectController.js` — add `showWorkload` handler
- `routes/projectRoutes.js` — add workload route
- `views/projects/workload.ejs` — new view
- `views/projects/show.ejs` — optional "Workload" button link in the project nav

## Dependencies

- Time Estimate feature is not required but makes this significantly more useful (shows estimated hours, not just count).

## Notes

- If Multiple Assignees feature is built, the aggregation changes from `assignee` to unwinding `assignees` array.
- The global workload view (`/workload`) should only show users from projects the requesting user manages. Super Admin sees all.
- A "danger" threshold could be configurable: e.g., highlight users with more than 10 open tasks in red.
- Unassigned tasks should be shown in a separate "Unassigned" row so leads can see the backlog that hasn't been delegated.
