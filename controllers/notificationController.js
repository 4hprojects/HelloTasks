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
  const PAGE_SIZE = 20;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const filter = { recipient: req.user._id };
  const total = await Notification.countDocuments(filter);
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  res.render('notifications/index', {
    title: 'Notifications',
    notifications,
    typeLabels: TYPE_LABELS,
    pagination: { page: safePage, totalPages, total, queryBase: '' }
  });
}

async function markRead(req, res) {
  await Notification.updateOne(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true }
  );
  res.redirect('/notifications');
}

async function markAllRead(req, res) {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  req.session.flash = { success: 'All notifications marked as read.' };
  res.redirect('/notifications');
}

module.exports = { listNotifications, markRead, markAllRead };
