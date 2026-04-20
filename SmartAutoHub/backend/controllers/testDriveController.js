/**
 * Test Drive Controller
 * Handles scheduling and managing test drives using legacy and slot-booking models.
 */

const TestDrive = require('../models/TestDrive');
const BuyerBooking = require('../models/BuyerBooking');
const Vehicle = require('../models/Vehicle');
const { paginate, formatPaginationResponse } = require('../utils/helpers');
const {
  sendTestDriveNotification,
  sendTestDriveApprovedEmail,
  sendTestDriveRejectedEmail
} = require('../utils/email');

/**
 * @desc    Schedule a no-slot test drive request
 * @route   POST /api/test-drives
 * @access  Private
 */
const scheduleTestDrive = async (req, res) => {
  try {
    const {
      vehicleId,
      date,
      time,
      preferredDate,
      buyerNotes,
      location,
      contactPreference,
      duration
    } = req.body;

    const vehicle = await Vehicle.findById(vehicleId).populate('sellerId', 'email firstName lastName phone');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.sellerId._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot schedule a test drive for your own vehicle'
      });
    }

    const existingTestDrive = await TestDrive.findOne({
      vehicleId,
      buyerId: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingTestDrive) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or approved test drive for this vehicle'
      });
    }

    if (!preferredDate) {
      return res.status(400).json({
        success: false,
        message: 'Preferred date is required'
      });
    }

    const parsedPreferredDate = new Date(preferredDate);

    if (Number.isNaN(parsedPreferredDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferred date'
      });
    }

    const preferredDateOnly = new Date(parsedPreferredDate);
    preferredDateOnly.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preferredDateOnly < today) {
      return res.status(400).json({
        success: false,
        message: 'Preferred date must be today or in the future'
      });
    }

    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;

    const testDrive = await TestDrive.create({
      vehicleId,
      buyerId: req.user._id,
      sellerId: vehicle.sellerId._id,
      date: new Date(date),
      time,
      preferredDate: parsedPreferredDate,
      duration: duration || 30,
      location: parsedLocation,
      buyerNotes,
      contactPreference: contactPreference || 'email'
    });

    const vehicleName = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`;
    const buyerName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Buyer';

    await sendTestDriveNotification(
      vehicle.sellerId.email,
      vehicle.sellerId.firstName || 'Seller',
      buyerName,
      vehicleName,
      new Date(date).toLocaleDateString(),
      time
    );

    return res.status(201).json({
      success: true,
      message: 'Test drive scheduled successfully. Waiting for seller approval.',
      data: testDrive
    });
  } catch (error) {
    console.error('Schedule test drive error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error scheduling test drive',
      error: error.message
    });
  }
};

/**
 * @desc    Get test drives for current buyer
 * @route   GET /api/test-drives/my-requests
 * @access  Private
 */
const getMyTestDriveRequests = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    const filter = { buyerId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const [testDrives, total] = await Promise.all([
      BuyerBooking.find(filter)
        .populate('vehicleId', 'name brand model year image images price')
        .populate('sellerId', 'firstName lastName phone email')
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limitNum),
      BuyerBooking.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      ...formatPaginationResponse(testDrives, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get my test drive requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching test drive requests',
      error: error.message
    });
  }
};

/**
 * @desc    Get test drives for current seller's vehicles
 * @route   GET /api/test-drives/my-vehicles
 * @access  Private
 */
const getTestDrivesForMyVehicles = async (req, res) => {
  try {
    const { status, vehicleId, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    const filter = { sellerId: req.user._id };

    if (status === 'active') {
      filter.status = { $in: ['Pending', 'Accepted', 'pending', 'approved'] };
    } else if (status === 'history') {
      filter.status = { $in: ['Rejected', 'Cancelled', 'Completed', 'rejected', 'cancelled', 'completed'] };
    } else if (status) {
      filter.status = status;
    }

    if (vehicleId) {
      filter.vehicleId = vehicleId;
    }

    const [testDrives, total] = await Promise.all([
      BuyerBooking.find(filter)
        .populate('vehicleId', 'name brand model year image images price')
        .populate('buyerId', 'firstName lastName phone email profileImage isFullyVerified')
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(limitNum),
      BuyerBooking.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      ...formatPaginationResponse(testDrives, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get test drives for my vehicles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching test drives',
      error: error.message
    });
  }
};

/**
 * @desc    Update test drive status
 * @route   PUT /api/test-drives/:id/status
 * @access  Private
 */
const updateTestDriveStatus = async (req, res) => {
  try {
    const { status, sellerNotes } = req.body;

    const normalizedInput = String(status || '').trim();
    let normalizedStatus = normalizedInput
      ? normalizedInput.charAt(0).toUpperCase() + normalizedInput.slice(1).toLowerCase()
      : '';

    if (normalizedStatus === 'Approved') {
      normalizedStatus = 'Accepted';
    }

    const allowedStatuses = ['Accepted', 'Rejected', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await BuyerBooking.findById(req.params.id)
      .populate('buyerId', 'firstName lastName email phone')
      .populate('vehicleId', 'brand model year')
      .populate('sellerId', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Test drive not found'
      });
    }

    const userId = req.user._id.toString();
    const sellerRef = booking.sellerId?._id || booking.sellerId;
    const buyerRef = booking.buyerId?._id || booking.buyerId;
    const isSeller = sellerRef.toString() === userId;
    const isBuyer = buyerRef.toString() === userId;

    if (!isSeller && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this test drive'
      });
    }

    if (['Accepted', 'Rejected', 'Completed'].includes(normalizedStatus) && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can perform this action'
      });
    }

    const previousStatus = booking.status;
    booking.status = normalizedStatus;

    if (sellerNotes !== undefined) {
      booking.sellerNotes = sellerNotes;
    }

    await booking.save();

    const buyerEmail = booking.buyerId?.email || booking.buyerInfo?.email;
    const buyerFirstName = booking.buyerId?.firstName || booking.buyerInfo?.fullName || 'Buyer';
    const sellerName = `${booking.sellerId?.firstName || ''} ${booking.sellerId?.lastName || ''}`.trim() || 'Seller';
    const sellerPhone = booking.sellerId?.phone || 'N/A';
    const vehicleName = `${booking.vehicleId?.year || ''} ${booking.vehicleId?.brand || ''} ${booking.vehicleId?.model || ''}`
      .trim()
      .replace(/\s+/g, ' ');
    const details = {
      date: booking.scheduledDate
        ? new Date(booking.scheduledDate).toLocaleDateString()
        : booking.date
          ? new Date(booking.date).toLocaleDateString()
          : 'N/A',
      time: booking.scheduledTime || booking.time || 'N/A',
      sellerName,
      sellerPhone
    };

    if (buyerEmail && normalizedStatus === 'Accepted' && previousStatus !== 'Accepted') {
      await sendTestDriveApprovedEmail(
        buyerEmail,
        buyerFirstName,
        vehicleName,
        details
      );
    }

    if (
      buyerEmail &&
      (normalizedStatus === 'Rejected' || normalizedStatus === 'Cancelled') &&
      !['Rejected', 'Cancelled'].includes(previousStatus)
    ) {
      await sendTestDriveRejectedEmail(
        buyerEmail,
        buyerFirstName,
        vehicleName,
        details
      );
    }

    return res.json({
      success: true,
      message: `Test drive ${normalizedStatus}`,
      data: booking
    });
  } catch (error) {
    console.error('Update test drive status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating test drive status',
      error: error.message
    });
  }
};

/**
 * @desc    Get single test drive
 * @route   GET /api/test-drives/:id
 * @access  Private
 */
const getTestDriveById = async (req, res) => {
  try {
    const testDrive = await TestDrive.findById(req.params.id)
      .populate('vehicleId', 'brand model year price images location')
      .populate('sellerId', 'firstName lastName phone email profileImage')
      .populate('buyerId', 'firstName lastName phone email profileImage');

    if (!testDrive) {
      return res.status(404).json({
        success: false,
        message: 'Test drive not found'
      });
    }

    const isSeller = testDrive.sellerId._id.toString() === req.user._id.toString();
    const isBuyer = testDrive.buyerId._id.toString() === req.user._id.toString();
    const isAdmin = ['admin1', 'admin2'].includes(req.user.role);

    if (!isSeller && !isBuyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this test drive'
      });
    }

    return res.json({
      success: true,
      data: testDrive
    });
  } catch (error) {
    console.error('Get test drive error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching test drive',
      error: error.message
    });
  }
};

/**
 * @desc    Delete/cancel a test drive
 * @route   DELETE /api/test-drives/:id
 * @access  Private
 */
const deleteTestDrive = async (req, res) => {
  try {
    const booking = await BuyerBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Test drive not found'
      });
    }

    const isBuyer = booking.buyerId.toString() === req.user._id.toString();
    const isAdmin = ['admin1', 'admin2'].includes(req.user.role);

    if (!isBuyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this test drive'
      });
    }

    if ((booking.status || '').toLowerCase() !== 'pending' && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending test drives'
      });
    }

    await BuyerBooking.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Test drive deleted successfully'
    });
  } catch (error) {
    console.error('Delete test drive error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting test drive',
      error: error.message
    });
  }
};

module.exports = {
  scheduleTestDrive,
  getMyTestDriveRequests,
  getTestDrivesForMyVehicles,
  updateTestDriveStatus,
  getTestDriveById,
  deleteTestDrive
};
