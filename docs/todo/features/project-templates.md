# Feature: Project Templates

**Category:** Project Management
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1 day

## Description

A project template captures the structure of a successful project — its default tasks (with titles, priorities, checklists, and descriptions but no assignees or dates) — and saves it as a reusable starting point. When creating a new project, users can choose "Create from template" and all the template's tasks are automatically created in the new project.

Templates are managed globally by Super Admins and can optionally be duplicated from any existing project.

## Value

Many projects in the Hello Ecosystem follow the same pattern: discovery, design, development, QA, launch. Without templates, every new project starts from a blank slate and someone has to re-create the same foundational task set every time. Templates eliminate that repetition and ensure every project starts with a consistent, proven structure.

## Technical Approach

### Model Changes

New model `models/ProjectTemplate.js`:

```js
const ProjectTemplateSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  tasks: [{
    title:       String,
    description: String,
    priority:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
    checklist:   [{ item: String }],
    tags:        [String],
    estimatedHours: Number,
    storyPoints: Number
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

### Routes

```
GET    /admin/project-templates            — list templates (admin)
POST   /admin/project-templates            — create template
DELETE /admin/project-templates/:id        — delete template
POST   /projects/:projectId/save-as-template — snapshot current project as a template
```

On project create:

```
POST /projects    — existing route, accept optional `templateId` in body
```

### Controllers

- `createProject`: if `req.body.templateId` is set, load the template and bulk-create its tasks after saving the project.
- `saveAsTemplate`: copy current project's tasks (without assignees/dates/status) into a new template.
- Template CRUD in admin controller.

### Views

- `views/admin/project-templates.ejs` — template list and management (admin)
- `views/projects/new.ejs` — add "Start from template" section above the form. Dropdown of available templates. Selecting one shows a preview list of tasks that will be created.
- `views/projects/show.ejs` — "Save as template" option in the project actions menu (managers only)

## Files to Modify

- `models/ProjectTemplate.js` — new model
- `controllers/projectController.js` — template application in `createProject`
- `controllers/adminController.js` — template CRUD
- `routes/adminRoutes.js` — template management routes
- `views/projects/new.ejs` — template selector
- `views/admin/project-templates.ejs` — new view

## Dependencies

- Task Templates feature uses a similar pattern — the two can share design conventions.

## Notes

- Template tasks are created in `draft` status with no assignee — leads assign tasks after project creation.
- A preview of template tasks before creating is important UX — users should know what they are getting before committing.
- Templates should be versioned or at least timestamped so teams can see when a template was last updated.
- Consider starter templates shipped with the app: "Web Development Project", "Content Campaign", "Bug Sprint" — reduces the cold-start problem for new teams.
