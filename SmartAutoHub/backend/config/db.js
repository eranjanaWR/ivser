/**
 * Database Configuration
 * Connects to MongoDB Atlas using Mongoose
 */

const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB Atlas
 * Uses environment variable for connection string
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8+ uses these options by default
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
