/**
 * Breakdown Controller
 * Handles breakdown requests and repairman assignments
 * Includes real-time location tracking via Socket.io
 */

const Breakdown = require('../models/Breakdown');
const User = require('../models/User');
const { paginate, formatPaginationResponse, calculateDistance } = require('../utils/helpers');
const { sendBreakdownNotification } = require('../utils/email');
const { calculateRoute, reverseGeocode } = require('../utils/geocoding');

/**
 * @desc    Create a breakdown request
 * @route   POST /api/breakdowns
 * @access  Private (Verified Users)
 */
const createBreakdown = async (req, res) => {
  try {
    const { location, description, category, vehicleDetails, images } = req.body;
    
    // Parse location if it's a string
    let parsedLocation = location;
    if (typeof location === 'string') {
      parsedLocation = JSON.parse(location);
    }
    
    // Parse vehicle details if it's a string
    let parsedVehicleDetails = vehicleDetails;
    if (typeof vehicleDetails === 'string') {
      parsedVehicleDetails = JSON.parse(vehicleDetails);
    }
    
    // Handle image uploads
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = req.files.map(file => file.path);
    }
    
    // Create breakdown
    const breakdown = await Breakdown.create({
      userId: req.user._id,
      location: {
        type: 'Point',
        coordinates: parsedLocation.coordinates,
        address: parsedLocation.address,
        city: parsedLocation.city,
        state: parsedLocation.state
      },
      description,
      category: category || 'other',
      vehicleDetails: parsedVehicleDetails,
      images: uploadedImages
    });
    
    // Find nearby repairmen
    const nearbyRepairmen = await findNearbyRepairmen(
      parsedLocation.coordinates[0], // longitude
      parsedLocation.coordinates[1], // latitude
      20 // radius in km
    );
    
    // Notify nearby repairmen (update breakdown with requests sent)
    const requestsSent = [];
    for (const repairman of nearbyRepairmen.slice(0, 10)) { // Limit to 10 nearest
      requestsSent.push({
        repairmanId: repairman._id,
        sentAt: new Date(),
        response: 'pending'
      });
      
      // Send email notification
      await sendBreakdownNotification(
        repairman.email,
        repairman.firstName,
        parsedLocation.address || 'Location provided',
        description,
        category
      );
    }
    
    breakdown.requestsSent = requestsSent;
    await breakdown.save();
    
    // Emit Socket.io event for new breakdown (if available)
    const io = req.app.get('io');
    if (io) {
      nearbyRepairmen.forEach(repairman => {
        io.to(`repairman_${repairman._id}`).emit('newBreakdownRequest', {
          breakdownId: breakdown._id,
          location: breakdown.location,
          category: breakdown.category,
          description: breakdown.description
        });
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Breakdown request created. Nearby repairmen have been notified.',
      data: {
        breakdown,
        nearbyRepairmenCount: nearbyRepairmen.length
      }
    });
  } catch (error) {
    console.error('Create breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating breakdown request',
      error: error.message
    });
  }
};

/**
 * @desc    Register current user as repairman from breakdown flow
 * @route   POST /api/breakdowns/register-repairman
 * @access  Private
 */
const registerAsRepairman = async (req, res) => {
  try {
    const {
      phone,
      specialization,
      experience,
      serviceRadius,
      latitude,
      longitude
    } = req.body;

    const parsedExperience = Number(experience);
    const parsedServiceRadius = Number(serviceRadius);
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    let parsedSpecialization = [];
    if (Array.isArray(specialization)) {
      parsedSpecialization = specialization
        .map(item => String(item).trim().toLowerCase())
        .filter(Boolean);
    } else if (typeof specialization === 'string') {
      parsedSpecialization = specialization
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
    }

    if (!parsedSpecialization.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one specialization is required'
      });
    }

    if (!Number.isFinite(parsedExperience) || parsedExperience < 0 || parsedExperience > 60) {
      return res.status(400).json({
        success: false,
        message: 'Experience must be between 0 and 60 years'
      });
    }

    if (!Number.isFinite(parsedServiceRadius) || parsedServiceRadius < 1 || parsedServiceRadius > 100) {
      return res.status(400).json({
        success: false,
        message: 'Service radius must be between 1 and 100 km'
      });
    }

    const updates = {
      role: 'repairman',
      'repairmanDetails.specialization': parsedSpecialization,
      'repairmanDetails.experience': parsedExperience,
      'repairmanDetails.serviceRadius': parsedServiceRadius,
      'repairmanDetails.isAvailable': true
    };

    if (phone && String(phone).trim()) {
      updates.phone = String(phone).trim();
    }

    if (Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude)) {
      updates.location = {
        type: 'Point',
        coordinates: [parsedLongitude, parsedLatitude]
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'You are now registered as a repairman',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Register repairman error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering as repairman',
      error: error.message
    });
  }
};

