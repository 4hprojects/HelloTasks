# Feature: My Tasks View

**Category:** Views & Visualization
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~1 hr

## Description

A dedicated personal task view showing only tasks assigned to the currently logged-in user, across all their projects. Tasks are grouped or sortable by due date, priority, project, or status. Overdue tasks are highlighted. A quick "Mark as In Progress" shortcut is available inline.

Accessible from a "My Tasks" link in the sidebar.

## Value

The existing dashboard shows a summary of assigned tasks, but navigating to a project and then filtering by assignee is slow. The "My Tasks" view is a developer or team member's primary daily-use page — it answers "what am I working on today?" immediately without project navigation. This is the most-used view in tools like Asana and Todoist.

## Technical Approach

### Model Changes

None. Uses the existing `assignee` (or `assignees`) field.

### Routes

```
GET /my-tasks    — personal task list for the logged-in user
```

Accepts filter params: `?status=`, `?project=`, `?sort=dueDate|priority`.

### Controllers

New handler `getMyTasks` (in `taskController.js` or new `myTasksController.js`):

```js
async function getMyTasks(req, res) {
  const { status, project, sort = 'dueDate' } = req.query;
  const query = {
    assignee: req.user._id,
    status: { $nin: ['archived', 'completed'] }
  };
  if (status) query.status = status;
  if (project) query.project = project;

  const sortMap = { dueDate: { dueDate: 1 }, priority: { priority: -1 } };
  const tasks = await Task.find(query)
    .populate('project', 'name')
    .sort(sortMap[sort] || { dueDate: 1 })
    .lean();

  // Get user's projects for filter dropdown
  const projects = await Project.find({ 'members.user': req.user._id }).lean();

  res.render('tasks/my-tasks', { title: 'My Tasks', tasks, projects, filters: req.query });
}
```

### Views

New `views/tasks/my-tasks.ejs`:

- Filter bar: status dropdown, project dropdown, sort selector
- Task table or card list grouped by project or sorted by due date
- Due date column with overdue highlight (red if past today)
- Status badge
- Quick status update form (inline `<form>` POST to update status)
- Empty state: "You have no open tasks."

## Files to Modify

- `controllers/taskController.js` — add `getMyTasks` handler
- `routes/taskRoutes.js` (or `routes/index.js`) — add `GET /my-tasks` route
- `views/tasks/my-tasks.ejs` — new view
- `views/partials/sidebar.ejs` — add "My Tasks" nav link

## Dependencies

None. Simple query on existing task data.

## Notes

- Default filter: exclude completed and archived tasks. User can toggle to see completed.
- Consider a "due this week" group vs. "due later" vs. "overdue" section layout as the primary grouping, since that maps directly to how someone plans their day.
- If Multiple Assignees feature is built, the query changes from `{ assignee: userId }` to `{ assignees: userId }`.
- The sidebar "My Tasks" link could show a count badge of overdue or due-today tasks as a quick attention signal.
