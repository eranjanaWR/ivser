/**
 * Script to check vehicle statuses in database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Vehicle = require('../models/Vehicle');

const checkVehicleStatuses = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get count of all vehicles
    const totalCount = await Vehicle.countDocuments();
    console.log(`📊 Total vehicles in database: ${totalCount}\n`);

    if (totalCount === 0) {
      console.log('❌ NO VEHICLES FOUND IN DATABASE!\n');
      await mongoose.connection.close();
      return;
    }

    // Get count by status
    console.log('Vehicle count by status:');
    const statusCounts = {};
    const allStatuses = ['active', 'inactive', 'pending', 'sold', 'removed'];
    
    for (const status of allStatuses) {
      const count = await Vehicle.countDocuments({ status });
      statusCounts[status] = count;
      console.log(`  - ${status}: ${count}`);
    }

    // Check for vehicles with undefined/missing status
    const undefinedCount = await Vehicle.countDocuments({ status: { $exists: false } });
    if (undefinedCount > 0) {
      console.log(`  - undefined/missing: ${undefinedCount}`);
      statusCounts['undefined'] = undefinedCount;
    }

    // Check for other status values
    const otherStatuses = await Vehicle.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $match: { _id: { $nin: allStatuses } } }
    ]);

    if (otherStatuses.length > 0) {
      console.log('\n⚠️  Unexpected status values found:');
      for (const item of otherStatuses) {
        console.log(`  - "${item._id}": ${item.count}`);
      }
    }

    // Show sample active vehicles (should appear in browse page)
    console.log('\n🟢 Sample active vehicles (these should show in browse page):');
    const activeVehicles = await Vehicle.find({ status: 'active' })
      .select('brand model year status')
      .sort({ createdAt: -1 })
      .limit(5);

    if (activeVehicles.length === 0) {
      console.log('  ❌ No active vehicles found!');
    } else {
      activeVehicles.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.brand} ${v.model} (${v.year}) - ${v.status}`);
      });
    }

    // Show sample non-active vehicles
    console.log('\n🔴 Sample non-active vehicles:');
    const nonActiveVehicles = await Vehicle.find({ status: { $ne: 'active' } })
      .select('brand model year status')
      .sort({ createdAt: -1 })
      .limit(5);

    if (nonActiveVehicles.length === 0) {
      console.log('  ✓ No non-active vehicles found');
    } else {
      nonActiveVehicles.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.brand} ${v.model} (${v.year}) - ${v.status}`);
      });
    }

    console.log('\n📋 Summary:');
    const hasActiveVehicles = statusCounts['active'] > 0;
    console.log(`  - Has active vehicles: ${hasActiveVehicles ? '✓ YES' : '❌ NO'}`);
    console.log(`  - With filter disabled: ${totalCount} vehicles will show`);
    console.log(`  - With status='active' filter: ${statusCounts['active']} vehicles will show`);

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkVehicleStatuses();
