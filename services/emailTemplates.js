const APP_URL = () => process.env.APP_URL || 'http://localhost:3000';

const STYLES = {
  wrap:   'font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0F172A;',
  btn:    'display:inline-block;padding:10px 24px;background:#1E40AF;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;',
  muted:  'color:#64748B;font-size:0.875rem;',
};

function wrap(inner) {
  return `<div style="${STYLES.wrap}">${inner}<p style="${STYLES.muted}">— HelloTasks</p></div>`;
}

function btn(text, url) {
  return `<p style="margin:1.5rem 0;"><a href="${url}" style="${STYLES.btn}">${text}</a></p>`;
}

function taskEmail(recipientName, message, taskPath) {
  return wrap(
    `<p>Hi ${recipientName},</p>` +
    `<p>${message}</p>` +
    btn('View Task', `${APP_URL()}${taskPath}`)
  );
}

function mentionEmail(recipientName, authorName, taskTitle, projectName, commentPath) {
  return wrap(
    `<p>Hi ${recipientName},</p>` +
    `<p><strong>${authorName}</strong> mentioned you in a comment on <strong>${taskTitle}</strong> in <strong>${projectName}</strong>.</p>` +
    btn('View Comment', `${APP_URL()}${commentPath}`)
  );
}

function passwordResetEmail(recipientName, resetUrl) {
  return wrap(
    `<p>Hi ${recipientName},</p>` +
    `<p>You requested a password reset for your HelloTasks account.</p>` +
    btn('Reset my password', resetUrl) +
    `<p style="${STYLES.muted}">This link expires in 1 hour. If you didn't request this, you can safely ignore it.</p>`
  );
}

function projectInviteEmail(recipientName, inviterName, projectName, acceptLink) {
  return wrap(
    `<p>Hi ${recipientName},</p>` +
    `<p><strong>${inviterName}</strong> has invited you to collaborate on <strong>${projectName}</strong> in HelloTasks.</p>` +
    `<p>Click below to set up your account and get started. This link expires in 72 hours.</p>` +
    btn('Accept Invitation', acceptLink) +
    `<p style="${STYLES.muted}">If you weren't expecting this invitation, you can safely ignore this email.</p>`
  );
}

function systemInviteEmail(recipientName, inviteUrl) {
  return wrap(
    `<p>Hi ${recipientName},</p>` +
    `<p>You've been invited to join HelloTasks by an administrator.</p>` +
    btn('Accept Invitation', inviteUrl) +
    `<p style="${STYLES.muted}">This link expires in 72 hours.</p>`
  );
}

function accountActivatedEmail(recipientName, loginUrl) {
  return wrap(
    `<p>Hi ${recipientName},</p>` +
    `<p>Your HelloTasks account has been activated. You can now log in and get started.</p>` +
    btn('Log In', loginUrl)
  );
}

module.exports = {
  taskEmail,
  mentionEmail,
  passwordResetEmail,
  projectInviteEmail,
  systemInviteEmail,
  accountActivatedEmail,
};
