/**
 * Admin Controller
 * Handles admin operations for Admin1 and Admin2 roles
 * Admin1: Full access - all users, vehicles, breakdowns, reports
 * Admin2: User verification - unverified/flagged users approval
 */

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Breakdown = require('../models/Breakdown');
const TestDrive = require('../models/TestDrive');
const { paginate, formatPaginationResponse } = require('../utils/helpers');

// ==================== ADMIN1 ROUTES ====================

/**
 * @desc    Get all users with filters
 * @route   GET /api/admin/users
 * @query   role, search, isActive, verificationStatus, startDate, endDate, page, limit
 * @access  Private (Admin1)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, search, isActive, verificationStatus, startDate, endDate, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    // Verification status filter
    if (verificationStatus === 'verified') {
      filter.isEmailVerified = true;
      filter.isIDVerified = true;
      filter.isFaceVerified = true;
    } else if (verificationStatus === 'partial') {
      filter.$or = [
        { isEmailVerified: true, isIDVerified: false },
        { isEmailVerified: true, isFaceVerified: false },
        { isIDVerified: true, isFaceVerified: false }
      ];
    } else if (verificationStatus === 'unverified') {
      filter.isEmailVerified = false;
      filter.isIDVerified = false;
      filter.isFaceVerified = false;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -emailOTP -faceVerification.faceDescriptor')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(users, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * @desc    Get all vehicles with filters
 * @route   GET /api/admin/vehicles
 * @query   status, search, startDate, endDate, minPrice, maxPrice, page, limit
 * @access  Private (Admin1)
 */
const getAllVehicles = async (req, res) => {
  try {
    const { status, search, startDate, endDate, minPrice, maxPrice, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = {};
    if (status) filter.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') }
      ];
    }
    
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('sellerId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Vehicle.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(vehicles, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get all vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles',
      error: error.message
    });
  }
};

/**
 * @desc    Get all breakdown requests with filters
 * @route   GET /api/admin/breakdowns
 * @query   status, startDate, endDate, page, limit
 * @access  Private (Admin1)
 */
const getAllBreakdowns = async (req, res) => {
  try {
    const { status, startDate, endDate, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = {};
    if (status) filter.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const [breakdowns, total] = await Promise.all([
      Breakdown.find(filter)
        .populate('userId', 'firstName lastName email phone')
        .populate('repairmanId', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Breakdown.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(breakdowns, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get all breakdowns error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breakdowns',
      error: error.message
    });
  }
};

/**
 * @desc    Get all test drives
 * @route   GET /api/admin/test-drives
 * @access  Private (Admin1)
 */
const getAllTestDrives = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = {};
    if (status) filter.status = status;
    
    const [testDrives, total] = await Promise.all([
      TestDrive.find(filter)
        .populate('vehicleId', 'brand model year')
        .populate('buyerId', 'firstName lastName email')
        .populate('sellerId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      TestDrive.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(testDrives, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get all test drives error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test drives',
      error: error.message
    });
  }
};

/**
 * @desc    Generate dashboard statistics/reports
 * @route   GET /api/admin/reports
 * @access  Private (Admin1)
 */
const generateReports = async (req, res) => {
  try {
    const [
      totalUsers,
      usersByRole,
      verifiedUsers,
      totalVehicles,
      vehiclesByStatus,
      totalBreakdowns,
      breakdownsByStatus,
      totalTestDrives,
      testDrivesByStatus,
      recentUsers,
      recentVehicles
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.countDocuments({ 
        isEmailVerified: true, 
        isIDVerified: true, 
        isFaceVerified: true 
      }),
      Vehicle.countDocuments(),
      Vehicle.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Breakdown.countDocuments(),
      Breakdown.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      TestDrive.countDocuments(),
      TestDrive.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role createdAt'),
      Vehicle.find().sort({ createdAt: -1 }).limit(5).select('brand model year price status createdAt')
    ]);
    
    // Format aggregation results
    const formatAggregation = (arr) => {
      return arr.reduce((acc, item) => {
        acc[item._id || 'unknown'] = item.count;
        return acc;
      }, {});
    };
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          byRole: formatAggregation(usersByRole),
          fullyVerified: verifiedUsers
        },
        vehicles: {
          total: totalVehicles,
          byStatus: formatAggregation(vehiclesByStatus)
        },
        breakdowns: {
          total: totalBreakdowns,
          byStatus: formatAggregation(breakdownsByStatus)
        },
        testDrives: {
          total: totalTestDrives,
          byStatus: formatAggregation(testDrivesByStatus)
        },
        recent: {
          users: recentUsers,
          vehicles: recentVehicles
        }
      }
    });
  } catch (error) {
    console.error('Generate reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating reports',
      error: error.message
    });
  }
};

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (Admin1)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin1)
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deleting other admins
    if (['admin1', 'admin2'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    // Also delete user's vehicles
    await Vehicle.deleteMany({ sellerId: req.params.id });
    
    res.json({
      success: true,
      message: 'User and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// ==================== ADMIN2 ROUTES ====================

/**
 * @desc    Get unverified users with filters
 * @route   GET /api/admin/unverified-users
 * @query   verificationType, role, startDate, endDate, page, limit
 * @access  Private (Admin2)
 */
const getUnverifiedUsers = async (req, res) => {
  try {
    const { page, limit, verificationType, role, startDate, endDate } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = {
      $or: [
        { isEmailVerified: false },
        { isIDVerified: false },
        { isFaceVerified: false }
      ]
    };
    
    if (verificationType === 'email') {
      filter.$or = [{ isEmailVerified: false }];
    } else if (verificationType === 'id') {
      filter.$or = [{ isIDVerified: false }];
    } else if (verificationType === 'face') {
      filter.$or = [{ isFaceVerified: false }];
    }
    
    // Role filter
    if (role) filter.role = role;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -faceVerification.faceDescriptor')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(users, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get unverified users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unverified users',
      error: error.message
    });
  }
};

/**
 * @desc    Get flagged users
 * @route   GET /api/admin/flagged-users
 * @access  Private (Admin2)
 */
const getFlaggedUsers = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = { isFlagged: true };
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -faceVerification.faceDescriptor')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(users, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get flagged users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flagged users',
      error: error.message
    });
  }
};

