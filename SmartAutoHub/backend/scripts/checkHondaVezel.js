/**
 * Script to check Honda Vezel boosts
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

const check = async () => {
  try {
    await connectDB();

    // Find Honda Vezel
    const vehicles = await Vehicle.find({
      brand: 'Honda',
      model: new RegExp('Vezel', 'i')
    });

    console.log(`\n🔍 Found ${vehicles.length} Honda Vezel vehicle(s):\n`);

    for (const vehicle of vehicles) {
      console.log(`\n🚗 ${vehicle.brand} ${vehicle.model}`);
      console.log(`   ID: ${vehicle._id}`);
      console.log(`   Status: ${vehicle.status}`);
      console.log(`   Year: ${vehicle.year}`);

      const boosts = await Boost.find({ vehicleId: vehicle._id })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      if (boosts.length === 0) {
        console.log('   Boosts: None');
      } else {
        console.log(`   Boosts:`);
        boosts.forEach((boost, i) => {
          console.log(`     ${i + 1}. ${boost.packageType.toUpperCase()} - ${boost.status}`);
          console.log(`        Ends: ${boost.endDate.toLocaleDateString('en-LK')} (${Math.ceil((boost.endDate - new Date()) / (1000 * 60 * 60 * 24))} days left)`);
          console.log(`        Created: ${boost.createdAt.toLocaleString('en-LK')}`);

          // Check if it shows in premium posts
          const now = new Date();
          if (boost.status === 'active' && boost.endDate >= now) {
            console.log(`        ✅ SHOWS IN PREMIUM POSTS`);
          } else {
            console.log(`        ❌ DOES NOT SHOW (status=${boost.status}, expired=${boost.endDate < now})`);
          }
        });
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

check();
