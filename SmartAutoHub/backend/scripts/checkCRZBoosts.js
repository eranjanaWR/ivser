/**
 * Script to check ALL boosts including pending ones
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

    const crzVehicle = await Vehicle.findOne({
      model: new RegExp('CRZ', 'i')
    });

    console.log(`\n📊 CHECKING ALL STATUSES FOR: ${crzVehicle.brand} ${crzVehicle.model}\n`);

    const allBoosts = await Boost.find({ vehicleId: crzVehicle._id });
    
    console.log(`Total boosts found: ${allBoosts.length}`);
    
    if (allBoosts.length === 0) {
      console.log('❌ No boosts found at all - boost request was not saved to database');
    } else {
      allBoosts.forEach((boost, i) => {
        console.log(`\n${i + 1}. Status: ${boost.status}`);
        console.log(`   Created: ${boost.createdAt}`);
        console.log(`   Start: ${boost.startDate}`);
        console.log(`   End: ${boost.endDate}`);
      });
    }

    // Also check for any recent boosts by checking created date
    console.log(`\n⏰ LATEST 5 BOOSTS IN ENTIRE DATABASE:`);
    const recentBoosts = await Boost.find()
      .populate('vehicleId', 'brand model')
      .sort({ createdAt: -1 })
      .limit(5);

    recentBoosts.forEach((boost, i) => {
      const vehicle = boost.vehicleId;
      console.log(`${i + 1}. ${vehicle.brand} ${vehicle.model} - ${boost.status} - Created: ${boost.createdAt.toLocaleString()}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

check();
