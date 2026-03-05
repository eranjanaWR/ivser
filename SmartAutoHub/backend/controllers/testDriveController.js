/**
 * Test Drive Controller
 * Handles scheduling and managing test drives
 */

const TestDrive = require('../models/TestDrive');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { paginate, formatPaginationResponse } = require('../utils/helpers');
const { sendTestDriveNotification } = require('../utils/email');

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
    
    if (vehicle.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for test drives'
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
    
    // Send notification to seller
    const vehicleName = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`;
    const buyerName = `${req.user.firstName} ${req.user.lastName}`;
    await sendTestDriveNotification(
      vehicle.sellerId.email,
      vehicle.sellerId.firstName,
      buyerName,
      vehicleName,
      new Date(date).toLocaleDateString(),
      time
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
    if (status) filter.status = status;
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
    
    let testDrive = await TestDrive.findById(req.params.id);
    
    if (!testDrive) {
      return res.status(404).json({
        success: false,
        message: 'Test drive not found'
      });
    }
    
    // Check authorization (seller can approve/reject, buyer can cancel)
    const isSeller = testDrive.sellerId.toString() === req.user._id.toString();
    const isBuyer = testDrive.buyerId.toString() === req.user._id.toString();
    
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
    testDrive.status = status;
    if (sellerNotes) testDrive.sellerNotes = sellerNotes;
    testDrive.respondedAt = new Date();
    if (status === 'completed') testDrive.completedAt = new Date();
    
    await testDrive.save();
    
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
