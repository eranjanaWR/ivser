/**
 * Test Drive Controller
 * Handles scheduling and managing test drives
 */

const TestDrive = require('../models/TestDrive');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { paginate, formatPaginationResponse } = require('../utils/helpers');
const { sendTestDriveNotification, sendTestDriveApprovedEmail, sendTestDriveRejectedEmail } = require('../utils/email');

/**
 * @desc    Schedule a test drive
 * @route   POST /api/test-drives
 * @access  Private (Verified Buyers)
 */
const scheduleTestDrive = async (req, res) => {
  try {
    const { vehicleId, date, time, preferredDate, buyerNotes, location, contactPreference, duration } = req.body;
    
    // Get vehicle and seller info
    const vehicle = await Vehicle.findById(vehicleId).populate('sellerId', 'email firstName');
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    // Can't schedule test drive for your own vehicle
    if (vehicle.sellerId._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot schedule a test drive for your own vehicle'
      });
    }
    
    // Check for existing pending test drive for same vehicle
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
    
    // Validate preferredDate is provided
    if (!preferredDate) {
      return res.status(400).json({
        success: false,
        message: 'Preferred date is required'
      });
    }

    // Validate preferredDate is not in the past
    const parsedPreferredDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(parsedPreferredDate.getTime()) || parsedPreferredDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Preferred date must be today or a future date'
      });
    }

    // Create test drive
    const testDrive = await TestDrive.create({
      vehicleId,
      buyerId: req.user._id,
      sellerId: vehicle.sellerId._id,
      date: new Date(date),
      time,
      preferredDate: parsedPreferredDate,
      duration: duration || 30,
      location: location ? JSON.parse(location) : undefined,
      buyerNotes,
      contactPreference: contactPreference || 'email'
    });
    
    // ===== INITIAL BOOKING NOTIFICATION EMAIL =====
    // When buyer successfully books a test drive, we send a notification email to the SELLER
    // The seller needs to know about the new booking request so they can approve or reject it
    
    // Step 1: Create full vehicle name for the email
    const vehicleName = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`;
    
    // Step 2: Create full buyer name who made the booking request
    const buyerName = `${req.user.firstName} ${req.user.lastName}`;
    
    // Step 3: Send the notification email to seller with all booking details
    // Parameters:
    // - Seller's email (WHERE email is sent)
    // - Seller's first name (for personalization)
    // - Buyer's full name (WHO is booking)
    // - Full vehicle name (WHAT vehicle is booked for)
    // - Formatted date (WHEN the test drive is requested)
    // - Time slot (WHAT TIME the buyer wants)
    await sendTestDriveNotification(
      vehicle.sellerId.email,                    // Send to seller's email
      vehicle.sellerId.firstName,                // Personalize with seller's name
      buyerName,                                 // Tell seller who the buyer is
      vehicleName,                               // Tell seller which vehicle
      new Date(date).toLocaleDateString(),       // Tell seller the requested date
      time                                       // Tell seller the requested time
    );
    
    res.status(201).json({
      success: true,
      message: 'Test drive scheduled successfully. Waiting for seller approval.',
      data: testDrive
    });
  } catch (error) {
    console.error('Schedule test drive error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling test drive',
      error: error.message
    });
  }
};

/**
 * @desc    Get test drives for buyer
 * @route   GET /api/test-drives/my-requests
 * @access  Private
 */
const getMyTestDriveRequests = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = { buyerId: req.user._id };
    if (status) filter.status = status;
    
    const BuyerBooking = require('../models/BuyerBooking');
    const [testDrives, total] = await Promise.all([
      BuyerBooking.find(filter)
        .populate('vehicleId', 'brand model year price images')
        .populate('sellerId', 'firstName lastName phone email')
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limitNum),
      BuyerBooking.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(testDrives, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get my test drive requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test drive requests',
      error: error.message
    });
  }
};

/**
 * @desc    Get test drives for seller
 * @route   GET /api/test-drives/my-vehicles
 * @access  Private (Sellers)
 */
const getTestDrivesForMyVehicles = async (req, res) => {
  try {
    const { status, vehicleId, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = { sellerId: req.user._id };
    
    // Handle status aliases (BuyerBooking uses capitalized statuses: 'Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled')
    if (status === 'active') {
      filter.status = { $in: ['Pending', 'Accepted', 'pending', 'approved'] };
    } else if (status === 'history') {
      filter.status = { $in: ['Rejected', 'Cancelled', 'Completed', 'rejected', 'cancelled', 'completed'] };
    } else if (status) {
      filter.status = status;
    }
    
    if (vehicleId) filter.vehicleId = vehicleId;
    
    const BuyerBooking = require('../models/BuyerBooking');
    const [testDrives, total] = await Promise.all([
      BuyerBooking.find(filter)
        .populate('vehicleId', 'brand model year price images')
        .populate('buyerId', 'firstName lastName phone email profileImage isFullyVerified')
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(limitNum),
      BuyerBooking.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(testDrives, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get test drives for my vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test drives',
      error: error.message
    });
  }
};

/**
 * @desc    Update test drive status (approve/reject)
 * @route   PUT /api/test-drives/:id/status
 * @access  Private (Seller only)
 */
const updateTestDriveStatus = async (req, res) => {
  try {
    const { status, sellerNotes } = req.body;
    
    // Accept lowercase or capitalized statuses, but normalize them to the BuyerBooking enum
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    // Map 'Approved' to 'Accepted'
    const finalStatus = normalizedStatus === 'Approved' ? 'Accepted' : normalizedStatus;

    const allowedStatuses = ['Accepted', 'Rejected', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Accepted, Rejected, Completed, or Cancelled.'
      });
    }
    
    const BuyerBooking = require('../models/BuyerBooking');
    let testDrive = await BuyerBooking.findById(req.params.id)
      .populate('buyerId', 'firstName lastName email')
      .populate('vehicleId', 'brand model year')
      .populate('sellerId', 'firstName lastName phone');
    
    if (!testDrive) {
      return res.status(404).json({
        success: false,
        message: 'Test drive not found'
      });
    }
    
    // Check authorization (seller can approve/reject, buyer can cancel)
    const isSeller = testDrive.sellerId._id.toString() === req.user._id.toString();
    const isBuyer = testDrive.buyerId._id.toString() === req.user._id.toString();
    
    if (!isSeller && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this test drive'
      });
    }
    
    // Only seller can approve/reject/complete
    if (['Accepted', 'Rejected', 'Completed'].includes(finalStatus) && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can perform this action'
      });
    }
    
    // Update test drive
    const previousStatus = testDrive.status;
    testDrive.status = finalStatus;
    if (sellerNotes) testDrive.sellerNotes = sellerNotes;
    
    await testDrive.save();
    
    // ========== EMAIL NOTIFICATION SECTION ==========
    
    if (finalStatus === 'Accepted' && previousStatus !== 'Accepted') {
      const vehicleName = `${testDrive.vehicleId.year} ${testDrive.vehicleId.brand} ${testDrive.vehicleId.model}`;
      
      const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      await sendTestDriveApprovedEmail(
        testDrive.buyerId.email,
        testDrive.buyerId.firstName,
        vehicleName,
        {
          date: formatDate(testDrive.scheduledDate),
          time: testDrive.scheduledTime,
          sellerName: `${testDrive.sellerId.firstName} ${testDrive.sellerId.lastName}`,
          sellerPhone: testDrive.sellerId.phone
        }
      );
      
      console.log('✅ Approval email sent to buyer:', testDrive.buyerId.email);
      
    } else if ((finalStatus === 'Rejected' || finalStatus === 'Cancelled') && previousStatus !== 'Rejected' && previousStatus !== 'Cancelled') {
      const vehicleName = `${testDrive.vehicleId.year} ${testDrive.vehicleId.brand} ${testDrive.vehicleId.model}`;
      
      const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      await sendTestDriveRejectedEmail(
        testDrive.buyerId.email,
        testDrive.buyerId.firstName,
        vehicleName,
        {
          date: formatDate(testDrive.scheduledDate),
          time: testDrive.scheduledTime,
          sellerName: `${testDrive.sellerId.firstName} ${testDrive.sellerId.lastName}`
        }
      );
      
      console.log('❌ Rejection/Cancellation email sent to buyer:', testDrive.buyerId.email);
    }
    
    res.json({
      success: true,
      message: `Test drive ${finalStatus.toLowerCase()}`,
      data: testDrive
    });
  } catch (error) {
    console.error('Update test drive status error:', error);
    res.status(500).json({
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
    
    // Check authorization
    const isSeller = testDrive.sellerId._id.toString() === req.user._id.toString();
    const isBuyer = testDrive.buyerId._id.toString() === req.user._id.toString();
    const isAdmin = ['admin1', 'admin2'].includes(req.user.role);
    
    if (!isSeller && !isBuyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this test drive'
      });
    }
    
    res.json({
      success: true,
      data: testDrive
    });
  } catch (error) {
    console.error('Get test drive error:', error);
    res.status(500).json({
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
    const BuyerBooking = require('../models/BuyerBooking');
    const testDrive = await BuyerBooking.findById(req.params.id);
    
    if (!testDrive) {
      return res.status(404).json({
        success: false,
        message: 'Test drive not found'
      });
    }
    
    // Check authorization
    const isBuyer = testDrive.buyerId.toString() === req.user._id.toString();
    const isAdmin = ['admin1', 'admin2'].includes(req.user.role);
    
    if (!isBuyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this test drive'
      });
    }
    
    // Only allow deletion if status is pending
    if (testDrive.status.toLowerCase() !== 'pending' && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending test drives'
      });
    }
    
    await BuyerBooking.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Test drive deleted successfully'
    });
  } catch (error) {
    console.error('Delete test drive error:', error);
    res.status(500).json({
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
