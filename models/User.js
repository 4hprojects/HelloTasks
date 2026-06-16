const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  globalRole: {
    type: String,
    enum: ['super_admin', 'project_lead', 'quality_manager', 'developer', 'viewer'],
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
  inviteExpires: Date
}, { timestamps: true });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
