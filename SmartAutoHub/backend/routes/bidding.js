/**
 * Bidding Routes
 * Routes for auction and bidding functionality
 */

const express = require('express');
const {
  getAuctions,
  getAuctionById,
  createAuction,
  placeBid,
  getUserAuctions,
  getUserBids,
  getUserWonBids,
  cancelAuction
} = require('../controllers/biddingController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * Public routes
 */
router.get('/auctions', getAuctions);
router.get('/auctions/:id', getAuctionById);

/**
 * Private routes (require authentication)
 */
router.post('/auctions', authenticate, createAuction);
router.post('/bids', authenticate, placeBid);
router.get('/my-auctions', authenticate, getUserAuctions);
router.get('/my-bids', authenticate, getUserBids);
router.get('/won-bids', authenticate, getUserWonBids);
router.put('/auctions/:id/cancel', authenticate, cancelAuction);

module.exports = router;
