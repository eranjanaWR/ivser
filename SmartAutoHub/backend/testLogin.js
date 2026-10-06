require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async() => {
  console.log('Connected to MongoDB');
  
  // Find the admin user
  const admin = await User.findOne({email: 'admin1@smartautohub.com'}).select('+password');
  
  if (!admin) {
    console.log('Admin user not found');
    process.exit(1);
  }
  
  console.log('Admin user found:');
  console.log('Email:', admin.email);
  console.log('Password hash:', admin.password.substring(0, 20) + '...');
  
  // Test password comparison
  const isMatch = await admin.comparePassword('admin123');
  console.log('Password match result:', isMatch);
  
  // Also test with bcrypt directly
  const directMatch = await bcrypt.compare('admin123', admin.password);
  console.log('Direct bcrypt comparison:', directMatch);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
