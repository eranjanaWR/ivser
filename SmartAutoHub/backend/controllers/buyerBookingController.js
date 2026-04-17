/**
 * Buyer Booking Controller
 * Handles test drive booking requests from buyers
 */

const BuyerBooking = require('../models/BuyerBooking');
const Vehicle = require('../models/Vehicle');
const mongoose = require('mongoose');

/**
 * Create a new test drive booking
 * POST /api/buyer/book-testdrive
 */
exports.createBooking = async (req, res) => {
  try {
    const { vehicleId, selectedSlot, scheduledDate, scheduledTime, buyerInfo } = req.body;
    const buyerId = req.user._id;

    console.log('📝 Creating buyer booking...');
    console.log('Request body:', {
      vehicleId,
      buyerId,
      selectedSlot,
      scheduledDate,
      scheduledTime,
      buyerInfo,
    });

    // Validate required fields
    if (!vehicleId || !selectedSlot || !scheduledDate || !scheduledTime || !buyerInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    if (!buyerInfo.fullName || !buyerInfo.email || !buyerInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Buyer info must include fullName, email, and phone',
      });
    }

    // Fetch vehicle to get seller ID and populate seller info for email
    const vehicle = await Vehicle.findById(vehicleId).populate('sellerId', 'email firstName lastName');
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Extract seller ID (since it's populated, we take the _id)
    const sellerId = vehicle.sellerId._id;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller information not found for this vehicle',
      });
    }

    // Create booking object
    const bookingData = {
      vehicleId,
      buyerId,
      sellerId,
      selectedSlot,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      buyerInfo,
    };

    // Create and save booking
    const booking = new BuyerBooking(bookingData);
    await booking.save();

    console.log('✅ Booking created successfully:', booking._id);

    // ===== EMAIL NOTIFICATION =====
    try {
      const { sendTestDriveNotification } = require('../utils/email');
      const vehicleName = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`;
      const buyerName = `${req.user.firstName} ${req.user.lastName}`;
      
      // Since we populated sellerId above, we can safely access email and firstName
      const sellerEmail = vehicle.sellerId.email;
      const sellerFirstName = vehicle.sellerId.firstName;
      
      const displayDate = new Date(scheduledDate).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      
      await sendTestDriveNotification(
        sellerEmail,
        sellerFirstName,
        buyerName,
        vehicleName,
        displayDate,
        scheduledTime
      );
      console.log('✉️ Email notification sent successfully to seller:', sellerEmail);
    } catch (emailErr) {
      console.error('❌ Failed to send email notification:', emailErr.message);
      // We don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Test drive booking created successfully. Awaiting seller confirmation.',
      data: {
        bookingId: booking._id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
      },
    });
  } catch (err) {
    console.error('❌ Error creating booking:', err);

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create booking',
    });
  }
};

/**
 * Get all bookings for a buyer
 * GET /api/buyer/bookings
 */
exports.getBuyerBookings = async (req, res) => {
  try {
    const buyerId = req.user._id;

    console.log('📥 Fetching bookings for buyer:', buyerId);

    const bookings = await BuyerBooking.find({ buyerId })
      .populate('vehicleId', 'name brand model year image')
      .populate('sellerId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    console.log('📦 Found', bookings.length, 'bookings');

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
};

/**
 * Get all bookings for a seller
 * GET /api/seller/bookings
 */
exports.getSellerBookings = async (req, res) => {
  try {
    const sellerId = req.user._id;

    console.log('📥 Fetching bookings for seller:', sellerId);

    const bookings = await BuyerBooking.find({ sellerId })
      .populate('vehicleId', 'name brand model year image')
      .populate('buyerId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    console.log('📦 Found', bookings.length, 'bookings');

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
};

/**
 * Get single booking by ID
 * GET /api/bookings/:id
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await BuyerBooking.findById(id)
      .populate('vehicleId')
      .populate('buyerId', 'firstName lastName email phone')
      .populate('sellerId', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization: only buyer, seller, or admin can view
    const isBuyer = booking.buyerId._id.toString() === userId.toString();
    const isSeller = booking.sellerId._id.toString() === userId.toString();

    if (!isBuyer && !isSeller && req.user.role !== 'admin1') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error('❌ Error fetching booking:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
    });
  }
};

/**
 * Update booking status (seller accepts/rejects)
 * PUT /api/bookings/:id/status
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sellerNotes } = req.body;
    const sellerId = req.user._id;

    // Validate status
    const validStatuses = ['Accepted', 'Rejected', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Accepted, Rejected, Pending',
      });
    }

    // Find booking and verify seller
    const booking = await BuyerBooking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.sellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can update this booking',
      });
    }

    // Update booking
    booking.status = status;
    if (sellerNotes) {
      booking.sellerNotes = sellerNotes;
    }

    await booking.save();

    console.log('✅ Booking status updated:', id, '→', status);

    res.status(200).json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      data: booking,
    });
  } catch (err) {
    console.error('❌ Error updating booking:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
    });
  }
};

/**
 * Cancel booking
 * PUT /api/bookings/:id/cancel
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { buyerNotes } = req.body;

    const booking = await BuyerBooking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization: only buyer can cancel
    if (booking.buyerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can cancel this booking',
      });
    }

    // Cannot cancel if already completed
    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking',
      });
    }

    booking.status = 'Cancelled';
    if (buyerNotes) {
      booking.buyerNotes = buyerNotes;
    }

    await booking.save();

    console.log('✅ Booking cancelled:', id);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (err) {
    console.error('❌ Error cancelling booking:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
    });
  }
};
