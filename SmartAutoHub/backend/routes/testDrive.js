/**
 * Test Drive Routes
 * Handles test drive scheduling and management
 */

const express = require('express');
const router = express.Router();
const testDriveController = require('../controllers/testDriveController');
const { protect, requireFullyVerified } = require('../middlewares/auth');
const { validateTestDrive, validateObjectId, validatePagination } = require('../middlewares/validation');

// All routes require authentication
router.use(protect);

// Schedule a test drive (verified buyers)
router.post(
  '/',
  requireFullyVerified,
  validateTestDrive,
  testDriveController.scheduleTestDrive
);

// Get my test drive requests (as buyer)
router.get('/my-requests', validatePagination, testDriveController.getMyTestDriveRequests);

// Get test drives for my vehicles (as seller)
router.get('/my-vehicles', validatePagination, testDriveController.getTestDrivesForMyVehicles);

// Get single test drive
router.get('/:id', validateObjectId(), testDriveController.getTestDriveById);

// Update test drive status (approve/reject/complete)
router.put('/:id/status', validateObjectId(), testDriveController.updateTestDriveStatus);

// Delete/cancel test drive
router.delete('/:id', validateObjectId(), testDriveController.deleteTestDrive);

module.exports = router;
