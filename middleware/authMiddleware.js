const User = require('../models/User');
const Notification = require('../models/Notification');

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

function checkRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.redirect('/login');
    if (roles.includes(req.user.globalRole)) return next();
    res.status(403).render('errors/403', { title: '403 Forbidden' });
  };
}

module.exports = { attachUser, isAuthenticated, checkRole };
