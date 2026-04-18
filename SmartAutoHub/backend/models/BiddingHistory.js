/**
 * Bidding History Model
 * Stores every single bid placed on a vehicle for permanent record and history retrieval
 */

const mongoose = require('mongoose');

const biddingHistorySchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BiddingVehicle',
      required: true,
    },
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bidderName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Bid amount cannot be negative'],
    },
    location: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of bids by auction, sorted by time
biddingHistorySchema.index({ auctionId: 1, timestamp: -1 });

// Index for querying bids by bidder
biddingHistorySchema.index({ bidderId: 1, auctionId: 1 });

const BiddingHistory = mongoose.model('BiddingHistory', biddingHistorySchema);

module.exports = BiddingHistory;