/**
 * Helper function to find nearby repairmen
 */
const findNearbyRepairmen = async (longitude, latitude, radiusKm = 20) => {
  try {
    const repairmen = await User.find({
      role: 'repairman',
      isActive: true,
      'repairmanDetails.isAvailable': true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000 // Convert km to meters
        }
      }
    }).select('firstName lastName email phone location repairmanDetails profileImage');
    
    // Calculate distance for each repairman
    return repairmen.map(repairman => {
      const distance = calculateDistance(
        latitude, longitude,
        repairman.location.coordinates[1],
        repairman.location.coordinates[0]
      );
      return {
        ...repairman.toObject(),
        distance
      };
    });
  } catch (error) {
    console.error('Find nearby repairmen error:', error);
    return [];
  }
};

/**
 * @desc    Get nearby repairmen
 * @route   GET /api/breakdowns/nearby-repairmen
 * @access  Private
 */
const getNearbyRepairmen = async (req, res) => {
  try {
    const { longitude, latitude, radius } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }
    
    const radiusKm = Number(radius) || 20;
    const repairmen = await findNearbyRepairmen(
      Number(longitude),
      Number(latitude),
      radiusKm
    );
    
    res.json({
      success: true,
      data: repairmen
    });
  } catch (error) {
    console.error('Get nearby repairmen error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby repairmen',
      error: error.message
    });
  }
};

/**
 * @desc    Get my breakdown requests (as user)
 * @route   GET /api/breakdowns/my-requests
 * @access  Private
 */
const getMyBreakdowns = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    
    const [breakdowns, total] = await Promise.all([
      Breakdown.find(filter)
        .populate('repairmanId', 'firstName lastName phone profileImage repairmanDetails')
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
    console.error('Get my breakdowns error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breakdown requests',
      error: error.message
    });
  }
};

/**
 * @desc    Get breakdown jobs for repairman
 * @route   GET /api/breakdowns/jobs
 * @access  Private (Repairman)
 */
const getRepairmanJobs = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    let filter = {};
    
    if (status === 'available') {
      // Get available jobs (pending and not yet assigned)
      filter = {
        status: 'pending',
        $or: [
          { repairmanId: { $exists: false } },
          { repairmanId: null }
        ]
      };
    } else if (status) {
      // Get jobs assigned to this repairman (supports multiple status query params)
      const statusList = Array.isArray(status) ? status : [status];
      filter = {
        repairmanId: req.user._id,
        status: statusList.length === 1 ? statusList[0] : { $in: statusList }
      };
    } else {
      // Get all jobs for this repairman (assigned or requested)
      filter = {
        $or: [
          { repairmanId: req.user._id },
          { 'requestsSent.repairmanId': req.user._id, status: 'pending' }
        ]
      };
    }
    
    const [breakdowns, total] = await Promise.all([
      Breakdown.find(filter)
        .populate('userId', 'firstName lastName phone profileImage')
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
    console.error('Get repairman jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

/**
 * @desc    Accept a breakdown job (repairman)
 * @route   POST /api/breakdowns/:id/accept
 * @access  Private (Repairman)
 */
const acceptBreakdown = async (req, res) => {
  try {
    const { estimatedCost, eta } = req.body;
    
    const breakdown = await Breakdown.findById(req.params.id);
    
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        message: 'Breakdown request not found'
      });
    }
    
    if (breakdown.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer available'
      });
    }
    
    const requestEntries = Array.isArray(breakdown.requestsSent) ? breakdown.requestsSent : [];

    // Verify whether this repairman was already notified
    const wasNotified = requestEntries.some(
      (entry) => entry.repairmanId?.toString() === req.user._id.toString()
    );
    
    // Update breakdown
    breakdown.status = 'accepted';
    breakdown.repairmanId = req.user._id;
    breakdown.estimatedCost = estimatedCost;
    breakdown.eta = eta;
    
    // Update request response history
    breakdown.requestsSent = requestEntries.map((entry) => {
      const isCurrentRepairman = entry.repairmanId?.toString() === req.user._id.toString();
      const entryObject = typeof entry.toObject === 'function' ? entry.toObject() : entry;

      return {
        ...entryObject,
        response: isCurrentRepairman ? 'accepted' : 'rejected',
        respondedAt: new Date()
      };
    });

    // If this repairman accepted without a prior notification record, add one.
    if (!wasNotified) {
      breakdown.requestsSent.push({
        repairmanId: req.user._id,
        sentAt: new Date(),
        response: 'accepted',
        respondedAt: new Date()
      });
    }
    
    await breakdown.save();
    
    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(`breakdown_${breakdown._id}`).emit('breakdownAccepted', {
        breakdownId: breakdown._id,
        repairmanId: req.user._id,
        eta,
        estimatedCost
      });
    }
    
    res.json({
      success: true,
      message: 'Job accepted successfully',
      data: breakdown
    });
  } catch (error) {
    console.error('Accept breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting job',
      error: error.message
    });
  }
};

