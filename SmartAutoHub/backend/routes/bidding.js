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
 * GET /api/bidding/check-registration/:auctionId
 * Check if current user is already a registered partner for an auction
 * Access: Private (Authenticated)
 */
router.get('/check-registration/:auctionId', protect, validateObjectId('auctionId'), auctionController.checkPartnerStatus);

/**
 * POST /api/bidding/join-partner
 * Register user as bidding partner with location and consent
 * Access: Private (Authenticated)
 */
router.post('/join-partner', protect, auctionController.joinAsPartner);

/**
 * SELLER CONTROLS: API routes for managing the live auction
 * Access: Private (Seller only - verified in controller)
 */
router.put('/:auctionId/extend-time', protect, validateObjectId('auctionId'), auctionController.extendAuctionTime);
router.put('/:auctionId/accept-bid', protect, validateObjectId('auctionId'), auctionController.acceptHighestBid);
router.put('/:auctionId/cancel-auction', protect, validateObjectId('auctionId'), auctionController.cancelAuction);

/**
 * POST-AUCTION CONNECTION: Result and Private Deal Chat
 * Access: Private (Seller or Winner Only - verified in controller)
 */
router.get('/result/:auctionId', protect, validateObjectId('auctionId'), auctionController.getAuctionResult);
router.get('/result/:auctionId/private-chat', protect, validateObjectId('auctionId'), auctionController.getPrivateChatHistory);
router.get('/deal-chat/:vehicleId', protect, validateObjectId('vehicleId'), auctionController.getDealChatHistory);

module.exports = router;
