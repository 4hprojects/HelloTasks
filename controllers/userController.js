const crypto = require('crypto');
const User = require('../models/User');
const { notify } = require('../utils/notify');
const { sendEmail } = require('../services/emailService');

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  project_lead: 'Project Lead',
  quality_manager: 'Quality Manager',
  developer: 'Developer',
  viewer: 'Viewer'
};

async function listUsers(req, res) {
  const { search, role, status } = req.query;
  const filter = {};
  if (role) filter.globalRole = role;
  if (status) filter.accountStatus = status;

  let users = await User.find(filter).sort({ createdAt: -1 }).lean();

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(u =>
      u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  res.render('users/index', {
    title: 'User Management',
    users,
    roleLabels: ROLE_LABELS,
    filters: { search, role, status }
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
  const validRoles = ['super_admin', 'project_lead', 'quality_manager', 'developer', 'viewer'];
  const validStatuses = ['pending', 'active', 'suspended'];

  if (globalRole && validRoles.includes(globalRole)) user.globalRole = globalRole;
  if (accountStatus && validStatuses.includes(accountStatus)) user.accountStatus = accountStatus;
  await user.save();

  // Notify user when their account is activated
  if (!wasActive && user.accountStatus === 'active') {
    await notify(user._id, 'account_activated',
      'Your HelloTasks account has been activated. You can now log in.',
      { link: '/dashboard' });
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
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

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

    await sendEmail(user.email, 'You\'ve been invited to HelloTasks', `
      <p>Hi ${user.fullName},</p>
      <p>You've been invited to join HelloTasks by an administrator.</p>
      <p><a href="${inviteUrl}" style="color:#4f46e5;font-weight:600;">Accept your invitation</a></p>
      <p>This link expires in 72 hours.</p>
    `);

    req.session.flash = { success: `Invitation sent to ${user.email}.` };
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Failed to send invitation. Please try again.' };
    res.redirect('/users/invite');
  }
}

module.exports = { listUsers, getUser, updateUser, getInviteUser, postInviteUser };
