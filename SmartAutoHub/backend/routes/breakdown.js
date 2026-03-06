/**
 * Breakdown Routes
 * Handles breakdown requests and repairman operations
 */

const express = require('express');
const router = express.Router();
const breakdownController = require('../controllers/breakdownController');
const { protect, authorize, requireFullyVerified } = require('../middlewares/auth');
const { uploadBreakdownImages } = require('../middlewares/upload');
const { validateBreakdown, validateObjectId, validatePagination } = require('../middlewares/validation');

// All routes require authentication
router.use(protect);

// Get nearby repairmen
router.get('/nearby-repairmen', breakdownController.getNearbyRepairmen);

// Calculate ETA between two points
router.post('/calculate-eta', breakdownController.calculateETA);

// Create breakdown request (verified users)
router.post(
  '/',
  requireFullyVerified,
  uploadBreakdownImages,
  validateBreakdown,
  breakdownController.createBreakdown
);

// Get my breakdown requests (as user)
router.get('/my-requests', validatePagination, breakdownController.getMyBreakdowns);

// Get jobs for repairman
router.get('/jobs', authorize('repairman'), validatePagination, breakdownController.getRepairmanJobs);

// Get single breakdown
router.get('/:id', validateObjectId(), breakdownController.getBreakdownById);

// Accept breakdown job (repairman)
router.post('/:id/accept', authorize('repairman'), validateObjectId(), breakdownController.acceptBreakdown);

// Update breakdown status (repairman)
router.put('/:id/status', validateObjectId(), breakdownController.updateBreakdownStatus);

// Update repairman location
router.put('/:id/location', authorize('repairman'), validateObjectId(), breakdownController.updateRepairmanLocation);

// Rate breakdown service
router.post('/:id/rate', validateObjectId(), breakdownController.rateBreakdown);

module.exports = router;
