/**
 * Script to remove all browse ads except specific ones
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Advertising = require('../models/Advertising');

const mongoUrl = process.env.MONGODB_URI;

async function removeOtherBrowseAds() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // The 4 ads to KEEP
    const adIdsToKeep = [
      '69cf3f3a7c9fb5bf36bc2fab', // asas
      '69cf3f0a7c9fb5bf36bc2fa9', // asdas
      '69cf3f607c9fb5bf36bc2fad', // dcxd
      '69cf4e8a7c9fb5bf36bc358e'  // Toyota Lanka
    ];

    console.log('\n🔍 Finding all browse placement ads...');
    const allBrowseAds = await Advertising.find({ placement: 'browse', status: 'approved' });
    
    if (allBrowseAds.length === 0) {
      console.log('❌ No browse ads found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`✅ Found ${allBrowseAds.length} browse placement ads total`);
    
    // Find ads to deactivate (all except the 4 to keep)
    const adsToRemove = allBrowseAds.filter(ad => !adIdsToKeep.includes(ad._id.toString()));
    
    if (adsToRemove.length === 0) {
      console.log('✅ No other ads to remove. Only the 4 required ads exist.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`\n📋 Ads to be deactivated (${adsToRemove.length}):`);
    adsToRemove.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'} (ID: ${ad._id})`);
    });

    // Display ads to keep
    console.log('\n✨ Ads to KEEP:');
    const adsToKeep = allBrowseAds.filter(ad => adIdsToKeep.includes(ad._id.toString()));
    adsToKeep.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'} (ID: ${ad._id})`);
    });

    // Deactivate all other ads
    console.log('\n🔄 Deactivating other browse ads...');
    const adsToRemoveIds = adsToRemove.map(ad => ad._id);
    
    const result = await Advertising.updateMany(
      { _id: { $in: adsToRemoveIds } },
      { status: 'deactivated' }
    );

    console.log(`✅ Successfully deactivated ${result.modifiedCount} ads`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Done! Only the 4 specified browse ads remain active.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removeOtherBrowseAds();
