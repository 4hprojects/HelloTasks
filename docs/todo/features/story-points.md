# Feature: Story Points

**Category:** Task Enhancements
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~1 hr

## Description

Story points are a relative complexity estimate used in agile workflows. Each task can be assigned a story point value from the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) or a simplified scale (XS, S, M, L, XL). Points are set during task creation or planning and displayed on the task card and detail page.

Unlike time estimates (which predict hours), story points capture complexity and uncertainty — a 13-point task isn't necessarily 13 hours, it's just significantly more complex than a 1-point task.

## Value

Story points enable sprint planning, velocity tracking, and capacity balancing. Even without a full sprint system, they help project leads understand the relative weight of tasks in a backlog and balance workloads across team members. Teams that use agile estimation will expect this field to be available.

## Technical Approach

### Model Changes

Add to `models/Task.js`:

```js
storyPoints: { type: Number, enum: [1, 2, 3, 5, 8, 13, 21], default: null }
```

### Routes

No new routes. Saved via existing task create/edit form.

### Controllers

- `createTask` / `updateTask`: read and validate `req.body.storyPoints`. Must be one of the allowed values or null.

### Views

- `views/tasks/new.ejs` / `edit.ejs` — add a "Story Points" select dropdown in the properties sidebar with options: None, 1, 2, 3, 5, 8, 13, 21.
- `views/tasks/show.ejs` — show story points badge in the properties section if set.
- `views/tasks/list.ejs` — optionally add a "Points" column (sortable).
- `views/projects/kanban.ejs` — optionally show the point value as a small badge on the card.

## Files to Modify

- `models/Task.js` — add `storyPoints` field
- `controllers/taskController.js` — validate on create/update
- `views/tasks/new.ejs` — add select
- `views/tasks/edit.ejs` — add select with existing value
- `views/tasks/show.ejs` — display badge
- `views/tasks/list.ejs` — optional column
- `views/projects/kanban.ejs` — optional card badge

## Dependencies

None. Standalone field addition.

## Notes

- If the Sprints feature is later added, story points per sprint can be summed to compute sprint velocity.
- Some teams prefer T-shirt sizing (XS/S/M/L/XL). Consider supporting both schemes via a project-level setting, or default to Fibonacci which is most common.
- Story points are intentionally abstract — resist the temptation to convert them to hours anywhere in the UI.
- Show unpointed tasks as a blank/dash, not as "0 points", to distinguish unestimated from zero-effort.
