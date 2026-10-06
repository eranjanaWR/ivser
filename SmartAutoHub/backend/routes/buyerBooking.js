const express = require('express');
const router = express.Router();

const buyerBookingController = require('../controllers/buyerBookingController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.post('/book-testdrive', buyerBookingController.createBooking);
router.get('/bookings', buyerBookingController.getBuyerBookings);
router.get('/bookings-as-seller', buyerBookingController.getSellerBookings);
router.get('/:id', buyerBookingController.getBookingById);
router.put('/:id/status', buyerBookingController.updateBookingStatus);
router.put('/:id/cancel', buyerBookingController.cancelBooking);

module.exports = router;
