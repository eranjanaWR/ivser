const BuyerBooking = require('../models/BuyerBooking');
const Vehicle = require('../models/Vehicle');
const { sendTestDriveNotification } = require('../utils/email');

/**
 * @desc    Create a slot-based test drive booking
 * @route   POST /api/buyer/book-testdrive
 * @access  Private
 */
const createBooking = async (req, res) => {
  try {
    const { vehicleId, selectedSlot, scheduledDate, scheduledTime, buyerInfo } = req.body;
    const buyerId = req.user._id;

    if (!vehicleId || !selectedSlot || !scheduledDate || !scheduledTime || !buyerInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for booking'
      });
    }

    if (!buyerInfo.fullName || !buyerInfo.email || !buyerInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Buyer info must include fullName, email, and phone'
      });
    }

    const vehicle = await Vehicle.findById(vehicleId).populate('sellerId', 'email firstName lastName');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const sellerId = vehicle?.sellerId?._id;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller information is missing for this vehicle'
      });
    }

    const bookingData = {
      vehicleId,
      buyerId,
      sellerId,
      selectedSlot,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      buyerInfo
    };

    const booking = await new BuyerBooking(bookingData).save();

    try {
      const sellerEmail = vehicle.sellerId.email;
      const sellerFirstName = vehicle.sellerId.firstName || 'Seller';
      const buyerName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || buyerInfo.fullName;
      const vehicleName = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`;
      const displayDate = new Date(booking.scheduledDate).toLocaleDateString();

      await sendTestDriveNotification(
        sellerEmail,
        sellerFirstName,
        buyerName,
        vehicleName,
        displayDate,
        scheduledTime
      );
    } catch (emailError) {
      console.error('Failed to send test drive booking notification email:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Test drive booking created successfully',
      data: {
        bookingId: booking._id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);

    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(', ');

      return res.status(400).json({
        success: false,
        message
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating booking'
    });
  }
};

/**
 * @desc    Get bookings created by current buyer
 * @route   GET /api/buyer/bookings
 * @access  Private
 */
const getBuyerBookings = async (req, res) => {
  try {
    const bookings = await BuyerBooking.find({ buyerId: req.user._id })
      .populate('vehicleId', 'name brand model year image images')
      .populate('sellerId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get buyer bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching buyer bookings',
      error: error.message
    });
  }
};

/**
 * @desc    Get bookings received by current seller
 * @route   GET /api/buyer/bookings-as-seller
 * @access  Private
 */
const getSellerBookings = async (req, res) => {
  try {
    const bookings = await BuyerBooking.find({ sellerId: req.user._id })
      .populate('vehicleId', 'name brand model year image images')
      .populate('buyerId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get seller bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching seller bookings',
      error: error.message
    });
  }
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/buyer/:id
 * @access  Private
 */
const getBookingById = async (req, res) => {
  try {
    const booking = await BuyerBooking.findById(req.params.id)
      .populate('vehicleId', 'brand model year price images')
      .populate('buyerId', 'firstName lastName email phone')
      .populate('sellerId', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const userId = req.user._id.toString();
    const isBuyer = booking.buyerId._id.toString() === userId;
    const isSeller = booking.sellerId._id.toString() === userId;
    const isAdmin = req.user.role === 'admin1';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    return res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

/**
 * @desc    Update booking status (seller)
 * @route   PUT /api/buyer/:id/status
 * @access  Private
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { status, sellerNotes } = req.body;
    const allowedStatuses = ['Accepted', 'Rejected', 'Pending'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed statuses: Accepted, Rejected, Pending'
      });
    }

    const booking = await BuyerBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    booking.status = status;

    if (sellerNotes !== undefined) {
      booking.sellerNotes = sellerNotes;
    }

    await booking.save();

    return res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel booking (buyer)
 * @route   PUT /api/buyer/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res) => {
  try {
    const { buyerNotes } = req.body;
    const booking = await BuyerBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }

    booking.status = 'Cancelled';

    if (buyerNotes !== undefined) {
      booking.buyerNotes = buyerNotes;
    }

    await booking.save();

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getBuyerBookings,
  getSellerBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
};
