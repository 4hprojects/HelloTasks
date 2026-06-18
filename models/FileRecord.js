const mongoose = require('mongoose');

const fileRecordSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  bucket: { type: String, required: true },
  publicUrl: { type: String, required: true },
  isWebP: { type: Boolean, default: false },
  isConfidential: { type: Boolean, default: false }
}, { timestamps: true });

fileRecordSchema.index({ task: 1 });
fileRecordSchema.index({ project: 1 });

module.exports = mongoose.model('FileRecord', fileRecordSchema);
