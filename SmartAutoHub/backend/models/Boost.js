/**
 * Boost Model
 * Handles vehicle advertisement boost requests
 */

const mongoose = require('mongoose');

const boostSchema = new mongoose.Schema({
  // Vehicle Reference
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  
  // User Reference (person requesting boost)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Package Details
  packageType: {
    type: String,
    enum: ['free', 'standard', 'premium', 'elite'],
    required: [true, 'Package type is required']
  },
  
  duration: {
    type: Number,
    required: [true, 'Duration is required']
  },
  
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  
  // Dates
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  // Contact Details
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required']
  },
  
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required']
  },
  
  // Payment Details
  paymentMethod: {
    type: String,
    enum: ['free', 'credit_card', 'bank_transfer', 'paypal', 'cash'],
    required: [true, 'Payment method is required']
  },
  
  cardLast4: String,
  cardHolder: String,
  bankSlipPath: String,
  
  // Additional Notes
  additionalNotes: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  
  // Admin Notes (for approval/rejection)
  adminNotes: String,
  
  // Approved/Rejected By
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvalDate: Date,
  rejectionDate: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
boostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Boost = mongoose.model('Boost', boostSchema);

module.exports = Boost;
