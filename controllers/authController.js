const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppSetting = require('../models/AppSetting');
const { sendEmail } = require('../services/emailService');
const { passwordResetEmail } = require('../services/emailTemplates');
const { verifyTurnstile } = require('../utils/turnstile');
const { REMEMBER_ME_MS, PASSWORD_RESET_EXPIRY_MS } = require('../utils/constants');

async function getRegister(req, res) {
  res.render('auth/register', { title: 'Create Account' });
}

async function postRegister(req, res) {
  const { firstName, lastName, email, password } = req.body;
  const fullName = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();
  try {
    if (!await verifyTurnstile(req.body['cf-turnstile-response'], req.ip)) {
      req.session.flash = { error: 'Security check failed. Please try again.' };
      return res.redirect('/register');
    }
    const settings = await AppSetting.findById('app');
    if (settings && !settings.openRegistration) {
      req.session.flash = { error: 'Registration is currently closed. Please contact an administrator.' };
      return res.redirect('/register');
    }

    if (!fullName) {
      req.session.flash = { error: 'Please enter your first and last name.' };
      return res.redirect('/register');
    }
    const existing = await User.findOne({ email });
    if (existing) {
      req.session.flash = { error: 'An account with that email already exists.' };
      return res.redirect('/register');
    }
    if (password.length < 8) {
      req.session.flash = { error: 'Password must be at least 8 characters.' };
      return res.redirect('/register');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ fullName, email, passwordHash });
    req.session.flash = { success: 'Account created. An admin will activate it shortly.' };
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Registration failed. Please try again.' };
    res.redirect('/register');
  }
}

async function getLogin(req, res) {
  res.render('auth/login', { title: 'Sign In' });
}

async function postLogin(req, res) {
  const { email, password } = req.body;
  try {
    if (!await verifyTurnstile(req.body['cf-turnstile-response'], req.ip)) {
      req.session.flash = { error: 'Security check failed. Please try again.' };
      return res.redirect('/login');
    }

    const user = await User.findOne({ email });

    if (user && user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
      req.session.flash = { error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.` };
      return res.redirect('/login');
    }

    const passwordOk = user && await user.comparePassword(password);

    if (!passwordOk) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) {
          user.lockoutUntil = new Date(Date.now() + 10 * 60 * 1000);
        }
        await user.save();
      }
      req.session.flash = { error: 'Invalid email or password.' };
      return res.redirect('/login');
    }

    if (user.accountStatus !== 'active') {
      req.session.flash = { error: 'Your account is pending activation. Please contact an admin.' };
      return res.redirect('/login');
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    req.session.userId = user._id.toString();
    if (req.body.rememberMe === 'on') {
      req.session.cookie.maxAge = REMEMBER_ME_MS;
    } else {
      req.session.cookie.expires = false;
    }
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Login failed. Please try again.' };
    res.redirect('/login');
  }
}

async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

/* ── Forgot password ── */
async function getForgotPassword(req, res) {
  res.render('auth/forgot-password', { title: 'Reset Password' });
}

async function postForgotPassword(req, res) {
  const { email } = req.body;
  try {
    if (!await verifyTurnstile(req.body['cf-turnstile-response'], req.ip)) {
      req.session.flash = { error: 'Security check failed. Please try again.' };
      return res.redirect('/forgot-password');
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always show the same message to avoid email enumeration
    const successMsg = 'If that email is registered, a reset link has been sent.';

    if (!user || user.accountStatus === 'suspended') {
      req.session.flash = { success: successMsg };
      return res.redirect('/forgot-password');
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    await user.save();

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password/${token}`;

    await sendEmail(user.email, 'Reset your HelloTasks password',
      passwordResetEmail(user.fullName, resetUrl));

    req.session.flash = { success: successMsg };
    res.redirect('/forgot-password');
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Something went wrong. Please try again.' };
    res.redirect('/forgot-password');
  }
}

/* ── Reset password ── */
async function getResetPassword(req, res) {
  const { token } = req.params;
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() }
  });
  if (!user) {
    req.session.flash = { error: 'This reset link is invalid or has expired.' };
    return res.redirect('/forgot-password');
  }
  res.render('auth/reset-password', { title: 'Set New Password', token });
}

async function postResetPassword(req, res) {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  try {
    if (password !== confirmPassword) {
      req.session.flash = { error: 'Passwords do not match.' };
      return res.redirect(`/reset-password/${token}`);
    }
    if (password.length < 8) {
      req.session.flash = { error: 'Password must be at least 8 characters.' };
      return res.redirect(`/reset-password/${token}`);
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });
    if (!user) {
      req.session.flash = { error: 'This reset link is invalid or has expired.' };
      return res.redirect('/forgot-password');
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    req.session.flash = { success: 'Password updated. You can now sign in.' };
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Something went wrong. Please try again.' };
    res.redirect(`/reset-password/${token}`);
  }
}

/* ── Accept invite ── */
async function getAcceptInvite(req, res) {
  const { token } = req.params;
  const user = await User.findOne({
    inviteToken: token,
    inviteExpires: { $gt: new Date() }
  });
  if (!user) {
    req.session.flash = { error: 'This invite link is invalid or has expired.' };
    return res.redirect('/login');
  }
  res.render('auth/accept-invite', { title: 'Set Up Your Account', token, invitedUser: { fullName: user.fullName, email: user.email } });
}

async function postAcceptInvite(req, res) {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  try {
    if (password !== confirmPassword) {
      req.session.flash = { error: 'Passwords do not match.' };
      return res.redirect(`/accept-invite/${token}`);
    }
    if (password.length < 8) {
      req.session.flash = { error: 'Password must be at least 8 characters.' };
      return res.redirect(`/accept-invite/${token}`);
    }

    const user = await User.findOne({
      inviteToken: token,
      inviteExpires: { $gt: new Date() }
    });
    if (!user) {
      req.session.flash = { error: 'This invite link is invalid or has expired.' };
      return res.redirect('/login');
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.accountStatus = 'active';
    user.inviteToken = undefined;
    user.inviteExpires = undefined;
    await user.save();

    req.session.flash = { success: 'Account activated. Welcome to HelloTasks!' };
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Something went wrong. Please try again.' };
    res.redirect(`/accept-invite/${token}`);
  }
}

module.exports = { getRegister, postRegister, getLogin, postLogin, logout, getForgotPassword, postForgotPassword, getResetPassword, postResetPassword, getAcceptInvite, postAcceptInvite };
