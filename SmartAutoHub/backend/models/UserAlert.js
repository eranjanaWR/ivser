/**
 * UserAlert Model
 * Tracks in-app notifications/alerts for users when their subscribed vehicles become available
 */

const mongoose = require('mongoose');

const userAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  
  vehicleBrand: String,
  vehicleModel: String,
  vehiclePrice: Number,
  vehicleImage: String,
  sellerName: String,
  
  alertType: {
    type: String,
    enum: ['available', 'price_drop', 'new_listing'],
    default: 'available'
  },
  
  message: {
    type: String,
    required: true
  },
  
  isSeen: {
    type: Boolean,
    default: false,
    index: true
  },
  
  seenAt: {
    type: Date,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for finding unseen alerts for a user
userAlertSchema.index({ userId: 1, isSeen: 1, createdAt: -1 });

module.exports = mongoose.model('UserAlert', userAlertSchema);
