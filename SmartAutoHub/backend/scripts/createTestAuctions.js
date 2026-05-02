/**
 * Create Test Auctions Script
 * Populates the database with sample auctions for testing
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

async function createTestAuctions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create a seller
    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      seller = await User.create({
        firstName: 'Test',
        lastName: 'Seller',
        email: 'seller@test.com',
        password: 'password123',
        role: 'seller',
        phone: '+94700000000',
        isEmailVerified: true,
        isFullyVerified: true,
      });
      console.log('Created test seller');
    }

    // Get vehicles from the database
    const vehicles = await Vehicle.find({ sellerId: seller._id }).limit(5);

    if (vehicles.length === 0) {
      console.log('No vehicles found for seller. Please add vehicles first.');
      process.exit(1);
    }

    // Delete existing auctions to avoid duplicates
    await Auction.deleteMany({});
    console.log('Cleared existing auctions');

    const now = new Date();
    const auctions = [];

    // Create Live Auctions (started, ongoing)
    for (let i = 0; i < Math.min(2, vehicles.length); i++) {
      const vehicle = vehicles[i];
      auctions.push({
        vehicleId: vehicle._id,
        sellerId: seller._id,
        startingPrice: 800000 + i * 100000,
        currentPrice: 950000 + i * 150000,
        status: 'Live',
        startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Started 2 hours ago
        endDate: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Ends in 4 hours
        totalBids: 5 + i * 2,
        description: `Beautiful ${vehicle.year} ${vehicle.model} available for auction. Bid now to get the best deal!`
      });
    }

    // Create Upcoming Auctions (not started yet)
    for (let i = 2; i < Math.min(4, vehicles.length); i++) {
      const vehicle = vehicles[i];
      auctions.push({
        vehicleId: vehicle._id,
        sellerId: seller._id,
        startingPrice: 700000 + i * 100000,
        currentPrice: 700000 + i * 100000,
        status: 'Upcoming',
        startDate: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Starts in 2 hours
        endDate: new Date(now.getTime() + 8 * 60 * 60 * 1000), // Ends in 8 hours
        totalBids: 0,
        description: `Upcoming auction for ${vehicle.year} ${vehicle.model}. Register your interest!`
      });
    }

    // Create Completed Auctions
    if (vehicles.length > 4) {
      const vehicle = vehicles[4];
      auctions.push({
        vehicleId: vehicle._id,
        sellerId: seller._id,
        startingPrice: 600000,
        currentPrice: 880000,
        status: 'Completed',
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Started yesterday
        endDate: new Date(now.getTime() - 4 * 60 * 60 * 1000), // Ended 4 hours ago
        winnerId: null,
        totalBids: 12,
        description: `Auction completed. Thanks for bidding!`
      });
    }

    // Insert auctions
    const createdAuctions = await Auction.insertMany(auctions);
    console.log(`Created ${createdAuctions.length} test auctions:`);
    
    createdAuctions.forEach((auction, index) => {
      console.log(`  ${index + 1}. ${auction.status} - LKR ${auction.currentPrice.toLocaleString()}`);
    });

    console.log('\nTest data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestAuctions();
