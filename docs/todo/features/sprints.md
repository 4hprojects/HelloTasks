# Feature: Sprints

**Category:** Project Management
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1–2 days

## Description

Sprints are time-boxed work periods (typically 1–2 weeks) used in agile workflows. A project can have multiple sprints. Tasks are assigned to a sprint during sprint planning. A sprint board shows only the tasks in the active sprint. When a sprint ends, incomplete tasks are moved to the backlog or the next sprint.

The sprint lifecycle: Plan → Active → Completed. Only one sprint can be active at a time per project.

## Value

For teams following agile or Scrum methodologies, sprints are the core unit of planning. Without sprints, all tasks are in one undifferentiated pool, making it hard to commit to a specific scope for a given week or two. Sprints create focus, enable velocity measurement, and produce natural "did we deliver what we planned?" retrospective data.

## Technical Approach

### Model Changes

New model `models/Sprint.js`:

```js
const SprintSchema = new mongoose.Schema({
  project:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name:      { type: String, required: true },
  goal:      { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },
  status:    { type: String, enum: ['planning', 'active', 'completed'], default: 'planning' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

Add to `models/Task.js`:

```js
sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null, index: true }
```

### Routes

```
GET    /projects/:projectId/sprints             — list sprints + backlog
POST   /projects/:projectId/sprints             — create sprint
GET    /projects/:projectId/sprints/:id         — sprint board
PUT    /projects/:projectId/sprints/:id         — update sprint
POST   /projects/:projectId/sprints/:id/start   — activate sprint
POST   /projects/:projectId/sprints/:id/complete — complete sprint (move incomplete tasks)
```

### Controllers

New `sprintController.js`:

- `listSprints`: list all sprints for the project + the task backlog (tasks with no sprint)
- `showSprint`: load sprint with its tasks, grouped by status (Kanban-style view)
- `startSprint`: set status to `active`, enforce one active sprint per project
- `completeSprint`: set status to `completed`, move incomplete tasks to next sprint or backlog

### Views

- New `views/sprints/list.ejs` — sprint list with "Create Sprint" button and backlog tasks
- New `views/sprints/show.ejs` — sprint board (Kanban-style, filtered to sprint tasks)

## Files to Modify

- `models/Sprint.js` — new model
- `models/Task.js` — add `sprint` ref field
- `controllers/sprintController.js` — new controller
- `routes/sprintRoutes.js` — new routes
- `views/sprints/list.ejs`, `show.ejs` — new views
- `views/tasks/new.ejs`, `edit.ejs` — optional sprint selector
- `server.js` — register sprint routes

## Dependencies

- Story Points feature is complementary (enables story point-based sprint capacity planning).
- Burndown Chart becomes per-sprint after sprints are built.

## Notes

- Sprint planning is about moving tasks from the backlog into a sprint. The UI should make drag-from-backlog-to-sprint easy — a two-column layout works well.
- "Completing" a sprint should produce a sprint summary: tasks completed, tasks carried over, velocity (story points if available).
- Do not auto-advance sprint status based on dates — always require a manual "Start Sprint" / "Complete Sprint" action. Automatic transitions cause confusion.
- Limit to one active sprint per project at a time.
