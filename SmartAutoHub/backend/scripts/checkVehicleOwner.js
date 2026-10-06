/**
 * Script to check who owns the toyota CRZ
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const check = async () => {
  try {
    await connectDB();

    // Get the toyota CRZ
    const vehicle = await Vehicle.findOne({
      model: new RegExp('CRZ', 'i')
    }).populate('sellerId', 'firstName lastName email phone role');

    if (!vehicle) {
      console.log('❌ Vehicle not found');
      process.exit(1);
    }

    console.log(`\n🚗 Toyota CRZ`);
    console.log(`   Vehicle ID: ${vehicle._id}`);
    console.log(`   Status: ${vehicle.status}`);
    console.log(`\n👤 Owner:`);
    console.log(`   Name: ${vehicle.sellerId.firstName} ${vehicle.sellerId.lastName}`);
    console.log(`   Email: ${vehicle.sellerId.email}`);
    console.log(`   Phone: ${vehicle.sellerId.phone}`);
    console.log(`   Role: ${vehicle.sellerId.role}`);
    console.log(`   ID: ${vehicle.sellerId._id}`);

    console.log(`\n📋 All users in system:`);
    const users = await User.find().select('firstName lastName email role');
    users.forEach((user, i) => {
      const isOwner = user._id.toString() === vehicle.sellerId._id.toString();
      const marker = isOwner ? ' ← OWNS TOYOTA CRZ' : '';
      console.log(`${i + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}${marker}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

check();
