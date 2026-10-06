/**
 * Script to remove first 5 browse page ads
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Advertising = require('../models/Advertising');

const mongoUrl = process.env.MONGODB_URI;

async function removeBrowsePageAds() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Find browse placement ads that are approved
    console.log('\n🔍 Finding browse page ads...');
    const browseAds = await Advertising.find({ placement: 'browse', status: 'approved' })
      .sort({ createdAt: 1 })
      .limit(5);
    
    if (browseAds.length === 0) {
      console.log('❌ No browse page ads found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`✅ Found ${browseAds.length} browse page ads to remove`);
    
    // Display ads to be removed
    console.log('\n📋 Ads to be deactivated:');
    browseAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'} (ID: ${ad._id})`);
    });

    // Deactivate all 5 ads
    console.log('\n🔄 Deactivating ads...');
    const adIds = browseAds.map(ad => ad._id);
    
    const result = await Advertising.updateMany(
      { _id: { $in: adIds } },
      { status: 'deactivated' }
    );

    console.log(`✅ Successfully deactivated ${result.modifiedCount} ads`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removeBrowsePageAds();
