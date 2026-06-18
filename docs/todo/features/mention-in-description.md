# Feature: @mention in Task Description

**Category:** Collaboration & Communication
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Users can @mention team members in the task description field (not just in comments). When the task is created or updated with a mention in the description, the mentioned users receive an in-app notification and an email.

The description textarea gets the same autocomplete dropdown already implemented for the comment textarea.

## Value

Task descriptions often reference specific people: "This design needs review by @Jane before implementation" or "Blocked — waiting on feedback from @Tom." Currently, these mentions are plain text and generate no notification. Activating mentions in descriptions closes that gap and means any important callout in a task is noticed by the right person.

## Technical Approach

### Model Changes

None. Mentions are parsed from the description text at save time, the same way they are parsed from comments.

### Routes

No new routes. Handled in existing task create/edit POST.

### Controllers

The mention parsing utility already exists (used in `createComment`). Apply the same parser in `createTask` and `updateTask`:

```js
const { parseMentions, notifyMentions } = require('../utils/mentionUtils'); // existing utility

// In createTask / updateTask:
const mentionedUsers = parseMentions(req.body.description, projectMembers);
await notifyMentions(mentionedUsers, task, req.user, 'task_description');
```

The `notifyMentions` function likely already handles creating in-app notifications and sending email. If it only handles comments, extend it with a `context` parameter to adjust the notification message.

### Views

- `views/tasks/new.ejs` / `edit.ejs` — add the `@mention` autocomplete JS to the description textarea.

The same JS block currently wired to the comment textarea should be reused by attaching it to `#taskDescription` as well. Check that the mention trigger script is parameterised by element ID rather than hardcoded to the comment textarea.

## Files to Modify

- `controllers/taskController.js` — call mention parser in `createTask` and `updateTask`
- `views/tasks/new.ejs` — attach mention autocomplete to description textarea
- `views/tasks/edit.ejs` — same
- `utils/mentionUtils.js` (or equivalent) — optionally add `context` param for notification message phrasing

## Dependencies

- Mention parsing utility already built as part of the comment @mention feature. This feature is a small extension.

## Notes

- Only parse mentions when the description actually changes (on update). Avoid re-notifying the same user every time an unrelated field is edited on the task.
- Track which users have already been mentioned in a description to avoid re-sending the notification if the description is saved again without mention changes. Store `mentionedInDescription: [userId]` on the task, or check against prior notifications.
- The autocomplete dropdown should behave identically to the one in the comment textarea — same position, same keyboard navigation.
