/**
 * Admin Routes
 * Handles admin operations for Admin1 and Admin2 roles
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');
const { validateObjectId, validatePagination } = require('../middlewares/validation');

// All routes require authentication and admin role
router.use(protect);

// ==================== ADMIN1 ROUTES ====================
// Full access to all data

// Get all users
router.get(
  '/users',
  authorize('admin1'),
  validatePagination,
  adminController.getAllUsers
);

// Get all vehicles
router.get(
  '/vehicles',
  authorize('admin1'),
  validatePagination,
  adminController.getAllVehicles
);

// Get all breakdowns
router.get(
  '/breakdowns',
  authorize('admin1'),
  validatePagination,
  adminController.getAllBreakdowns
);

// Get all test drives
router.get(
  '/test-drives',
  authorize('admin1'),
  validatePagination,
  adminController.getAllTestDrives
);

// Generate reports/statistics
router.get(
  '/reports',
  authorize('admin1'),
  adminController.generateReports
);

// Get dashboard summary
router.get(
  '/dashboard',
  authorize('admin1'),
  adminController.getDashboard
);

// Update user status (activate/deactivate)
router.put(
  '/users/:id/status',
  authorize('admin1'),
  validateObjectId(),
  adminController.updateUserStatus
);

// Delete user
router.delete(
  '/users/:id',
  authorize('admin1'),
  validateObjectId(),
  adminController.deleteUser
);

// ==================== ADMIN2 ROUTES ====================
// User verification management

// Get unverified users
router.get(
  '/unverified-users',
  authorize('admin2', 'admin1'),
  validatePagination,
  adminController.getUnverifiedUsers
);

// Get flagged users
router.get(
  '/flagged-users',
  authorize('admin2', 'admin1'),
  validatePagination,
  adminController.getFlaggedUsers
);

// Manually verify user
router.put(
  '/users/:id/verify',
  authorize('admin2', 'admin1'),
  validateObjectId(),
  adminController.manuallyVerifyUser
);

// Flag/unflag user
router.put(
  '/users/:id/flag',
  authorize('admin2', 'admin1'),
  validateObjectId(),
  adminController.flagUser
);

// Approve user (fully verify)
router.put(
  '/users/:id/approve',
  authorize('admin2', 'admin1'),
  validateObjectId(),
  adminController.approveUser
);

// Reject user (flag and deactivate)
router.put(
  '/users/:id/reject',
  authorize('admin2', 'admin1'),
  validateObjectId(),
  adminController.rejectUser
);

// ==================== SHARED ROUTES ====================

// Get user details (for verification review)
router.get(
  '/users/:id',
  authorize('admin1', 'admin2'),
  validateObjectId(),
  adminController.getUserDetails
);

module.exports = router;
