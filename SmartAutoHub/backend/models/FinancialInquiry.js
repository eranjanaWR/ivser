/**
 * Financial Inquiry Model
 * Stores agent contact requests and inquiry information
 */

const mongoose = require('mongoose');

const financialInquirySchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be submitted by anonymous users
  },

  // Contact Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$|^$/, 'Please enter a valid email or leave empty']
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },

  // Financial Information
  vehicleCategory: {
    type: String,
    enum: ['car', 'bike', 'three-wheeler'],
    required: [true, 'Vehicle category is required']
  },

  selectedCompany: {
    type: String,
    required: [true, 'Finance company selection is required']
  },

  // Preferred Meeting Details
  preferredDates: [{
    type: String, // ISO date format YYYY-MM-DD
    required: false
  }],

  preferredTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', ''],
    default: ''
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'contacted', 'converted', 'rejected'],
    default: 'pending'
  },

  // Agent Assignment
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  // Notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  contactedAt: {
    type: Date,
    required: false
  }
});

// Update timestamp on save
financialInquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for queries
financialInquirySchema.index({ phone: 1 });
financialInquirySchema.index({ selectedCompany: 1 });
financialInquirySchema.index({ status: 1 });
financialInquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('FinancialInquiry', financialInquirySchema);
