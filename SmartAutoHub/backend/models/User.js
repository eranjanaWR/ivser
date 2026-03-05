/**
 * User Model
 * Handles all user types: seller, buyer, repairman, admin1, admin2
 * Includes verification flags for email, ID, and face verification
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    trim: true
  },
  
  // User Role
  role: {
    type: String,
    enum: ['seller', 'buyer', 'repairman', 'admin1', 'admin2'],
    default: 'buyer'
  },
  
  // Verification Flags
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isIDVerified: {
    type: Boolean,
    default: false
  },
  isFaceVerified: {
    type: Boolean,
    default: false
  },
  
  // OTP for Email Verification
  emailOTP: {
    code: String,
    expiresAt: Date
  },
  
  // ID Verification Data
  idVerification: {
    idNumber: String,
    idFrontImage: String, // URL or base64
    idBackImage: String,
    extractedText: String, // Text extracted from ID using Tesseract
    verifiedAt: Date
  },
  
  // Face Verification Data
  faceVerification: {
    selfieImage: String,
    faceDescriptor: [Number], // Face descriptor from face-api.js
    matchScore: Number,
    verifiedAt: Date
  },
  
  // Profile Image
  profileImage: {
    type: String,
    default: ''
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Location for repairmen (GeoJSON)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  
  // Repairman specific fields
  repairmanDetails: {
    specialization: [String], // e.g., ['engine', 'electrical', 'bodywork']
    experience: Number, // years
    rating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    serviceRadius: {
      type: Number,
      default: 10 // km
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  
  // Timestamps
  lastLogin: Date,
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

// Index for geospatial queries (finding nearest repairmen)
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user is fully verified
userSchema.methods.isFullyVerified = function() {
  return this.isEmailVerified && this.isIDVerified && this.isFaceVerified;
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    profileImage: this.profileImage,
    isEmailVerified: this.isEmailVerified,
    isIDVerified: this.isIDVerified,
    isFaceVerified: this.isFaceVerified,
    isFullyVerified: this.isFullyVerified(),
    address: this.address,
    ...(this.role === 'repairman' && { repairmanDetails: this.repairmanDetails }),
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
