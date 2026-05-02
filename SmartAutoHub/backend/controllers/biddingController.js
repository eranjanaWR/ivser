/**
 * Bidding Controller
 * Handles auctions and bidding functionality
 */

const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Vehicle = require('../models/Vehicle');
const { paginate, formatPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all auctions with filters
 * @route   GET /api/bidding/auctions
 * @access  Public
 */
const getAuctions = async (req, res) => {
  try {
    const { status = 'Live', page = 1, limit = 12 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const auctions = await Auction.find(filter)
      .populate('vehicleId', 'model year transmission condition mileage images')
      .populate('sellerId', 'firstName lastName phone')
      .populate('winnerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Auction.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: auctions,
      pagination: formatPaginationResponse(page, limit, total)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get auction by ID
 * @route   GET /api/bidding/auctions/:id
 * @access  Public
 */
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('vehicleId')
      .populate('sellerId', 'firstName lastName phone email')
      .populate('winnerId', 'firstName lastName');

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    const bids = await Bid.find({ auctionId: req.params.id })
      .populate('bidderId', 'firstName lastName')
      .sort({ bidTime: -1 });

    res.status(200).json({
      success: true,
      data: {
        auction,
        bids
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create a new auction
 * @route   POST /api/bidding/auctions
 * @access  Private (Seller only)
 */
const createAuction = async (req, res) => {
  try {
    const { vehicleId, startingPrice, startDate, endDate, description } = req.body;

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Verify user owns the vehicle
    if (vehicle.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only create auctions for your own vehicles'
      });
    }

    const auction = await Auction.create({
      vehicleId,
      sellerId: req.user._id,
      startingPrice,
      currentPrice: startingPrice,
      startDate,
      endDate,
      description,
      status: new Date(startDate) <= new Date() ? 'Live' : 'Upcoming'
    });

    const populatedAuction = await Auction.findById(auction._id)
      .populate('vehicleId')
      .populate('sellerId', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: populatedAuction
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Place a bid on an auction
 * @route   POST /api/bidding/bids
 * @access  Private (Buyers)
 */
const placeBid = async (req, res) => {
  try {
    const { auctionId, bidAmount } = req.body;

    // Check if auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Check if auction is live
    if (auction.status !== 'Live') {
      return res.status(400).json({
        success: false,
        message: 'This auction is not active'
      });
    }

    // Check if user is the seller
    if (auction.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot bid on your own auction'
      });
    }

    // Check if bid amount is higher than current price
    if (bidAmount <= auction.currentPrice) {
      return res.status(400).json({
        success: false,
        message: `Bid amount must be higher than ${auction.currentPrice}`
      });
    }

    // Mark previous highest bid as outbid
    const previousHighestBid = await Bid.findOne({
      auctionId,
      status: 'Active'
    }).sort({ bidAmount: -1 });

    if (previousHighestBid) {
      previousHighestBid.status = 'Outbid';
      await previousHighestBid.save();
    }

    // Create new bid
    const bid = await Bid.create({
      auctionId,
      bidderId: req.user._id,
      bidAmount,
      status: 'Active'
    });

    // Update auction current price
    auction.currentPrice = bidAmount;
    auction.totalBids = (auction.totalBids || 0) + 1;
    await auction.save();

    const populatedBid = await Bid.findById(bid._id)
      .populate('bidderId', 'firstName lastName')
      .populate('auctionId');

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: populatedBid
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get user's auctions
 * @route   GET /api/bidding/my-auctions
 * @access  Private
 */
const getUserAuctions = async (req, res) => {
  try {
    const { status, page = 1, limit = 12 } = req.query;

    let filter = { sellerId: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const auctions = await Auction.find(filter)
      .populate('vehicleId')
      .populate('winnerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Auction.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: auctions,
      pagination: formatPaginationResponse(page, limit, total)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get user's bids
 * @route   GET /api/bidding/my-bids
 * @access  Private
 */
const getUserBids = async (req, res) => {
  try {
    const { status, page = 1, limit = 12 } = req.query;

    let filter = { bidderId: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const bids = await Bid.find(filter)
      .populate('auctionId')
      .populate('auctionId.vehicleId')
      .sort({ bidTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bid.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: bids,
      pagination: formatPaginationResponse(page, limit, total)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get user's won bids
 * @route   GET /api/bidding/won-bids
 * @access  Private
 */
const getUserWonBids = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const skip = (page - 1) * limit;

    const wonAuctions = await Auction.find({
      winnerId: req.user._id,
      status: 'Completed'
    })
      .populate('vehicleId')
      .populate('sellerId', 'firstName lastName phone')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Auction.countDocuments({
      winnerId: req.user._id,
      status: 'Completed'
    });

    res.status(200).json({
      success: true,
      data: wonAuctions,
      pagination: formatPaginationResponse(page, limit, total)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Cancel an auction
 * @route   PUT /api/bidding/auctions/:id/cancel
 * @access  Private (Seller only)
 */
const cancelAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    if (auction.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own auctions'
      });
    }

    auction.status = 'Cancelled';
    await auction.save();

    res.status(200).json({
      success: true,
      message: 'Auction cancelled successfully',
      data: auction
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAuctions,
  getAuctionById,
  createAuction,
  placeBid,
  getUserAuctions,
  getUserBids,
  getUserWonBids,
  cancelAuction
};