/**
 * @desc    Manually verify user
 * @route   PUT /api/admin/users/:id/verify
 * @access  Private (Admin2)
 */
const manuallyVerifyUser = async (req, res) => {
  try {
    const { isEmailVerified, isIDVerified, isFaceVerified } = req.body;
    
    const updates = {};
    if (isEmailVerified !== undefined) updates.isEmailVerified = isEmailVerified;
    if (isIDVerified !== undefined) updates.isIDVerified = isIDVerified;
    if (isFaceVerified !== undefined) updates.isFaceVerified = isFaceVerified;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User verification status updated',
      data: user
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user',
      error: error.message
    });
  }
};

/**
 * @desc    Flag/unflag user
 * @route   PUT /api/admin/users/:id/flag
 * @access  Private (Admin2)
 */
const flagUser = async (req, res) => {
  try {
    const { isFlagged, flagReason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isFlagged, 
        flagReason: isFlagged ? flagReason : null 
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: isFlagged ? 'User flagged' : 'User unflagged',
      data: user
    });
  } catch (error) {
    console.error('Flag user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error flagging user',
      error: error.message
    });
  }
};

/**
 * @desc    Get user details for verification review
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin1, Admin2)
 */
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's vehicles if seller
    let vehicles = [];
    if (user.role === 'seller') {
      vehicles = await Vehicle.find({ sellerId: user._id }).limit(10);
    }
    
    // Get user's breakdowns if repairman
    let breakdowns = [];
    if (user.role === 'repairman') {
      breakdowns = await Breakdown.find({ repairmanId: user._id })
        .sort({ createdAt: -1 })
        .limit(10);
    }
    
    res.json({
      success: true,
      data: {
        user,
        vehicles,
        breakdowns
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

/**
 * @desc    Approve user verification (sets all verification flags to true)
 * @route   PUT /api/admin/users/:id/approve
 * @access  Private (Admin2)
 */
const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isEmailVerified: true,
        isIDVerified: true,
        isFaceVerified: true,
        isFlagged: false,
        flagReason: null
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User approved and fully verified',
      data: user
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving user',
      error: error.message
    });
  }
};

/**
 * @desc    Reject user (flags user and deactivates account)
 * @route   PUT /api/admin/users/:id/reject
 * @access  Private (Admin2)
 */
const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isFlagged: true,
        flagReason: reason || 'Rejected by admin',
        isActive: false
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User rejected and flagged',
      data: user
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting user',
      error: error.message
    });
  }
};

/**
 * @desc    Get dashboard summary for Admin1
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin1)
 */
