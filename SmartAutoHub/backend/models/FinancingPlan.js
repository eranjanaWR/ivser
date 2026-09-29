/**
 * Financing Plan Model
 * Stores a saved loan/financing calculation for a logged-in buyer.
 * Used by the "Save Financing Plan" feature (Financial Aid improvements).
 */

const mongoose = require('mongoose');

const financingPlanSchema = new mongoose.Schema(
  {
    // Owner of the saved plan
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },

    // Optional link to the vehicle this plan was calculated for
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: false
    },

    // Finance company this plan was calculated against
    financeCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinanceCompany',
      required: [true, 'Finance company is required']
    },

    // Loan Inputs (snapshot at time of save)
    vehiclePrice: {
      type: Number,
      required: [true, 'Vehicle price is required'],
      min: [0, 'Vehicle price cannot be negative']
    },
    downPayment: {
      type: Number,
      default: 0,
      min: [0, 'Down payment cannot be negative']
    },
    loanAmount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: [0, 'Loan amount cannot be negative']
    },
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      min: [0, 'Interest rate cannot be negative']
    },
    // Loan period in months (consistent with existing calculator/API convention)
    loanPeriod: {
      type: Number,
      required: [true, 'Loan period is required'],
      min: [1, 'Loan period must be at least 1 month']
    },

    // Calculated Results (snapshot at time of save)
    monthlyPayment: {
      type: Number,
      required: [true, 'Monthly payment is required'],
      min: [0, 'Monthly payment cannot be negative']
    },
    totalInterest: {
      type: Number,
      required: [true, 'Total interest is required'],
      min: [0, 'Total interest cannot be negative']
    },
    totalPayment: {
      type: Number,
      required: [true, 'Total payment is required'],
      min: [0, 'Total payment cannot be negative']
    },
    processingFee: {
      type: Number,
      default: 0,
      min: [0, 'Processing fee cannot be negative']
    },

    // Timestamp (plans are immutable snapshots - no updatedAt needed)
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    collection: 'financingplans'
  }
);

// Indexes for common lookups
financingPlanSchema.index({ userId: 1, createdAt: -1 });
financingPlanSchema.index({ vehicleId: 1 });

module.exports = mongoose.model('FinancingPlan', financingPlanSchema);
