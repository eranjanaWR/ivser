/**
 * Script to deactivate Premium Motors ad
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Advertising = require('../models/Advertising');

const mongoUrl = process.env.MONGODB_URI;

async function removePremiumMotorsAd() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URL:', mongoUrl ? mongoUrl.substring(0, 50) + '...' : 'Not found');
    
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Find Premium Motors ad
    console.log('\n🔍 Finding Premium Motors ad...');
    const ad = await Advertising.findOne({ company: 'Premium Motors' });
    
    if (!ad) {
      console.log('❌ Premium Motors ad not found');
      process.exit(1);
    }

    console.log('✅ Found ad:', {
      _id: ad._id,
      company: ad.company,
      status: ad.status,
      placement: ad.placement
    });

    // Deactivate the ad
    console.log('\n🔄 Deactivating Premium Motors ad...');
    const updated = await Advertising.findByIdAndUpdate(
      ad._id,
      { status: 'deactivated' },
      { new: true }
    );

    console.log('✅ Ad deactivated successfully');
    console.log('📝 Updated status:', updated.status);

    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removePremiumMotorsAd();
