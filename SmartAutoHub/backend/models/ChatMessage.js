/**
 * ChatMessage Model
 * Stores messages from the live auction group chat
 */

const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionVehicle',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
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

// Index for efficient querying of messages by auction
chatMessageSchema.index({ auctionId: 1, timestamp: -1 });

// Index for cleaning up old messages (optional)
chatMessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 }); // 7 days TTL

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
