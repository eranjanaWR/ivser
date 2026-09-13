/**
 * Finance Company Model
 * Stores finance/leasing company details used by the Financial Aid feature
 * (loan calculator, comparison, smart recommendation, and contact/branch info)
 */

const mongoose = require('mongoose');

// Embedded branch structure (no separate collection needed for Step 1)
const branchSchema = new mongoose.Schema(
  {
    branchName: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      maxlength: [150, 'Branch name cannot exceed 150 characters']
    },
    address: {
      type: String,
      required: [true, 'Branch address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters']
    },
    phone: {
      type: String,
      trim: true
    },
    // Google Places identifier for the branch (used later for Maps/Places integration)
    googlePlaceId: {
      type: String,
      trim: true
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  { _id: true }
);

const financeCompanySchema = new mongoose.Schema(
  {
    // Company Details
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      unique: true,
      maxlength: [150, 'Company name cannot exceed 150 characters']
    },
    logo: {
      type: String,
      trim: true,
      default: ''
    },

    // Loan Terms
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      min: [0, 'Interest rate cannot be negative']
    },
    maxLoanAmount: {
      type: Number,
      required: [true, 'Maximum loan amount is required'],
      min: [0, 'Maximum loan amount cannot be negative']
    },
    // NOTE: Assumed to be a percentage of the vehicle price (industry-typical).
    // Needs confirmation - see report notes.
    minDownPayment: {
      type: Number,
      required: [true, 'Minimum down payment is required'],
      min: [0, 'Minimum down payment cannot be negative']
    },
    // NOTE: Assumed to be a flat currency amount (not a percentage).
    // Needs confirmation - see report notes.
    processingFee: {
      type: Number,
      default: 0,
      min: [0, 'Processing fee cannot be negative']
    },
    // Allowed loan period range offered by this company, in months
    loanPeriod: {
      minMonths: {
        type: Number,
        required: [true, 'Minimum loan period is required'],
        min: [1, 'Minimum loan period must be at least 1 month']
      },
      maxMonths: {
        type: Number,
        required: [true, 'Maximum loan period is required'],
        min: [1, 'Maximum loan period must be at least 1 month']
      }
    },

    // Contact Information
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$|^$/, 'Please enter a valid email or leave empty']
    },
    website: {
      type: String,
      trim: true
    },

    // Branches (embedded subdocuments)
    branches: [branchSchema],

    // Status (soft-disable without deleting the company record)
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'financecompanies'
  }
);

// Validate that maxMonths is not less than minMonths
financeCompanySchema.pre('validate', function validateLoanPeriod(next) {
  if (
    this.loanPeriod &&
    this.loanPeriod.minMonths != null &&
    this.loanPeriod.maxMonths != null &&
    this.loanPeriod.maxMonths < this.loanPeriod.minMonths
  ) {
    return next(new Error('Maximum loan period cannot be less than minimum loan period'));
  }
  return next();
});

// Indexes
financeCompanySchema.index({ isActive: 1 });
financeCompanySchema.index({ 'branches.googlePlaceId': 1 }, { sparse: true });

module.exports = mongoose.model('FinanceCompany', financeCompanySchema);
