/**
 * Script to create test vehicles with sample images from the uploads folder
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Vehicle = require('../models/Vehicle');
const Image = require('../models/Image');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createTestVehiclesWithImages = async () => {
  try {
    await connectDB();

    // Get or create a test seller
    let seller = await User.findOne({ email: 'seller@test.com' });
    if (!seller) {
      seller = await User.create({
        firstName: 'Test',
        lastName: 'Seller',
        email: 'seller@test.com',
        phone: '+94701234567',
        password: 'Test@123', // Should be hashed in production
        role: 'seller',
        isEmailVerified: true,
        isIDVerified: true,
        isFaceVerified: true,
      });
      console.log('✓ Created test seller');
    }

    // Sample vehicle data
    const testVehicles = [
      {
        brand: 'Toyota',
        model: 'Coster',
        year: 2020,
        mileage: 45000,
        price: 2500000,
        fuelType: 'diesel',
        transmission: 'manual',
        bodyType: 'bus',
        color: 'white',
        condition: 'used',
        description: 'Well maintained Toyota Coster bus',
        location: { city: 'Colombo', state: 'Western', country: 'Sri Lanka' },
      },
      {
        brand: 'Toyota',
        model: 'Hiace',
        year: 2021,
        mileage: 32000,
        price: 3200000,
        fuelType: 'petrol',
        transmission: 'automatic',
        bodyType: 'van',
        color: 'silver',
        condition: 'new',
        description: 'New Toyota Hiace van with full features',
        location: { city: 'Kandy', state: 'Central', country: 'Sri Lanka' },
      },
      {
        brand: 'Toyota',
        model: 'Alphrad',
        year: 2019,
        mileage: 62000,
        price: 3900000,
        fuelType: 'petrol',
        transmission: 'automatic',
        bodyType: 'sedan',
        color: 'black',
        condition: 'used',
        description: 'Premium Toyota Alphrad sedan',
        location: { city: 'Galle', state: 'Southern', country: 'Sri Lanka' },
      },
    ];

    // Get sample images from uploads folder
    const uploadsPath = path.join(__dirname, '../uploads/vehicles');
    let imageFiles = [];

    if (fs.existsSync(uploadsPath)) {
      imageFiles = fs
        .readdirSync(uploadsPath)
        .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .slice(0, 9); // Get up to 9 images
      console.log(`✓ Found ${imageFiles.length} sample images in uploads folder`);
    }

    // Create vehicles with images
    for (let i = 0; i < testVehicles.length; i++) {
      const vehicleData = {
        ...testVehicles[i],
        sellerId: seller._id,
        status: 'active',
      };

      // Check if vehicle already exists
      let vehicle = await Vehicle.findOne({
        brand: vehicleData.brand,
        model: vehicleData.model,
        year: vehicleData.year,
        sellerId: seller._id,
      });

      if (!vehicle) {
        vehicle = await Vehicle.create(vehicleData);
        console.log(`✓ Created ${vehicleData.brand} ${vehicleData.model}`);
      } else {
        console.log(`→ ${vehicleData.brand} ${vehicleData.model} already exists`);
        continue;
      }

      // Add images if available
      if (imageFiles.length > 0) {
        const imagesToAdd = imageFiles.slice(0, 2); // Add up to 2 images per vehicle

        for (let j = 0; j < imagesToAdd.length; j++) {
          const filename = imagesToAdd[j];
          const filepath = path.join(uploadsPath, filename);

          try {
            // Read image file
            const fileData = fs.readFileSync(filepath);
            const base64Data = fileData.toString('base64');

            // Determine mime type
            const ext = path.extname(filename).toLowerCase();
            const mimeTypeMap = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
            };
            const mimeType = mimeTypeMap[ext] || 'image/jpeg';

            // Create image document
            const image = await Image.create({
              vehicleId: vehicle._id,
              filename: filename,
              imageData: base64Data,
              mimeType: mimeType,
              fileSize: fileData.length,
              order: j,
            });

            // Add image reference to vehicle
            vehicle.images.push(image._id);
          } catch (err) {
            console.error(`✗ Error adding image ${filename}:`, err.message);
          }
        }

        // Save vehicle with image references
        await vehicle.save();
        console.log(`  ✓ Added ${imagesToAdd.length} images to ${vehicleData.model}`);
      }
    }

    console.log('\n✓ Test vehicles created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

// Run script
createTestVehiclesWithImages();
