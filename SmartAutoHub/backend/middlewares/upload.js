/**
 * Upload Middleware
 * Handles file uploads using Multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const subdirs = ['vehicles', 'ids', 'selfies', 'profiles', 'breakdowns', 'bank_slips'];

subdirs.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folderName = 'vehicles';
    
    // Determine folder based on fieldname or route
    if (file.fieldname === 'idFront' || file.fieldname === 'idBack' || file.fieldname === 'idImage' || file.fieldname === 'idDocument') {
      folderName = 'ids';
    } else if (file.fieldname === 'selfie') {
      folderName = 'selfies';
    } else if (file.fieldname === 'profileImage') {
      folderName = 'profiles';
    } else if (file.fieldname === 'vehicleImages' || file.fieldname === 'images') {
      folderName = 'vehicles';
    } else if (file.fieldname === 'breakdownImages') {
      folderName = 'breakdowns';
    } else if (file.fieldname === 'bankSlip' || file.fieldname === 'cardProof') {
      folderName = 'bank_slips';
    }
    
    // Use absolute path
    const dirPath = path.join(uploadsDir, folderName);
    console.log(`📂 [MULTER DEST] Field: ${file.fieldname}, Folder: ${folderName}, Path: ${dirPath}`);
    cb(null, dirPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log(`📝 [MULTER FILE] Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types - images and PDFs for bank slip uploads
  const allowedImageExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
  const allowedDocExtensions = ['.pdf'];
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();
  
  console.log(`📁 [FILEFILTER] Processing file: ${file.fieldname}`);
  console.log(`  - originalName: ${file.originalname}`);
  console.log(`  - extension: ${extname}`);
  console.log(`  - mimetype: ${mimetype}`);
  
  // Check if it's for bank slip or card proof upload (allow both images and PDFs)
  if (file.fieldname === 'bankSlip' || file.fieldname === 'cardProof') {
    const isAllowedImage = allowedImageExtensions.includes(extname) && mimetype.startsWith('image/');
    const isAllowedDoc = allowedDocExtensions.includes(extname) && mimetype === 'application/pdf';
    
    console.log(`  - isAllowedImage: ${isAllowedImage} (for ${file.fieldname})`);
    console.log(`  - isAllowedDoc: ${isAllowedDoc} (for ${file.fieldname})`);
    
    if (isAllowedImage || isAllowedDoc) {
      console.log(`✅ [FILEFILTER] File accepted: ${file.fieldname}`);
      cb(null, true);
    } else {
      const error = 'For payment uploads, only image files (JPEG, PNG, GIF) or PDF documents are allowed';
      console.log(`❌ [FILEFILTER] File rejected: ${error}`);
      cb(new Error(error), false);
    }
  } else {
    // For other uploads, only allow images
    const isImage = allowedImageExtensions.includes(extname) && mimetype.startsWith('image/');
    
    console.log(`  - isImage: ${isImage} (for ${file.fieldname})`);
    
    if (isImage) {
      console.log(`✅ [FILEFILTER] File accepted: ${file.fieldname}`);
      cb(null, true);
    } else {
      const error = 'Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed';
      console.log(`❌ [FILEFILTER] File rejected: ${error}`);
      cb(new Error(error), false);
    }
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
  
  // ID verification upload (front and back, or single idDocument)
  uploadID: upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 }
  ]),
  
  // Face verification upload
  uploadSelfie: upload.single('selfie'),
  
  // Vehicle images upload
  uploadVehicleImages: upload.array('images', 10),
  
  // Profile image upload
  uploadProfileImage: upload.single('profileImage'),
  
  // Breakdown images upload
  uploadBreakdownImages: upload.array('breakdownImages', 5),
  
  // Registration upload (profile image + ID image)
  uploadRegistration: upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idImage', maxCount: 1 }
  ]),
  
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
