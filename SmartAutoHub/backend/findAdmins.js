const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const findAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const admins = await User.find({ role: { $in: ['admin1', 'admin2'] } }).select('_id name email role');
    console.log('Admin users found:', admins.length);
    if (admins.length > 0) {
      admins.forEach(a => console.log(`  - ${a._id}: ${a.name} (${a.role})`));
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

findAdmins();
