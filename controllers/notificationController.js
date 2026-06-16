const Notification = require('../models/Notification');

const TYPE_LABELS = {
  task_assigned: 'Task Assigned',
  task_ready_for_review: 'Ready for Review',
  task_approved: 'Task Approved',
  task_returned: 'Returned for Refinement',
  task_completed: 'Task Completed',
  task_comment: 'New Comment',
  account_activated: 'Account Activated',
  general: 'Notification'
};

async function listNotifications(req, res) {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.render('notifications/index', {
    title: 'Notifications',
    notifications,
    typeLabels: TYPE_LABELS
  });
}

async function markRead(req, res) {
  await Notification.updateOne(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true }
  );
  res.redirect('back');
}

async function markAllRead(req, res) {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  req.session.flash = { success: 'All notifications marked as read.' };
  res.redirect('/notifications');
}

module.exports = { listNotifications, markRead, markAllRead };
