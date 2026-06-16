const mongoose = require('mongoose');

const STATUSES = ['draft', 'assigned', 'in_progress', 'ready_for_review', 'returned_for_refinement', 'approved', 'completed', 'blocked', 'archived'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: STATUSES, default: 'draft' },
  priority: { type: String, enum: PRIORITIES, default: 'medium' },
  dueDate: { type: Date, default: null },
  isConfidential: { type: Boolean, default: false },
  requiresLeadApproval: { type: Boolean, default: false },
  externalUrl: { type: String, trim: true, default: '' },
  checklist: [{
    item: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false }
  }],
  statusHistory: [{
    status: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }],
  qaReview: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decision: { type: String, enum: ['approved', 'returned', null], default: null },
    note: { type: String, default: '' },
    reviewedAt: { type: Date, default: null }
  },
  leadApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
    approvedAt: { type: Date, default: null }
  },
  archivedAt: { type: Date, default: null }
}, { timestamps: true });

taskSchema.methods.isVisibleTo = function (user) {
  if (!this.isConfidential) return true;
  if (user.globalRole === 'super_admin') return true;
  const uid = user._id.toString();
  if (this.assignee && this.assignee.toString() === uid) return true;
  if (this.createdBy && this.createdBy.toString() === uid) return true;
  return false;
};

module.exports = mongoose.model('Task', taskSchema);
