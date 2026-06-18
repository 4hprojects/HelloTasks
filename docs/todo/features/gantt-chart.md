# Feature: Timeline / Gantt Chart

**Category:** Views & Visualization
**Priority:** Low
**Status:** Idea
**Effort Estimate:** ~2–3 days

## Description

A horizontal timeline view showing tasks as bars stretching from their creation date (or a manual start date) to their due date. Tasks are grouped by assignee or by project phase/milestone. Dependency arrows (if Task Dependencies is built) connect blocking/blocked tasks. The timeline can be scrolled horizontally to see past and future weeks.

## Value

The Gantt chart is the standard tool for project scheduling and deadline planning. It makes overlapping work, critical paths, and tight deadlines immediately visible in a way that a task list cannot. Project managers at larger companies expect to see one. For the Hello Ecosystem's current size, it is lower priority, but it becomes important as project complexity grows.

## Technical Approach

### Model Changes

Add optional `startDate` to `models/Task.js` (a task's intended start date, separate from creation date):

```js
startDate: { type: Date, default: null }
```

### Routes

```
GET /projects/:projectId/tasks/timeline    — Gantt chart view
```

### Controllers

- `showTimeline`: load all non-archived tasks with `startDate` or `dueDate` set, sorted by start date.
- Optionally load dependency data if Task Dependencies feature is built.

### Views

New `views/tasks/timeline.ejs`:

This is the complex part. Options:

1. **Pure CSS/HTML approach** — compute each bar's left offset and width as a percentage of the visible date range. Works well for small task sets (< 100). Simple, no external library.
2. **SVG rendering** — more precise, supports dependency arrows. Still no external library. Higher complexity.
3. **Third-party library** — DHTMLX Gantt (has open-source version), or a lightweight canvas-based library. Introduces a dependency but saves significant rendering work.

Recommended: start with the pure CSS/HTML approach for simplicity, then migrate to SVG if dependency arrows are needed.

## Files to Modify

- `models/Task.js` — add optional `startDate` field
- `controllers/taskController.js` — add `showTimeline` handler
- `routes/taskRoutes.js` — add timeline route
- `views/tasks/timeline.ejs` — new view
- `views/tasks/new.ejs` / `edit.ejs` — add optional start date field
- `public/css/tasks.css` — timeline bar styles

## Dependencies

- Task Dependencies feature provides the data for dependency arrows (optional enhancement to the chart).
- Milestones feature data can be overlaid on the chart as vertical markers.

## Notes

- This is listed as Low priority because the rendering complexity is high and the immediate user base is small enough to manage without it.
- The minimum viable version (CSS bars, no arrows) is buildable in ~half a day. Full dependency arrows and interactive resizing is a much larger effort.
- Horizontal scrolling on a timeline is tricky to implement well on mobile — consider making the timeline desktop-only initially.
- If a third-party library is chosen, prefer one with a permissive open-source license to avoid licensing complexity.
