# Feature: Task Templates

**Category:** Task Enhancements
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Task templates let users save a task's structure (title pattern, description, checklist, priority, estimated hours) as a reusable template. When creating a new task, users can choose "Use a template" and the form is pre-filled with the template's values. Templates are managed at the project level by managers and above.

## Value

Repetitive task types — QA review tasks, bug report tasks, weekly update tasks — always have the same structure. Without templates, users re-type the same checklist and description every time. Templates eliminate that friction and ensure consistency: every bug report task has the same steps, every QA task has the same review checklist.

## Technical Approach

### Model Changes

New model `models/TaskTemplate.js`:

```js
const TaskTemplateSchema = new mongoose.Schema({
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
  priority:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  estimatedHours: { type: Number, default: null },
  storyPoints: { type: Number, default: null },
  checklist:   [{ item: String }],
  tags:        [String],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

### Routes

```
GET    /projects/:projectId/task-templates            — list templates (managers)
POST   /projects/:projectId/task-templates            — create template
DELETE /projects/:projectId/task-templates/:templateId — delete template
GET    /projects/:projectId/task-templates/:templateId/apply — return template JSON for form pre-fill
```

Also add a "Save as template" action to the task show/edit page:

```
POST /projects/:projectId/tasks/:taskId/save-as-template
```

### Controllers

New `taskTemplateController.js`:

- `listTemplates`: return all templates for the project
- `createTemplate`: save new template from form data
- `deleteTemplate`: managers only
- `applyTemplate`: return template fields as JSON (XHR call from task new form)
- `saveAsTemplate`: copy fields from an existing task into a new template

### Views

- `views/tasks/new.ejs` — "Use a template" dropdown above the form. Selecting a template fires an XHR `GET /apply` and fills form fields with JS.
- New `views/task-templates/list.ejs` — template management page linked from project show.
- `views/tasks/show.ejs` or `edit.ejs` — "Save as template" button.

## Files to Modify

- `models/TaskTemplate.js` — new model
- `controllers/taskTemplateController.js` — new controller
- `routes/projectRoutes.js` or new `routes/taskTemplateRoutes.js` — register routes
- `views/tasks/new.ejs` — template selector
- `views/task-templates/list.ejs` — new view
- `views/tasks/show.ejs` — save-as-template button
- `server.js` — register routes

## Dependencies

- Task Tags and Story Points features are useful but not required — template model can include those fields optionally.

## Notes

- Templates do not copy the assignee — that is always set fresh when creating a task.
- Templates are project-scoped. Global templates (shared across all projects) can be a future enhancement.
- The "Use a template" interaction should be a progressive disclosure pattern — the dropdown appears above the form and pre-fills fields without submitting, so users can still modify before saving.
