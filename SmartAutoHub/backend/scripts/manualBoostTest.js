/**
 * Script to manually create a boost like the frontend does
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

const createBoostManually = async () => {
  try {
    await connectDB();

    // Get the toyota CRZ vehicle
   const vehicle = await Vehicle.findOne({
      model: new RegExp('CRZ', 'i')
    });

    if (!vehicle) {
      console.log('❌ Vehicle not found');
      process.exit(1);
    }

    console.log(`\n🚗 Found vehicle: ${vehicle.brand} ${vehicle.model}`);
    console.log(`   ID: ${vehicle._id}`);
    console.log(`   Seller ID: ${vehicle.sellerId}`);

    // Get or create a test user
    let user = await User.findOne({ email: 'testuser@test.com' });
    if (!user) {
      user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@test.com',
        phone: '+94701234567',
        password: 'Test@123',
        role: 'seller',
        isEmailVerified: true,
        isIDVerified: true,
        isFaceVerified: true,
      });
      console.log('✓ Created test user');
    }

    console.log(`\n👤 User: ${user.firstName} ${user.lastName}`);
    console.log(`   ID: ${user._id}`);

    // Update vehicle to belong to this user so we can boost it
    vehicle.sellerId = user._id;
    await vehicle.save();
    console.log('✓ Updated vehicle owner');

    // Simulate exactly what the frontend sends
    const packageType = 'free';
    const duration = 28;
    const amount = 0;
    const startDate = new Date();
    const paymentMethod = 'free';
    const contactPerson = user.firstName + ' ' + user.lastName;
    const contactPhone = user.phone;
    const additionalNotes = 'Test boost';

    console.log(`\n📝 Creating boost with:`);
    console.log(`   Package: ${packageType}`);
    console.log(`   Duration: ${duration} days`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Start: ${startDate.toLocaleDateString('en-LK')}`);
    console.log(`   Payment: ${paymentMethod}`);
    console.log(`   Contact: ${contactPerson} / ${contactPhone}`);

    // Create boost exactly like the backend does
    const newBoost = new Boost({
      vehicleId: vehicle._id,
      userId: user._id,
      packageType,
      duration,
      amount,
      startDate: new Date(startDate),
      endDate: new Date(new Date(startDate).getTime() + duration * 24 * 60 * 60 * 1000),
      paymentMethod,
      contactPerson,
      contactPhone,
      additionalNotes,
      status: packageType === 'free' ? 'active' : 'pending'
    });

    console.log(`\n💾 Saving boost...`);
    console.log(`   Status: ${newBoost.status}`);
    console.log(`   End Date: ${newBoost.endDate.toLocaleDateString('en-LK')}`);

    try {
      const savedBoost = await newBoost.save();
      console.log(`\n✅ Boost saved successfully!`);
      console.log(`   Boost ID: ${savedBoost._id}`);
      console.log(`   Status: ${savedBoost.status}`);

      // Verify it was saved
      const verifyBoost = await Boost.findById(savedBoost._id);
      console.log(`\n✓ Verification: Boost found in database`);
      console.log(`   Vehicle: ${verifyBoost.vehicleId}`);
      console.log(`   Status: ${verifyBoost.status}`);

    } catch (saveError) {
      console.error(`\n❌ Error saving boost:`, saveError.message);
      if (saveError.errors) {
        console.log(`\nValidation errors:`);
        Object.keys(saveError.errors).forEach(key => {
          console.log(`  - ${key}: ${saveError.errors[key].message}`);
        });
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

createBoostManually();
