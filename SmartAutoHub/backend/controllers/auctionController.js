/**
 * Auction Vehicle Controller
 * Handles CRUD operations for auction/bidding vehicles
 */

const AuctionVehicle = require('../models/AuctionVehicle');
const User = require('../models/User');
const BiddingHistory = require('../models/BiddingHistory');
const BiddingChat = require('../models/BiddingChat');
const DealMessage = require('../models/DealMessage'); // ✅ NEW: Private Chat Model
const BiddingPartner = require('../models/BiddingPartner');
const axios = require('axios'); // For Geocoding API calls
const { paginate, formatPaginationResponse } = require('../utils/helpers');

/**
 * Helper: Geocode city name to Lat/Lng using Nominatim
 */
const geocodeCity = async (city, province) => {
  try {
    const query = `${city}, ${province}, Sri Lanka`;
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'SmartAutoHub/1.0' } }
    );
    
    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Geocoding failed:', error.message);
    return null;
  }
};

/**
 * @desc    Create a new auction vehicle listing
 * @route   POST /api/auction-vehicles
 * @access  Private (Sellers)
 */
const createAuctionVehicle = async (req, res) => {
  try {
    const {
      brand, model, year, mileage, vin, fuelType, transmission,
      bodyType, color, engineCapacity, doors, seats, condition,
      description, features, location, startingPrice, auctionStartDate, auctionEndDate,
      existingImages, originalVehicleId
    } = req.body;

    // ✅ BACKEND SECURITY: Verify ownership if copying from an existing vehicle
    if (originalVehicleId) {
      const Vehicle = require('../models/Vehicle');
      const originalVehicle = await Vehicle.findById(originalVehicleId);
      if (originalVehicle && originalVehicle.sellerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Security Alert: You are not authorized to list this vehicle for bidding as you are not the owner.'
        });
      }
    }

    // Validate required fields
    if (!brand || !model || !year || !mileage || !startingPrice || !auctionStartDate || !auctionEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: brand, model, year, mileage, startingPrice, auctionStartDate, auctionEndDate'
      });
    }

    // Validate auction dates
    const startDate = new Date(auctionStartDate);
    const endDate = new Date(auctionEndDate);
    const now = new Date();

    if (startDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Auction start date must be in the future'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Auction end date must be after start date'
      });
    }

    // Check if images are uploaded or provided via existing list
    let parsedExistingImages = [];
    if (existingImages) {
      try {
        parsedExistingImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      } catch (e) {
        parsedExistingImages = [];
      }
    }

    const hasNewFiles = req.files && req.files.length > 0;
    if (!hasNewFiles && parsedExistingImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required (either new upload or existing URL)'
      });
    }

    // Parse location if it's a string
    let parsedLocation = location || {};
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (e) {
        parsedLocation = {};
      }
    }

    // Parse features if needed
    let parsedFeatures = features;
    if (typeof features === 'string') {
      try {
        parsedFeatures = JSON.parse(features);
      } catch {
        parsedFeatures = features.split(',').map(f => f.trim()).filter(Boolean);
      }
    } else if (Array.isArray(features)) {
      parsedFeatures = features.filter(Boolean);
    }

    const vehicleData = {
      sellerId: req.user._id,
      brand: brand.trim(),
      model: model.trim(),
      year: parseInt(year),
      mileage: parseInt(mileage),
      vin: vin?.trim(),
      fuelType: fuelType?.toLowerCase(),
      transmission: transmission?.toLowerCase(),
      bodyType: bodyType?.toLowerCase(),
      color: color?.trim(),
      engineCapacity,
      doors: doors ? parseInt(doors) : undefined,
      seats: seats ? parseInt(seats) : undefined,
      condition: condition?.toLowerCase(),
      description: description?.trim(),
      features: parsedFeatures,
      images: [
        ...parsedExistingImages,
        ...(req.files ? req.files.map(file => `/uploads/vehicles/${file.filename}`) : [])
      ],
      location: parsedLocation,
      startingPrice: parseFloat(startingPrice),
      auctionStartDate: startDate,
      auctionEndDate: endDate
    };

    // Remove undefined fields
    Object.keys(vehicleData).forEach(key => vehicleData[key] === undefined && delete vehicleData[key]);

    // Determine initial status based on start date
    if (startDate > now) {
      vehicleData.status = 'upcoming';
    } else {
      vehicleData.status = 'live';
    }

    const auctionVehicle = await AuctionVehicle.create(vehicleData);

    res.status(201).json({
      success: true,
      message: 'Auction vehicle created successfully',
      data: auctionVehicle
    });
  } catch (error) {
    console.error('Create auction vehicle error:', error);
    
    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A vehicle with this ${field} is already listed for bidding. Duplicate ${field} is not allowed.`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating auction vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Get all auction vehicles (for bidding page) - both live and upcoming
 * @route   GET /api/auction-vehicles
 * @access  Public
 */
const getAuctionVehicles = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, search, status } = req.query;

    const now = new Date();

    // ✅ AUTO-TRANSITION LOGIC: Update statuses based on current time
    // Upcoming → Live transition
    try {
      const upcomingToLive = await AuctionVehicle.updateMany(
        {
          status: 'upcoming',
          auctionStartDate: { $lte: now },
          auctionEndDate: { $gt: now }
        },
        { $set: { status: 'live' } }
      );
      if (upcomingToLive.modifiedCount > 0) {
        console.log(`✅ Auto-transitioned ${upcomingToLive.modifiedCount} vehicles from 'upcoming' to 'live'`);
      }
    } catch (err) {
      console.error('❌ Error transitioning upcoming to live:', err.message);
    }

    // Live → Closed transition
    try {
      const liveToClosed = await AuctionVehicle.updateMany(
        {
          status: 'live',
          auctionEndDate: { $lte: now }
        },
        { $set: { status: 'closed' } }
      );
      if (liveToClosed.modifiedCount > 0) {
        console.log(`✅ Auto-transitioned ${liveToClosed.modifiedCount} vehicles from 'live' to 'closed'`);
      }
    } catch (err) {
      console.error('❌ Error transitioning live to closed:', err.message);
    }

    // ✅ BUILD FILTER: Include live, upcoming, and closed vehicles
    let filter = {};

    // Filter by status if provided
    if (status === 'live') {
      // Only live vehicles currently active
      filter.status = 'live';
      filter.auctionStartDate = { $lte: now };
      filter.auctionEndDate = { $gt: now };
    } else if (status === 'upcoming') {
      // Only upcoming vehicles not yet started
      filter.status = 'upcoming';
      filter.auctionStartDate = { $gt: now };
    } else if (status === 'closed') {
      // ✅ NEW: Only closed vehicles (past their end date)
      filter.status = 'closed';
    } else {
      // ✅ FIXED: Return live, upcoming, AND closed vehicles if no status filter
      filter.$or = [
        { status: 'live', auctionStartDate: { $lte: now }, auctionEndDate: { $gt: now } },
        { status: 'upcoming', auctionStartDate: { $gt: now } },
        { status: 'closed' }
      ];
    }

    // ✅ IMPROVED SEARCH: Properly combine search with status filters
    if (search) {
      const statusFilter = filter;
      filter = {
        $and: [
          statusFilter,
          {
            $or: [
              { brand: new RegExp(search, 'i') },
              { model: new RegExp(search, 'i') },
              { description: new RegExp(search, 'i') }
            ]
          }
        ]
      };
    }

    console.log('🔍 [FILTER DEBUG] Status:', status, '| Filter:', JSON.stringify(filter));

    // Sorting
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1; // Newest first
    }

    // Pagination
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    // Execute query
    const [vehicles, total] = await Promise.all([
      AuctionVehicle.find(filter)
        .populate('sellerId', 'firstName lastName email phone profileImage')
        .populate('highestBidder', 'firstName lastName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      AuctionVehicle.countDocuments(filter)
    ]);

    console.log(`📊 [RESULTS] Found ${total} total vehicles matching filter | Returned ${vehicles.length} after pagination`);
    if (vehicles.length > 0) {
      console.log(`   Status breakdown of returned vehicles:`);
      vehicles.forEach((v, idx) => {
        console.log(`   [${idx}] ${v.brand} ${v.model} - Status: ${v.status}`);
      });
    }

    // Enrich vehicles with actual status based on dates (for redundancy)
    const enrichedVehicles = vehicles.map(vehicle => {
      const vehicleObj = vehicle.toObject();
      if (vehicleObj.auctionEndDate <= now) {
        vehicleObj.actualStatus = 'closed';
      } else if (vehicleObj.auctionStartDate <= now) {
        vehicleObj.actualStatus = 'live';
      } else {
        vehicleObj.actualStatus = 'upcoming';
      }
      return vehicleObj;
    });

    res.json({
      success: true,
      ...formatPaginationResponse(enrichedVehicles, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get auction vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching auction vehicles',
      error: error.message
    });
  }
};

/**
 * @desc    Get single auction vehicle by ID
 * @route   GET /api/auction-vehicles/:id
 * @access  Public
 */
const getAuctionVehicleById = async (req, res) => {
  try {
    const vehicle = await AuctionVehicle.findById(req.params.id)
      .populate('sellerId', 'firstName lastName email phoneNumber phone profileImage')
      .populate('highestBidder', 'firstName lastName email phoneNumber phone')
      .populate('winnerId', 'firstName lastName email phoneNumber phone')
      .populate('bids.bidderId', 'firstName lastName');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Auction vehicle not found'
      });
    }

    // Increment views
    vehicle.views += 1;
    await vehicle.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Get auction vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching auction vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Get seller's auction vehicles
 * @route   GET /api/auction-vehicles/seller/:sellerId
 * @access  Private (Seller or Admin)
 */
const getSellerAuctionVehicles = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const sellerId = req.params.sellerId;

    // Check authorization
    if (sellerId !== req.user._id.toString() && !['admin1', 'admin2'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these vehicles'
      });
    }

    const filter = { sellerId };
    if (status) {
      filter.status = status;
    }

    // Pagination
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    const [vehicles, total] = await Promise.all([
      AuctionVehicle.find(filter)
        .populate('highestBidder', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuctionVehicle.countDocuments(filter)
    ]);

    res.json({
      success: true,
      ...formatPaginationResponse(vehicles, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get seller auction vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller auction vehicles',
      error: error.message
    });
  }
};

/**
 * @desc    Update an auction vehicle
 * @route   PUT /api/auction-vehicles/:id
 * @access  Private (Owner or Admin)
 */
const updateAuctionVehicle = async (req, res) => {
  try {
    let vehicle = await AuctionVehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Auction vehicle not found'
      });
    }

    // Check authorization
    if (vehicle.sellerId.toString() !== req.user._id.toString() && 
        !['admin1', 'admin2'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle'
      });
    }

    // Don't allow updating certain fields
    const { sellerId, bids, views, ...updateData } = req.body;

    vehicle = await AuctionVehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Auction vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Update auction vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating auction vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Delete an auction vehicle
 * @route   DELETE /api/auction-vehicles/:id
 * @access  Private (Owner or Admin)
 */
const deleteAuctionVehicle = async (req, res) => {
  try {
    const vehicle = await AuctionVehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Auction vehicle not found'
      });
    }

    // Check authorization
    if (vehicle.sellerId.toString() !== req.user._id.toString() && 
        !['admin1', 'admin2'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this vehicle'
      });
    }

    await AuctionVehicle.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Auction vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete auction vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting auction vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Place a bid on an auction vehicle
 * @route   POST /api/auction-vehicles/:id/bid
 * @access  Private
 */
const placeBid = async (req, res) => {
  try {
    const { bidAmount, message } = req.body;
    const vehicleId = req.params.id;

    if (!bidAmount || bidAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid bid amount is required'
      });
    }

    const vehicle = await AuctionVehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Auction vehicle not found'
      });
    }

    // Check if auction is still active (live status)
    const now = new Date();
    if (vehicle.auctionEndDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'This auction has ended'
      });
    }

    if (vehicle.auctionStartDate > now) {
      return res.status(400).json({
        success: false,
        message: 'This bidding has not started yet'
      });
    }

    if (vehicle.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'This auction is closed'
      });
    }

    // Check if bid is higher than current bid
    if (bidAmount <= vehicle.currentBid) {
      return res.status(400).json({
        success: false,
        message: `Bid must be higher than the current bid of $${vehicle.currentBid}`
      });
    }

    // STEP 1: Save bid to BiddingHistory collection for permanent record
    const newBidRecord = new BiddingHistory({
      auctionId: vehicleId,
      bidderId: req.user._id,
      bidderName: `${req.user.firstName} ${req.user.lastName}`,
      amount: bidAmount,
      location: {
        latitude: req.body.location?.latitude || null,
        longitude: req.body.location?.longitude || null,
        city: req.body.location?.city || null,
        country: req.body.location?.country || null,
      },
      timestamp: new Date(),
    });

    await newBidRecord.save();
    console.log(`📝 Bid saved to BiddingHistory: ${newBidRecord._id}`);

    // STEP 2: Update vehicle's current bid and highest bidder
    vehicle.currentBid = bidAmount;
    vehicle.highestBidder = req.user._id;
    vehicle.status = 'live'; // Ensure status is live when bid is placed
    vehicle.bids.push({
      bidderId: req.user._id,
      bidAmount,
      message
    });

    await vehicle.save();
    console.log(`✅ Vehicle updated with new highest bid: LKR ${bidAmount}`);

    // STEP 3: Emit Socket.io event for LIVE DASHBOARD UPDATES (AFTER database saves succeed)
    const io = req.app.get('io');
    if (!io) {
      console.error('❌ [CRITICAL] Socket.io instance not available on request object!');
      console.error('   This means real-time bid updates will NOT be sent to connected clients.');
    } else {
      const bidPlacedPayload = {
        vehicleId,
        bidAmount,
        bidder: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
        },
        location: {
          lat: req.body.location?.latitude || null,
          lng: req.body.location?.longitude || null,
          city: req.body.location?.city || null,
          district: req.body.location?.district || null,
          province: req.body.location?.province || null,
        },
        timestamp: new Date(),
      };

      const roomName = `auction_${vehicleId}`;
      const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
      
      console.log(`📢 [EMISSION] Broadcasting bidPlaced to room: ${roomName} (${roomSize} users connected)`);
      console.log(`   Payload:`, bidPlacedPayload);

      // Emit bid placed event to auction room
      io.to(roomName).emit('bidPlaced', bidPlacedPayload);
      console.log(`✅ [EMISSION] Emitted 'bidPlaced' event`);
      
      // Also emit newBid event for backup compatibility
      io.to(roomName).emit('newBid', bidPlacedPayload);
      console.log(`✅ [EMISSION] Emitted 'newBid' event`);

      // Get top bidders for the dashboard with user details
      const bidderStats = {};
      const biddersMap = new Map();
      
      vehicle.bids.forEach((bid) => {
        if (!bidderStats[bid.bidderId]) {
          bidderStats[bid.bidderId] = {
            count: 0,
            lastBid: 0,
          };
        }
        bidderStats[bid.bidderId].count += 1;
        bidderStats[bid.bidderId].lastBid = bid.bidAmount;
      });

      // Fetch user details for top bidders
      const User = require('../models/User');
      const topBiddersData = Object.entries(bidderStats)
        .map(([bidderId, stats]) => ({
          _id: bidderId,
          bidCount: stats.count,
          lastBid: stats.lastBid,
        }))
        .sort((a, b) => b.lastBid - a.lastBid)
        .slice(0, 5);

      // Fetch user details for each bidder
      const topBiddersWithDetails = topBiddersData.map(bidder => {
        // Find the bidder in populated data or use fallback
        const bidderUser = vehicle.bids.find(b => b.bidderId?.toString() === bidder._id.toString())?.bidderId;
        return {
          _id: bidder._id,
          firstName: bidderUser?.firstName || 'Anonymous',
          lastName: bidderUser?.lastName || 'Bidder',
          bidCount: bidder.bidCount,
          lastBid: bidder.lastBid,
        };
      });

      // Emit bidders update event with enriched data
      io.to(roomName).emit('biddersUpdate', {
        topBidders: topBiddersWithDetails,
        totalBids: vehicle.bids.length,
      });

      console.log(`✅ [EMISSION] Socket events emitted for vehicle ${vehicleId}`);
      console.log(`   Emitted 'bidPlaced' event with amount: LKR ${bidAmount}`);
      console.log(`   Emitted 'biddersUpdate' event with ${topBiddersWithDetails.length} top bidders`);
    }

    res.json({
      success: true,
      message: 'Bid placed successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('❌ Place bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Error placing bid',
      error: error.message
    });
  }
};

/**
 * @desc    Get bid history for an auction
 * @route   GET /api/bidding/:auctionId/history
 * @access  Public
 */
const getBidHistory = async (req, res) => {
  try {
    const { auctionId } = req.params;

    console.log('📡 getBidHistory: Received request for auctionId:', auctionId);

    // Validate auctionId
    if (!auctionId) {
      console.warn('⚠️ getBidHistory: Missing auctionId');
      return res.status(400).json({
        success: false,
        message: 'Auction ID is required'
      });
    }

    // Validate MongoDB ObjectId format
    if (!auctionId.match(/^[0-9a-fA-F]{24}$/)) {
      console.warn('⚠️ getBidHistory: Invalid ObjectId format:', auctionId);
      return res.status(400).json({
        success: false,
        message: 'Invalid Auction ID format'
      });
    }

    console.log('🔍 getBidHistory: Searching for vehicle with ID:', auctionId);

    // Find the auction vehicle with bid history
    const vehicle = await AuctionVehicle.findById(auctionId)
      .populate({
        path: 'bids.bidderId',
        select: 'firstName lastName email'
      });

    if (!vehicle) {
      console.warn('⚠️ getBidHistory: Vehicle not found for ID:', auctionId);
      console.log('📊 Available vehicles count:', await AuctionVehicle.countDocuments());
      return res.status(404).json({
        success: false,
        message: 'Auction vehicle not found',
        vehicleId: auctionId
      });
    }

    console.log('✅ getBidHistory: Vehicle found:', vehicle._id, '- Bids count:', vehicle.bids.length);

    // Sort bids by timestamp in ascending order (oldest first)
    const sortedBids = vehicle.bids.sort((a, b) => {
      return new Date(a.bidDate || 0) - new Date(b.bidDate || 0);
    });

    // Map bids to the format expected by frontend
    const formattedBids = sortedBids.map((bid, index) => ({
      id: bid._id,
      bidIndex: index + 1,
      firstName: bid.bidderId?.firstName || 'User',
      lastName: bid.bidderId?.lastName || '',
      amount: bid.bidAmount,
      timestamp: bid.bidDate || new Date().toISOString(),
      bidderId: bid.bidderId?._id,
      bidLabel: `Bid ${index + 1}`
    }));

    console.log(`📋 Retrieved ${formattedBids.length} bids for auction: ${auctionId}`);

    res.json({
      success: true,
      data: formattedBids,
      total: formattedBids.length,
      vehicleId: auctionId
    });
  } catch (error) {
    console.error('❌ Get bid history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving bid history',
      error: error.message
    });
  }
};

/**
 * @desc    Get complete bidding details with history and chat messages
 * @route   GET /api/bidding/:auctionId/details
 * @access  Public
 */
const getBiddingDetails = async (req, res) => {
  try {
    const { auctionId } = req.params;

    console.log('📡 getBiddingDetails: Fetching complete details for auctionId:', auctionId);

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID is required',
      });
    }

    // Validate MongoDB ObjectId format
    if (!auctionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Auction ID format',
      });
    }

    // STEP 1: Fetch vehicle info
    const vehicle = await AuctionVehicle.findById(auctionId)
      .populate('sellerId', 'firstName lastName email phone')
      .populate('highestBidder', 'firstName lastName email phone');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    console.log(`✅ Vehicle found: ${vehicle.brand} ${vehicle.model}`);

    // STEP 2: Fetch all bids from BiddingHistory
    const bidHistory = await BiddingHistory.find({ auctionId })
      .sort({ timestamp: 1 })
      .lean();

    console.log(`📝 Retrieved ${bidHistory.length} bids from BiddingHistory`);

    // STEP 3: Fetch all chat messages from BiddingChat
    const chatMessages = await BiddingChat.find({ auctionId })
      .sort({ timestamp: 1 })
      .lean();

    console.log(`💬 Retrieved ${chatMessages.length} messages from BiddingChat`);

    // Return complete auction details
    res.status(200).json({
      success: true,
      data: {
        vehicle: {
          _id: vehicle._id,
          year: vehicle.year,
          brand: vehicle.brand,
          model: vehicle.model,
          condition: vehicle.condition,
          mileage: vehicle.mileage,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          color: vehicle.color,
          engineCapacity: vehicle.engineCapacity,
          doors: vehicle.doors,
          seats: vehicle.seats,
          description: vehicle.description,
          features: vehicle.features,
          images: vehicle.images,
          location: vehicle.location,
          startingPrice: vehicle.startingPrice,
          currentBid: vehicle.currentBid,
          highestBidder: vehicle.highestBidder,
          auctionStartDate: vehicle.auctionStartDate,
          auctionEndDate: vehicle.auctionEndDate,
          status: vehicle.status,
          sellerId: vehicle.sellerId,
          views: vehicle.views,
          createdAt: vehicle.createdAt,
        },
        bidHistory: bidHistory.map((bid, index) => ({
          _id: bid._id,
          auctionId: bid.auctionId,
          bidderId: bid.bidderId,
          bidderName: bid.bidderName,
          amount: bid.amount,
          bidIndex: index + 1,
          timestamp: bid.timestamp,
        })),
        chatMessages: chatMessages.map(msg => ({
          _id: msg._id,
          auctionId: msg.auctionId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          message: msg.message,
          timestamp: msg.timestamp,
        })),
        partners: await BiddingPartner.find({ auctionId, status: 'active' })
          .populate('userId', 'firstName lastName')
          .lean()
          .then(partners => partners.map(p => ({
            id: p.userId?._id,
            name: `${p.userId?.firstName || 'User'} ${p.userId?.lastName || ''}`.trim(),
            location: p.location,
            joinedAt: p.consentDate
          }))),
        totals: {
          totalBids: bidHistory.length,
          totalMessages: chatMessages.length,
          totalPartners: await BiddingPartner.countDocuments({ auctionId, status: 'active' })
        },
      },
    });
  } catch (error) {
    console.error('❌ getBiddingDetails error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bidding details',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all chat messages for an auction (STEP 2: API ROUTE)
 * @route   GET /api/bidding/:auctionId/chat-history
 * @access  Public
 */
const getChatHistory = async (req, res) => {
  try {
    const { auctionId } = req.params;

    console.log('📡 [PERSISTENCE-FETCH] getChatHistory: Fetching messages for auctionId:', auctionId);

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID is required',
      });
    }

    // Validate MongoDB ObjectId format
    if (!auctionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Auction ID format',
      });
    }

    // STEP 2: Query BiddingChat collection and return sorted messages (oldest first)
    // Don't use .lean() to ensure all fields including reply fields are properly serialized
    const messagesRaw = await BiddingChat.find({ auctionId })
      .sort({ timestamp: 1 });
    
    // Convert to plain objects to ensure all fields are included
    const messages = messagesRaw.map(msg => ({
      _id: msg._id,
      auctionId: msg.auctionId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      message: msg.message,
      timestamp: msg.timestamp,
      replyToId: msg.replyToId || null,
      replyToText: msg.replyToText || null,
      replyToSender: msg.replyToSender || null,
    }));

    console.log(`✅ [PERSISTENCE-FETCH] Retrieved ${messages.length} messages from BiddingChat`);
    if (messages.length > 0) {
      console.log(`📋 [PERSISTENCE-FETCH] Messages found - restoring to frontend`);
      // Log sample message with ALL fields including reply fields
      const sample = messages[0];
      console.log(`   Sample message ID: ${sample._id}`);
      console.log(`   Text: "${sample.message}"`);
      console.log(`   Has reply? ${sample.replyToId ? 'YES' : 'NO'}`);
      if (sample.replyToId) {
        console.log(`   - replyToId: ${sample.replyToId}`);
        console.log(`   - replyToText: "${sample.replyToText}"`);
        console.log(`   - replyToSender: ${sample.replyToSender}`);
      }
      // Check for any messages with replies
      const repliesCount = messages.filter(m => m.replyToId).length;
      console.log(`   Total messages with replies: ${repliesCount}`);
    }

    // Return with 'messages' field for frontend compatibility
    res.json({
      success: true,
      messages: messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('❌ [PERSISTENCE-FETCH] getChatHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message,
    });
  }
};

/**
 * @desc    Check if user is already a bidding partner for an auction
 * @route   GET /api/bidding/partner-status/:auctionId
 * @access  Private
 */
const checkPartnerStatus = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user._id;

    const partner = await BiddingPartner.findOne({
      userId,
      auctionId,
      status: 'active'
    });

    res.json({
      success: true,
      isPartner: !!partner,
      data: partner || null
    });
  } catch (error) {
    console.error('❌ Error checking partner status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking partner status',
      error: error.message
    });
  }
};

/**
 * @desc    Join auction as bidding partner with location and consent
 * @route   POST /api/bidding/join-partner
 * @access  Private
 */
const joinAsPartner = async (req, res) => {
  try {
    const { auctionId, location, hasConsented } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!auctionId || !location || typeof hasConsented !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId, location, hasConsented'
      });
    }

    // Validate location object - Auto-geocode if coordinates missing
    let { latitude, longitude, mainTown, province, district } = location;
    
    if (!latitude || !longitude) {
      console.log(`🌍 Geocoding town for partner: ${mainTown}`);
      const coords = await geocodeCity(mainTown, province);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unable to verify coordinates for this city. Please provide a more specific location.'
        });
      }
    }

    // Validate auction exists
    const auction = await AuctionVehicle.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction vehicle not found'
      });
    }

    // Check if user is already a partner for this auction
    let partner = await BiddingPartner.findOne({
      userId,
      auctionId
    });

    if (partner) {
      // Update existing partner record
      partner.hasConsented = hasConsented;
      partner.location = {
        latitude,
        longitude,
        mainTown,
        province,
        district
      };
      partner.status = 'active';
      partner.consentDate = new Date();
      await partner.save();

      console.log(`✅ Updated bidding partner ${userId} for auction ${auctionId}`);
    } else {
      // Create new partner record
      partner = await BiddingPartner.create({
        userId,
        auctionId,
        hasConsented,
        location: {
          latitude,
          longitude,
          mainTown,
          province,
          district
        },
        status: 'active',
        consentDate: new Date()
      });

      console.log(`✅ New bidding partner created: ${userId} for auction ${auctionId}`);
    }

    // ✅ SOCKET BROADCAST: Notify all viewers of the new partner
    const io = req.app.get('io');
    if (io) {
      const userPartner = await BiddingPartner.findById(partner._id).populate('userId', 'firstName lastName');
      const broadcastData = {
        id: userId,
        name: `${userPartner.userId?.firstName || 'User'} ${userPartner.userId?.lastName || ''}`.trim(),
        location: {
          lat: latitude,
          lng: longitude,
          mainTown,
          province,
          district
        },
        timestamp: new Date().toISOString()
      };
      
      const roomName = `auction_${auctionId}`;
      io.to(roomName).emit('newPartnerJoined', broadcastData);
      console.log(`📢 Broadcasted newPartnerJoined to ${roomName}`);
    }

    res.json({
      success: true,
      message: 'Successfully registered as bidding partner',
      data: partner
    });
  } catch (error) {
    console.error('❌ Error joining as partner:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering as bidding partner',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user's personal auction listings (My Auctions)
 * @route   GET /api/auction-vehicles/my-auctions
 * @access  Private
 */
const getMyAuctions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const myAuctions = await AuctionVehicle.find({ sellerId: userId })
      .populate('sellerId', 'firstName lastName email profileImage')
      .populate('highestBidder', 'firstName lastName')
      .sort({ createdAt: -1 });

    console.log(`✅ [MY AUCTIONS] Found ${myAuctions.length} auctions for user ${userId}`);

    res.json({
      success: true,
      count: myAuctions.length,
      data: myAuctions
    });
  } catch (error) {
    console.error('❌ Error fetching user auctions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your auctions',
      error: error.message
    });
  }
};

/**
 * @desc    End auction immediately
 * @route   PUT /api/auction-vehicles/:id/end-auction
 * @access  Private (Seller only)
 */
const endAuctionNow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const vehicle = await AuctionVehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Verify ownership
    if (vehicle.sellerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can end this auction'
      });
    }

    // Update vehicle status to closed
    vehicle.status = 'closed';
    vehicle.auctionEndDate = new Date();
    await vehicle.save();

    console.log(`✅ [SELLER] Auction ${id} ended immediately`);

    res.json({
      success: true,
      message: 'Auction ended successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('❌ Error ending auction:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending auction',
      error: error.message
    });
  }
};

/**
 * @desc    Extend auction time by N minutes
 * @route   PUT /api/auction-vehicles/:id/extend-time
 * @access  Private (Seller only)
 */
const extendAuctionTime = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { minutes = 5 } = req.body;
    const userId = req.user._id;

    const vehicle = await AuctionVehicle.findById(auctionId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    console.log(`⏱️ [EXTEND-TIME] Processing extension for auctionId: ${auctionId}`);

    // Verify ownership
    if (vehicle.sellerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can extend this auction'
      });
    }

    // Extend end date
    const extensionMs = minutes * 60000;
    const newEndDate = new Date(vehicle.auctionEndDate.getTime() + extensionMs);
    vehicle.auctionEndDate = newEndDate;
    await vehicle.save();

    console.log(`✅ [SELLER] Auction ${auctionId} extended by ${minutes} minutes. New end date: ${newEndDate}`);

    // BROADCAST: Notify all users via Socket.io
    const io = req.app.get('io');
    if (io) {
      const roomName = `auction_${auctionId}`;
      io.to(roomName).emit('auctionUpdated', {
        vehicleId: auctionId,
        auctionEndDate: newEndDate,
        message: `Auction time extended by ${minutes} minutes`
      });
      console.log(`📢 [EMISSION] Broadcasted auctionUpdated to room: ${roomName}`);
    }

    res.json({
      success: true,
      message: `Auction extended by ${minutes} minutes`,
      endTime: vehicle.auctionEndDate,
      data: vehicle
    });
  } catch (error) {
    console.error('❌ Error extending auction time:', error);
    res.status(500).json({
      success: false,
      message: 'Error extending auction time',
      error: error.message
    });
  }
};

/**
 * @desc    Accept highest bid and end auction
 * @route   PUT /api/auction-vehicles/:id/accept-bid
 * @access  Private (Seller only)
 */
const acceptHighestBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user._id;

    const vehicle = await AuctionVehicle.findById(auctionId).populate('highestBidder');
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Verify ownership
    if (vehicle.sellerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can accept bids on this auction'
      });
    }

    if (!vehicle.highestBidder) {
      return res.status(400).json({
        success: false,
        message: 'No bids to accept'
      });
    }

    // Mark auction as completed and record winner
    vehicle.status = 'completed';
    vehicle.winnerId = vehicle.highestBidder?._id || vehicle.highestBidder;
    vehicle.auctionEndDate = new Date();
    await vehicle.save();

    console.log(`✅ [SELLER] Accepted highest bid from ${vehicle.highestBidder.firstName} for ${vehicle.currentBid || 0}`);

    // BROADCAST: Notify all users via Socket.io
    const io = req.app.get('io');
    if (io) {
      const roomName = `auction_${auctionId}`;
      io.to(roomName).emit('auctionEnded', {
        vehicleId: auctionId,
        status: 'completed',
        winner: {
          _id: vehicle.highestBidder._id,
          name: `${vehicle.highestBidder.firstName} ${vehicle.highestBidder.lastName}`
        },
        finalBid: vehicle.currentBid,
        message: 'Auction ended: Highest bid accepted by seller'
      });
      console.log(`📢 [EMISSION] Broadcasted auctionEnded to room: ${roomName}`);
    }

    res.json({
      success: true,
      message: 'Highest bid accepted. Auction ended.',
      data: vehicle
    });
  } catch (error) {
    console.error('❌ Error accepting bid:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting bid',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel auction
 * @route   PUT /api/auction-vehicles/:id/cancel-auction
 * @access  Private (Seller only)
 */
const cancelAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user._id;

    const vehicle = await AuctionVehicle.findById(auctionId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Verify ownership
    if (vehicle.sellerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can cancel this auction'
      });
    }

    // Mark auction as cancelled
    vehicle.status = 'cancelled';
    vehicle.auctionEndDate = new Date(); // End now
    await vehicle.save();

    console.log(`✅ [SELLER] Auction ${auctionId} cancelled`);

    // BROADCAST: Notify all users via Socket.io
    const io = req.app.get('io');
    if (io) {
      const roomName = `auction_${auctionId}`;
      io.to(roomName).emit('auctionEnded', {
        vehicleId: auctionId,
        status: 'cancelled',
        message: 'Auction cancelled by seller'
      });
      console.log(`📢 [EMISSION] Broadcasted auctionEnded to room: ${roomName}`);
    }

    res.json({
      success: true,
      message: 'Auction cancelled successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('❌ Error cancelling auction:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling auction',
      error: error.message
    });
  }
};

/**
 * GET /api/bidding/result/:auctionId
 * Get auction results including winner and seller contact info
 * ACCESS: Private (Seller or Winner Only)
 */
const getAuctionResult = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user._id.toString();

    // Populate all three possible winner/seller fields
    const vehicle = await AuctionVehicle.findById(auctionId)
      .populate('sellerId',      'firstName lastName email phoneNumber phone')
      .populate('highestBidder', 'firstName lastName email phoneNumber phone')
      .populate('winnerId',      'firstName lastName email phoneNumber phone');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    // --- Safe ID extraction (handles both populated objects and raw ObjectIds) ---
    const sellerIdStr = (vehicle.sellerId?._id || vehicle.sellerId)?.toString();

    // Winner can be stored in winnerId OR highestBidder (timer-expired auctions)
    const winnerIdStr =
      (vehicle.winnerId?._id   || vehicle.winnerId)?.toString()      ||
      (vehicle.highestBidder?._id || vehicle.highestBidder)?.toString();

    console.log('[RESULT-AUTH]', { userId, sellerIdStr, winnerIdStr });

    const isSeller = sellerIdStr && userId === sellerIdStr;
    const isWinner = winnerIdStr && userId === winnerIdStr;

    if (!isSeller && !isWinner) {
      console.warn('[RESULT-AUTH] Access denied for user:', userId);
      return res.status(403).json({ success: false, message: 'Access denied: You are not part of this deal' });
    }

    // Determine the "other party" the viewer should contact
    const otherParty = isSeller
      ? (vehicle.winnerId   || vehicle.highestBidder)   // Seller sees winner
      : vehicle.sellerId;                                // Winner sees seller

    res.json({
      success: true,
      vehicle,
      isSeller,
      isWinner,
      otherParty,
    });
  } catch (error) {
    console.error('\u274c [GET-RESULT] Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/bidding/result/:auctionId/private-chat
 * Get private chat history between winner and seller
 * ACCESS: Private (Seller or Winner Only)
 */
const getPrivateChatHistory = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user._id.toString();

    const vehicle = await AuctionVehicle.findById(auctionId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Auction not found' });

    const sellerIdStr = vehicle.sellerId?.toString();
    const winnerIdStr =
      vehicle.winnerId?.toString() ||
      vehicle.highestBidder?.toString();

    const isSeller = sellerIdStr && userId === sellerIdStr;
    const isWinner = winnerIdStr && userId === winnerIdStr;

    if (!isSeller && !isWinner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await DealMessage.find({ auctionId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'firstName lastName');

    res.json({ success: true, messages });
  } catch (error) {
    console.error('\u274c [GET-PRIVATE-CHAT] Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/bidding/deal-chat/:vehicleId
 * Get chat history for a private deal (using the DealMessage model)
 * ACCESS: Private (Seller or Winner Only)
 */
const getDealChatHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const userId = req.user._id.toString();

    console.log('Fetching history for:', vehicleId);

    const vehicle = await AuctionVehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Auction not found' });

    const sellerIdStr = vehicle.sellerId?.toString();
    const winnerIdStr =
      vehicle.winnerId?.toString() ||
      vehicle.highestBidder?.toString();

    const isSeller = sellerIdStr && userId === sellerIdStr;
    const isWinner = winnerIdStr && userId === winnerIdStr;

    if (!isSeller && !isWinner) {
      return res.status(403).json({ success: false, message: 'Access denied to this private deal' });
    }

    const messages = await DealMessage.find({ auctionId: vehicleId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'firstName lastName');

    res.json({ success: true, messages });
  } catch (error) {
    console.error('\u274c [GET-DEAL-CHAT] Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * SOCKET CONTROLLER: Save a private deal message to the database
 * Called directly by Socket.io, not through an Express route
 */
const saveDealMessage = async (messageData) => {
  try {
    const DealMessage = require('../models/DealMessage');
    const { vehicleId, senderId, message } = messageData;

    const newMessage = new DealMessage({
      auctionId: vehicleId,
      senderId: senderId,
      message: message
    });
    
    const savedMessage = await newMessage.save();
    return savedMessage;
  } catch (error) {
    console.error('\u274c Error saving deal message:', error);
    throw error;
  }
};
/**
 * GET /api/auction-vehicles/won-bids
 * Get all auctions won by the current user
 * ACCESS: Private
 */
const getMyWonBids = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Find vehicles that are closed/completed and where the user is the winner
    // Winner could be stored in winnerId OR highestBidder
    const vehicles = await AuctionVehicle.find({
      status: { $in: ['closed', 'completed', 'Completed', 'Closed'] },
      $or: [
        { winnerId: userId },
        { highestBidder: userId },
        { highestBidderId: userId }
      ]
    })
    .populate('sellerId', 'firstName lastName email phoneNumber profileImage')
    .sort({ auctionEndDate: -1 });

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error('\u274c [GET-WON-BIDS] Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createAuctionVehicle,
  getAuctionVehicles,
  getAuctionVehicleById,
  getSellerAuctionVehicles,
  updateAuctionVehicle,
  deleteAuctionVehicle,
  placeBid,
  getBidHistory,
  getBiddingDetails,
  getChatHistory,
  checkPartnerStatus,
  joinAsPartner,
  getMyAuctions,
  endAuctionNow,
  extendAuctionTime,
  acceptHighestBid,
  cancelAuction,
  getAuctionResult,
  getPrivateChatHistory,
  getDealChatHistory,
  getMyWonBids,
  saveDealMessage
};
