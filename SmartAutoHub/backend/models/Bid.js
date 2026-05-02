/**
 * Bid Model
 * Handles individual bids placed on auctions
 */

const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  // Auction Reference
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, 'Auction ID is required']
  },

  // Bidder Reference
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bidder ID is required']
  },

  // Bid Amount
  bidAmount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount cannot be negative']
  },

  // Bid Status
  status: {
    type: String,
    enum: ['Active', 'Outbid', 'Winner', 'Cancelled'],
    default: 'Active'
  },

  // Bidding Time
  bidTime: {
    type: Date,
    default: Date.now
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
bidSchema.index({ auctionId: 1, bidTime: -1 });
bidSchema.index({ bidderId: 1 });
bidSchema.index({ auctionId: 1, status: 1 });

module.exports = mongoose.model('Bid', bidSchema);
