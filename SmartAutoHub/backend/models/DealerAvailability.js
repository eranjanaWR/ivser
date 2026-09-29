const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Slot id is required']
    },
    startTime: {
      type: String,
      required: [true, 'Slot start time is required']
    },
    endTime: {
      type: String,
      required: [true, 'Slot end time is required']
    },
    days: {
      type: [Boolean],
      required: [true, 'Slot days are required'],
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 7,
        message: 'Days array must contain exactly 7 values'
      }
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const dealerAvailabilitySchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    availabilitySlots: {
      type: [availabilitySlotSchema],
      default: []
    },
    isDefault24x7: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'dealeravailabilities'
  }
);

dealerAvailabilitySchema.index({ sellerId: 1, updatedAt: -1 });

dealerAvailabilitySchema.pre('save', function updateAvailabilityFlags(next) {
  this.updatedAt = new Date();
  this.isDefault24x7 = (this.availabilitySlots || []).length === 0;
  next();
});

module.exports = mongoose.model('DealerAvailability', dealerAvailabilitySchema);