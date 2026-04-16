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
    const { vehicleId, date, time, buyerNotes, location, contactPreference, duration } = req.body;
    
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
    
    // Create test drive
    const testDrive = await TestDrive.create({
      vehicleId,
      buyerId: req.user._id,
      sellerId: vehicle.sellerId._id,
      date: new Date(date),
      time,
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
    
    const [testDrives, total] = await Promise.all([
      TestDrive.find(filter)
        .populate('vehicleId', 'brand model year price images')
        .populate('sellerId', 'firstName lastName phone email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      TestDrive.countDocuments(filter)
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
    
    // Handle status aliases
    if (status === 'active') {
      // Active requests: pending or approved (not completed/rejected/cancelled)
      filter.status = { $in: ['pending', 'approved'] };
    } else if (status === 'history') {
      // History: rejected, cancelled, or completed
      filter.status = { $in: ['rejected', 'cancelled', 'completed'] };
    } else if (status) {
      // Specific status
      filter.status = status;
    }
    
    if (vehicleId) filter.vehicleId = vehicleId;
    
    const [testDrives, total] = await Promise.all([
      TestDrive.find(filter)
        .populate('vehicleId', 'brand model year price images')
        .populate('buyerId', 'firstName lastName phone email profileImage isFullyVerified')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limitNum),
      TestDrive.countDocuments(filter)
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
    
    const allowedStatuses = ['approved', 'rejected', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    let testDrive = await TestDrive.findById(req.params.id)
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
    if (['approved', 'rejected', 'completed'].includes(status) && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can perform this action'
      });
    }
    
    // Update test drive
    const previousStatus = testDrive.status;
    testDrive.status = status;
    if (sellerNotes) testDrive.sellerNotes = sellerNotes;
    testDrive.respondedAt = new Date();
    if (status === 'completed') testDrive.completedAt = new Date();
    
    await testDrive.save();
    
    // ========== EMAIL NOTIFICATION SECTION ==========
    // Send email notifications to buyer based on the booking status change
    // This section handles three types of emails:
    // 1. APPROVAL EMAIL - When seller approves the test drive request (status = 'approved')
    // 2. REJECTION/CANCELLATION EMAIL - When seller rejects or cancels the test drive request
    
    if (status === 'approved' && previousStatus !== 'approved') {
      // ===== APPROVAL EMAIL BLOCK =====
      // Condition: Only send approval email if new status is 'approved' AND previous status was NOT 'approved'
      // (This prevents duplicate emails if status is updated multiple times)
      
      // Step 1: Create full vehicle name by combining year, brand, and model
      // Example: "2023 Honda Civic" or "2020 Toyota Camry"
      const vehicleName = `${testDrive.vehicleId.year} ${testDrive.vehicleId.brand} ${testDrive.vehicleId.model}`;
      
      // Step 2: Format the test drive date into a readable format
      // Example: "Monday, January 15, 2024" instead of "2024-01-15"
      const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Step 3: Call the email function to send approval email
      // Parameters being passed:
      // - Buyer's email address
      // - Buyer's first name (personalization)
      // - Full vehicle name with year, brand, model
      // - Object containing test drive details: formatted date, time, seller's name and phone
      await sendTestDriveApprovedEmail(
        testDrive.buyerId.email,          // WHERE to send email (buyer's email)
        testDrive.buyerId.firstName,      // WHO to greet (buyer's name)
        vehicleName,                      // WHAT vehicle (full name)
        {
          date: formatDate(testDrive.date),                                          // WHEN scheduled
          time: testDrive.time,                                                      // WHAT TIME
          sellerName: `${testDrive.sellerId.firstName} ${testDrive.sellerId.lastName}`, // WHO is seller
          sellerPhone: testDrive.sellerId.phone                                       // HOW to contact seller
        }
      );
      
      // Log successful email send for debugging
      console.log('✅ Approval email sent to buyer:', testDrive.buyerId.email);
      
    } else if ((status === 'rejected' || status === 'cancelled') && previousStatus !== 'rejected' && previousStatus !== 'cancelled') {
      // ===== REJECTION/CANCELLATION EMAIL BLOCK =====
      // Condition: Send rejection email if status changed to 'rejected' OR 'cancelled'
      // AND it wasn't already in rejected/cancelled status (prevents duplicate emails)
      
      // Step 1: Create full vehicle name (same as approval)
      const vehicleName = `${testDrive.vehicleId.year} ${testDrive.vehicleId.brand} ${testDrive.vehicleId.model}`;
      
      // Step 2: Format the test drive date into readable format
      const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Step 3: Call the email function to send rejection/cancellation email
      // Parameters being passed (similar to approval but fewer details):
      // - Buyer's email address
      // - Buyer's first name
      // - Full vehicle name
      // - Object containing test drive date, time, and seller's name (phone not needed for rejection)
      await sendTestDriveRejectedEmail(
        testDrive.buyerId.email,          // WHERE to send email (buyer's email)
        testDrive.buyerId.firstName,      // WHO to greet (buyer's name)
        vehicleName,                      // WHAT vehicle (full name)
        {
          date: formatDate(testDrive.date),                                          // WHEN it was scheduled
          time: testDrive.time,                                                      // WHAT TIME it was
          sellerName: `${testDrive.sellerId.firstName} ${testDrive.sellerId.lastName}` // WHO rejected it (seller)
        }
      );
      
      // Log successful email send for debugging
      console.log('❌ Rejection/Cancellation email sent to buyer:', testDrive.buyerId.email);
    }
    // ========== END EMAIL NOTIFICATION SECTION ==========
    
    res.json({
      success: true,
      message: `Test drive ${status}`,
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
    const testDrive = await TestDrive.findById(req.params.id);
    
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
    if (testDrive.status !== 'pending' && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending test drives'
      });
    }
    
    await TestDrive.findByIdAndDelete(req.params.id);
    
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
