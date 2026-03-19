/**
 * Script to create admin users
 * Run: node scripts/createAdmin.js
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

// Import the actual User model (includes pre-save password hashing hook)
const User = require('../models/User');

const createAdminUsers = async () => {
  try {
    // Delete existing admin users to create fresh
    await User.deleteMany({ email: { $in: ['admin1@smartautohub.com', 'admin2@smartautohub.com'] } });
    console.log('Deleted existing admin users');
    
    // Admin1 - Full access admin
    const admin1 = new User({
      firstName: 'Admin',
      lastName: 'One',
      email: 'admin1@smartautohub.com',
      password: 'admin123',
      phone: '1234567890',
      role: 'admin1',
      isActive: true,
      isEmailVerified: true,
      isIDVerified: true,
      isFaceVerified: true
    });
    await admin1.save();
    console.log('Admin1 created:', admin1.email);
    
    // Admin2 - Verification management admin
    const admin2 = new User({
      firstName: 'Admin',
      lastName: 'Two',
      email: 'admin2@smartautohub.com',
      password: 'admin123',
      phone: '0987654321',
      role: 'admin2',
      isActive: true,
      isEmailVerified: true,
      isIDVerified: true,
      isFaceVerified: true
    });
    await admin2.save();
    console.log('Admin2 created:', admin2.email);
    
    console.log('\n=== Admin Credentials ===');
    console.log('Admin1 (Full Access):');
    console.log('  Email: admin1@smartautohub.com');
    console.log('  Password: admin123');
    console.log('\nAdmin2 (Verification Management):');
    console.log('  Email: admin2@smartautohub.com');
    console.log('  Password: admin123');
    console.log('=========================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin users:', error);
    process.exit(1);
  }
};

createAdminUsers();
