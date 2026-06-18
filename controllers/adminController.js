const AppSetting = require('../models/AppSetting');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

async function buildWeeklyReportData() {
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [aggResult, recipients, settings] = await Promise.all([
    Task.aggregate([
      { $match: { status: { $ne: 'archived' } } },
      { $facet: {
        overall: [
          { $group: {
            _id: null,
            total: { $sum: 1 },
            blocked:    { $sum: { $cond: [{ $eq: ['$status', 'blocked'] },            1, 0] } },
            inReview:   { $sum: { $cond: [{ $eq: ['$status', 'ready_for_review'] },   1, 0] } },
            completedThisWeek: { $sum: { $cond: [
              { $and: [{ $eq: ['$status', 'completed'] }, { $gte: ['$updatedAt', sevenDaysAgo] }] }, 1, 0
            ]}}
          }}
        ],
        byProject: [
          { $group: {
            _id: '$project',
            total:      { $sum: 1 },
            done:       { $sum: { $cond: [{ $eq: ['$status', 'completed'] },          1, 0] } },
            blocked:    { $sum: { $cond: [{ $eq: ['$status', 'blocked'] },            1, 0] } },
            review:     { $sum: { $cond: [{ $eq: ['$status', 'ready_for_review'] },   1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] },        1, 0] } }
          }},
          { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'proj' } },
          { $unwind: '$proj' },
          { $project: { name: '$proj.name', total: 1, done: 1, blocked: 1, review: 1, inProgress: 1 } },
          { $sort: { name: 1 } }
        ]
      }}
    ]),
    User.find({ globalRole: { $in: ['super_admin', 'project_lead'] }, accountStatus: 'active' }).select('email fullName').lean(),
    AppSetting.findById('app')
  ]);

  const s = settings || { appName: 'HelloTasks', weeklyReportNote: '' };
  const overall = aggResult[0]?.overall[0] || {};
  const totalTasks        = overall.total               || 0;
  const completedThisWeek = overall.completedThisWeek   || 0;
  const blockedCount      = overall.blocked             || 0;
  const inReviewCount     = overall.inReview            || 0;
  const projectRows       = aggResult[0]?.byProject     || [];

  const reportDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return { settings: s, totalTasks, recipients, completedThisWeek, blockedCount, inReviewCount, projectRows, reportDate };
}

async function getSettings(req, res) {
  let settings = await AppSetting.findById('app');
  if (!settings) settings = await AppSetting.create({ _id: 'app' });

  res.render('admin/settings', {
    title: 'Admin Settings',
    settings
  });
}

async function postSettings(req, res) {
  const { appName, supportEmail, openRegistration, weeklyReportNote, weeklyReportAutoSend } = req.body;

  await AppSetting.findByIdAndUpdate(
    'app',
    {
      appName: appName?.trim() || 'HelloTasks',
      supportEmail: supportEmail?.trim() || '',
      openRegistration: openRegistration === 'on',
      weeklyReportNote: weeklyReportNote?.trim() || '',
      weeklyReportAutoSend: weeklyReportAutoSend === 'on'
    },
    { upsert: true, new: true }
  );

  req.session.flash = { success: 'Settings saved.' };
  res.redirect('/admin/settings');
}

async function getWeeklyReportPreview(req, res) {
  try {
    const data = await buildWeeklyReportData();
    res.render('admin/weekly-report-preview', {
      title: 'Weekly Report Preview',
      ...data
    });
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Failed to load report preview.' };
    res.redirect('/admin/settings');
  }
}

