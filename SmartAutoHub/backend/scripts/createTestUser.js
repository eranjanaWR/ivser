/**
 * Script to create test users for development
 * Run: node scripts/createTestUser.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createTestUsers = async () => {
  try {
    
    await User.deleteMany({ 
      email: { $in: ['dinethmalaka2004@gmail.com', 'udakarasachith19@gmail.com'] } 
    });
    console.log('Cleaned up existing test users');
    
    
    const userDineth = new User({
      firstName: 'Dineth',
      lastName: 'Malaka',
      email: 'dinethmalaka2004@gmail.com',
      password: 'test123456',
      phone: '9876543210',
      role: 'buyer',
      isActive: true,
      isEmailVerified: true,
      isIDVerified: true,
      isFaceVerified: true
    });

    
    const userOther = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'udakarasachith19@gmail.com',
      password: 'test123456',
      phone: '1234567890',
      role: 'buyer',
      isActive: true,
      isEmailVerified: true,
      isIDVerified: true,
      isFaceVerified: true
    });

    await Promise.all([userDineth.save(), userOther.save()]);
    
    console.log('✅ Both test users created successfully');
    console.log('\n--- Credentials ---');
    console.log('User 1: dinethmalaka2004@gmail.com');
    console.log('User 2: udakarasachith19@gmail.com');
    console.log('Password: test123456');
    console.log('-------------------\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
};

createTestUsers();