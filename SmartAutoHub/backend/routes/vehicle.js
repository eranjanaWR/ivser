/**
 * Vehicle Routes
 * Handles vehicle CRUD operations
 */

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect, authorize, requireFullyVerified, optionalAuth } = require('../middlewares/auth');
const { uploadVehicleImages } = require('../middlewares/upload');
const { validateVehicle, validateObjectId, validatePagination } = require('../middlewares/validation');

// Public routes
router.get('/', validatePagination, vehicleController.getVehicles);
router.get('/seller/:sellerId', validateObjectId('sellerId'), validatePagination, vehicleController.getVehiclesBySeller);
router.get('/:id', validateObjectId(), vehicleController.getVehicleById);

// Protected routes
router.use(protect);

// My vehicles (seller's own)
router.get('/my-vehicles', vehicleController.getMyVehicles);

// Saved vehicles
router.get('/saved', vehicleController.getSavedVehicles);

// Save/unsave vehicle
router.post('/:id/save', validateObjectId(), vehicleController.toggleSaveVehicle);

// Create vehicle (verified sellers only)
router.post(
  '/',
  authorize('seller', 'admin1'),
  requireFullyVerified,
  uploadVehicleImages,
  validateVehicle,
  vehicleController.createVehicle
);

// Update vehicle (owner or admin)
router.put(
  '/:id',
  validateObjectId(),
  uploadVehicleImages,
  vehicleController.updateVehicle
);

// Delete vehicle (owner or admin)
router.delete(
  '/:id',
  validateObjectId(),
  vehicleController.deleteVehicle
);

module.exports = router;
