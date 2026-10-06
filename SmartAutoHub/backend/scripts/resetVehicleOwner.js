/**
 * Script to reset vehicle owner to Test Seller
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

const resetOwner = async () => {
  try {
    await connectDB();

    // Get Test Seller
    const seller = await User.findOne({ email: 'seller@test.com' });
    if (!seller) {
      console.log('❌ Test Seller not found');
      process.exit(1);
    }

    // Get toyota CRZ
    const vehicle = await Vehicle.findOne({
      model: new RegExp('CRZ', 'i')
    });

    if (!vehicle) {
      console.log('❌ Vehicle not found');
      process.exit(1);
    }

    console.log(`\n🚗 Resetting ownership:`);
    console.log(`   Vehicle: ${vehicle.brand} ${vehicle.model}`);
    console.log(`   Old owner ID: ${vehicle.sellerId}`);
    console.log(`   New owner: ${seller.firstName} ${seller.lastName} (${seller.email})`);
    console.log(`   New owner ID: ${seller._id}`);

    vehicle.sellerId = seller._id;
    await vehicle.save();

    console.log(`\n✅ Vehicle owner reset successfully!`);
    console.log(`   Now ANYONE can boost this vehicle (since it belongs to Test Seller)`);

    // Remove any previous boosts
    const Boost = require('../models/Boost');
    const deletedCount = await Boost.deleteMany({ vehicleId: vehicle._id });
    console.log(`\n🗑️  Removed ${deletedCount.deletedCount} previous bo osts`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

resetOwner();
