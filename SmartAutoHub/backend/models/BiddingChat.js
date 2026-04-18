/**
 * Bidding Chat Model
 * Stores all discussion messages in the live auction group chat for permanent record
 */

const mongoose = require('mongoose');

const biddingChatSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BiddingVehicle',
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
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    // Reply (Quote) Fields
    replyToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BiddingChat',
      default: null,
    },
    replyToText: {
      type: String,
      default: null,
      maxlength: [100, 'Quoted text cannot exceed 100 characters'],
    },
    replyToSender: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of messages by auction, sorted by time
biddingChatSchema.index({ auctionId: 1, timestamp: -1 });

// Index for querying messages by sender
biddingChatSchema.index({ senderId: 1, auctionId: 1 });

const BiddingChat = mongoose.model('BiddingChat', biddingChatSchema);

module.exports = BiddingChat;
