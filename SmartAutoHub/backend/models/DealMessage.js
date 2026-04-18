const mongoose = require('mongoose');

/**
 * DealMessage Schema
 * Stores private chat messages between the Seller and the Winner
 * for a specific completed auction.
 */
const dealMessageSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionVehicle',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealMessage',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Ensure efficient querying for specific auction conversations
dealMessageSchema.index({ auctionId: 1, timestamp: 1 });

module.exports = mongoose.model('DealMessage', dealMessageSchema);
