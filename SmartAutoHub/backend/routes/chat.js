/**
 * Chat Routes
 * Handles chat message endpoints
 */

const express = require('express');
const router = express.Router();
const { getChatHistory } = require('../controllers/chatController');
const { auth } = require('../middlewares/auth');

/**
 * GET /api/auction/:auctionId/chat-history
 * Get chat history for an auction
 */
router.get('/:auctionId/chat-history', getChatHistory);

// NOTE: Socket.io handler in server.js handles message saving
// and bidding.js route handles chat-history for persistence layer

module.exports = router;
