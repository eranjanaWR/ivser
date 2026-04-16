/**
 * Dealer Availability Model
 * Stores test drive availability time slots for sellers
 */

const mongoose = require('mongoose');

const dealerAvailabilitySchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    availabilitySlots: [
      {
        id: {
          type: String,
          required: true,
        },
        startTime: {
          type: String, // Format: HH:mm (24-hour)
          required: true,
        },
        endTime: {
          type: String, // Format: HH:mm (24-hour)
          required: true,
        },
        days: {
          type: [Boolean], // Array of 7 booleans (Mon-Sun)
          required: true,
          validate: {
            validator: (v) => v.length === 7,
            message: 'Days array must have exactly 7 values (Mon-Sun)',
          },
        },
        enabled: {
          type: Boolean,
          default: true,
        },
      },
    ],
    // Default availability (24/7 if no slots)
    isDefault24x7: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field before saving
dealerAvailabilitySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  // If availabilitySlots array is not empty, it's not default 24/7
  this.isDefault24x7 = this.availabilitySlots.length === 0;
  next();
});

// Index for efficient queries
dealerAvailabilitySchema.index({ sellerId: 1, updatedAt: -1 });

module.exports = mongoose.model('DealerAvailability', dealerAvailabilitySchema);
