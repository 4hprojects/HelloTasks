# Feature: Quick-add Task

**Category:** Developer / Power User
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A "New Task" button in the topbar (or a persistent floating action button) opens a slide-over panel or minimal modal where users can create a task without leaving their current page. The quick-add form captures: title (required), project (required), priority, due date, and assignee. Saving the task closes the panel and stays on the current page.

## Value

The current flow to create a task requires navigating to a project, then to the task list, then clicking "New Task." This is 3 navigation steps. Quick-add collapses that to one action from anywhere in the app. It is especially valuable when a user is reviewing the kanban board or reading a project and wants to capture a task immediately without losing their place.

## Technical Approach

### Model Changes

None.

### Routes

```
POST /tasks/quick-create    — create task from the quick-add form
```

Returns JSON `{ ok: true, taskId, taskUrl }` or flash redirect depending on whether the request is XHR.

### Controllers

New `quickCreateTask` handler (or reuse `createTask` with XHR detection):

```js
async function quickCreateTask(req, res) {
  const { title, project: projectId, priority, dueDate, assignee } = req.body;

  // Validate user has access to the selected project
  const membership = req.user.projectMemberships.find(m => m.project.toString() === projectId);
  if (!membership) return res.json({ ok: false, error: 'No access to that project.' });

  const task = await Task.create({
    title, project: projectId, priority: priority || 'medium',
    dueDate: dueDate || null, assignee: assignee || null,
    status: 'draft', createdBy: req.user._id,
    statusHistory: [{ status: 'draft', changedBy: req.user._id }]
  });

  req.session.flash = { success: `Task "${task.title}" created.` };
  if (req.xhr) return res.json({ ok: true, taskId: task._id, taskUrl: `/projects/${projectId}/tasks/${task._id}` });
  res.redirect(req.get('Referer') || '/dashboard');
}
```

### Views

Add a "+" new task button to `views/partials/topbar.ejs`.

New `views/partials/quick-add-panel.ejs` (slide-over panel):

```html
<div id="quick-add-panel" class="slide-panel" style="display:none;" role="dialog" aria-label="Quick add task">
  <form id="quick-add-form" method="POST" action="/tasks/quick-create">
    <input type="hidden" name="_csrf" value="<%= csrfToken %>">
    <h3>New Task</h3>
    <input type="text" name="title" placeholder="Task title..." required class="form-input" autofocus>
    <select name="project" class="form-select" required>
      <option value="">Select project…</option>
      <% userProjects.forEach(p => { %>
        <option value="<%= p._id %>"><%= p.name %></option>
      <% }) %>
    </select>
    <div class="quick-add-row">
      <select name="priority" class="form-select">
        <option value="medium">Medium</option>
        <option value="low">Low</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <input type="date" name="dueDate" class="form-input">
    </div>
    <div class="form-actions">
      <button type="submit" class="btn btn--primary">Create Task</button>
      <button type="button" class="btn btn--ghost" onclick="closeQuickAdd()">Cancel</button>
    </div>
  </form>
</div>
```

JS in `main.js`: toggle panel, submit via `fetch`, show flash toast on success.

## Files to Modify

- `controllers/taskController.js` — add `quickCreateTask`
- `routes/taskRoutes.js` (root-level) — add `POST /tasks/quick-create`
- `routes/index.js` or `server.js` — register the route
- `views/partials/topbar.ejs` — add "+" button
- `views/partials/quick-add-panel.ejs` — new partial
- `views/layouts/main.ejs` — include the panel partial + pass `userProjects` to it
- `middleware/currentUser.js` — attach `res.locals.userProjects` for the panel dropdown
- `public/css/layout.css` — slide-over panel styles

## Dependencies

None. Can be built independently.

## Notes

- The `userProjects` list in the panel needs to be available on every page — add it to `res.locals` in the current user middleware, not in individual controllers.
- On mobile, a full-screen modal is better than a side panel.
- After successful quick-create, show a toast with "Task created — View task" link (which navigates to the full task). Do not redirect.
- The panel should trap focus (Tab cycles within the panel only) while open.
