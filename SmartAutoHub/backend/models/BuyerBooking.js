/**
 * BuyerBooking Model
 * Stores test drive booking requests from buyers
 */

const mongoose = require('mongoose');

const buyerBookingSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer ID is required'],
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller ID is required'],
      index: true,
    },
    selectedSlot: {
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      days: {
        type: [Boolean], // 7 elements: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
        required: true,
      },
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required (HH:mm format)'],
    },
    buyerInfo: {
      fullName: {
        type: String,
        required: [true, 'Full name is required'],
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
      },
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    sellerNotes: {
      type: String,
      default: null,
    },
    buyerNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding bookings by buyer
buyerBookingSchema.index({ buyerId: 1, createdAt: -1 });

// Index for finding bookings by seller
buyerBookingSchema.index({ sellerId: 1, createdAt: -1 });

// Index for finding bookings by vehicle
buyerBookingSchema.index({ vehicleId: 1, createdAt: -1 });

// Pre-save validation
buyerBookingSchema.pre('save', async function (next) {
  // Validate that scheduled date is not in the past
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (this.scheduledDate < now) {
    throw new Error('Scheduled date cannot be in the past');
  }

  // Validate that scheduled date matches the allowed days
  const dayOfWeek = this.scheduledDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0 = Monday format

  if (!this.selectedSlot.days[adjustedDay]) {
    throw new Error('Selected date does not fall within the available days for this slot');
  }

  // Validate scheduled time is within slot's time range
  const [slotStartHour, slotStartMin] = this.selectedSlot.startTime.split(':').map(Number);
  const [slotEndHour, slotEndMin] = this.selectedSlot.endTime.split(':').map(Number);
  const [scheduledHour, scheduledMin] = this.scheduledTime.split(':').map(Number);

  const slotStartMins = slotStartHour * 60 + slotStartMin;
  const slotEndMins = slotEndHour * 60 + slotEndMin;
  const scheduledMins = scheduledHour * 60 + scheduledMin;

  if (scheduledMins < slotStartMins || scheduledMins >= slotEndMins) {
    throw new Error('Scheduled time is outside the slot\'s available time range');
  }

  next();
});

module.exports = mongoose.model('BuyerBooking', buyerBookingSchema);
