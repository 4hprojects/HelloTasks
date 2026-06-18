# Feature: Automation Rules

**Category:** Automation
**Priority:** Low
**Status:** Idea
**Effort Estimate:** ~2–3 days

## Description

A configurable rule engine where project managers define "when X, do Y" automations. Examples:
- When a task's status changes to "Blocked", notify the project lead.
- When a task's due date passes and status is not "Completed", set priority to "Critical".
- When a task is moved to "Approved", assign it to a specific user for final delivery.

Rules are managed per project from a dedicated automation settings page.

## Value

Automation rules reduce the overhead of manual workflow management. Instead of a project lead monitoring every status change, rules handle the routine triggers automatically — escalating overdue tasks, routing approvals, notifying the right person at the right time. This is a core differentiator in tools like Monday.com and ClickUp that HelloTasks can eventually offer.

## Technical Approach

### Model Changes

New model `models/AutomationRule.js`:

```js
const AutomationRuleSchema = new mongoose.Schema({
  project:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name:     { type: String, required: true },
  enabled:  { type: Boolean, default: true },
  trigger: {
    event: { type: String, enum: ['status_changed', 'due_date_passed', 'task_created', 'comment_added', 'priority_changed'] },
    condition: { type: mongoose.Schema.Types.Mixed }   // e.g., { status: 'blocked' }
  },
  actions: [{
    type: { type: String, enum: ['notify_user', 'set_priority', 'set_status', 'assign_to', 'add_tag'] },
    params: { type: mongoose.Schema.Types.Mixed }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

### Routes

```
GET    /projects/:projectId/automations           — list rules
POST   /projects/:projectId/automations           — create rule
GET    /projects/:projectId/automations/:id/edit  — edit form
PUT    /projects/:projectId/automations/:id       — update rule
DELETE /projects/:projectId/automations/:id       — delete rule
```

### Controllers

New `automationController.js` for CRUD.

New `utils/automationEngine.js`:

```js
async function runAutomations(event, task, project, actor) {
  const rules = await AutomationRule.find({ project: project._id, enabled: true, 'trigger.event': event });
  for (const rule of rules) {
    if (matchesCondition(rule.trigger.condition, task)) {
      for (const action of rule.actions) {
        await executeAction(action, task, actor);
      }
    }
  }
}
```

Call `runAutomations('status_changed', task, project, user)` from `updateStatus` controller, etc.

### Views

- New `views/automations/list.ejs` — rule list with enable/disable toggle and delete
- New `views/automations/form.ejs` — rule builder UI (trigger selector + condition fields + action builder)

## Files to Modify

- `models/AutomationRule.js` — new model
- `controllers/automationController.js` — new controller
- `utils/automationEngine.js` — new engine
- `routes/projectRoutes.js` or new `routes/automationRoutes.js`
- `controllers/taskController.js` — call `runAutomations` in `updateStatus`, `createTask`, etc.
- `views/automations/list.ejs`, `form.ejs` — new views
- `server.js` — register automation routes

## Dependencies

This is the most complex feature in the backlog. Best built after the simpler automation features (scheduled weekly report, status auto-progression) to establish patterns.

## Notes

- Keep the initial trigger/action types minimal: a few triggers, a few actions. Resist scope creep.
- The rule builder UI is the hardest part — a clean, non-technical UI that makes trigger/action combinations understandable is important for non-developer users.
- Automation logs (which rules fired, what they did, when) are valuable for debugging but add complexity. Log to the existing AuditLog model.
- Guard against infinite loops: an action that changes a status should not re-trigger a status_changed event for the same rule.
