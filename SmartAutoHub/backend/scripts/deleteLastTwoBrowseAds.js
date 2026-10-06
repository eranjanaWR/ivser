/**
 * Script to delete the last 2 browse page ads
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Advertising = require('../models/Advertising');

const mongoUrl = process.env.MONGODB_URI;

async function deleteLastTwoBrowseAds() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Finding all browse placement ads in order...');
    const allBrowseAds = await Advertising.find({ placement: 'browse', status: 'approved' })
      .sort({ createdAt: 1 });
    
    if (allBrowseAds.length === 0) {
      console.log('❌ No browse ads found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`✅ Found ${allBrowseAds.length} browse placement ads`);
    
    // Get the last 2 ads
    const lastTwoAds = allBrowseAds.slice(-2);
    
    console.log('\n📋 All current browse ads:');
    allBrowseAds.forEach((ad, index) => {
      const isLast = lastTwoAds.some(a => a._id.toString() === ad._id.toString());
      const marker = isLast ? '❌ DELETE' : '✅ KEEP';
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'} (ID: ${ad._id}) ${marker}`);
    });

    // Deactivate the last 2 ads
    console.log('\n🔄 Deactivating last 2 browse ads...');
    const lastTwoIds = lastTwoAds.map(ad => ad._id);
    
    const result = await Advertising.updateMany(
      { _id: { $in: lastTwoIds } },
      { status: 'deactivated' }
    );

    console.log(`✅ Successfully deactivated ${result.modifiedCount} ads`);

    // Show remaining ads
    console.log('\n📝 Remaining active browse ads:');
    const remainingAds = allBrowseAds.filter(ad => !lastTwoIds.some(id => id.toString() === ad._id.toString()));
    remainingAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.company || 'Unknown'} (ID: ${ad._id})`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Done! Last 2 browse ads have been deleted.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteLastTwoBrowseAds();
