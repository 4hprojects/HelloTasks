# Feature: Saved Filters

**Category:** Developer / Power User
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Users can save a combination of filter settings (status, priority, assignee, tag, date range) as a named preset. Saved filters appear as quick-access chips in the task list filter bar (e.g., "My Blocked Tasks", "Critical Due This Week", "Unassigned"). Clicking a filter chip applies all its conditions instantly.

## Value

Power users typically have 3–5 filter combinations they use daily. Re-applying the same filters every time is tedious. Saved filters make common views one-click accessible, transforming the task list into a flexible personal workspace without building dedicated views for every possible combination.

## Technical Approach

### Model Changes

New model `models/SavedFilter.js`:

```js
const SavedFilterSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },  // null = global
  name:    { type: String, required: true, trim: true, maxlength: 50 },
  filters: { type: mongoose.Schema.Types.Mixed }  // { status, priority, assignee, tag, dueBefore, dueAfter }
}, { timestamps: true });
```

### Routes

```
POST   /saved-filters           — create saved filter
DELETE /saved-filters/:id       — delete saved filter
GET    /saved-filters           — list user's saved filters (JSON, for filter bar population)
```

### Controllers

- `createSavedFilter`: save current URL query params as a filter object
- `deleteSavedFilter`: delete by ID (own filters only)
- `listSavedFilters`: return JSON array of user's saved filters (called on page load to populate chips)

### Views

- `views/tasks/list.ejs` — add saved filter chips row below the main filter bar:
  - Load saved filters via a small XHR on page load (or pass from controller)
  - Each chip: `<button>` with filter name, click applies filters (sets URL params + re-renders or submits the filter form)
  - "Save current filters" button at the end of the filter row — opens a small inline form to name the filter
  - Each chip has an "×" to delete

## Files to Modify

- `models/SavedFilter.js` — new model
- `controllers/savedFilterController.js` — new controller
- `routes/savedFilterRoutes.js` — new routes
- `views/tasks/list.ejs` — saved filter chips row
- `public/css/components.css` — filter chip styles
- `server.js` — register saved filter routes

## Dependencies

None. Works with the existing filter bar.

## Notes

- Saved filters are user-scoped (not shared with the team). A "shared team filters" feature is a future enhancement.
- Store filters as a plain object of the query params (e.g., `{ status: 'blocked', priority: 'high' }`). Apply by setting `window.location.search` when the chip is clicked.
- A project-scoped saved filter (only applies on that project's task list) vs. a global filter (applies on `/tasks`) should be distinguished. Use the `project` field: null = global.
- Limit to 10 saved filters per user per context (global vs. per-project) to keep the chip row from overflowing.
