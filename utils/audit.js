const AuditLog = require('../models/AuditLog');

async function audit(action, user, opts = {}) {
  try {
    await AuditLog.create({ action, performedBy: user._id, ...opts });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { audit };
