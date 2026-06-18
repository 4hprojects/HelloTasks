# Feature: In-app Notification Preferences

**Category:** User & Access Management
**Priority:** Medium
**Status:** Idea
**Effort Estimate:** ~half day

## Description

Users can control which events generate in-app notifications and/or email notifications. A preferences page (or section in account settings) shows a list of notification event types with toggles for "In-app" and "Email" per event type.

Event types: task assigned, task status changed, comment on my task, @mention in comment, @mention in description, task approved, task returned, task completed, due date reminder, weekly report, team announcements.

## Value

Currently, every notification event is sent to every eligible recipient unconditionally. Some users want every notification; others want only direct assignments and mentions. Without preference controls, the only escape from notification overload is to ignore emails entirely — which means missing important ones. Preferences let users tune the system to their working style.

## Technical Approach

### Model Changes

Add to `models/User.js`:

```js
notificationPrefs: {
  taskAssigned:         { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
  taskStatusChanged:    { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: false } },
  commentOnMyTask:      { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
  mentionInComment:     { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
  mentionInDescription: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
  taskApproved:         { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
  taskReturned:         { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
  taskCompleted:        { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: false } },
  dueDateReminder:      { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
  weeklyReport:         { inApp: { type: Boolean, default: false }, email: { type: Boolean, default: true } },
  announcements:        { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } }
}
```

### Routes

```
GET  /account/notifications    — notification preferences page
POST /account/notifications    — save preferences
```

### Controllers

- `showNotificationPrefs`: render the preferences form with current user settings
- `updateNotificationPrefs`: save the posted checkboxes to `user.notificationPrefs`
- At each notification dispatch point (task assigned, comment created, etc.): check `user.notificationPrefs[eventType].email` and `inApp` before sending

### Views

New `views/account/notifications.ejs`:

- Table with event types as rows and "In-app" / "Email" as column checkboxes
- "Save preferences" button
- "Turn off all emails" shortcut link

## Files to Modify

- `models/User.js` — add `notificationPrefs` sub-document
- `controllers/accountController.js` — add `showNotificationPrefs`, `updateNotificationPrefs`
- `routes/accountRoutes.js` — add notification pref routes
- `services/emailService.js` or notification dispatch utils — check prefs before sending
- All controllers that dispatch notifications — check `user.notificationPrefs`
- `views/account/notifications.ejs` — new view

## Dependencies

None. Works with the existing notification and email system.

## Notes

- Default preferences should err toward more notifications to avoid silent misses for new users. Users who want less can opt out.
- Batch updating notification preferences (one form submit for all events) is better UX than per-event AJAX toggles for the initial implementation.
- Check preferences when loading the `recipient` at notification dispatch time — this means the recipient must be loaded (not just referenced by ID) before deciding to send.
- Global mute: a "Pause all emails" option that temporarily sets all email prefs to false without losing individual settings would be a useful follow-up.
