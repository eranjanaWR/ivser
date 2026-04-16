/**
 * Auction Vehicle Routes
 * Handles CRUD operations for auction/bidding vehicles
 */

const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { protect, authorize } = require('../middlewares/auth');
const { validateObjectId, validatePagination } = require('../middlewares/validation');
const { uploadMultiple } = require('../middlewares/upload');

// ✅ PUBLIC ROUTES (NO AUTH REQUIRED)
// Get all active auction vehicles
router.get('/', validatePagination, auctionController.getAuctionVehicles);

// ✅ PROTECTED SPECIFIC ROUTES - MUST COME BEFORE WILDCARD /:id
// Get current user's personal auctions
router.get('/my-auctions', protect, auctionController.getMyAuctions);

// Get seller's auction vehicles
router.get('/seller/:sellerId', protect, validateObjectId('sellerId'), auctionController.getSellerAuctionVehicles);

// Get complete bidding details (vehicle, bids, and chat messages) - for dashboard persistence
router.get('/bidding/:auctionId/details', protect, validateObjectId('auctionId'), auctionController.getBiddingDetails);

// ✅ PUBLIC WILDCARD ROUTE - MUST COME LAST
// Get vehicle by ID (public - for showroom viewing)
router.get('/:id', validateObjectId(), auctionController.getAuctionVehicleById);

// ✅ ALL ROUTES BELOW ARE PROTECTED
router.use(protect);

// Create auction vehicle (sellers only)
router.post(
  '/',
  protect,
  authorize('seller', 'buyer/seller', 'admin1'),
  uploadMultiple('images', 10),
  auctionController.createAuctionVehicle
);

// Place a bid on an auction vehicle
router.post('/:id/bid', validateObjectId(), auctionController.placeBid);

// Update auction vehicle (owner or admin)
router.put('/:id', validateObjectId(), auctionController.updateAuctionVehicle);

// ✅ NEW: Seller Control Routes
router.put('/:id/end-auction', validateObjectId(), auctionController.endAuctionNow);
router.put('/:id/extend-time', validateObjectId(), auctionController.extendAuctionTime);
router.put('/:id/accept-bid', validateObjectId(), auctionController.acceptHighestBid);
router.put('/:id/cancel-auction', validateObjectId(), auctionController.cancelAuction);

// Delete auction vehicle (owner or admin)
router.delete('/:id', validateObjectId(), auctionController.deleteAuctionVehicle);

module.exports = router;
