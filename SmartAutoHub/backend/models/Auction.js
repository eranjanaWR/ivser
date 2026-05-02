/**
 * Auction Model
 * Handles vehicle auctions and bidding
 */

const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  // Vehicle Reference
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },

  // Seller Reference
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },

  // Auction Details
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [0, 'Starting price cannot be negative']
  },

  currentPrice: {
    type: Number,
    required: true,
    default: function() {
      return this.startingPrice;
    }
  },

  status: {
    type: String,
    enum: ['Live', 'Upcoming', 'Completed', 'Cancelled'],
    default: 'Upcoming',
    required: true
  },

  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },

  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },

  // Winner Reference
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  totalBids: {
    type: Number,
    default: 0
  },

  description: {
    type: String,
    maxlength: 1000
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for status and dates for efficient queries
auctionSchema.index({ status: 1, endDate: 1 });
auctionSchema.index({ sellerId: 1 });
auctionSchema.index({ winnerId: 1 });

module.exports = mongoose.model('Auction', auctionSchema);
