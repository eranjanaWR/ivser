/**
 * Breakdown Model
 * Handles breakdown requests and repairman assignments
 * Supports real-time location tracking via Socket.io
 */

const mongoose = require('mongoose');

const breakdownSchema = new mongoose.Schema({
  // User who reported the breakdown
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Assigned Repairman
  repairmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Breakdown Location (GeoJSON)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required']
    },
    address: String,
    city: String,
    state: String
  },
  
  // Description of the problem
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Problem Category
  category: {
    type: String,
    enum: ['engine', 'electrical', 'tire', 'battery', 'fuel', 'brakes', 'transmission', 'other'],
    default: 'other'
  },
  
  // Vehicle Details (optional)
  vehicleDetails: {
    brand: String,
    model: String,
    year: Number,
    color: String,
    licensePlate: String
  },
  
  // Images of the breakdown
  images: [{
    type: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Status History
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  
  // Live Location Tracking for Repairman
  repairmanLiveLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    lastUpdated: Date
  },
  
  // Estimated Time of Arrival
  eta: {
    type: Number, // minutes
  },
  
  // Pricing
  estimatedCost: {
    type: Number
  },
  finalCost: {
    type: Number
  },
  
  // Rating (after completion)
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  
  // Requests sent to repairmen (for tracking who was notified)
  requestsSent: [{
    repairmanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    response: {
      type: String,
      enum: ['pending', 'accepted', 'rejected']
    },
    respondedAt: Date
  }],
  
  // Timestamps
  acceptedAt: Date,
  arrivedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  
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

// Geospatial index for location queries
breakdownSchema.index({ location: '2dsphere' });
breakdownSchema.index({ 'repairmanLiveLocation': '2dsphere' });
breakdownSchema.index({ userId: 1, status: 1 });
breakdownSchema.index({ repairmanId: 1, status: 1 });

// Add status to history when status changes
breakdownSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
    
    // Update specific timestamps based on status
    switch (this.status) {
      case 'accepted':
        this.acceptedAt = new Date();
        break;
      case 'arrived':
        this.arrivedAt = new Date();
        break;
      case 'completed':
        this.completedAt = new Date();
        break;
      case 'cancelled':
        this.cancelledAt = new Date();
        break;
    }
  }
  
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Breakdown', breakdownSchema);
