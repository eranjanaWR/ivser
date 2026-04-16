/**
 * Auction Vehicle Model
 * Stores vehicles specifically listed for bidding/auction
 * Separate from general vehicle listings
 */

const mongoose = require('mongoose');

const auctionVehicleSchema = new mongoose.Schema({
  // Seller Reference
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },

  // Vehicle Details
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage cannot be negative']
  },

  // Additional Vehicle Details
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid', 'other'],
    default: 'petrol',
    lowercase: true
  },
  transmission: {
    type: String,
    enum: ['automatic', 'manual', 'cvt', 'other'],
    default: 'automatic',
    lowercase: true
  },
  bodyType: {
    type: String,
    enum: ['sedan', 'suv', 'hatchback', 'coupe', 'truck', 'van', 'wagon', 'convertible', 'other', 'bus', 'three wheeler', 'motorcycle', 'pickup', 'jeep'],
    default: 'sedan',
    lowercase: true
  },
  color: {
    type: String,
    trim: true
  },
  engineCapacity: {
    type: String,
    trim: true
  },
  doors: {
    type: Number,
    min: 0,  // ✅ UPDATED: Allow 0 for motorcycles
    max: 6
  },
  seats: {
    type: Number,
    min: 1,
    max: 100
  },

  // Vehicle Condition
  condition: {
    type: String,
    enum: ['new', 'used', 'excellent', 'good', 'fair', 'poor'],
    default: 'good',
    lowercase: true
  },

  // Description
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  // Features
  features: [{
    type: String,
    trim: true
  }],

  // Images (URLs or paths)
  images: [{
    type: String
  }],

  // Location
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'USA'
    }
  },

  // Bidding Details
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [0, 'Starting price cannot be negative']
  },

  currentBid: {
    type: Number,
    default: function() {
      return this.startingPrice;
    }
  },

  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  auctionStartDate: {
    type: Date,
    default: Date.now
  },

  auctionEndDate: {
    type: Date,
    required: [true, 'Auction end date is required']
  },

  status: {
    type: String,
    enum: ['upcoming', 'live', 'closed'],
    default: 'upcoming'
  },

  // Bidding History
  bids: [{
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bidAmount: Number,
    bidDate: {
      type: Date,
      default: Date.now
    },
    message: String
  }],

  // Views counter
  views: {
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

// Index for efficient queries
auctionVehicleSchema.index({ sellerId: 1, status: 1 });
auctionVehicleSchema.index({ status: 1, auctionEndDate: 1 });
auctionVehicleSchema.index({ brand: 'text', model: 'text', description: 'text' });

// Virtual for full name
auctionVehicleSchema.virtual('fullName').get(function() {
  return `${this.year} ${this.brand} ${this.model}`;
});

// Pre-save middleware
auctionVehicleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AuctionVehicle', auctionVehicleSchema);
