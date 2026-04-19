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
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 120000,
      family: 4,
      maxPoolSize: 20,
      minPoolSize: 5,
      maxIdleTimeMS: 60000,
      waitQueueTimeoutMS: 60000,
      connectTimeoutMS: 120000
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
