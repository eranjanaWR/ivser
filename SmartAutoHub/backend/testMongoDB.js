/**
 * Test MongoDB Connection
 * Verifies that your database connection works
 * Run: node testMongoDB.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('\n🔍 Testing MongoDB Connection...\n');
console.log('Connection String:', process.env.MONGODB_URI.substring(0, 50) + '...');

mongoose.connect(process.env.MONGODB_URI, {
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(() => {
    console.log('\n✅ SUCCESS! MongoDB Connected');
    console.log('Connected to:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('\n🎉 Your database is working perfectly!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ FAILED! MongoDB Connection Error:');
    console.error('Error:', err.message);
    console.error('\n⚠️ Troubleshooting:');
    console.error('1. Check MongoDB Atlas IP Whitelist (allow 0.0.0.0/0)');
    console.error('2. Verify username & password');
    console.error('3. Check internet connection');
    console.error('4. Try again in 30 seconds\n');
    process.exit(1);
  });
