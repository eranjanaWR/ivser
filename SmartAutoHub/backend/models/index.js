/**
 * Models Index
 * Export all models from a single entry point
 */

const User = require('./User');
const Vehicle = require('./Vehicle');
const TestDrive = require('./TestDrive');
const Breakdown = require('./Breakdown');

module.exports = {
  User,
  Vehicle,
  TestDrive,
  Breakdown
};
