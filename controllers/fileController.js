const path = require('path');
const FileRecord = require('../models/FileRecord');
const supabase = require('../config/supabase');
const { uploadFile: uploadToSupabase } = require('../services/uploadService');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOC_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.csv', '.ppt', '.pptx', '.txt', '.md'
]);

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function handleUpload(req, res) {
  const { projectId } = req.params;
  const task = req.task;

  if (!req.file) {
    req.session.flash = { error: 'No file selected.' };
    return res.redirect(`/projects/${projectId}/tasks/${task._id}`);
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    req.session.flash = { error: 'File type not allowed.' };
    return res.redirect(`/projects/${projectId}/tasks/${task._id}`);
  }

  const isImage = IMAGE_TYPES.includes(req.file.mimetype);
  const sizeLimit = isImage ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

  if (req.file.size > sizeLimit) {
    req.session.flash = {
      error: `File too large. ${isImage ? 'Images' : 'Documents'} must be under ${isImage ? '5' : '10'} MB.`
    };
    return res.redirect(`/projects/${projectId}/tasks/${task._id}`);
  }

  try {
    const folder = `projects/${projectId}/tasks/${task._id}`;
    const meta = await uploadToSupabase(req.file, folder);

    await FileRecord.create({
      task: task._id,
      project: projectId,
      uploadedBy: req.user._id,
      isConfidential: task.isConfidential,
      ...meta
    });

    req.session.flash = { success: `"${req.file.originalname}" uploaded.` };
  } catch (err) {
    console.error('Upload error:', err.message);
    req.session.flash = { error: 'Upload failed. Check your Supabase storage configuration.' };
  }

  res.redirect(`/projects/${projectId}/tasks/${task._id}#files`);
}

async function deleteFile(req, res) {
  const { projectId, taskId, fileId } = req.params;
  const record = await FileRecord.findById(fileId);

  if (!record) {
    req.session.flash = { error: 'File not found.' };
    return res.redirect(`/projects/${projectId}/tasks/${taskId}`);
  }

  const isUploader = record.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'project_lead'].includes(req.projectRole);

  if (!isUploader && !isAdmin) {
    req.session.flash = { error: 'You cannot delete this file.' };
    return res.redirect(`/projects/${projectId}/tasks/${taskId}`);
  }

  try {
    await supabase.storage.from(record.bucket).remove([record.filePath]);
  } catch (err) {
    console.error('Storage delete error:', err.message);
  }

  await FileRecord.findByIdAndDelete(fileId);
  req.session.flash = { success: 'File deleted.' };
  res.redirect(`/projects/${projectId}/tasks/${taskId}#files`);
}

module.exports = { handleUpload, deleteFile, formatSize };
