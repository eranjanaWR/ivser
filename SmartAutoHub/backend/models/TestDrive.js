/**
 * TestDrive Model
 * Handles test drive scheduling between buyers and sellers
 */

const mongoose = require('mongoose');

const testDriveSchema = new mongoose.Schema({
  // Vehicle Reference
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  
  // Buyer Reference (person requesting test drive)
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer ID is required']
  },
  
  // Seller Reference (owner of the vehicle)
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },
  
  // Scheduling Details
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required']
  },

  // Buyer's Preferred Date (submitted from the no-slot modal form)
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required'],
    validate: {
      validator: function (value) {
        // Must not be in the past (compare date only, ignore time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Preferred date cannot be in the past'
    }
  },
  
  // Duration (in minutes)
  duration: {
    type: Number,
    default: 30
  },
  
  // Meeting Location
  location: {
    address: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  
  // Notes
  buyerNotes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  sellerNotes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Contact Preference
  contactPreference: {
    type: String,
    enum: ['email', 'phone', 'both'],
    default: 'email'
  },
  
  // Response timestamps
  respondedAt: Date,
  completedAt: Date,
  
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

// Indexes
testDriveSchema.index({ buyerId: 1, status: 1 });
testDriveSchema.index({ sellerId: 1, status: 1 });
testDriveSchema.index({ vehicleId: 1 });
testDriveSchema.index({ date: 1 });

module.exports = mongoose.model('TestDrive', testDriveSchema);
