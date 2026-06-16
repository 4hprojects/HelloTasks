const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const supabase = require('../config/supabase');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown'
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('File type not allowed'));
  }
});

async function uploadFile(file, folder = 'uploads') {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  let buffer = file.buffer;
  let mimeType = file.mimetype;
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let storedName;

  if (isImage) {
    buffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
    mimeType = 'image/webp';
    storedName = `${uid}.webp`;
  } else {
    storedName = `${uid}${path.extname(file.originalname).toLowerCase()}`;
  }

  const filePath = `${folder}/${storedName}`;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType: mimeType,
    upsert: false
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return {
    originalName: file.originalname,
    storedName,
    filePath,
    mimeType,
    size: buffer.length,
    bucket,
    publicUrl: urlData.publicUrl,
    isWebP: isImage,
    uploadedAt: new Date()
  };
}

module.exports = { upload, uploadFile };
