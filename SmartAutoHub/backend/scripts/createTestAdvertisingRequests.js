/**
 * Script to create test advertising requests for development
 * Run: node scripts/createTestAdvertisingRequests.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import the Advertising model
const Advertising = require('../models/Advertising');

const createTestAdvertisingRequests = async () => {
  try {
    // Delete existing test advertising requests
    await Advertising.deleteMany({ email: { $in: ['test1@company.com', 'test2@company.com', 'test3@company.com'] } });
    console.log('Cleaned up existing test advertising requests');
    
    // Create test advertising requests
    const testRequests = [
      {
        name: 'John Smith',
        email: 'test1@company.com',
        phone: '9876543210',
        company: 'AutoCare Solutions',
        message: 'Looking to advertise our repair services',
        packageName: 'Starter',
        placement: 'browse',
        adPhotoUpload: true,
        adPhotoUrl: '/uploads/advertising/test1.jpg',
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'credit_card',
        paymentRefNumber: 'REF001',
        cardholderName: 'John Smith',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        submittedAt: new Date()
      },
      {
        name: 'Sarah Johnson',
        email: 'test2@company.com',
        phone: '8765432109',
        company: 'Premium Motors',
        message: 'Premium package for vehicle sales advertising',
        packageName: 'Professional',
        placement: 'home',
        adPhotoUpload: true,
        adPhotoUrl: '/uploads/advertising/test2.jpg',
        status: 'approved',
        paymentStatus: 'completed',
        paymentMethod: 'debit_card',
        paymentRefNumber: 'REF002',
        cardholderName: 'Sarah Johnson',
        cardNumber: '5555555555554444',
        expiryDate: '06/26',
        cvv: '456',
        submittedAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        name: 'Mike Wilson',
        email: 'test3@company.com',
        phone: '7654321098',
        company: 'Quick Fix Garage',
        message: 'Free trial for testing',
        packageName: 'Free Trial',
        placement: 'browse',
        adPhotoUpload: true,
        adPhotoUrl: '/uploads/advertising/test3.jpg',
        status: 'pending',
        paymentStatus: 'free',
        paymentMethod: 'none',
        submittedAt: new Date(Date.now() - 172800000) // 2 days ago
      }
    ];

    const createdRequests = await Advertising.insertMany(testRequests);
    console.log(`✅ Created ${createdRequests.length} test advertising requests successfully\n`);
    
    console.log('=== Created Advertising Requests ===');
    createdRequests.forEach((req, idx) => {
      console.log(`\n${idx + 1}. ${req.company}`);
      console.log(`   Email: ${req.email}`);
      console.log(`   Package: ${req.packageName}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Payment Status: ${req.paymentStatus}`);
    });
    console.log('\n====================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test advertising requests:', error);
    process.exit(1);
  }
};

createTestAdvertisingRequests();
