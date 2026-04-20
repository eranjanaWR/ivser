/**
 * SmartAuto Hub - Main Server File
 * Express server with Socket.io for real-time features
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { createProxyMiddleware } = require('http-proxy-middleware');
const connectDB = require('./config/db');

// Allow both single-port mode (5000) and optional split-port local dev.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003'
].filter(Boolean);

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend build files
const frontendPath = path.join(__dirname, '../frontend/build');
const isProduction = process.env.NODE_ENV === 'production';
const serveFrontendBuild = isProduction || process.env.SERVE_FRONTEND_BUILD === 'true';
const frontendDevServer = process.env.FRONTEND_DEV_SERVER || 'http://localhost:3000';
const frontendDevProxy = createProxyMiddleware({
  target: frontendDevServer,
  changeOrigin: true,
  ws: true
});

if (serveFrontendBuild) {
  app.use(express.static(frontendPath));
}

// Make io accessible to routes
app.set('io', io);

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const vehicleRoutes = require('./routes/vehicle');
const imageRoutes = require('./routes/image');
const testDriveRoutes = require('./routes/testDrive');
const breakdownRoutes = require('./routes/breakdown');
const adminRoutes = require('./routes/admin');
const predictionRoutes = require('./routes/prediction');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notification');
const priceNotificationRoutes = require('./routes/priceNotifications');
const advertisingRoutes = require('./routes/advertising');
const financialRoutes = require('./routes/financial');


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/test-drives', testDriveRoutes);
app.use('/api/breakdowns', breakdownRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user/price-notifications', priceNotificationRoutes);
app.use('/api/advertising', advertisingRoutes);
app.use('/api/financial', financialRoutes);

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

// Serve React frontend for any non-API route (must be after API routes)
app.get('*', (req, res, next) => {
  if (serveFrontendBuild) {
    return res.sendFile(path.join(frontendPath, 'index.html'));
  }

  // In development, forward non-API routes to CRA so HMR works,
  // while keeping backend and API on localhost:5000.
  return frontendDevProxy(req, res, next);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
