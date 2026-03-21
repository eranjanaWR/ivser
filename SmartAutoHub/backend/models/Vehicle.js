/**
 * Vehicle Model
 * Stores vehicle listing information for buying/selling
 */

const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  // Additional Details
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
  type: {
    type: String,
    enum: ['sedan', 'suv', 'hatchback', 'coupe', 'truck', 'van', 'wagon', 'convertible', 'other', 'bus', 'three wheeler', 'motorcycle', 'pickup', 'jeep'],
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
    min: 2,
    max: 6
  },
  seats: {
    type: Number,
    min: 1,
    max: 12
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
  
  // VIN Number (optional)
  vin: {
    type: String,
    trim: true
  },
  
  // Location
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'USA'
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coords: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['available', 'pending', 'sold', 'removed'],
    default: 'available'
  },
  
  // Views counter
  views: {
    type: Number,
    default: 0
  },
  
  // Search count (tracked from vehicle search/click)
  searchCount: {
    type: Number,
    default: 0,
    index: true
  },
  
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Predicted Price (from ML model)
  predictedPrice: {
    type: Number
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

// Index for search queries
vehicleSchema.index({ brand: 'text', model: 'text', description: 'text' });
vehicleSchema.index({ price: 1, year: 1, mileage: 1 });
vehicleSchema.index({ 'location.coordinates.coords': '2dsphere' });

// Virtual for full name
vehicleSchema.virtual('fullName').get(function() {
  return `${this.year} ${this.brand} ${this.model}`;
});

// Pre-save middleware
vehicleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
