/**
 * Dealer Availability Routes
 * API endpoints for managing test drive availability
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  saveAvailability,
  getAvailability,
  getSellerAvailability,
  deleteSlot,
  resetAvailability,
} = require('../controllers/availabilityController');

const router = express.Router();

// Protected routes (require authentication)
router.post('/', protect, saveAvailability); // Save/update availability
router.get('/', protect, getAvailability); // Get current user's availability
router.delete('/', protect, resetAvailability); // Reset to default 24/7
router.delete('/slot/:slotId', protect, deleteSlot); // Delete specific slot

// Public route (no auth required)
router.get('/seller/:sellerId', getSellerAvailability); // Get specific seller's availability

module.exports = router;
