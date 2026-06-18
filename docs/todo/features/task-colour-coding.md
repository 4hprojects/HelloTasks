# Feature: Task Colour Coding

**Category:** Project Management
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~2 hrs

## Description

Users can assign a colour label to any task for quick visual grouping on the Kanban board and task list. A small colour dot or left-border accent is shown on the task card. The colour is freeform — chosen from a fixed palette of 8 colours. No semantic meaning is enforced (unlike priority badges), so teams can use colours however makes sense for them: by category, by area, by urgency, by team.

## Value

Priority and status already provide semantic categories, but teams often want an additional visual grouping layer — for example, distinguishing frontend tasks (blue) from backend (green) from client-requested (amber). Colour coding provides that without requiring a formal category system. It is a fast, low-friction way to create visual patterns on a dense Kanban board.

## Technical Approach

### Model Changes

Add to `models/Task.js`:

```js
colorLabel: {
  type: String,
  enum: ['none', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink'],
  default: 'none'
}
```

### Routes

No new routes. Saved via existing task create/edit form.

### Controllers

- `createTask` / `updateTask`: read and validate `req.body.colorLabel` against the enum.

### Views

- `views/tasks/new.ejs` / `edit.ejs` — add a "Colour Label" colour swatch picker in the properties sidebar. Eight circular colour buttons, click to select. Selected one gets a checkmark overlay.
- `views/tasks/show.ejs` — show colour dot in the properties section if set.
- `views/tasks/list.ejs` — colour dot in the first column or as a left border on the row.
- `views/projects/kanban.ejs` — colour as a narrow left-border accent on the card (3px, same as the existing priority indicator).

## Files to Modify

- `models/Task.js` — add `colorLabel` field
- `controllers/taskController.js` — validate on create/update
- `views/tasks/new.ejs` — colour picker
- `views/tasks/edit.ejs` — colour picker with current value
- `views/tasks/show.ejs` — colour dot
- `views/tasks/list.ejs` — colour dot column
- `views/projects/kanban.ejs` — colour border on card
- `public/css/tasks.css` — colour label CSS variables

## Dependencies

None. Standalone field addition.

## Notes

- The colour palette should use the existing CSS custom properties where possible (e.g., `--color-danger` for red, `--color-accent` for green).
- Colour is purely decorative — it should never be the only indicator of something important (accessibility: colourblind users). Always pair with text labels.
- A future enhancement could allow project-level named colour categories (e.g., "Blue = Frontend"), but for now freeform is sufficient.
- The filter bar on the task list could gain a colour filter as a follow-up.
