/**
 * Fix User Login Script
 * Activates and verifies the user account in MongoDB
 * Run: node fixUserLogin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Import the User model
const User = require('./models/User');

const fixUserLogin = async () => {
  try {
    console.log('\n🔧 Fixing user account...\n');

    // Update user: activate and verify email
    const user = await User.findOneAndUpdate(
      { email: 'dinethmalaka2004@gmail.com' },
      {
        isActive: true,
        isEmailVerified: true,
        isFaceVerified: true,
        isIDVerified: true
      },
      { new: true }
    );

    if (!user) {
      console.log('❌ User not found in database');
      process.exit(1);
    }

    console.log('✅ User account fixed successfully!\n');
    console.log('=== Login Credentials ===');
    console.log('Email:', user.email);
    console.log('Password: seller123');
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);
    console.log('Email Verified:', user.isEmailVerified);
    console.log('========================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing user:', error.message);
    process.exit(1);
  }
};

fixUserLogin();
