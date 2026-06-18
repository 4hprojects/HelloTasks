const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },

  // System-level role — platform maintenance only.
  // Values: 'user' (everyone) | 'system_admin' (platform admin)
  systemRole: {
    type: String,
    enum: ['user', 'system_admin'],
    default: 'user'
  },

  // Workspace-level role — controls access within the app / workspace.
  // New canonical values: owner | manager | quality_manager | member | viewer
  // Legacy values kept valid so existing Atlas records are not broken:
  //   super_admin → system_admin (migrate via scripts/migrate-roles.js)
  //   project_lead → manager
  //   developer → member
  globalRole: {
    type: String,
    enum: ['super_admin', 'system_admin', 'owner', 'project_lead', 'manager', 'quality_manager', 'developer', 'member', 'viewer'],
    default: 'viewer'
  },

  // Fallback role when user has no workspace or project membership.
  defaultRole: {
    type: String,
    enum: ['viewer'],
    default: 'viewer'
  },

  accountStatus: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending'
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  inviteToken: String,
  inviteExpires: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date, default: null }
}, { timestamps: true });

userSchema.index({ accountStatus: 1 });
userSchema.index({ globalRole: 1 });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
