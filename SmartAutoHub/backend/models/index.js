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

module.exports = {
  User,
  Vehicle,
  TestDrive,
  Breakdown,
  Search,
  Notification,
  UserAlert
};
