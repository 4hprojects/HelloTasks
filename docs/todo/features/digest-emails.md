# Feature: Digest Emails

**Category:** Reporting & Analytics
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~1 day

## Description

Instead of receiving an individual email for every task event, users can opt into a digest mode where all their notifications are batched and delivered as a single email summary — either daily (sent at 08:00) or weekly (sent on Monday morning).

The digest email lists: tasks assigned to you that changed status, new comments on your tasks, tasks you're watching that were updated, and any @mentions.

Users choose their preference (immediate / daily digest / weekly digest) in their notification settings.

## Value

High-activity projects generate a flood of individual notification emails that users start ignoring. A digest condenses the noise into one useful email at a predictable time, making notifications feel less like spam and more like a useful daily briefing. This is a standard feature in GitHub, Jira, and Asana.

## Technical Approach

### Model Changes

Add to the Notification model a `delivered` flag to track which notifications have been included in a digest:

```js
digestedAt: { type: Date, default: null }
```

Add user preference (or use the Notification Preferences feature if that is built first):

```js
// On User model:
emailDigestFrequency: { type: String, enum: ['immediate', 'daily', 'weekly'], default: 'immediate' }
```

### Routes

No new routes. Triggered by cron job.

### Controllers / Cron Job

New `jobs/digestEmailJob.js`:

```js
// Daily digest: runs at 08:00 every day
cron.schedule('0 8 * * *', async () => {
  const users = await User.find({ emailDigestFrequency: 'daily', accountStatus: 'active' });
  for (const user of users) {
    const pending = await Notification.find({
      recipient: user._id,
      digestedAt: null,
      createdAt: { $lte: new Date() }
    }).populate('task project').lean();

    if (pending.length === 0) continue;
    await sendDigestEmail(user, pending);
    await Notification.updateMany({ _id: { $in: pending.map(n => n._id) } }, { digestedAt: new Date() });
  }
});

// Weekly digest: runs Monday 08:00
cron.schedule('0 8 * * 1', async () => { /* same for 'weekly' users */ });
```

Email notifications already dispatched for `immediate` users should be skipped in the digest. Gate this by checking `user.emailDigestFrequency` at the point of sending event-driven emails.

### Views

- Digest email HTML template in `services/emailTemplates.js` — a structured summary with sections per notification type
- `views/users/profile.ejs` or account settings page — "Email notification frequency" selector

## Files to Modify

- `models/Notification.js` — add `digestedAt` field
- `models/User.js` — add `emailDigestFrequency` field
- `jobs/digestEmailJob.js` — new cron job
- `services/emailTemplates.js` — digest email template
- `services/emailService.js` — add `sendDigestEmail()` function
- `server.js` — register digest job
- Account settings view — notification frequency selector

## Dependencies

- Notification Preferences feature defines the user preference model — build that first or inline the preference here.

## Notes

- Users on `immediate` mode should not be included in digest runs — check frequency before sending individual event emails too, and skip the email if they have switched to digest mode.
- A digest with zero items should not be sent — skip silently.
- The digest email should be scannable in 30 seconds. Group by type: "Tasks assigned to you", "Comments on your tasks", "Mentions". Avoid overwhelming detail per item.
- Opt-out from digest (back to immediate) should be one click from within the email footer.
