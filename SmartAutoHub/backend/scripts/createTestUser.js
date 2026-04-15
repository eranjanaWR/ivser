/**
 * Script to create test user for development
 * Run: node scripts/createTestUser.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import the User model (includes pre-save password hashing hook)
const User = require('../models/User');

const createTestUser = async () => {
  try {
    // Delete existing test user if any
    await User.deleteMany({ email: 'udakarasachith19@gmail.com' });
    console.log('Cleaned up existing test user');
    
    // Create test buyer
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'udakarasachith19@gmail.com',
      password: 'test123456',
      phone: '9876543210',
      role: 'buyer',
      isActive: true,
      isEmailVerified: true,
      isIDVerified: true,
      isFaceVerified: true
    });
    await testUser.save();
    console.log('✅ Test user created successfully');
    
    console.log('\n=== Test User Credentials ===');
    console.log('Email: udakarasachith19@gmail.com');
    console.log('Password: test123456');
    console.log('Role: buyer');
    console.log('================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();
