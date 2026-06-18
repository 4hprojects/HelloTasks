# Feature: Blocked / At-Risk Report

**Category:** Reporting & Analytics
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~2 hrs

## Description

A dedicated view listing all tasks that are currently blocked or overdue (past their due date and not completed). Tasks are grouped by project and sorted by how long they have been blocked or overdue. Each row shows the task title, assignee, days blocked/overdue, and a direct link to the task.

Available at `/reports/at-risk` or as a preset filter on the global task list.

## Value

Blocked and overdue tasks are the primary indicators that a project is in trouble. Currently, a project lead has to filter the task list manually to find these. A dedicated at-risk report surfaces this information immediately without any filtering, making it a natural daily check-in page for anyone responsible for project health.

## Technical Approach

### Model Changes

None. Uses existing `status` and `dueDate` fields. Uses `blockedSince` timestamp if Task Dependencies feature tracks when a task became blocked — otherwise approximate from the last `statusHistory` entry with `status: 'blocked'`.

### Routes

```
GET /reports/at-risk    — at-risk report
```

### Controllers

Two queries:

1. **Blocked tasks**: `Task.find({ status: 'blocked', project: { $in: accessibleProjectIds } })`
2. **Overdue tasks**: `Task.find({ dueDate: { $lt: new Date() }, status: { $nin: ['completed', 'archived', 'blocked'] }, project: { $in: accessibleProjectIds } })`

Merge results, add computed `daysOverdue` / `daysBlocked` per task, sort by that value descending.

### Views

New `views/reports/at-risk.ejs`:

- Two sections: "Blocked" and "Overdue"
- Table per section: task title (link), project, assignee, priority badge, days blocked/overdue (highlighted in red if > 7 days), status
- Summary stat at the top: total blocked count, total overdue count
- Empty state: "No blocked or overdue tasks — everything is on track."
- Optional: project filter dropdown

## Files to Modify

- `controllers/reportController.js` (or admin controller) — add `showAtRiskReport` handler
- `routes/reportRoutes.js` — add at-risk route
- `views/reports/at-risk.ejs` — new view

## Dependencies

None. Minimal new logic — mainly a query and presentation.

## Notes

- This could also be a preset filter on the existing `/tasks` global list rather than a standalone report page. Both approaches are valid.
- A quick action on each row ("Notify assignee" or "Change priority to Critical") would make this page more actionable, but is a follow-up enhancement.
- Consider emailing this report to project leads when the blocked/overdue count exceeds a threshold (a future automation rule).
- "Days blocked" is computed from the most recent `statusHistory` entry where `status === 'blocked'`.
