/**
 * Advertising Routes
 * Handles advertising package submissions and inquiries
 */

const express = require('express');
const router = express.Router();
const {
  submitPackageRequest,
  checkRequestStatus,
} = require('../controllers/advertisingController');

/**
 * @route   GET /api/advertising/test
 * @desc    Test if advertising API is working
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Advertising API is working',
    timestamp: new Date()
  });
});

/**
 * @route   GET /api/advertising/approved
 * @desc    Get all approved advertising requests to display on pages
 * @access  Public
 */
router.get('/approved', async (req, res) => {
  try {
    console.log('📢 [ADVERTISING] GET /approved endpoint called');
    const Advertising = require('../models/Advertising');
    const requests = await Advertising.find({ status: 'approved' })
      .sort({ submittedAt: -1 })
      .limit(10);
    
    console.log(`✅ [ADVERTISING] Found ${requests.length} approved ads`);
    console.log('📦 [ADVERTISING] Returning:', requests.map(r => ({ _id: r._id, company: r.company, status: r.status })));
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('❌ [ADVERTISING] Error fetching approved ads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approved ads',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/advertising/image/:id
 * @desc    Get lightweight image data for carousel (only image + metadata, no other fields)
 * @access  Public
 */
router.get('/image/:id', async (req, res) => {
  try {
    const Advertising = require('../models/Advertising');
    const { id } = req.params;
    
    // Select only necessary fields for fast loading
    const ad = await Advertising.findById(id)
      .select('adPhotoBase64 company _id')
      .lean(); // Use lean() for faster queries without Mongoose overhead
    
    if (!ad || !ad.adPhotoBase64) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    res.json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('❌ Error fetching ad image:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ad image',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/advertising/requests
 * @desc    Get all advertising requests (including paymentSlipBase64)
 * @access  Public
 */
router.get('/requests', async (req, res) => {
  try {
    console.log('📢 [ADVERTISING] GET /requests endpoint called');
    const Advertising = require('../models/Advertising');
    const requests = await Advertising.find()
      .sort({ submittedAt: -1 });

    console.log(`✅ [ADVERTISING] Found ${requests.length} ads`);
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('❌ [ADVERTISING] Error fetching requests:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch advertising requests'
    });
  }
});

/**
 * @route   POST /api/advertising/submit-package
 * @desc    Submit an advertising package request
 * @access  Public
 */
router.post('/submit-package', submitPackageRequest);

/**
 * @route   GET /api/advertising/status/:id
 * @desc    Check the status of an advertising request
 * @access  Public
 */
router.get('/status/:id', checkRequestStatus);

module.exports = router;
