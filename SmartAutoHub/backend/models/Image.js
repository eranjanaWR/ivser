/**
 * Image Model
 * Stores vehicle images in the database with base64 encoding
 */

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  // Reference to vehicle
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required'],
    index: true
  },

  // Image metadata
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },

  // Base64 encoded image data
  imageData: {
    type: String,
    required: [true, 'Image data is required']
  },

  // MIME type (e.g., 'image/jpeg')
  mimeType: {
    type: String,
    default: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },

  // File size in bytes
  fileSize: {
    type: Number
  },

  // Upload order (to maintain image sequence)
  order: {
    type: Number,
    default: 0
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
imageSchema.index({ vehicleId: 1, order: 1 });

module.exports = mongoose.model('Image', imageSchema);
