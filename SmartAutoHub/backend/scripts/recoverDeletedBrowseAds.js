/**
 * Script to recover the 2 deleted browse ads
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Advertising = require('../models/Advertising');

const mongoUrl = process.env.MONGODB_URI;

async function recoverDeletedBrowseAds() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // The 2 ads to recover
    const adsToRecoverIds = [
      '69cf3f607c9fb5bf36bc2fad', // dcxd
      '69cf4e8a7c9fb5bf36bc358e'  // Toyota Lanka
    ];

    console.log('\n🔍 Finding deactivated browse ads to recover...');
    const deactivatedAds = await Advertising.find({ _id: { $in: adsToRecoverIds } });
    
    if (deactivatedAds.length === 0) {
      console.log('❌ No ads found to recover');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`✅ Found ${deactivatedAds.length} ads to recover`);
    
    // Display ads to be recovered
    console.log('\n📋 Ads to be recovered:');
    deactivatedAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'} (Current status: ${ad.status})`);
    });

    // Restore ads to approved status
    console.log('\n🔄 Restoring ads to approved status...');
    
    const result = await Advertising.updateMany(
      { _id: { $in: adsToRecoverIds } },
      { status: 'approved' }
    );

    console.log(`✅ Successfully recovered ${result.modifiedCount} ads`);

    // Show updated status
    console.log('\n📝 Verifying recovery...');
    const recoveredAds = await Advertising.find({ _id: { $in: adsToRecoverIds } });
    recoveredAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'} - Status: ${ad.status}`);
    });

    // Show all active browse ads
    console.log('\n📊 All active browse ads now:');
    const allActiveBrowse = await Advertising.find({ placement: 'browse', status: 'approved' })
      .sort({ createdAt: 1 });
    allActiveBrowse.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'}`);
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

recoverDeletedBrowseAds();
