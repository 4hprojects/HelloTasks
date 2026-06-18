# Feature: Global Search

**Category:** Developer / Power User
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A search bar accessible from the topbar that searches across tasks, projects, and users simultaneously. Results appear in a grouped dropdown (Tasks / Projects / Users) as the user types. Clicking a result navigates to that record. Pressing Enter opens a full results page with pagination.

## Value

As the number of tasks and projects grows, navigating to a specific item by browsing becomes increasingly slow. Global search lets a user type a task title or project name and jump directly to it in 2 seconds. It is the single most-used navigation pattern in Jira and GitHub Issues, and the absence of it is felt immediately once a project reaches 50+ tasks.

## Technical Approach

### Model Changes

Add MongoDB text indexes:

```js
// models/Task.js
TaskSchema.index({ title: 'text', description: 'text' });

// models/Project.js
ProjectSchema.index({ name: 'text', description: 'text' });

// models/User.js
UserSchema.index({ fullName: 'text', email: 'text' });
```

### Routes

```
GET /search                — full search results page
GET /search/suggest        — XHR autocomplete (JSON response)
```

### Controllers

- `suggest` (for autocomplete):
  ```js
  async function suggest(req, res) {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) return res.json({ results: [] });

    const [tasks, projects, users] = await Promise.all([
      Task.find({ $text: { $search: q }, project: { $in: accessibleProjectIds } })
        .limit(4).select('title project status').populate('project', 'name').lean(),
      Project.find({ $text: { $search: q }, _id: { $in: accessibleProjectIds } })
        .limit(3).select('name status').lean(),
      User.find({ $text: { $search: q }, accountStatus: 'active' })
        .limit(3).select('fullName email globalRole').lean()
    ]);

    res.json({ results: { tasks, projects, users } });
  }
  ```

- `search` (full results page): same query with pagination.

### Views

- `views/partials/topbar.ejs` — add a search input with a magnifying glass icon. On `input` event (debounced 300ms), call `GET /search/suggest?q=...` via `fetch` and render a dropdown of results. On `Enter`, submit to `/search?q=...`.

- New `views/search/results.ejs` — full results page with three sections (Tasks, Projects, Users), result counts, and pagination for tasks.

## Files to Modify

- `models/Task.js` — add text index
- `models/Project.js` — add text index
- `models/User.js` — add text index
- `controllers/searchController.js` — new controller
- `routes/searchRoutes.js` — new routes
- `views/partials/topbar.ejs` — search input + dropdown
- `views/search/results.ejs` — new view
- `server.js` — register search routes
- `public/css/layout.css` — search bar styles

## Dependencies

None beyond MongoDB text indexes (built-in to MongoDB, no extra service needed).

## Notes

- MongoDB `$text` search does not support partial/prefix matching by default. For better autocomplete, use a regex query (`$regex: q, $options: 'i'`) alongside or instead of `$text`, especially for short queries (< 4 chars).
- Respect RBAC: only return tasks from projects the user is a member of. Only return users if the requester has admin-level access (or any project overlap).
- Debounce the suggest call to 300ms to avoid flooding the server on fast typists.
- Highlight the matched term in the dropdown results using `<mark>` tags.
- The search input should also be triggerable via the `/` keyboard shortcut (when the Keyboard Shortcuts feature is built).
