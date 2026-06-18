# Feature: REST API

**Category:** Developer / Power User
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1–2 days

## Description

A public REST API under `/api/v1/` that exposes the core HelloTasks resources over HTTP. Authenticated using API Keys (Bearer token). Follows standard REST conventions: GET for read, POST for create, PATCH for update, DELETE for delete. Returns JSON. Supports the same RBAC rules as the web interface.

Initial scope: tasks, projects, users (read-only). Write endpoints for tasks (create, update status).

## Value

A REST API opens HelloTasks to external integration — CI pipelines, monitoring dashboards, Zapier, custom scripts, Slack bots. It also enables mobile apps, data exports, and any future integration without requiring changes to the core app. API keys (built as a companion feature) provide the authentication layer.

## Technical Approach

### Model Changes

None. Reuses existing models.

### Routes

New route group `routes/apiRoutes.js`:

```js
const router = express.Router();

// Tasks
router.get('/projects/:projectId/tasks',               apiAuth, checkProjectAccess, listTasksApi);
router.get('/projects/:projectId/tasks/:taskId',       apiAuth, checkProjectAccess, loadTask, showTaskApi);
router.post('/projects/:projectId/tasks',              apiAuth, checkProjectAccess, requireRole(['developer','manager','project_lead']), createTaskApi);
router.patch('/projects/:projectId/tasks/:taskId/status', apiAuth, checkProjectAccess, loadTask, updateStatusApi);

// Projects
router.get('/projects',            apiAuth, listProjectsApi);
router.get('/projects/:projectId', apiAuth, checkProjectAccess, showProjectApi);

// Users (admin only)
router.get('/users', apiAuth, requireGlobalRole(['super_admin','system_admin']), listUsersApi);
```

Register in `server.js`:

```js
app.use('/api/v1', apiRoutes);
```

### Controllers

New `controllers/apiController.js`:

- All handlers mirror existing web controllers but return JSON instead of rendering views
- Strip sensitive fields before returning: no `passwordHash`, no session data
- Use standard HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity

Example `listTasksApi`:

```js
async function listTasksApi(req, res) {
  const { status, priority, assignee, page = 1, limit = 50 } = req.query;
  const query = { project: req.project._id, status: { $ne: 'archived' } };
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignee) query.assignee = assignee;

  const tasks = await Task.find(query).skip((page - 1) * limit).limit(limit).lean();
  const total = await Task.countDocuments(query);

  res.json({ data: tasks, meta: { total, page: Number(page), limit: Number(limit) } });
}
```

### Authentication Middleware

`apiAuth` middleware (separate from `isAuthenticated` session middleware):

```js
async function apiAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing API key.' });
  const rawKey = authHeader.slice(7);
  const prefix = rawKey.slice(0, 10);

  const keyRecord = await ApiKey.findOne({ keyPrefix: prefix, revokedAt: null });
  if (!keyRecord || !(await bcrypt.compare(rawKey, keyRecord.keyHash))) {
    return res.status(401).json({ error: 'Invalid API key.' });
  }

  ApiKey.findByIdAndUpdate(keyRecord._id, { lastUsedAt: new Date() }).exec(); // fire-and-forget
  req.user = await User.findById(keyRecord.user).lean();
  next();
}
```

## Files to Modify

- `controllers/apiController.js` — new controller
- `routes/apiRoutes.js` — new routes
- `middleware/apiAuth.js` — new middleware
- `server.js` — register API routes
- `package.json` — no new packages needed

## Dependencies

- **API Keys feature is required** — the API is useless without authentication.

## Notes

- Add rate limiting to API routes (stricter than the web UI) — 100 requests per 15 minutes per key.
- Version the API from day one (`/api/v1/`). It is much harder to add versioning later.
- Write a minimal API reference in `docs/reference/api.md` — even a simple table of endpoints with example requests/responses is valuable.
- Confidential task visibility rules apply to API responses — do not expose masked task fields to users without access, even over the API.
- CORS is not needed initially (API keys imply server-to-server usage). Add CORS headers only if browser-based API access is planned.
