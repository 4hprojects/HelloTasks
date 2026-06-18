# Feature: Private Notes on Tasks

**Category:** Task Enhancements
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Users can post a private note on a task that is only visible to themselves. Private notes appear in the comment thread but are visually distinguished (e.g., a lock icon, muted background) and are filtered out for other users. A private note is not included in @mention parsing and does not trigger notifications to other team members.

## Value

Team members sometimes need to jot down personal reminders, partial findings, or draft thoughts on a task without sharing them publicly. Currently, there is no way to do this — all comments are visible to all project members. Private notes provide a personal scratchpad within the task context.

## Technical Approach

### Model Changes

Add to the `Comment` model:

```js
isPrivate: { type: Boolean, default: false }
```

### Routes

No new routes. The existing comment POST form gains an `isPrivate` checkbox.

### Controllers

- `createComment`: read `req.body.isPrivate === 'on'` and save accordingly.
- `loadComments` (in `showTask`): filter out private comments from other users:
  ```js
  Comment.find({
    task: taskId,
    $or: [{ isPrivate: false }, { isPrivate: true, author: req.user._id }]
  })
  ```
- Skip `@mention` parsing and notification dispatch for private notes.

### Views

- `views/tasks/show.ejs` — add "Private note" checkbox below the comment textarea. When checked, show a hint: "Only you can see this."
- In the comment thread: render private comments with a distinct visual style — muted background, lock icon, "(Private)" label. Only shown to the author.

## Files to Modify

- `models/Comment.js` — add `isPrivate` field
- `controllers/commentController.js` (or task show controller) — filter private comments, skip mentions
- `views/tasks/show.ejs` — private checkbox + private comment styling

## Dependencies

None. Small addition to the existing comment system.

## Notes

- Private notes are only private from other regular users. Super Admin or system_admin may have a policy-level reason to view all notes (e.g., for moderation or audit). Decide this policy before building.
- If a private note is later made public (toggle), it should then go through normal mention parsing.
- Do not allow marking someone else's comment as private.
- Private notes should not appear in project activity feeds or audit logs visible to other users.
