const mongoose = require('mongoose');

/**
 * WorkspaceMember — tracks a user's role within a workspace.
 *
 * For the current HelloTasks MVP there is a single implicit workspace,
 * so globalRole on the User model serves the same purpose.
 * This model is ready for future multi-workspace support.
 *
 * effectiveRole = projectRole || workspaceRole || defaultRole
 */
const workspaceMemberSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  role: {
    type: String,
    enum: ['owner', 'manager', 'quality_manager', 'member', 'viewer'],
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['invited', 'active', 'suspended', 'removed'],
    default: 'invited'
  },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  joinedAt:  { type: Date }
}, { timestamps: true });

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('WorkspaceMember', workspaceMemberSchema);
