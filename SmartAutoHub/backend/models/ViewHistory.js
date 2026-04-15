/**
 * ViewHistory Model
 * Tracks vehicle views for trending calculations
 * Persists even after vehicle deletion
 */

const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  
  brand: {
    type: String,
    required: true,
    trim: true
  },
  
  model: {
    type: String,
    required: true,
    trim: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Allow anonymous views
  },
  
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create index for efficient aggregation
viewHistorySchema.index({ model: 1 });
viewHistorySchema.index({ brand: 1 });
viewHistorySchema.index({ model: 1, viewedAt: -1 });

module.exports = mongoose.model('ViewHistory', viewHistorySchema);