/**
 * @desc    Update breakdown status (repairman)
 * @route   PUT /api/breakdowns/:id/status
 * @access  Private (Repairman)
 */
const updateBreakdownStatus = async (req, res) => {
  try {
    const { status, note, finalCost } = req.body;
    
    const allowedStatuses = ['on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const breakdown = await Breakdown.findById(req.params.id);
    
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        message: 'Breakdown request not found'
      });
    }
    
    // Verify ownership or admin
    const isRepairman = breakdown.repairmanId?.toString() === req.user._id.toString();
    const isUser = breakdown.userId.toString() === req.user._id.toString();
    const isAdmin = ['admin1', 'admin2'].includes(req.user.role);
    
    if (!isRepairman && !isAdmin && !(isUser && status === 'cancelled')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this breakdown'
      });
    }
    
    // Update status
    breakdown.status = status;
    if (note) {
      breakdown.statusHistory.push({ status, note, timestamp: new Date() });
    }
    if (finalCost && status === 'completed') {
      breakdown.finalCost = finalCost;
    }
    
    await breakdown.save();
    
    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(`breakdown_${breakdown._id}`).emit('breakdownStatusUpdate', {
        breakdownId: breakdown._id,
        status,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: breakdown
    });
  } catch (error) {
    console.error('Update breakdown status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
};

/**
 * @desc    Update repairman live location
 * @route   PUT /api/breakdowns/:id/location
 * @access  Private (Repairman)
 */
const updateRepairmanLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    
    const breakdown = await Breakdown.findById(req.params.id);
    
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        message: 'Breakdown request not found'
      });
    }
    
    if (breakdown.repairmanId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Update live location
    breakdown.repairmanLiveLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
      lastUpdated: new Date()
    };
    
    // Calculate route and ETA using OSRM
    let etaMinutes = null;
    let distanceKm = null;
    let etaText = null;
    
    try {
      const routeData = await calculateRoute(
        { lat: latitude, lng: longitude }, // repairman location
        { 
          lat: breakdown.location.coordinates[1], 
          lng: breakdown.location.coordinates[0] 
        } // breakdown location
      );
      
      if (routeData) {
        etaMinutes = routeData.duration.minutes;
        distanceKm = parseFloat(routeData.distance.km);
        etaText = routeData.duration.text;
        breakdown.eta = etaMinutes;
      }
    } catch (routeErr) {
      // Fallback to simple distance calculation if routing fails
      const distance = calculateDistance(
        latitude, longitude,
        breakdown.location.coordinates[1],
        breakdown.location.coordinates[0]
      );
      etaMinutes = Math.ceil(distance * 2); // Estimate 2 minutes per km
      distanceKm = distance;
      breakdown.eta = etaMinutes;
    }
    
    await breakdown.save({ validateBeforeSave: false });
    
    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(`breakdown_${breakdown._id}`).emit('repairmanLocationUpdate', {
        breakdownId: breakdown._id,
        latitude,
        longitude,
        eta: etaMinutes,
        etaText,
        distance: distanceKm,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Location updated',
      data: {
        location: breakdown.repairmanLiveLocation,
        eta: etaMinutes,
        etaText,
        distance: distanceKm
      }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

/**
 * @desc    Rate breakdown service
 * @route   POST /api/breakdowns/:id/rate
 * @access  Private (User who created breakdown)
 */
const rateBreakdown = async (req, res) => {
  try {
    const { score, review } = req.body;
    
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating score must be between 1 and 5'
      });
    }
    
    const breakdown = await Breakdown.findById(req.params.id);
    
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        message: 'Breakdown request not found'
      });
    }
    
    if (breakdown.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the requester can rate this service'
      });
    }
    
    if (breakdown.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed services'
      });
    }
    
    if (breakdown.rating && breakdown.rating.score) {
      return res.status(400).json({
        success: false,
        message: 'This service has already been rated'
      });
    }
    
    // Add rating
    breakdown.rating = {
      score,
      review,
      ratedAt: new Date()
    };
    await breakdown.save();
    
    // Update repairman's average rating
    if (breakdown.repairmanId) {
      const repairman = await User.findById(breakdown.repairmanId);
      if (repairman) {
        const totalRatings = repairman.repairmanDetails.totalRatings + 1;
        const currentAvg = repairman.repairmanDetails.rating || 0;
        const newAvg = ((currentAvg * repairman.repairmanDetails.totalRatings) + score) / totalRatings;
        
        repairman.repairmanDetails.rating = Math.round(newAvg * 10) / 10;
        repairman.repairmanDetails.totalRatings = totalRatings;
        await repairman.save({ validateBeforeSave: false });
      }
    }
    
    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: breakdown.rating
    });
  } catch (error) {
    console.error('Rate breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting rating',
      error: error.message
    });
  }
};

