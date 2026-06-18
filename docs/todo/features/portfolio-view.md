# Feature: Portfolio View

**Category:** Views & Visualization
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A high-level overview page showing all projects side by side, each with a progress bar, task count breakdown (total / completed / in progress / blocked), and status badge. Designed for project managers and admins to get a one-screen summary of the health of the entire portfolio without drilling into individual projects.

Available at `/projects/portfolio` or as a view toggle on the projects list page.

## Value

The existing projects list shows project names and status badges but no task data. The dashboard shows overall stats. The portfolio view fills the gap: a manager overseeing 8 projects can see at a glance which ones are healthy, which are stalled, and which are blocked — without clicking into each project individually. This is a standard feature in Monday.com and Asana's "portfolios" or ClickUp's "workspaces."

## Technical Approach

### Model Changes

None. Uses existing Project and Task data.

### Routes

```
GET /projects/portfolio    — portfolio view
```

Or add `?view=portfolio` to the existing `/projects` route.

### Controllers

- `showPortfolio` (or add a branch in `listProjects`):
  - Load all accessible projects (RBAC-scoped as with the existing list)
  - For each project, run a lightweight aggregation to get task stats:
    ```js
    Task.aggregate([
      { $match: { project: { $in: projectIds }, status: { $ne: 'archived' } } },
      { $group: {
        _id: '$project',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status','completed'] }, 1, 0] } },
        blocked:   { $sum: { $cond: [{ $eq: ['$status','blocked'] }, 1, 0] } },
        inProgress:{ $sum: { $cond: [{ $eq: ['$status','in_progress'] }, 1, 0] } }
      }}
    ])
    ```
  - Merge stats into the project list and render

### Views

New `views/projects/portfolio.ejs` (or a conditional block in `views/projects/list.ejs`):

- Grid of project cards (3-column on desktop, 1-column on mobile)
- Each card: project avatar + name, status badge, progress bar (% completed), mini stats row (total, in progress, blocked), link to project + kanban

## Files to Modify

- `controllers/projectController.js` — add `showPortfolio` handler
- `routes/projectRoutes.js` — add portfolio route
- `views/projects/portfolio.ejs` — new view
- `views/projects/list.ejs` — optional view toggle button (List / Portfolio)
- `public/css/` — portfolio card styles

## Dependencies

None. Extension of existing project list.

## Notes

- Reuse the `$facet` aggregation pattern already used in `adminController.js` for the weekly report.
- For Super Admin and system admin, show all projects. For project leads, show only their projects.
- The portfolio view is read-only — no actions, just visibility.
- A "sort by health" option (most blocked first, or lowest completion % first) would be a useful default for identifying problem areas.
