/**
 * Models Index
 * Export all models from a single entry point
 */

const User = require('./User');
const Vehicle = require('./Vehicle');
const TestDrive = require('./TestDrive');
const Breakdown = require('./Breakdown');
const Search = require('./Search');
const Notification = require('./Notification');
const UserAlert = require('./UserAlert');
const Image = require('./Image');
const Boost = require('./Boost');
const Advertising = require('./Advertising');
const DealerAvailability = require('./DealerAvailability');
const BuyerBooking = require('./BuyerBooking');
const AuctionVehicle = require('./AuctionVehicle');
const ChatMessage = require('./ChatMessage');
const BiddingHistory = require('./BiddingHistory');
const BiddingChat = require('./BiddingChat');
const BiddingPartner = require('./BiddingPartner');

module.exports = {
  User,
  Vehicle,
  TestDrive,
  Breakdown,
  Search,
  Notification,
  UserAlert,
  Image,
  Boost,
  Advertising,
  DealerAvailability,
  BuyerBooking,
  AuctionVehicle,
  ChatMessage,
  BiddingHistory,
  BiddingChat,
  BiddingPartner
};