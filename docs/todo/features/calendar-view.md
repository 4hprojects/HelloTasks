# Feature: Calendar View

**Category:** Views & Visualization
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A monthly calendar view showing tasks positioned on their due date. Each day cell lists the task titles due that day as small clickable chips. Clicking a chip navigates to the task detail page. The calendar can be filtered by project or by assignee. Navigation arrows move between months.

Available from the global task view (`/tasks/calendar`) and from within a project (`/projects/:id/tasks/calendar`).

## Value

The task list and Kanban board show status-based groupings, not time-based ones. When a user wants to understand their week's workload — what is due Monday vs. Friday — the list view requires heavy filtering. A calendar view makes time-based planning effortless and is especially useful for project leads scheduling reviews and due dates.

## Technical Approach

### Model Changes

None. Uses existing `dueDate` field on Task.

### Routes

```
GET /tasks/calendar                            — global calendar view
GET /projects/:projectId/tasks/calendar        — project calendar view
```

Both accept `?month=YYYY-MM` query param for navigation (default: current month).

### Controllers

- `showCalendar` (global and project-scoped variants):
  - Parse `month` param, compute start/end of month
  - Query `Task.find({ dueDate: { $gte: startOfMonth, $lte: endOfMonth }, status: { $ne: 'archived' } })` with project filter if scoped
  - Group tasks by `dueDate` (ISO date string) into a map `{ '2026-06-20': [task, ...] }`
  - Render the view with the task map and the month's calendar grid metadata

### Views

New `views/tasks/calendar.ejs`:

- Pure HTML/CSS calendar grid (7-column table, one row per week)
- EJS loops to fill in the days and task chips
- Navigation links: `?month=YYYY-MM` for prev/next month
- Each task chip: small `<a>` link, colour-coded by priority
- Day cells with tasks overflow: show first 3, "and N more" link

No external calendar library needed — a simple CSS grid with EJS iteration is sufficient.

## Files to Modify

- `controllers/taskController.js` — add `showCalendar` function (or `calendarController.js`)
- `routes/taskRoutes.js` — add calendar route
- `routes/projectRoutes.js` — add project-scoped calendar route
- `views/tasks/calendar.ejs` — new view
- `public/css/tasks.css` — calendar grid styles
- `views/partials/sidebar.ejs` — add "Calendar" link

## Dependencies

None. Uses existing task data.

## Notes

- The calendar grid needs to handle month offset — the first day of the month may not be Monday. Compute the day-of-week offset and pad the grid with empty cells.
- Keep it read-only for now — drag-and-drop due date editing on the calendar is a follow-up enhancement.
- On mobile, a weekly view or a simple grouped list by date is more readable than a full monthly grid. Consider a responsive fallback.
- Highlight today's date cell with a subtle background colour.
- Show overdue tasks (past due date, not completed) with a red indicator.
