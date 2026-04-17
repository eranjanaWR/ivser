/**
 * Dealer Availability Routes
 * API endpoints for sellers to manage test drive availability
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

// PUBLIC route – buyer booking page fetches seller slots without login
router.get('/seller/:sellerId', getSellerAvailability); // Get seller's availability by sellerId

// Protected routes (require authentication) - sellers only
router.post('/', protect, saveAvailability);         // Save/update availability
router.get('/', protect, getAvailability);           // Get current user's availability
router.delete('/', protect, resetAvailability);      // Reset to default 24/7
router.delete('/slot/:slotId', protect, deleteSlot); // Delete specific slot

module.exports = router;
