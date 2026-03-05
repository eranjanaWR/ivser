/**
 * Script to create admin users
 * Run: node scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema (simplified for this script)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: String,
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: true },
  isIDVerified: { type: Boolean, default: true },
  isFaceVerified: { type: Boolean, default: true },
  isFlagged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const createAdminUsers = async () => {
  try {
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Admin1 - Full access admin
    const admin1 = await User.findOneAndUpdate(
      { email: 'admin1@smartautohub.com' },
      {
        firstName: 'Admin',
        lastName: 'One',
        email: 'admin1@smartautohub.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'admin1',
        isActive: true,
        isEmailVerified: true,
        isIDVerified: true,
        isFaceVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('Admin1 created:', admin1.email);
    
    // Admin2 - Verification management admin
    const admin2 = await User.findOneAndUpdate(
      { email: 'admin2@smartautohub.com' },
      {
        firstName: 'Admin',
        lastName: 'Two',
        email: 'admin2@smartautohub.com',
        password: hashedPassword,
        phone: '0987654321',
        role: 'admin2',
        isActive: true,
        isEmailVerified: true,
        isIDVerified: true,
        isFaceVerified: true
      },
      { upsert: true, new: true }
    );
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
