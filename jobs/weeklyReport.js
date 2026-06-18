const cron = require('node-cron');
const AppSetting = require('../models/AppSetting');
const { buildWeeklyReportData, dispatchWeeklyReport } = require('../controllers/adminController');

function startWeeklyReport() {
  // Runs every Monday at 08:00 UTC
  cron.schedule('0 8 * * 1', async () => {
    console.log('[WeeklyReport] Running scheduled send…');
    try {
      const settings = await AppSetting.findById('app');
      if (!settings || !settings.weeklyReportAutoSend) {
        console.log('[WeeklyReport] Auto-send disabled — skipping.');
        return;
      }

      const data = await buildWeeklyReportData();
      const sent = await dispatchWeeklyReport(data);
      console.log(`[WeeklyReport] Done — ${sent} recipient(s) notified.`);
    } catch (err) {
      console.error('[WeeklyReport] Job error:', err.message);
    }
  }, { timezone: 'UTC' });

  console.log('[WeeklyReport] Scheduled — runs every Monday at 08:00 UTC.');
}

module.exports = { startWeeklyReport };
