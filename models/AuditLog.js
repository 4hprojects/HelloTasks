const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action:      { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  targetType:  { type: String },
  targetId:    { type: mongoose.Schema.Types.ObjectId },
  targetName:  { type: String },
  meta:        { type: mongoose.Schema.Types.Mixed },
  createdAt:   { type: Date, default: Date.now, index: true }
});

auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ projectId: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
