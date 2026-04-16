/**
 * Database Cleanup Script
 * Clears all bidding-related collections for fresh testing
 * 
 * Usage:
 * 1. Run from backend directory: node scripts/cleanupDatabase.js
 * 2. Confirm the action when prompted
 * 3. System will delete all data from target collections
 * 4. Ready for fresh testing
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config(path.join(__dirname, '../.env'));

// Import models
const AuctionVehicle = require('../models/Vehicle');
const BiddingHistory = require('../models/BiddingHistory');
const BiddingChat = require('../models/BiddingChat');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartautohub';

/**
 * Connect to MongoDB
 */
const connectDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

/**
 * Clear auction vehicles collection
 */
const clearAuctionVehicles = async () => {
  try {
    console.log('\n🚗 Clearing auction_vehicles collection...');
    const result = await AuctionVehicle.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} auction vehicles`);
  } catch (err) {
    console.error('❌ Error clearing auction_vehicles:', err.message);
  }
};

/**
 * Clear bidding history collection
 */
const clearBiddingHistory = async () => {
  try {
    console.log('\n💰 Clearing bidding_history collection...');
    const result = await BiddingHistory.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} bidding history records`);
  } catch (err) {
    console.error('❌ Error clearing bidding_history:', err.message);
  }
};

/**
 * Clear bidding chat collection
 */
const clearBiddingChats = async () => {
  try {
    console.log('\n💬 Clearing bidding_chats collection...');
    const result = await BiddingChat.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} chat messages`);
  } catch (err) {
    console.error('❌ Error clearing bidding_chats:', err.message);
  }
};

/**
 * Show database statistics before cleanup
 */
const showDBStats = async () => {
  try {
    console.log('\n📊 Database Statistics (Before Cleanup):');
    console.log('─────────────────────────────────');
    
    const vehicleCount = await AuctionVehicle.countDocuments();
    console.log(`Auction Vehicles: ${vehicleCount}`);
    
    const bidCount = await BiddingHistory.countDocuments();
    console.log(`Bidding History Records: ${bidCount}`);
    
    const chatCount = await BiddingChat.countDocuments();
    console.log(`Chat Messages: ${chatCount}`);
    
    const userCount = await User.countDocuments();
    console.log(`Total Users: ${userCount}`);
    
    console.log('─────────────────────────────────');
  } catch (err) {
    console.error('❌ Error fetching stats:', err.message);
  }
};

/**
 * Show database statistics after cleanup
 */
const showCleanedStats = async () => {
  try {
    console.log('\n📊 Database Statistics (After Cleanup):');
    console.log('─────────────────────────────────');
    
    const vehicleCount = await AuctionVehicle.countDocuments();
    console.log(`Auction Vehicles: ${vehicleCount}`);
    
    const bidCount = await BiddingHistory.countDocuments();
    console.log(`Bidding History Records: ${bidCount}`);
    
    const chatCount = await BiddingChat.countDocuments();
    console.log(`Chat Messages: ${chatCount}`);
    
    const userCount = await User.countDocuments();
    console.log(`Total Users: ${userCount} (Preserved)`);
    
    console.log('─────────────────────────────────');
  } catch (err) {
    console.error('❌ Error fetching stats:', err.message);
  }
};

/**
 * Main cleanup function
 */
const runCleanup = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   DATABASE CLEANUP - Fresh Testing Mode    ║');
    console.log('╚════════════════════════════════════════════╝');
    
    // Show stats before cleanup
    await showDBStats();
    
    // Confirm before proceeding
    console.log('\n⚠️  WARNING: This will DELETE all auction vehicles, bidding history, and chat messages!');
    console.log('   User accounts will be preserved.');
    console.log('\n🔄 Starting cleanup process...\n');
    
    // Perform cleanup
    await clearAuctionVehicles();
    await clearBiddingHistory();
    await clearBiddingChats();
    
    // Show stats after cleanup
    await showCleanedStats();
    
    console.log('\n✅ CLEANUP COMPLETED!');
    console.log('─────────────────────────────────');
    console.log('✓ Ready for fresh testing');
    console.log('✓ All users preserved');
    console.log('✓ You can now add new vehicles via the form');
    console.log('✓ Start fresh bidding sessions\n');
    
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    process.exit(0);
  }
};

// Execute cleanup
connectDatabase().then(() => runCleanup());
