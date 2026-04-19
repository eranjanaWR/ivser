require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Advertising = require('./models/Advertising');
  const count = await Advertising.countDocuments();
  const all = await Advertising.find().lean();
  console.log('Total advertising requests:', count);
  console.log('Data:', JSON.stringify(all, null, 2));
  process.exit(0);
});
