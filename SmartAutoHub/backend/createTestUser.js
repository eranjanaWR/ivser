/**
 * Create Test User
 * Quick script to create a test user account for login testing
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const connectDB = require('./config/db');

const createTestUser = async () => {
  try {
    // Connect to DB
    await connectDB();
    console.log('📡 Connected to MongoDB');

    // Delete if exists
    await User.deleteOne({ email: 'test@smartautohub.com' });
    console.log('🗑️ Cleared old test user');

    // Create test user
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@smartautohub.com',
      password: 'password123',
      phone: '1234567890',
      role: 'buyer',
      isEmailVerified: true
    });

    console.log('✅ Test user created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: test@smartautohub.com');
    console.log('   Password: password123');
    console.log('\n🌐 Go to: http://localhost:3000/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUser();
