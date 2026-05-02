/**
 * Models Index
 * Export all models from a single entry point
 */

const User = require('./User');
const Vehicle = require('./Vehicle');
const TestDrive = require('./TestDrive');
const BuyerBooking = require('./BuyerBooking');
const DealerAvailability = require('./DealerAvailability');
const Breakdown = require('./Breakdown');
const Search = require('./Search');
const Notification = require('./Notification');
const UserAlert = require('./UserAlert');
const Image = require('./Image');
const Boost = require('./Boost');
const Advertising = require('./Advertising');
const Auction = require('./Auction');
const Bid = require('./Bid');

module.exports = {
  User,
  Vehicle,
  TestDrive,
  BuyerBooking,
  DealerAvailability,
  Breakdown,
  Search,
  Notification,
  UserAlert,
  Image,
  Boost,
  Advertising,
  Auction,
  Bid
};
