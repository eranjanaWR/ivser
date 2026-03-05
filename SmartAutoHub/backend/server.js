/**
 * SmartAuto Hub - Main Server File
 * Express server with Socket.io for real-time features
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible to routes
app.set('io', io);

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const vehicleRoutes = require('./routes/vehicle');
const testDriveRoutes = require('./routes/testDrive');
const breakdownRoutes = require('./routes/breakdown');
const adminRoutes = require('./routes/admin');
const predictionRoutes = require('./routes/prediction');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/test-drives', testDriveRoutes);
app.use('/api/breakdowns', breakdownRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prediction', predictionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartAuto Hub API is running' });
});

// Socket.io connection handling for live location updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join a breakdown room for live updates
  socket.on('joinBreakdownRoom', (breakdownId) => {
    socket.join(`breakdown_${breakdownId}`);
    console.log(`User joined breakdown room: ${breakdownId}`);
  });
  
  // Leave a breakdown room
  socket.on('leaveBreakdownRoom', (breakdownId) => {
    socket.leave(`breakdown_${breakdownId}`);
    console.log(`User left breakdown room: ${breakdownId}`);
  });
  
  // Repairman location update
  socket.on('updateRepairmanLocation', (data) => {
    const { breakdownId, location } = data;
    // Broadcast to the specific breakdown room
    io.to(`breakdown_${breakdownId}`).emit('repairmanLocationUpdate', {
      breakdownId,
      location,
      timestamp: new Date()
    });
  });
  
  // Repairman status update
  socket.on('updateRepairmanStatus', (data) => {
    const { breakdownId, status } = data;
    io.to(`breakdown_${breakdownId}`).emit('repairmanStatusUpdate', {
      breakdownId,
      status,
      timestamp: new Date()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
