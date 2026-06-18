const AppSetting = require('../models/AppSetting');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

async function buildWeeklyReportData() {
  const settings = await AppSetting.findById('app') || { appName: 'HelloTasks', weeklyReportNote: '' };

  const [projects, allTasks, recipients] = await Promise.all([
    Project.find({}).sort({ name: 1 }).lean(),
    Task.find({ status: { $ne: 'archived' } }).lean(),
    User.find({ globalRole: { $in: ['super_admin', 'project_lead'] }, accountStatus: 'active' }).select('email fullName').lean()
  ]);

  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const statusCounts = {};
  allTasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

  const completedThisWeek = allTasks.filter(t =>
    t.status === 'completed' && new Date(t.updatedAt) >= sevenDaysAgo
  ).length;

  const blockedCount = statusCounts['blocked'] || 0;
  const inReviewCount = statusCounts['ready_for_review'] || 0;

  const projectRows = projects.map(p => {
    const ptasks = allTasks.filter(t => t.project.toString() === p._id.toString());
    const done = ptasks.filter(t => t.status === 'completed').length;
    const blocked = ptasks.filter(t => t.status === 'blocked').length;
    const review = ptasks.filter(t => t.status === 'ready_for_review').length;
    const inProgress = ptasks.filter(t => t.status === 'in_progress').length;
    return { name: p.name, total: ptasks.length, done, blocked, review, inProgress };
  }).filter(r => r.total > 0);

  const reportDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return { settings, allTasks, recipients, completedThisWeek, blockedCount, inReviewCount, projectRows, reportDate };
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
  const { appName, supportEmail, openRegistration, weeklyReportNote } = req.body;

  await AppSetting.findByIdAndUpdate(
    'app',
    {
      appName: appName?.trim() || 'HelloTasks',
      supportEmail: supportEmail?.trim() || '',
      openRegistration: openRegistration === 'on',
      weeklyReportNote: weeklyReportNote?.trim() || ''
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

async function sendWeeklyReport(req, res) {
  try {
    const { settings, allTasks, recipients, completedThisWeek, blockedCount, inReviewCount, projectRows, reportDate } = await buildWeeklyReportData();

    if (recipients.length === 0) {
      req.session.flash = { error: 'No active Super Admins or Project Leads found to send to.' };
      return res.redirect('/admin/settings');
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
              <td style="padding:10px 14px;text-align:right;font-weight:700;">${allTasks.length}</td>
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

    req.session.flash = { success: `Weekly report sent to ${emailList.length} recipient${emailList.length === 1 ? '' : 's'}.` };
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Failed to send weekly report. Please try again.' };
    res.redirect('/admin/settings');
  }
}

module.exports = { getSettings, postSettings, getWeeklyReportPreview, sendWeeklyReport };