async function dispatchWeeklyReport({ settings, totalTasks, recipients, completedThisWeek, blockedCount, inReviewCount, projectRows, reportDate }) {
  if (recipients.length === 0) {
    console.warn('[WeeklyReport] No active Super Admins or Project Leads found — skipping send.');
    return 0;
  }

  const projectRowsHtml = projectRows.map(r => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${r.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${r.total}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${r.inProgress}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;color:#1d4ed8;">${r.review}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;color:#16a34a;">${r.done}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;color:#dc2626;">${r.blocked}</td>
    </tr>
  `).join('');

  const noteHtml = settings.weeklyReportNote
    ? `<p style="background:#eff6ff;border-left:3px solid #1e40af;padding:10px 14px;border-radius:4px;color:#1e40af;font-size:14px;margin-bottom:20px;">${settings.weeklyReportNote}</p>`
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
      <div style="background:#1e40af;padding:24px 32px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">${settings.appName} — Weekly Report</h1>
        <p style="color:#bfdbfe;margin:6px 0 0;font-size:14px;">${reportDate}</p>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:28px 32px;border-radius:0 0 8px 8px;">
        ${noteHtml}
        <h2 style="font-size:16px;margin:0 0 12px;color:#1e40af;">Overall Summary</h2>
        <table style="border-collapse:collapse;width:100%;margin-bottom:28px;">
          <tr style="background:#eff6ff;">
            <td style="padding:10px 14px;font-weight:600;">Total Projects (with tasks)</td>
            <td style="padding:10px 14px;text-align:right;font-weight:700;">${projectRows.length}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;">Total Active Tasks</td>
            <td style="padding:10px 14px;text-align:right;font-weight:700;">${totalTasks}</td>
          </tr>
          <tr style="background:#eff6ff;">
            <td style="padding:10px 14px;font-weight:600;">Completed This Week</td>
            <td style="padding:10px 14px;text-align:right;font-weight:700;color:#16a34a;">${completedThisWeek}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;">Ready for Review</td>
            <td style="padding:10px 14px;text-align:right;font-weight:700;color:#1d4ed8;">${inReviewCount}</td>
          </tr>
          <tr style="background:#eff6ff;">
            <td style="padding:10px 14px;font-weight:600;">Blocked</td>
            <td style="padding:10px 14px;text-align:right;font-weight:700;color:#dc2626;">${blockedCount}</td>
          </tr>
        </table>

        ${projectRows.length > 0 ? `
        <h2 style="font-size:16px;margin:0 0 12px;color:#1e40af;">Project Breakdown</h2>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          <thead>
            <tr style="background:#1e40af;color:#fff;">
              <th style="padding:8px 12px;text-align:left;">Project</th>
              <th style="padding:8px 12px;text-align:center;">Total</th>
              <th style="padding:8px 12px;text-align:center;">In Progress</th>
              <th style="padding:8px 12px;text-align:center;color:#bfdbfe;">Review</th>
              <th style="padding:8px 12px;text-align:center;color:#bbf7d0;">Done</th>
              <th style="padding:8px 12px;text-align:center;color:#fecaca;">Blocked</th>
            </tr>
          </thead>
          <tbody>${projectRowsHtml}</tbody>
        </table>
        ` : ''}
      </div>
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:16px;">Sent from ${settings.appName} · Do not reply</p>
    </div>
  `;

  const emailList = recipients.map(r => r.email);
  await Promise.all(emailList.map(email =>
    sendEmail(email, `${settings.appName} — Weekly Report (${reportDate})`, html)
  ));

  return emailList.length;
}

async function sendWeeklyReport(req, res) {
  try {
    const data = await buildWeeklyReportData();

    if (data.recipients.length === 0) {
      req.session.flash = { error: 'No active Super Admins or Project Leads found to send to.' };
      return res.redirect('/admin/settings');
    }

    const sent = await dispatchWeeklyReport(data);
    req.session.flash = { success: `Weekly report sent to ${sent} recipient${sent === 1 ? '' : 's'}.` };
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Failed to send weekly report. Please try again.' };
    res.redirect('/admin/settings');
  }
}

module.exports = { getSettings, postSettings, getWeeklyReportPreview, sendWeeklyReport, buildWeeklyReportData, dispatchWeeklyReport };
