const crypto = require('crypto');
const User = require('../models/User');
const { notify } = require('../utils/notify');
const { sendEmail } = require('../services/emailService');
const { accountActivatedEmail, systemInviteEmail } = require('../services/emailTemplates');
const { audit } = require('../utils/audit');
const { ROLE_LABELS: ROLE_LABELS_MAP } = require('../utils/roles');
const { INVITE_EXPIRY_MS } = require('../utils/constants');

// Labels for every valid globalRole value (legacy + canonical)
const ROLE_LABELS = {
  system_admin:    'System Admin',
  super_admin:     'System Admin',
  owner:           'Owner',
  manager:         'Manager',
  project_lead:    'Manager',
  quality_manager: 'Quality Manager',
  member:          'Member',
  developer:       'Member',
  viewer:          'Viewer',
};

async function listUsers(req, res) {
  const { search, role, status } = req.query;
  const filter = {};
  if (role) filter.globalRole = role;
  if (status) filter.accountStatus = status;
  if (search) filter.$or = [
    { fullName: { $regex: search, $options: 'i' } },
    { email:    { $regex: search, $options: 'i' } }
  ];

  const PAGE_SIZE = 25;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const total = await User.countDocuments(filter);
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const qp = new URLSearchParams();
  if (search) qp.set('search', search);
  if (role)   qp.set('role', role);
  if (status) qp.set('status', status);

  res.render('users/index', {
    title: 'User Management',
    users,
    roleLabels: ROLE_LABELS,
    filters: { search: search || '', role: role || '', status: status || '' },
    pagination: { page: safePage, totalPages, total, queryBase: qp.toString() }
  });
}

async function getUser(req, res) {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).render('errors/404', { title: '404 Not Found' });

  res.render('users/show', {
    title: user.fullName,
    targetUser: user,
    roleLabels: ROLE_LABELS
  });
}

async function updateUser(req, res) {
  const { globalRole, accountStatus } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).render('errors/404', { title: '404 Not Found' });

  // Prevent demoting yourself
  if (user._id.toString() === req.user._id.toString()) {
    req.session.flash = { error: 'You cannot change your own role or status.' };
    return res.redirect(`/users/${user._id}`);
  }

  const wasActive = user.accountStatus === 'active';
  const validRoles = ['system_admin', 'super_admin', 'owner', 'manager', 'project_lead', 'quality_manager', 'member', 'developer', 'viewer'];
  const validStatuses = ['pending', 'active', 'suspended'];

  const oldRole = user.globalRole;
  if (globalRole && validRoles.includes(globalRole)) user.globalRole = globalRole;
  if (accountStatus && validStatuses.includes(accountStatus)) user.accountStatus = accountStatus;
  await user.save();

  if (globalRole && validRoles.includes(globalRole) && globalRole !== oldRole) {
    await audit('role_changed', req.user, {
      targetType: 'user', targetId: user._id, targetName: user.fullName,
      meta: { oldRole, newRole: globalRole }
    });
  }

  // Notify + email user when their account is activated
  if (!wasActive && user.accountStatus === 'active') {
    await notify(user._id, 'account_activated',
      'Your HelloTasks account has been activated. You can now log in.',
      { link: '/dashboard' });
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    try {
      await sendEmail(
        user.email,
        'Your HelloTasks account has been activated',
        accountActivatedEmail(user.fullName, `${appUrl}/login`)
      );
    } catch (err) {
      console.error('Account activation email failed:', err.message);
    }
  }

  req.session.flash = { success: `${user.fullName} updated.` };
  res.redirect(`/users/${user._id}`);
}

async function getInviteUser(req, res) {
  res.render('users/invite', {
    title: 'Invite User',
    roleLabels: ROLE_LABELS
  });
}

async function postInviteUser(req, res) {
  const { fullName, email, globalRole } = req.body;
  const cleanEmail = email.toLowerCase().trim();
  const cleanRole = Object.keys(ROLE_LABELS).includes(globalRole) ? globalRole : 'viewer';

  try {
    let user = await User.findOne({ email: cleanEmail });

    if (user && user.accountStatus === 'active') {
      req.session.flash = { error: 'A user with that email is already active.' };
      return res.redirect('/users/invite');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + INVITE_EXPIRY_MS);

    if (user) {
      // Re-invite existing pending/suspended user
      user.fullName = fullName || user.fullName;
      user.globalRole = cleanRole;
      user.inviteToken = token;
      user.inviteExpires = expires;
      await user.save();
    } else {
      // Create new pending user with a placeholder password hash
      const placeholderHash = await require('bcryptjs').hash(crypto.randomBytes(16).toString('hex'), 10);
      user = await User.create({
        fullName,
        email: cleanEmail,
        passwordHash: placeholderHash,
        globalRole: cleanRole,
        accountStatus: 'pending',
        inviteToken: token,
        inviteExpires: expires
      });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/accept-invite/${token}`;

    await sendEmail(user.email, "You've been invited to HelloTasks",
      systemInviteEmail(user.fullName, inviteUrl));

    req.session.flash = { success: `Invitation sent to ${user.email}.`, inviteUrl };
    res.redirect('/users/invite');
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Failed to send invitation. Please try again.' };
    res.redirect('/users/invite');
  }
}

module.exports = { listUsers, getUser, updateUser, getInviteUser, postInviteUser };
