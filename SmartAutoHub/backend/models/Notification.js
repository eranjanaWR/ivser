const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    searchCriteria: {
      search: { type: String, default: '' },
      brand: { type: String, default: '' },
      fuelType: { type: String, default: '' },
      transmission: { type: String, default: '' },
      condition: { type: String, default: '' },
      minPrice: { type: Number, default: 0 },
      maxPrice: { type: Number, default: 50000000 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationsSent: {
      type: Number,
      default: 0,
    },
    lastNotifiedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for finding active subscriptions
NotificationSchema.index({ isActive: 1, email: 1 });

// Index for brand searches
NotificationSchema.index({ 'searchCriteria.brand': 1, isActive: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
