/**
 * Advertising Request Model
 * Stores advertising package requests submitted by users
 */

const mongoose = require('mongoose');
const User = require('./User');

const advertisingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    default: 'Not provided'
  },
  message: {
    type: String,
    trim: true,
    default: 'No additional message'
  },
  packageName: {
    type: String,
    enum: ['Free Trial', 'Starter', 'Professional', 'Premium'],
    required: true
  },
  placement: {
    type: String,
    enum: ['home', 'browse', 'Not specified'],
    default: 'Not specified'
  },
  adPhotoUpload: {
    type: Boolean,
    required: true,
    default: false
  },
  adPhotoUrl: {
    type: String,
    default: null
  },
  adPhotoBase64: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'deactivated'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['free', 'pending', 'completed', 'failed'],
    default: function() {
      return this.packageName === 'Free Trial' ? 'free' : 'pending';
    }
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'none'],
    default: 'none'
  },
  paymentRefNumber: {
    type: String,
    default: null
  },
  cardholderName: {
    type: String,
    default: null
  },
  cardNumber: {
    type: String,
    default: null
  },
  expiryDate: {
    type: String,
    default: null
  },
  cvv: {
    type: String,
    default: null
  },
  paymentSlipBase64: {
    type: String,
    default: null
  },
  adminMessage: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  ipAddress: String,
  userAgent: String
});

module.exports = mongoose.model('Advertising', advertisingSchema);
