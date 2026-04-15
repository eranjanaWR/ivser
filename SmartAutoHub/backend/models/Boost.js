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
  
  // Payment Reference Number (unique identifier for payment tracking)
  paymentRefNumber: {
    type: String,
    unique: true,
    sparse: true
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
  
  // Notification Email (where to send boost-related notifications)
  notificationEmail: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    validate: {
      validator: function(email) {
        // Allow empty/null values, but if provided must be valid email
        if (!email) return true;
        return /^\S+@\S+\.\S+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
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
  cardProofPath: String,
  
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

// Update the updatedAt field before saving AND ensure notificationEmail is set
boostSchema.pre('save', async function(next) {
  try {
    this.updatedAt = Date.now();
    
    // Ensure notificationEmail is always populated with a valid email
    if (!this.notificationEmail || !this.notificationEmail.includes('@')) {
      // Try to populate userId if not already populated
      if (this.userId && typeof this.userId === 'string') {
        await this.populate('userId');
      }
      
      // Get email from populated user or user reference
      const userEmail = this.userId?.email || this.userId?._doc?.email;
      if (userEmail && userEmail.includes('@')) {
        this.notificationEmail = userEmail;
      } else {
        // Fallback: set a placeholder if we can't get user email
        // This will at least allow the save to proceed
        console.warn(`⚠️ Could not find valid email for boost ${this._id}`);
        // Don't block the save, just log the warning
      }
    }
    
    next();
  } catch (err) {
    console.error('Error in Boost pre-save hook:', err);
    next();
  }
});

const Boost = mongoose.model('Boost', boostSchema);

module.exports = Boost;
