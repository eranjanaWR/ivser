/**
 * Bidding Partner Model
 * Stores first-time bidder information and consent for auctions
 * Tracks when users join an auction as bidding partners
 */

const mongoose = require('mongoose');

const biddingPartnerSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // Auction Reference
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionVehicle',
      required: [true, 'Auction ID is required'],
      index: true,
    },

    // Consent Information
    hasConsented: {
      type: Boolean,
      default: true,
      required: true,
    },

    consentDate: {
      type: Date,
      default: Date.now,
    },

    // Location Information
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      province: {
        type: String,
        required: [true, 'Province is required'],
        trim: true,
      },
    },

    // Status tracking
    status: {
      type: String,
      enum: ['active', 'inactive', 'opted_out'],
      default: 'active',
    },

    // Email notifications tracking
    notificationsSent: {
      type: Number,
      default: 0,
    },

    lastNotificationDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Composite index for quick lookup of partner status for a user in an auction
biddingPartnerSchema.index({ userId: 1, auctionId: 1 });

// Index for finding all partners in an auction
biddingPartnerSchema.index({ auctionId: 1 });

// Index for finding all auctions a user is partnered in
biddingPartnerSchema.index({ userId: 1 });

const BiddingPartner = mongoose.model('BiddingPartner', biddingPartnerSchema);

module.exports = BiddingPartner;
