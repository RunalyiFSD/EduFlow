const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require('../config/env');

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Cloudinary storage for cover images (images only)
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eduflow/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 800, quality: 'auto', fetch_format: 'auto' }]
  }
});

// Cloudinary storage for video files
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eduflow/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for course covers.'));
    }
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed.'));
    }
  }
});

// Export both, default to imageUpload for backward compatibility
module.exports = imageUpload;
module.exports.videoUpload = videoUpload;
module.exports.cloudinary = cloudinary;
