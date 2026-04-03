/**
 * Vehicle Routes
 * Handles vehicle CRUD operations
 * 
 * Route matching priority (Express matches in order):
 * 1. Literal strings: /my-vehicles, /saved, /seller
 * 2. Multi-segment params: /:id/images, /:vehicleId/images/:imageId
 * 3. Single segment params: /:id, /:id/save
 */

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect, authorize, requireFullyVerified, optionalAuth } = require('../middlewares/auth');
const { uploadVehicleImages, uploadSingle } = require('../middlewares/upload');
const { validateVehicle, validateObjectId, validatePagination } = require('../middlewares/validation');

// ============================================
// GET ROUTES
// ============================================

// Create vehicle 
router.post(
  '/',
  protect,
  authorize('buyer', 'seller', 'buyer/seller', 'admin1'),
  uploadVehicleImages,
  validateVehicle,
  vehicleController.createVehicle
);

// Get all vehicles (PUBLIC)
router.get('/', validatePagination, vehicleController.getVehicles);

// Get my vehicles (PROTECTED - literal string before :id)
router.get('/my-vehicles', protect, vehicleController.getMyVehicles);

// Get saved vehicles (PROTECTED - literal string before :id)
router.get('/saved', protect, vehicleController.getSavedVehicles);

// Get featured/boosted vehicles (PUBLIC - literal string before :id)
router.get('/featured/active', vehicleController.getFeaturedVehicles);

// DEBUG: Get all boosts (PUBLIC - for testing)
router.get('/debug/boosts', vehicleController.getAllBoosts);

// Get vehicles by seller (PUBLIC - specific path segment before generic :id)
router.get('/seller/:sellerId', validateObjectId('sellerId'), validatePagination, vehicleController.getVehiclesBySeller);

// Get vehicle images (PUBLIC - multi-segment route before generic :id)
router.get('/:id/images', validateObjectId('id'), vehicleController.getVehicleImages);

// Delete specific image (PROTECTED - multi-segment route before generic :id)
router.delete(
  '/:vehicleId/images/:imageId',
  protect,
  validateObjectId('vehicleId'),
  validateObjectId('imageId'),
  vehicleController.deleteVehicleImage
);

// Upload images to vehicle (PROTECTED - multi-segment route before generic :id)
router.post(
  '/:vehicleId/images',
  protect,
  validateObjectId('vehicleId'),
  uploadVehicleImages,
  vehicleController.uploadVehicleImages
);

// Boost vehicle ad (PROTECTED - multi-segment route before generic :id)
router.post(
  '/:vehicleId/boost',
  protect,
  validateObjectId('vehicleId'),
  uploadSingle('bankSlip'),
  vehicleController.boostVehicleAd
);

// Boost management routes (MUST come before generic /:id routes)
// Get all boost requests (ADMIN ONLY - literal route)
router.get(
  '/boost/all',
  protect,
  authorize('admin1', 'admin2'),
  vehicleController.getAllBoostRequests
);

// Get single boost request (PROTECTED - specific multi-segment route)
router.get(
  '/boost/:boostId',
  protect,
  validateObjectId('boostId'),
  vehicleController.getBoostRequestDetails
);

// Approve boost request (ADMIN ONLY - specific multi-segment route)
router.put(
  '/boost/:boostId/approve',
  protect,
  authorize('admin1', 'admin2'),
  validateObjectId('boostId'),
  vehicleController.approveBoostRequest
);

// Reject boost request (ADMIN ONLY - specific multi-segment route)
router.put(
  '/boost/:boostId/reject',
  protect,
  authorize('admin1', 'admin2'),
  validateObjectId('boostId'),
  vehicleController.rejectBoostRequest
);

// Save/unsave vehicle (PROTECTED)
router.post('/:id/save', protect, validateObjectId(), vehicleController.toggleSaveVehicle);

// Get single vehicle (PUBLIC - generic :id comes last)
router.get('/:id', validateObjectId(), vehicleController.getVehicleById);

// Update vehicle (PROTECTED)
router.put(
  '/:id',
  protect,
  validateObjectId(),
  uploadVehicleImages,
  vehicleController.updateVehicle
);

// Delete vehicle (PROTECTED)
router.delete(
  '/:id',
  protect,
  validateObjectId(),
  vehicleController.deleteVehicle
);

module.exports = router;
