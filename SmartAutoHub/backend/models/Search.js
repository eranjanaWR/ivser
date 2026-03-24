/**
 * Search Model
 * Tracks vehicle searches for trending searches functionality
 */

const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Allow anonymous searches
  },
  
  searchQuery: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  // What the user searched for
  searchType: {
    type: String,
    enum: ['brand', 'model', 'general'],
    default: 'general'
  },
  
  // Metadata
  filters: {
    search: String,
    brand: String,
    model: String,
    type: String,
    fuelType: String,
    transmission: String,
    minPrice: Number,
    maxPrice: Number,
    condition: String,
    location: String,
    priceRange: [Number]
  },
  
  resultsCount: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient queries
searchSchema.index({ searchQuery: 1, createdAt: -1 });
searchSchema.index({ 'filters.brand': 1 });

module.exports = mongoose.model('Search', searchSchema);
