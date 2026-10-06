/**
 * Script to find all vehicles with their boosts
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

const checkVehicles = async () => {
  try {
    await connectDB();

    console.log('\n🔍 SEARCHING FOR TOYOTA CRZ:');
    const crzVehicles = await Vehicle.find({
      $or: [
        { brand: new RegExp('toyota', 'i'), model: new RegExp('CRZ', 'i') },
        { model: new RegExp('CRZ', 'i') }
      ]
    }).select('brand model year status');

    if (crzVehicles.length === 0) {
      console.log('❌ No toyota CRZ found in database');
    } else {
      console.log(`✓ Found ${crzVehicles.length} vehicles:\n`);
      crzVehicles.forEach(v => {
        console.log(`- ${v.brand} ${v.model} (${v.year}) - Status: ${v.status}`);
      });
    }

    console.log('\n\n🚗 ALL VEHICLES IN DATABASE (last 20):');
    const allVehicles = await Vehicle.find()
      .select('brand model year status')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`Total: ${(await Vehicle.countDocuments())} vehicles\n`);
    allVehicles.forEach((v, i) => {
      console.log(`${i + 1}. ${v.brand} ${v.model} (${v.year}) - Status: ${v.status}`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

checkVehicles();
