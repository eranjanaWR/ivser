/**
 * Migration script to update vehicle status from 'available' to 'active'
 */
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
require('dotenv').config({ path: '../.env' });

const migrateVehicleStatus = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://smartautohub:smartautohub%40123@smartautohub.nqvvpzc.mongodb.net/smartautohub?retryWrites=true&w=majority');
    
    console.log('📊 Fetching vehicles with old status...');
    const vehiclesWithOldStatus = await Vehicle.find({
      $or: [
        { status: 'available' },
        { status: { $exists: false } } // Vehicles without status field
      ]
    });
    
    console.log(`\n📈 Found ${vehiclesWithOldStatus.length} vehicles with old/missing status`);
    
    if (vehiclesWithOldStatus.length === 0) {
      console.log('✓ No vehicles to migrate');
      await mongoose.connection.close();
      return;
    }
    
    // Update all vehicles with old status to 'active'
    const updateResult = await Vehicle.updateMany(
      {
        $or: [
          { status: 'available' },
          { status: { $exists: false } }
        ]
      },
      { $set: { status: 'active' } }
    );
    
    console.log(`\n✓ Migration complete!`);
    console.log(`  - Matched: ${updateResult.matchedCount} vehicles`);
    console.log(`  - Modified: ${updateResult.modifiedCount} vehicles`);
    
    // Verify the migration
    const activeVehicles = await Vehicle.countDocuments({ status: 'active' });
    const totalVehicles = await Vehicle.countDocuments();
    
    console.log(`\n📊 Verification:`);
    console.log(`  - Total vehicles: ${totalVehicles}`);
    console.log(`  - Active vehicles: ${activeVehicles}`);
    
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateVehicleStatus();
