const cron = require('node-cron');
const Task = require('../models/Task');
const { sendEmail } = require('../services/emailService');

function reminderEmailHtml(assigneeName, taskTitle, projectName, dueDate, taskPath) {
  const url = `${process.env.APP_URL || 'http://localhost:3000'}${taskPath}`;
  const formatted = new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return `<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0F172A;"><p>Hi ${assigneeName},</p><p>This is a reminder that <strong>${taskTitle}</strong> in <strong>${projectName}</strong> is due <strong>tomorrow, ${formatted}</strong>.</p><p style="margin:1.5rem 0;"><a href="${url}" style="display:inline-block;padding:10px 24px;background:#1E40AF;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Task</a></p><p style="color:#64748B;font-size:0.875rem;">— HelloTasks</p></div>`;
}

function startDueDateReminder() {
  // Run daily at 08:00 server time
  cron.schedule('0 8 * * *', async () => {
    console.log('[DueDateReminder] Running…');
    try {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const tasks = await Task.find({
        dueDate: { $gte: start, $lte: end },
        status: { $nin: ['completed', 'archived'] },
        assignee: { $ne: null }
      })
        .populate('assignee', 'fullName email accountStatus')
        .populate('project', 'name')
        .lean();

      let sent = 0;
      for (const task of tasks) {
        if (!task.assignee || task.assignee.accountStatus !== 'active' || !task.assignee.email) continue;
        const taskPath = `/projects/${task.project._id}/tasks/${task._id}`;
        try {
          await sendEmail(
            task.assignee.email,
            `Reminder: "${task.title}" is due tomorrow`,
            reminderEmailHtml(task.assignee.fullName, task.title, task.project.name, task.dueDate, taskPath)
          );
          sent++;
        } catch (err) {
          console.error(`[DueDateReminder] Failed for task ${task._id}:`, err.message);
        }
      }
      console.log(`[DueDateReminder] Done — ${sent} reminder(s) sent.`);
    } catch (err) {
      console.error('[DueDateReminder] Job error:', err.message);
    }
  });

  console.log('[DueDateReminder] Scheduled — runs daily at 08:00.');
}

module.exports = { startDueDateReminder };
