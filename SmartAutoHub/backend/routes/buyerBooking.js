/**
 * Buyer Booking Routes
 * Handles test drive booking endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createBooking,
  getBuyerBookings,
  getSellerBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
} = require('../controllers/buyerBookingController');

/**
 * POST /api/buyer/book-testdrive
 * Create a new test drive booking
 * Auth: Required (buyer)
 */
router.post('/book-testdrive', protect, createBooking);

/**
 * GET /api/buyer/bookings
 * Get all bookings made by the current user (as buyer)
 * Auth: Required
 */
router.get('/bookings', protect, getBuyerBookings);

/**
 * GET /api/seller/bookings
 * Get all bookings for the current user's vehicles (as seller)
 * Auth: Required
 */
router.get('/bookings-as-seller', protect, getSellerBookings);

/**
 * GET /api/bookings/:id
 * Get a specific booking by ID
 * Auth: Required (buyer, seller, or admin)
 */
router.get('/:id', protect, getBookingById);

/**
 * PUT /api/bookings/:id/status
 * Update booking status (seller accepts/rejects)
 * Auth: Required (seller only)
 */
router.put('/:id/status', protect, updateBookingStatus);

/**
 * PUT /api/bookings/:id/cancel
 * Cancel a booking
 * Auth: Required (buyer only)
 */
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