/**
 * @desc    Get single breakdown by ID
 * @route   GET /api/breakdowns/:id
 * @access  Private
 */
const getBreakdownById = async (req, res) => {
  try {
    const breakdown = await Breakdown.findById(req.params.id)
      .populate('userId', 'firstName lastName phone email profileImage')
      .populate('repairmanId', 'firstName lastName phone email profileImage repairmanDetails');
    
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        message: 'Breakdown request not found'
      });
    }
    
    // Check authorization
    const isUser = breakdown.userId._id.toString() === req.user._id.toString();
    const isRepairman = breakdown.repairmanId?._id.toString() === req.user._id.toString();
    const wasNotified = breakdown.requestsSent.some(
      r => r.repairmanId.toString() === req.user._id.toString()
    );
    const isAdmin = ['admin1', 'admin2'].includes(req.user.role);
    
    if (!isUser && !isRepairman && !wasNotified && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this breakdown'
      });
    }
    
    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    console.error('Get breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breakdown',
      error: error.message
    });
  }
};

/**
 * @desc    Calculate ETA between two points
 * @route   POST /api/breakdowns/calculate-eta
 * @access  Private
 */
const calculateETA = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination || 
        !origin.lat || !origin.lng || 
        !destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination coordinates are required'
      });
    }
    
    const routeData = await calculateRoute(origin, destination);
    
    if (!routeData) {
      return res.status(500).json({
        success: false,
        message: 'Unable to calculate route'
      });
    }
    
    res.json({
      success: true,
      data: {
        distance: routeData.distance,
        duration: routeData.duration,
        eta: routeData.eta
      }
    });
  } catch (error) {
    console.error('Calculate ETA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating ETA',
      error: error.message
    });
  }
};

module.exports = {
  registerAsRepairman,
  createBreakdown,
  getNearbyRepairmen,
  getMyBreakdowns,
  getRepairmanJobs,
  acceptBreakdown,
  updateBreakdownStatus,
  updateRepairmanLocation,
  rateBreakdown,
  getBreakdownById,
  calculateETA
};
