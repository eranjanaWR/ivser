const mongoose = require('mongoose');

const buyerBookingSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    selectedSlot: {
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
        required: [true, 'Slot days are required']
      }
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required']
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required (HH:mm)']
    },
    buyerInfo: {
      fullName: {
        type: String,
        required: [true, 'Buyer full name is required']
      },
      email: {
        type: String,
        required: [true, 'Buyer email is required'],
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email address']
      },
      phone: {
        type: String,
        required: [true, 'Buyer phone is required']
      }
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    sellerNotes: {
      type: String,
      default: null
    },
    buyerNotes: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'buyerbookings'
  }
);

buyerBookingSchema.index({ buyerId: 1, createdAt: -1 });
buyerBookingSchema.index({ sellerId: 1, createdAt: -1 });
buyerBookingSchema.index({ vehicleId: 1, createdAt: -1 });

const timeToMinutes = (timeString) => {
  const [hours, minutes] = String(timeString || '')
    .split(':')
    .map((part) => Number(part));

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return NaN;
  }

  return (hours * 60) + minutes;
};

buyerBookingSchema.pre('save', function validateBooking(next) {
  try {
    if (!this.scheduledDate || !this.selectedSlot || !this.scheduledTime) {
      return next();
    }

    const scheduledDate = new Date(this.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduledDateOnly = new Date(scheduledDate);
    scheduledDateOnly.setHours(0, 0, 0, 0);

    if (scheduledDateOnly < today) {
      throw new Error('Scheduled date cannot be in the past');
    }

    const utcDay = scheduledDate.getUTCDay();
    const mondayFirstDayIndex = (utcDay + 6) % 7;
    const allowedDays = this.selectedSlot.days || [];

    if (!allowedDays[mondayFirstDayIndex]) {
      throw new Error('Selected date is not available for this slot');
    }

    const selectedMinutes = timeToMinutes(this.scheduledTime);
    const startMinutes = timeToMinutes(this.selectedSlot.startTime);
    const endMinutes = timeToMinutes(this.selectedSlot.endTime);

    if (
      Number.isNaN(selectedMinutes) ||
      Number.isNaN(startMinutes) ||
      Number.isNaN(endMinutes) ||
      selectedMinutes < startMinutes ||
      selectedMinutes >= endMinutes
    ) {
      throw new Error('Selected time is outside the slot range');
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports = mongoose.model('BuyerBooking', buyerBookingSchema);