const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      totalVehicles,
      activeVehicles,
      soldVehicles,
      totalBreakdowns,
      pendingBreakdowns,
      completedBreakdowns,
      totalTestDrives,
      pendingTestDrives,
      unverifiedUsers,
      flaggedUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: lastWeek } }),
      User.countDocuments({ createdAt: { $gte: lastMonth } }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'active' }),
      Vehicle.countDocuments({ status: 'sold' }),
      Breakdown.countDocuments(),
      Breakdown.countDocuments({ status: 'pending' }),
      Breakdown.countDocuments({ status: 'completed' }),
      TestDrive.countDocuments(),
      TestDrive.countDocuments({ status: 'pending' }),
      User.countDocuments({
        $or: [
          { isEmailVerified: false },
          { isIDVerified: false },
          { isFaceVerified: false }
        ]
      }),
      User.countDocuments({ isFlagged: true })
    ]);
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
          unverified: unverifiedUsers,
          flagged: flaggedUsers
        },
        vehicles: {
          total: totalVehicles,
          active: activeVehicles,
          sold: soldVehicles
        },
        breakdowns: {
          total: totalBreakdowns,
          pending: pendingBreakdowns,
          completed: completedBreakdowns
        },
        testDrives: {
          total: totalTestDrives,
          pending: pendingTestDrives
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// ==================== ADMIN VEHICLE MANAGEMENT ====================

/**
 * @desc    Create a new vehicle listing (Admin)
 * @route   POST /api/admin/vehicles
 * @access  Private (Admin1)
 */
const createVehicle = async (req, res) => {
  try {
    const {
      brand, model, year, mileage, price, fuelType, transmission,
      bodyType, color, engineSize, doors, seats, condition,
      description, features, vin, location, sellerId
    } = req.body;
    
    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path);
    }
    
    // Parse features if it's a string
    let parsedFeatures = features;
    if (typeof features === 'string') {
      try {
        parsedFeatures = JSON.parse(features);
      } catch {
        parsedFeatures = features.split(',').map(f => f.trim());
      }
    }
    
    // Parse location if it's a string
    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        parsedLocation = undefined;
      }
    }
    
    // Use provided sellerId or default to admin's ID
    const vehicleSellerId = sellerId || req.user._id;
    
    // Create vehicle
    const vehicle = await Vehicle.create({
      sellerId: vehicleSellerId,
      brand,
      model,
      year: Number(year),
      mileage: Number(mileage),
      price: Number(price),
      fuelType,
      transmission,
      bodyType,
      color,
      engineSize,
      doors: doors ? Number(doors) : undefined,
      seats: seats ? Number(seats) : undefined,
      condition,
      description,
      features: parsedFeatures,
      images,
      vin,
      location: parsedLocation,
      status: 'available'
    });
    
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully by admin',
      data: vehicle
    });
  } catch (error) {
    console.error('Admin create vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Update a vehicle listing (Admin)
 * @route   PUT /api/admin/vehicles/:id
 * @access  Private (Admin1)
 */
const updateVehicle = async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      req.body.images = [...(vehicle.images || []), ...newImages];
    }
    
    // Parse features if needed
    if (req.body.features && typeof req.body.features === 'string') {
      try {
        req.body.features = JSON.parse(req.body.features);
      } catch {
        req.body.features = req.body.features.split(',').map(f => f.trim());
      }
    }
    
    // Parse location if needed
    if (req.body.location && typeof req.body.location === 'string') {
      req.body.location = JSON.parse(req.body.location);
    }
    
    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Admin update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a vehicle listing (Admin)
 * @route   DELETE /api/admin/vehicles/:id
 * @access  Private (Admin1)
 */
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    await Vehicle.findByIdAndDelete(req.params.id);
    
    // Also delete associated test drives
    await TestDrive.deleteMany({ vehicleId: req.params.id });
    
    res.json({
      success: true,
      message: 'Vehicle and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle',
      error: error.message
    });
  }
};

module.exports = {
  // Admin1 routes
  getAllUsers,
  getAllVehicles,
  getAllBreakdowns,
  getAllTestDrives,
  generateReports,
  updateUserStatus,
  deleteUser,
  getDashboard,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  // Admin2 routes
  getUnverifiedUsers,
  getFlaggedUsers,
  manuallyVerifyUser,
  flagUser,
  approveUser,
  rejectUser,
  // Shared routes
  getUserDetails
};
