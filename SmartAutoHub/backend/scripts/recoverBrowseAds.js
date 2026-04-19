/**
 * Script to recover (restore) the 5 browse page ads
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Advertising = require('../models/Advertising');

const mongoUrl = process.env.MONGODB_URI;

async function recoverBrowsePageAds() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // The 5 ads that were deactivated
    const adIdsToRecover = [
      '69cf4e8a7c9fb5bf36bc358e', // Toyota Lanka
      '69d168393040dd144b6c1aa4', // Not provided
      '69cf3f3a7c9fb5bf36bc2fab', // asdas
      '69cf3f0a7c9fb5bf36bc2fa9', // asas
      '69cf3f607c9fb5bf36bc2fad'  // dcxd
    ];

    console.log('\n🔍 Finding deactivated browse ads to recover...');
    const ads = await Advertising.find({ _id: { $in: adIdsToRecover } });
    
    if (ads.length === 0) {
      console.log('❌ No ads found to recover');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`✅ Found ${ads.length} ads to recover`);
    
    // Display ads to be recovered
    console.log('\n📋 Ads to be recovered:');
    ads.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'} (Current status: ${ad.status})`);
    });

    // Restore all ads to approved status
    console.log('\n🔄 Restoring ads to approved status...');
    
    const result = await Advertising.updateMany(
      { _id: { $in: adIdsToRecover } },
      { status: 'approved' }
    );

    console.log(`✅ Successfully recovered ${result.modifiedCount} ads`);

    // Show updated status
    console.log('\n📝 Verifying recovery...');
    const recoveredAds = await Advertising.find({ _id: { $in: adIdsToRecover } });
    recoveredAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'} - Status: ${ad.status}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Done! Ads have been recovered.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

recoverBrowsePageAds();
