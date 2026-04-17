/**
 * Vehicle Routes
 * Handles vehicle CRUD operations
 */

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect, authorize, requireFullyVerified, optionalAuth } = require('../middlewares/auth');
const { uploadVehicleImages, uploadSingle, uploadFields } = require('../middlewares/upload');
const { validateVehicle, validateObjectId, validatePagination } = require('../middlewares/validation');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all vehicles
router.get('/', validatePagination, vehicleController.getVehicles);

// Get available bidding vehicles (YOUR PART)
router.get('/bidding/available', validatePagination, vehicleController.getBiddingVehicles);

// Get featured/boosted vehicles
router.get('/featured/active', vehicleController.getFeaturedVehicles);

// Get vehicles by seller
router.get('/seller/:sellerId', validateObjectId('sellerId'), validatePagination, vehicleController.getVehiclesBySeller);

// Get vehicle images
router.get('/:id/images', validateObjectId('id'), vehicleController.getVehicleImages);

// Get single vehicle (Keep this near the end of GET routes)
router.get('/:id', validateObjectId(), vehicleController.getVehicleById);

// DEBUG routes
router.get('/debug/boosts', vehicleController.getAllBoosts);

// ============================================
// PROTECTED ROUTES (Requires Login)
// ============================================
router.use(protect);

// Create vehicle 
router.post(
  '/',
  authorize('buyer', 'seller', 'buyer/seller', 'admin1'),
  uploadVehicleImages,
  validateVehicle,
  vehicleController.createVehicle
);

// My vehicles (seller's own)
router.get('/my-vehicles', vehicleController.getMyVehicles);

// Saved vehicles
router.get('/saved', vehicleController.getSavedVehicles);

// Save/unsave vehicle
router.post('/:id/save', validateObjectId(), vehicleController.toggleSaveVehicle);

// Toggle bidding status (YOUR PART)
router.put('/:id/bidding', validateObjectId(), vehicleController.toggleBiddingStatus);

// Delete specific image
router.delete(
  '/:vehicleId/images/:imageId',
  validateObjectId('vehicleId'),
  validateObjectId('imageId'),
  vehicleController.deleteVehicleImage
);

// Upload images to vehicle
router.post(
  '/:vehicleId/images',
  validateObjectId('vehicleId'),
  uploadVehicleImages,
  vehicleController.uploadVehicleImages
);

// Update vehicle
router.put(
  '/:id',
  validateObjectId(),
  uploadVehicleImages,
  vehicleController.updateVehicle
);

// Delete vehicle
router.delete(
  '/:id',
  validateObjectId(),
  vehicleController.deleteVehicle
);

// ============================================
// BOOST ROUTES (Main Branch Updates)
// ============================================

// Get all boost requests (ADMIN ONLY)
router.get(
  '/boost/all',
  authorize('admin1', 'admin2'),
  vehicleController.getAllBoostRequests
);

// Get single boost request
router.get(
  '/boost/:boostId',
  validateObjectId('boostId'),
  vehicleController.getBoostRequestDetails
);

// Approve/Reject boost
router.put('/boost/:boostId/approve', authorize('admin1', 'admin2'), validateObjectId('boostId'), vehicleController.approveBoostRequest);
router.put('/boost/:boostId/reject', authorize('admin1', 'admin2'), validateObjectId('boostId'), vehicleController.rejectBoostRequest);

// Boost vehicle ad POST route with advanced logging and upload
const boost_upload = uploadFields([
  { name: 'bankSlip', maxCount: 1 },
  { name: 'cardProof', maxCount: 1 }
]);

router.post(
  '/:vehicleId/boost',
  validateObjectId('vehicleId'),
  boost_upload,
  vehicleController.boostVehicleAd
);

module.exports = router;