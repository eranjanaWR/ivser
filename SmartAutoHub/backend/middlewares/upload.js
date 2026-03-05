/**
 * Upload Middleware
 * Handles file uploads using Multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const subdirs = ['vehicles', 'ids', 'selfies', 'profiles', 'breakdowns'];

subdirs.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/';
    
    // Determine folder based on fieldname or route
    if (file.fieldname === 'idFront' || file.fieldname === 'idBack') {
      folder = 'uploads/ids/';
    } else if (file.fieldname === 'selfie') {
      folder = 'uploads/selfies/';
    } else if (file.fieldname === 'profileImage') {
      folder = 'uploads/profiles/';
    } else if (file.fieldname === 'vehicleImages' || file.fieldname === 'images') {
      folder = 'uploads/vehicles/';
    } else if (file.fieldname === 'breakdownImages') {
      folder = 'uploads/breakdowns/';
    }
    
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files
  },
  fileFilter: fileFilter
});

// Memory storage for base64 processing (face-api.js, tesseract)
const memoryStorage = multer.memoryStorage();

const uploadMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: fileFilter
});

// Export different upload configurations
module.exports = {
  // Single file upload
  uploadSingle: (fieldName) => upload.single(fieldName),
  
  // Multiple files upload
  uploadMultiple: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  
  // Multiple fields upload
  uploadFields: (fields) => upload.fields(fields),
  
  // ID verification upload (front and back)
  uploadID: upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 }
  ]),
  
  // Face verification upload
  uploadSelfie: upload.single('selfie'),
  
  // Vehicle images upload
  uploadVehicleImages: upload.array('images', 10),
  
  // Profile image upload
  uploadProfileImage: upload.single('profileImage'),
  
  // Breakdown images upload
  uploadBreakdownImages: upload.array('breakdownImages', 5),
  
  // Memory storage uploads (for processing without saving)
  uploadIDMemory: uploadMemory.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 }
  ]),
  uploadSelfieMemory: uploadMemory.single('selfie'),
  
  // Error handler middleware
  handleUploadError: (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 10 files'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  }
};
