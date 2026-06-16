const Notification = require('../models/Notification');

async function notify(recipientId, type, message, { link = '', projectId = null, taskId = null } = {}) {
  if (!recipientId) return;
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      message,
      link,
      project: projectId || null,
      task: taskId || null
    });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

async function notifyMany(recipientIds, type, message, opts = {}) {
  const unique = [...new Set(recipientIds.map(id => id.toString()))];
  await Promise.all(unique.map(id => notify(id, type, message, opts)));
}

module.exports = { notify, notifyMany };
