/**
 * Script to check boosts in the database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Boost = require('../models/Boost');
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

const checkBoosts = async () => {
  try {
    await connectDB();

    console.log('\n📊 ALL BOOSTS IN DATABASE:');
    const allBoosts = await Boost.find()
      .populate('vehicleId', 'brand model year')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (allBoosts.length === 0) {
      console.log('❌ No boosts found');
    } else {
      console.log(`✓ Found ${allBoosts.length} boosts:\n`);
      allBoosts.forEach((boost, i) => {
        const vehicle = boost.vehicleId;
        const vehicleInfo = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'DELETED';
        console.log(`${i + 1}. ${boost.packageType.toUpperCase()} - ${vehicleInfo}`);
        console.log(`   Status: ${boost.status}`);
        console.log(`   Start: ${boost.startDate.toLocaleDateString('en-LK')}`);
        console.log(`   End: ${boost.endDate.toLocaleDateString('en-LK')}`);
        console.log(`   Days: ${Math.ceil((boost.endDate - boost.startDate) / (1000 * 60 * 60 * 24))}`);
        console.log(`   Created: ${boost.createdAt.toLocaleString('en-LK')}\n`);
      });
    }

    console.log('\n🔍 ACTIVE BOOSTS (status=active && endDate >= now):');
    const now = new Date();
    const activeBoosts = await Boost.find({
      status: 'active',
      endDate: { $gte: now }
    })
      .populate('vehicleId', 'brand model year')
      .sort({ endDate: -1 });

    if (activeBoosts.length === 0) {
      console.log('❌ No active boosts found');
    } else {
      console.log(`✓ Found ${activeBoosts.length} active boosts:\n`);
      activeBoosts.forEach((boost, i) => {
        const vehicle = boost.vehicleId;
        const vehicleInfo = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'DELETED';
        const daysLeft = Math.ceil((boost.endDate - now) / (1000 * 60 * 60 * 24));
        console.log(`${i + 1}. ${boost.packageType.toUpperCase()} - ${vehicleInfo} (${daysLeft} days left)`);
      });
    }

    console.log('\n🚗 VEHICLES WITH RECENT BOOSTS:');
    const vehiclesWithBoosts = await Vehicle.find()
      .select('brand model year')
      .sort({ createdAt: -1 })
      .limit(10);

    const vehicleIds = vehiclesWithBoosts.map(v => v._id);
    const vehicleBoosts = await Boost.find({ vehicleId: { $in: vehicleIds } })
      .populate('vehicleId', 'brand model')
      .sort({ createdAt: -1 });

    vehicleBoosts.forEach(boost => {
      const vehicle = boost.vehicleId;
      console.log(`${vehicle.brand} ${vehicle.model}: ${boost.packageType} boost (${boost.status})`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

checkBoosts();
