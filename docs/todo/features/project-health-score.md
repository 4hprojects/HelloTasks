# Feature: Project Health Score

**Category:** Reporting & Analytics
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

A computed 0–100 score for each project that summarizes its overall health. The score is derived from a weighted formula combining: completion percentage, overdue task percentage, blocked task percentage, and tasks in review waiting percentage. The score and a traffic-light colour (green/amber/red) are shown on the project list, project detail page, and portfolio view.

## Value

A single number is faster to scan than a table of stats. Project leads managing multiple projects can see at a glance which projects need attention. A declining score trend over time could trigger early intervention. It also provides a consistent definition of "healthy project" that everyone on the team shares.

## Technical Approach

### Model Changes

None required. The score is computed on-demand from existing task data. Optionally cache it on the Project model for performance:

```js
healthScore: { type: Number, default: null },
healthScoreUpdatedAt: { type: Date, default: null }
```

### Routes

No new routes. Score is computed and rendered as part of existing project views.

### Controllers

Add a shared utility function `computeHealthScore(taskStats)`:

```js
function computeHealthScore({ total, completed, blocked, overdue, inReview }) {
  if (total === 0) return 100; // No tasks = healthy by default

  const completionRate = completed / total;
  const blockedRate    = blocked / total;
  const overdueRate    = overdue / total;
  const reviewWait     = inReview / total;

  // Weighted formula (adjust weights as needed)
  const score = Math.round(
    (completionRate * 50) -
    (blockedRate * 20) -
    (overdueRate * 20) -
    (reviewWait * 10) +
    50  // base
  );

  return Math.max(0, Math.min(100, score));
}
```

The `overdue` count requires a query: `dueDate < today AND status !== completed/archived`.

Call this in `listProjects`, `showProject`, and the portfolio view.

### Views

- `views/projects/list.ejs` — add health score badge next to status badge
- `views/projects/show.ejs` — show score and traffic-light indicator in the project details panel
- `views/projects/portfolio.ejs` — show score prominently on each project card

## Files to Modify

- `utils/projectHealth.js` — new utility with `computeHealthScore()` function
- `controllers/projectController.js` — call utility in `listProjects`, `showProject`
- `views/projects/list.ejs` — health score display
- `views/projects/show.ejs` — health score display
- `public/css/components.css` — health score badge styles

## Dependencies

- Portfolio View feature benefits significantly from this score.
- Blocked / At-risk Report uses the same underlying data.

## Notes

- The formula weights are opinionated — document them clearly and make them easy to tune.
- Consider showing the score trend (up/down vs. last week) with a small arrow indicator.
- A score of 0 should visually alarm — red background, clear warning. A score of 80+ should be calm and green.
- Do not cache the score server-side on first build — compute fresh each time. Add caching later if it becomes a performance issue.
