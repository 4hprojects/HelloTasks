# Feature: Scheduled Weekly Report Email

**Category:** Automation
**Priority:** High
**Status:** Idea
**Effort Estimate:** ~30 min

## Description

The weekly project summary report is currently triggered manually by a Super Admin or Project Lead via the admin settings page. This feature adds an automatic schedule: the report is sent every Monday morning at 08:00 server time without any manual action required.

An on/off toggle in admin settings controls whether the auto-send is active.

## Value

The manual trigger requires someone to remember to send the report each week. Automated scheduling removes that dependency — the report reliably reaches all Project Leads and Super Admins every Monday, keeping the team consistently informed about project progress without adding a recurring human task.

## Technical Approach

### Model Changes

Add to the app settings model (or `AppSettings` if it exists):

```js
weeklyReportAutoSend: { type: Boolean, default: false }
```

### Routes

No new routes. The toggle is managed via the existing admin settings form POST.

### Controllers

- `postSettings`: save `weeklyReportAutoSend` from the settings form.
- The cron job reads this setting before sending.

### Cron Job

Add a new cron job in `jobs/weeklyReport.js` (or extend the existing `jobs/dueDateReminder.js`):

```js
const cron = require('node-cron');
const AppSettings = require('../models/AppSettings');
const { buildWeeklyReportData, dispatchWeeklyReport } = require('../controllers/adminController');

cron.schedule('0 8 * * 1', async () => {
  const settings = await AppSettings.findOne();
  if (!settings || !settings.weeklyReportAutoSend) return;
  const data = await buildWeeklyReportData();
  await dispatchWeeklyReport(data);
}, { timezone: 'UTC' });
```

The `buildWeeklyReportData()` function already exists in `adminController.js`. `dispatchWeeklyReport` is the send logic extracted from `sendWeeklyReport`.

### Views

- `views/admin/settings.ejs` — add a toggle checkbox: "Automatically send weekly report every Monday at 08:00 UTC".

## Files to Modify

- `models/AppSettings.js` (or equivalent) — add `weeklyReportAutoSend` field
- `controllers/adminController.js` — extract `dispatchWeeklyReport` as a reusable function
- `jobs/weeklyReport.js` — new cron job file
- `server.js` — register the new cron job
- `views/admin/settings.ejs` — add toggle

## Dependencies

- Requires `buildWeeklyReportData()` to be extractable from `adminController.js` as a standalone function (it may already be — see the admin controller for the `getWeeklyReportPreview` handler which already calls it).

## Notes

- The timezone for the cron schedule should be configurable or clearly documented — "08:00 UTC" may be 04:00 EST. Consider making the send time configurable in admin settings.
- The cron job should log success/failure to the server console (Morgan or a simple `console.log`).
- If the job runs and no active Project Leads or Super Admins are found to send to, it should log a warning and skip silently without erroring.
- This is the simplest-to-build feature in the entire backlog — all infrastructure already exists.
