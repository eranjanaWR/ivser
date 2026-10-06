require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  socketTimeoutMS: 60000,
  serverSelectionTimeoutMS: 60000,
  maxPoolSize: 10
}).then(async () => {
  try {
    console.log('✓ Connected to MongoDB');
    const Advertising = require('./models/Advertising');
    
    // Count documents
    const count = await Advertising.countDocuments();
    console.log('Total documents:', count);
    
    // Find all with simple query
    const all = await Advertising.find({}).limit(5);
    console.log('Found documents:', all.length);
    
    all.forEach((doc, idx) => {
      console.log(`${idx + 1}. ${doc.company || 'Unknown'} - ${doc.status}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
