# Feature: Task Tags / Labels

**Category:** Task Enhancements
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~2 hrs

## Description

Tags are freeform keyword labels attached to tasks for categorization. A task can have multiple tags (e.g., `bug`, `frontend`, `v2.0`, `urgent`). Tags appear as coloured chips on task cards and list rows. The task list filter bar includes a tag filter to show only tasks with a specific tag, enabling cross-cutting views that cut across priority and status.

## Value

Status and priority cover workflow state, but they don't capture the *type* or *domain* of work. Tags fill that gap — letting teams label tasks by area (`frontend`, `backend`, `design`), by version (`v1.2`, `v2.0`), by type (`bug`, `improvement`, `research`), or by any ad hoc grouping needed. Filtering by tag quickly surfaces all related work across a project.

## Technical Approach

### Model Changes

Add to `models/Task.js`:

```js
tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }]
```

No separate Tag collection needed for basic freeform tags. If preset/managed tags are later needed, a `ProjectTag` model can be added then.

### Routes

No new routes. Tags are saved via existing task create/edit forms.

### Controllers

- `createTask` / `updateTask`: read `req.body.tags` as a comma-separated string or multi-value input. Parse, trim, lowercase, deduplicate, and save as array.
- `listTasks`: add tag filter — if `req.query.tag` is set, add `{ tags: req.query.tag }` to the query.

### Views

- `views/tasks/new.ejs` / `edit.ejs` — add a "Tags" text input that accepts comma-separated tags. Show a small "Type and press comma or Enter to add" hint. Render existing tags as removable chips using inline JS.
- `views/tasks/show.ejs` — display tags as coloured chips in the properties section.
- `views/tasks/list.ejs` — show tags as small chips in a column. Clicking a tag filters by that tag.
- `views/projects/kanban.ejs` — optionally show the first 1–2 tags as small chips on the card.
- `views/tasks/list.ejs` filter bar — add a tag filter dropdown or input.

## Files to Modify

- `models/Task.js` — add `tags` array
- `controllers/taskController.js` — parse tags on create/update, add tag filter to list query
- `views/tasks/new.ejs` — tag input
- `views/tasks/edit.ejs` — tag input with existing values
- `views/tasks/show.ejs` — tag chip display
- `views/tasks/list.ejs` — tag column + filter
- `public/css/components.css` — `.tag-chip` style

## Dependencies

None. Standalone field addition.

## Notes

- Lowercase and trim all tags on save to avoid duplicates like `Bug` vs `bug`.
- Limit to 10 tags per task to prevent abuse.
- Consider assigning deterministic colours to tags based on a hash of the tag string (same tag always gets the same colour across the app).
- A future enhancement could be project-level "preset tags" managed by the project lead, to enforce consistency. For now, freeform is sufficient.
- The global task list at `/tasks` should also support tag filtering.
