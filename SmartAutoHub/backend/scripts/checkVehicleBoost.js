/**
 * Script to check boost for a specific vehicle
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Vehicle = require('../models/Vehicle');
const Boost = require('../models/Boost');
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

const checkVehicleBoost = async () => {
  try {
    await connectDB();

    // Find toyota CRZ
    const vehicle = await Vehicle.findOne({
      model: new RegExp('CRZ', 'i')
    });

    if (!vehicle) {
      console.log('❌ Vehicle not found');
      process.exit(1);
    }

    console.log(`\n🚗 Vehicle Found: ${vehicle.brand} ${vehicle.model}`);
    console.log(`   ID: ${vehicle._id}`);
    console.log(`   Status: ${vehicle.status}`);
    console.log(`   Year: ${vehicle.year}`);
    console.log(`   Price: ${vehicle.price}`);

    console.log('\n🎯 BOOSTS FOR THIS VEHICLE:');
    const boosts = await Boost.find({ vehicleId: vehicle._id })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (boosts.length === 0) {
      console.log('❌ No boosts found for this vehicle');
    } else {
      console.log(`✓ Found ${boosts.length} boost(s):\n`);
      boosts.forEach((boost, i) => {
        console.log(`${i + 1}. Package: ${boost.packageType.toUpperCase()}`);
        console.log(`   Status: ${boost.status}`);
        console.log(`   Start: ${boost.startDate.toLocaleDateString('en-LK')} ${boost.startDate.toLocaleTimeString('en-LK')}`);
        console.log(`   End: ${boost.endDate.toLocaleDateString('en-LK')} ${boost.endDate.toLocaleTimeString('en-LK')}`);
        console.log(`   Duration: ${boost.duration} days`);
        console.log(`   Created: ${boost.createdAt.toLocaleString('en-LK')}`);
        console.log(`   By: ${boost.userId.firstName} ${boost.userId.lastName}\n`);
      });
    }

    console.log('\n📋 CHECKING IF VEHICLE SHOULD APPEAR IN PREMIUM POSTS:');
    const now = new Date();
    const activeBoost = boosts.find(b => b.status === 'active' && b.endDate >= now);
    
    if (activeBoost) {
      console.log('✅ YES - Vehicle has an active boost and will appear in Premium Posts');
      console.log(`   Boost ends: ${activeBoost.endDate.toLocaleDateString('en-LK')} (${Math.ceil((activeBoost.endDate - now) / (1000 * 60 * 60 * 24))} days left)`);
    } else {
      console.log('❌ NO - Vehicle does not have an active boost');
      if (boosts.length > 0) {
        console.log('   Reason: Latest boost status is "' + boosts[0].status + '"');
        if (boosts[0].endDate < now) {
          console.log('   Reason: Boost has expired');
        }
      }
    }

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

checkVehicleBoost();
