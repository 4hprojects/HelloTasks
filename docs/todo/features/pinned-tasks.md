# Feature: Pinned Tasks

**Category:** Project Management
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~1 hr

## Description

Project managers and leads can pin up to 5 tasks to the top of the project task list. Pinned tasks always appear first, above all other sorting and filters, highlighted with a subtle visual treatment (pin icon, top border accent). Clicking the pin icon on a task card or list row toggles the pin on/off.

## Value

In a project with 50+ tasks, the most critical items get buried by sort order. Pinning lets leads surface the 2–3 tasks that everyone needs to notice right now — a release blocker, an urgent client request, or a critical bug — without changing anyone's filter settings or forcing manual sorting.

## Technical Approach

### Model Changes

Add to `models/Task.js`:

```js
isPinned:  { type: Boolean, default: false, index: true },
pinnedAt:  { type: Date, default: null }
```

`pinnedAt` is used to sort multiple pinned tasks by pin order (most recently pinned appears first).

### Routes

```
POST /projects/:projectId/tasks/:taskId/pin    — pin task
POST /projects/:projectId/tasks/:taskId/unpin  — unpin task
```

Both can be XHR-capable for in-page toggle.

### Controllers

- `pinTask`: `Task.findByIdAndUpdate(..., { $set: { isPinned: true, pinnedAt: new Date() } })`
- `unpinTask`: `Task.findByIdAndUpdate(..., { $set: { isPinned: false, pinnedAt: null } })`
- Guard: only `MANAGER_ROLES` can pin tasks.
- In `listTasks`: sort by `{ isPinned: -1, pinnedAt: -1, ...existingSort }` so pinned tasks always float to top.

### Views

- `views/tasks/list.ejs` — pin icon button (pushpin SVG) in each task row for managers. Pinned rows get a visual highlight (left border or background tint). A "pinned" section header above pinned tasks.
- `views/projects/kanban.ejs` — show a small pin icon on pinned task cards.
- `views/tasks/show.ejs` — show pin badge in task hero if pinned.

## Files to Modify

- `models/Task.js` — add `isPinned`, `pinnedAt` fields
- `controllers/taskController.js` — add `pinTask`, `unpinTask`, update sort in `listTasks`
- `routes/taskRoutes.js` — add pin/unpin routes
- `views/tasks/list.ejs` — pin button + pinned row styling
- `views/projects/kanban.ejs` — pin icon on cards
- `public/css/tasks.css` — pinned row highlight styles

## Dependencies

None. Standalone field addition.

## Notes

- Enforce a soft limit of 5 pinned tasks per project to prevent the "everything is pinned" problem. Return an error if a 6th pin is attempted.
- Pinned tasks still respect confidentiality — confidential pinned tasks are still masked for users without access.
- Pinning does not affect the Kanban view column order — it only affects the list view sort order.
- The pin icon should be visible on hover in the list view and always visible for already-pinned tasks.
