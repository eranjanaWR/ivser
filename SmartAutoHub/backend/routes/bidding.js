/**
 * Bidding Routes
 * Handles bid-related endpoints for auction vehicles
 */

const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { validateObjectId } = require('../middlewares/validation');
const { protect } = require('../middlewares/auth');

/**
 * GET /api/bidding/:auctionId/history
 * Get complete bid history for an auction vehicle
 * Sorted by timestamp (oldest first)
 * Access: Public
 */
router.get('/:auctionId/history', auctionController.getBidHistory);

/**
 * GET /api/bidding/:auctionId/combined
 * Get combined bidding history with both bids and chat messages
 * FOR PERSISTENCE: Returns all bids and messages from database
 * Access: Public
 */
router.get('/:auctionId/combined', auctionController.getBiddingDetails);

/**
 * GET /api/bidding/:auctionId/chat-history
 * STEP 2: API Route - Get all chat messages from database
 * Returns sorted chat history from BiddingChat collection
 * Access: Public
 */
router.get('/:auctionId/chat-history', auctionController.getChatHistory);

/**
 * GET /api/bidding/partner-status/:auctionId
 * Check if current user is a bidding partner for an auction
 * Access: Private (Authenticated)
 */
router.get('/partner-status/:auctionId', protect, validateObjectId('auctionId'), auctionController.checkPartnerStatus);

/**
 * POST /api/bidding/join-partner
 * Register user as bidding partner with location and consent
 * Access: Private (Authenticated)
 */
router.post('/join-partner', protect, auctionController.joinAsPartner);

module.exports = router;
