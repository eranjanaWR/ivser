/**
 * Script to create test boosts for existing vehicles
 * This will add featured/premium boosts to display in the Premium Posts section
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Vehicle = require('../models/Vehicle');
const Boost = require('../models/Boost');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createTestBoosts = async () => {
  try {
    await connectDB();

    // Get or create a test seller
    let seller = await User.findOne({ email: 'seller@test.com' });
    if (!seller) {
      seller = await User.create({
        firstName: 'Test',
        lastName: 'Seller',
        email: 'seller@test.com',
        phone: '+94701234567',
        password: 'Test@123',
        role: 'seller',
        isEmailVerified: true,
        isIDVerified: true,
        isFaceVerified: true,
      });
      console.log('✓ Created test seller');
    }

    // Get first 6 vehicles
    const vehicles = await Vehicle.find({ status: 'active' }).limit(6);
    
    if (vehicles.length === 0) {
      console.log('✗ No active vehicles found. Please create test vehicles first.');
      process.exit(1);
    }

    console.log(`✓ Found ${vehicles.length} vehicles`);

    // Delete existing boosts for these vehicles
    await Boost.deleteMany({
      vehicleId: { $in: vehicles.map(v => v._id) }
    });
    console.log('✓ Cleared existing boosts');

    // Create boosts for each vehicle
    const packageTypes = ['free', 'standard', 'premium', 'elite'];
    const boosts = [];

    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      const packageType = packageTypes[i % packageTypes.length];
      
      // Calculate duration based on package type
      const durations = {
        free: 28,      // 28 days
        standard: 14,  // 14 days
        premium: 30,   // 30 days
        elite: 60      // 60 days
      };
      
      const amounts = {
        free: 0,
        standard: 5000,
        premium: 10000,
        elite: 20000
      };

      const duration = durations[packageType];
      const amount = amounts[packageType];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      const boost = await Boost.create({
        vehicleId: vehicle._id,
        userId: seller._id,
        packageType: packageType,
        duration: duration,
        amount: amount,
        startDate: startDate,
        endDate: endDate,
        status: 'active',
        contactPerson: seller.firstName + ' ' + seller.lastName,
        contactPhone: seller.phone,
        paymentMethod: packageType === 'free' ? 'free' : 'credit_card'
      });

      boosts.push(boost);
      console.log(`✓ Created ${packageType.toUpperCase()} boost for ${vehicle.brand} ${vehicle.model} (ends: ${endDate.toLocaleDateString('en-LK')})`);
    }

    console.log(`\n✓ Successfully created ${boosts.length} boosts!`);
    console.log('The Premium Posts section should now display featured vehicles.');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error creating test boosts:', error.message);
    process.exit(1);
  }
};

// Run the script
createTestBoosts();
