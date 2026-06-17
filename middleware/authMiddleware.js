const User = require('../models/User');
const Notification = require('../models/Notification');
const { normalizeRole, isSystemAdmin } = require('../utils/roles');

async function attachUser(req, res, next) {
  if (req.session && req.session.userId) {
    try {
      req.user = await User.findById(req.session.userId).lean();
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  res.locals.user = req.user;
  res.locals.unreadCount = 0;
  if (req.user) {
    try {
      res.locals.unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    } catch { /* non-fatal */ }
  }
  next();
}

function isAuthenticated(req, res, next) {
  if (req.user) return next();
  req.session.flash = { error: 'Please log in to continue.' };
  res.redirect('/login');
}

/**
 * checkRole(...roles) — accepts both legacy and canonical role names.
 * Normalises the user's globalRole before checking, so old DB values
 * (super_admin, project_lead, developer) work alongside new ones.
 */
function checkRole(...roles) {
  // Normalise the allowed list so callers don't need to pass both old + new
  const normalised = roles.map(normalizeRole);
  return (req, res, next) => {
    if (!req.user) return res.redirect('/login');
    const userRole = normalizeRole(req.user.globalRole);
    if (normalised.includes(userRole)) return next();
    // system_admin passes any role check
    if (isSystemAdmin(req.user)) return next();
    res.status(403).render('errors/403', { title: '403 Forbidden' });
  };
}

module.exports = { attachUser, isAuthenticated, checkRole };
