const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    // Canonical: manager | quality_manager | member | viewer
    // Legacy (kept valid): project_lead → manager, developer → member
    enum: ['project_lead', 'manager', 'quality_manager', 'developer', 'member', 'viewer'],
    default: 'viewer'
  },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['active', 'on_hold', 'completed', 'archived'],
    default: 'active'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema]
}, { timestamps: true });

projectSchema.index({ status: 1 });
projectSchema.index({ 'members.user': 1 });

projectSchema.methods.getMemberRole = function (userId) {
  const m = this.members.find(m => m.user.toString() === userId.toString());
  return m ? m.role : null;
};

projectSchema.methods.hasMember = function (userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

module.exports = mongoose.model('Project', projectSchema);
