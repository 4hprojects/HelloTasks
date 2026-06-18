# Feature: Milestones

**Category:** Project Management
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Milestones are named checkpoints in a project's timeline — for example, "Alpha Release", "Beta Launch", "v2.0 Shipped." Each milestone has a name, a target due date, and a set of tasks linked to it. The milestone shows a progress bar based on how many of its linked tasks are completed.

Milestones appear on the project detail page and in the task list as a grouping filter.

## Value

Projects often have natural phases or delivery targets. Without milestones, all tasks exist in a flat list with no sense of which ones belong to "this release" vs. "next release." Milestones provide a lightweight project structure that is more meaningful than just priority or status — they answer "when is this group of work due?" and "are we on track for this deliverable?"

## Technical Approach

### Model Changes

New model `models/Milestone.js`:

```js
const MilestoneSchema = new mongoose.Schema({
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  dueDate:     { type: Date, default: null },
  status:      { type: String, enum: ['open', 'completed', 'cancelled'], default: 'open' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

Add to `models/Task.js`:

```js
milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', default: null, index: true }
```

### Routes

```
GET    /projects/:projectId/milestones         — list milestones
POST   /projects/:projectId/milestones         — create milestone
GET    /projects/:projectId/milestones/:id     — milestone detail (tasks grouped under it)
PUT    /projects/:projectId/milestones/:id     — update milestone
DELETE /projects/:projectId/milestones/:id     — delete milestone
```

### Controllers

New `milestoneController.js`:

- `listMilestones`: list with task counts per milestone
- `createMilestone`, `updateMilestone`, `deleteMilestone`
- `showMilestone`: show with its tasks and progress bar

In `createTask` / `updateTask`: accept optional `milestone` field from the form.

### Views

- `views/projects/show.ejs` — milestones panel showing each milestone name, due date, progress bar, open task count
- New `views/milestones/list.ejs` and `views/milestones/show.ejs`
- `views/tasks/new.ejs` / `edit.ejs` — optional "Milestone" select dropdown

## Files to Modify

- `models/Milestone.js` — new model
- `models/Task.js` — add `milestone` ref field
- `controllers/milestoneController.js` — new controller
- `routes/projectRoutes.js` or new `routes/milestoneRoutes.js`
- `views/projects/show.ejs` — milestones panel
- `views/tasks/new.ejs`, `edit.ejs` — milestone selector
- `views/tasks/list.ejs` — filter by milestone

## Dependencies

None. Can be built independently.

## Notes

- Deleting a milestone should not delete its linked tasks — it should just clear the `milestone` reference on those tasks (`$unset` or `$set null`).
- A milestone with all tasks completed should auto-close (or prompt the manager to close it).
- Milestones on the project page give a good sense of project structure at a glance — show them in due-date order with a clear "N tasks remaining" count.
- Consider overlaying milestones as vertical markers on the Gantt chart when that feature is built.
