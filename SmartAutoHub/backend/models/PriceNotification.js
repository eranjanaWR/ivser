/**
 * Price Change Notification Model
 * Stores price change notifications for wishlist vehicles
 */

const mongoose = require('mongoose');

const priceNotificationSchema = new mongoose.Schema({
  // User who is receiving the notification (the buyer with wishlist)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Vehicle details
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },

  // Seller info
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Notification type
  type: {
    type: String,
    enum: ['price_increase', 'price_decrease'],
    required: true
  },

  // Price information
  oldPrice: {
    type: Number,
    required: true
  },

  newPrice: {
    type: Number,
    required: true
  },

  priceChange: {
    type: Number,
    default: 0 // newPrice - oldPrice (positive for increase, negative for decrease)
  },

  priceChangePercent: {
    type: Number,
    default: 0 // percentage change
  },

  // Vehicle info snapshot
  vehicleInfo: {
    brand: String,
    model: String,
    year: Number,
    name: String,
    image: String
  },

  // Notification status
  isRead: {
    type: Boolean,
    default: false
  },

  readAt: Date,

  // Email sent status
  emailSent: {
    type: Boolean,
    default: false
  },

  emailSentAt: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for querying notifications by user
priceNotificationSchema.index({ userId: 1, createdAt: -1 });

// Index for unread notifications
priceNotificationSchema.index({ userId: 1, isRead: 0 });

// Mark as read
priceNotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('PriceNotification', priceNotificationSchema);
