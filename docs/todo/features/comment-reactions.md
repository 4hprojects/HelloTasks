# Feature: Reactions on Comments

**Category:** Collaboration & Communication
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Team members can react to comments on tasks with emoji reactions (👍 ✅ 👀 🔥 ❓). Each reaction shows a count. Clicking an emoji toggles your own reaction on/off. Reactions are displayed inline below the comment text as small pill buttons.

## Value

Reactions provide a lightweight way to acknowledge a comment or signal agreement without writing a full reply comment. Instead of a thread full of "Sounds good!" comments, a thumbs-up reaction does the same job with less noise. This keeps the comment thread focused on substantive discussion.

## Technical Approach

### Model Changes

Add to `models/Comment.js`:

```js
reactions: [{
  emoji:  { type: String },  // e.g., '👍', '✅', '🔥'
  users:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}]
```

### Routes

```
POST /projects/:projectId/tasks/:taskId/comments/:commentId/react
```

Accepts `{ emoji }` in the body. Toggles the current user into/out of the reaction's `users` array.

### Controllers

```js
async function reactToComment(req, res) {
  const { emoji } = req.body;
  const allowedEmojis = ['👍', '✅', '👀', '🔥', '❓'];
  if (!allowedEmojis.includes(emoji)) return res.json({ ok: false });

  const comment = await Comment.findById(req.params.commentId);
  let reaction = comment.reactions.find(r => r.emoji === emoji);

  if (reaction) {
    const idx = reaction.users.indexOf(req.user._id);
    if (idx > -1) reaction.users.splice(idx, 1);
    else reaction.users.push(req.user._id);
    if (reaction.users.length === 0) comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
  } else {
    comment.reactions.push({ emoji, users: [req.user._id] });
  }

  await comment.save();
  res.json({ ok: true, reactions: comment.reactions });
}
```

### Views

- `views/tasks/show.ejs` — below each comment body, render existing reactions as pill buttons with count. Add a "+" button that shows a small emoji picker (fixed 5 options as a dropdown). Use XHR to toggle reactions without page reload.

## Files to Modify

- `models/Comment.js` — add `reactions` array
- `controllers/commentController.js` — add `reactToComment` handler
- `routes/taskRoutes.js` (or comment routes) — add reaction route
- `views/tasks/show.ejs` — reaction pills + toggle JS

## Dependencies

None. Works with existing comment system.

## Notes

- No notifications should be sent for reactions — they are ambient feedback, not communication.
- Limit the reaction set to 5–6 options to keep the UI minimal. Freeform emoji pickers are unnecessarily complex.
- The reaction picker should appear as a small popover above the "+" button — vanilla JS with CSS `position: absolute`.
- Show each reactor's name in a tooltip on hover over the reaction pill.
