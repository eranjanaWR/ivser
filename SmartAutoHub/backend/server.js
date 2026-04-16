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
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
  ],
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
const imageRoutes = require('./routes/image');
const testDriveRoutes = require('./routes/testDrive');
const buyerBookingRoutes = require('./routes/buyerBooking');
const breakdownRoutes = require('./routes/breakdown');
const adminRoutes = require('./routes/admin');
const predictionRoutes = require('./routes/prediction');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notification');
const availabilityRoutes = require('./routes/availability');
const auctionRoutes = require('./routes/auction');
const biddingRoutes = require('./routes/bidding');
const advertisingRoutes = require('./routes/advertising');
const chatRoutes = require('./routes/chat');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/test-drives', testDriveRoutes);
app.use('/api/buyer', buyerBookingRoutes);
app.use('/api/breakdowns', breakdownRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/auction-vehicles', auctionRoutes);
app.use('/api/bidding', biddingRoutes);
app.use('/api/advertising', advertisingRoutes);
app.use('/api/auction', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartAuto Hub API is running' });
});

// Socket.io connection handling for live auction and breakdown updates
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  
  // Join an auction room for live updates
  socket.on('joinAuction', (vehicleId) => {
    if (!vehicleId) {
      console.warn('⚠️ joinAuction: Missing vehicleId');
      return;
    }
    
    const roomName = `auction_${vehicleId}`;
    socket.join(roomName);
    console.log(`📍 User ${socket.id} joined room: ${roomName}`);
    console.log(`   Active users in ${roomName}:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
  });
  
  // Also listen for 'joinAuctionRoom' (frontend compatibility)
  socket.on('joinAuctionRoom', (vehicleId) => {
    if (!vehicleId) {
      console.warn('⚠️ joinAuctionRoom: Missing vehicleId');
      return;
    }
    
    const roomName = `auction_${vehicleId}`;
    socket.join(roomName);
    console.log(`📍 User ${socket.id} joined auction room: ${roomName}`);
    console.log(`   Active users in ${roomName}:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
  });
  
  // Handle chat messages - CRITICAL: Save to DB FIRST (STEP 1), then broadcast (STEP 1B)
  socket.on('send_chat_message', async (data) => {
    console.log('📨 [PERSISTENCE-SEND] Received send_chat_message from', socket.id);
    
    if (!data || !data.auctionId) {
      console.warn('⚠️ [PERSISTENCE-SEND] Missing auctionId or data');
      return;
    }

    const roomName = `auction_${data.auctionId}`;
    const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    console.log(`   Room: ${roomName} (${roomSize} users listening)`);

    // STEP 1: SAVE TO DATABASE FIRST (ATOMIC - BLOCKS UNTIL SAVED)
    try {
      const BiddingChat = require('./models/BiddingChat');
      
      const chatMessage = await BiddingChat.create({
        auctionId: data.auctionId,
        senderId: data.senderId || null,
        senderName: data.senderName || 'Anonymous',
        message: data.message.trim(),
        timestamp: new Date(), // Use current timestamp, not frontend timestamp
        // Manually map the reply data from nested replyingTo object
        replyToId: data.replyingTo?.id || null,
        replyToText: data.replyingTo?.text || null,
        replyToSender: data.replyingTo?.sender || null,
      });

      console.log(`✅ [PERSISTENCE-SEND-SAVE] Message saved to BiddingChat`);
      console.log(`   ID: ${chatMessage._id}`);
      console.log(`   Message: "${chatMessage.message}"`);
      console.log(`   DEBUG - Received data.replyingTo:`, JSON.stringify(data.replyingTo));
      console.log(`   Saved replyToId: ${chatMessage.replyToId || 'null'}`);
      console.log(`   Saved replyToText: ${chatMessage.replyToText ? `"${chatMessage.replyToText}"` : 'null'}`);
      console.log(`   Saved replyToSender: ${chatMessage.replyToSender || 'null'}`);
      if (chatMessage.replyToId) {
        console.log(`   ✅ [CRITICAL] Reply data persisted: Quoted "${chatMessage.replyToText}" by ${chatMessage.replyToSender}`);
      } else if (data.replyingTo) {
        console.log(`   ❌ [ERROR] replyingTo was sent but NOT saved! data.replyingTo: ${JSON.stringify(data.replyingTo)}`);
      }

      // STEP 1B: ONLY THEN broadcast to connected clients
      const broadcastData = {
        _id: chatMessage._id,
        auctionId: data.auctionId,
        senderId: data.senderId,
        senderName: data.senderName,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp,
        replyToId: chatMessage.replyToId,
        replyToText: chatMessage.replyToText,
        replyToSender: chatMessage.replyToSender,
      };

      io.to(roomName).emit('receive_chat_message', broadcastData);
      console.log(`✅ [PERSISTENCE-SEND-EMIT] Broadcasted to ${roomSize} users in ${roomName}`);

    } catch (error) {
      console.error(`❌ [PERSISTENCE-SEND-ERROR] Failed to save message to BiddingChat:`, error.message);
      // Emit error back to sender
      socket.emit('chat_error', {
        message: 'Failed to save message to database',
        error: error.message
      });
    }
  });
  
  // Leave an auction room
  socket.on('leaveAuction', (vehicleId) => {
    if (!vehicleId) return;
    
    const roomName = `auction_${vehicleId}`;
    socket.leave(roomName);
    console.log(`🚪 User ${socket.id} left room: ${roomName}`);
  });
  
  // Join a breakdown room for live updates
  socket.on('joinBreakdownRoom', (breakdownId) => {
    socket.join(`breakdown_${breakdownId}`);
    console.log(`📍 User ${socket.id} joined breakdown room: breakdown_${breakdownId}`);
  });
  
  // Leave a breakdown room
  socket.on('leaveBreakdownRoom', (breakdownId) => {
    socket.leave(`breakdown_${breakdownId}`);
    console.log(`🚪 User ${socket.id} left breakdown room: breakdown_${breakdownId}`);
  });
  
  // Repairman location update
  socket.on('updateRepairmanLocation', (data) => {
    const { breakdownId, location } = data;
    console.log(`📡 Repairman location update for breakdown: ${breakdownId}`);
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
    console.log(`📡 Repairman status update for breakdown: ${breakdownId} → ${status}`);
    io.to(`breakdown_${breakdownId}`).emit('repairmanStatusUpdate', {
      breakdownId,
      status,
      timestamp: new Date()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
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
