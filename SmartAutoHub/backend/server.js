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
app.use(express.static(frontendPath));

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
const advertisingRoutes = require('./routes/advertising');
// Routes from your feature branch
const availabilityRoutes = require('./routes/availability');
const auctionRoutes = require('./routes/auction');
const biddingRoutes = require('./routes/bidding');
const chatRoutes = require('./routes/chat');
const BiddingChat = require('./models/BiddingChat');
const DealMessage = require('./models/DealMessage'); // ✅ NEW: Private Chat Model
const Breakdown = require('./models/Breakdown');

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
app.use('/api/advertising', advertisingRoutes);
// Your specific feature API endpoints
app.use('/api/availability', availabilityRoutes);
app.use('/api/auction-vehicles', auctionRoutes);
app.use('/api/bidding', biddingRoutes);
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
    if (!vehicleId) return;
    const roomName = `auction_${vehicleId}`;
    socket.join(roomName);
    console.log(`📍 User ${socket.id} joined room: ${roomName}`);
  });
  
  // Also listen for 'joinAuctionRoom' (frontend compatibility)
  socket.on('joinAuctionRoom', (vehicleId) => {
    if (!vehicleId) return;
    const roomName = `auction_${vehicleId}`;
    socket.join(roomName);
    console.log(`📍 User ${socket.id} joined auction room: ${roomName}`);
  });
  
  // Handle chat messages with DB persistence
  socket.on('send_chat_message', async (data) => {
    if (!data || !data.auctionId) return;
    const roomName = `auction_${data.auctionId}`;

    try {
      const BiddingChat = require('./models/BiddingChat');
      const chatMessage = await BiddingChat.create({
        auctionId: data.auctionId,
        senderId: data.senderId || null,
        senderName: data.senderName || 'Anonymous',
        message: data.message.trim(),
        timestamp: new Date(),
        replyToId: data.replyingTo?.id || null,
        replyToText: data.replyingTo?.text || null,
        replyToSender: data.replyingTo?.sender || null,
      });

      const broadcastData = {
        _id: chatMessage._id,
        clientMessageId: data.clientMessageId, // Added for frontend deduplication
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
    } catch (error) {
      console.error(`❌ Chat save error:`, error.message);
      socket.emit('chat_error', { message: 'Failed to save message' });
    }
  });
  
  // Leave an auction room
  socket.on('leaveAuction', (vehicleId) => {
    if (!vehicleId) return;
    socket.leave(`auction_${vehicleId}`);
  });
  
  // Join a breakdown room for live updates
  socket.on('joinBreakdownRoom', (breakdownId) => {
    socket.join(`breakdown_${breakdownId}`);
  });
  
  // Repairman location/status updates
  socket.on('updateRepairmanLocation', (data) => {
    io.to(`breakdown_${data.breakdownId}`).emit('repairmanLocationUpdate', { ...data, timestamp: new Date() });
  });
  
  socket.on('updateRepairmanStatus', (data) => {
    io.to(`breakdown_${data.breakdownId}`).emit('repairmanStatusUpdate', { ...data, timestamp: new Date() });
  });

  // --- ✅ NEW: POST-AUCTION PRIVATE CHAT (Seller & Winner) ---
  
  // Join private deal room
  socket.on('joinPrivateDeal', (vehicleId) => {
    if (!vehicleId) return;
    const roomName = `private_deal_${vehicleId}`;
    socket.join(roomName);
    console.log(`🔒 [SOCKET] User joined private deal room: ${roomName}`);
  });

  // Handle private message
  socket.on('sendPrivateMessage', async (data) => {
    const { vehicleId, senderId, senderName, message } = data;
    const roomName = `private_deal_${vehicleId}`;

    console.log(`💬 [PRIVATE] Message from ${senderName} in room ${roomName}`);

    try {
      const { saveDealMessage } = require('./controllers/auctionController');
      
      // PERSISTENCE: Save to database using controller
      const savedMessage = await saveDealMessage(data);

      // BROADCAST: Only to the private room, AFTER successful save
      const broadcastData = {
        ...data,
        timestamp: savedMessage.createdAt || new Date().toISOString(),
        _id: savedMessage._id // Send back the DB ID to help with duplicate prevention
      };

      io.to(roomName).emit('receive_private_message', broadcastData);
    } catch (error) {
      console.error(`❌ [PRIVATE] Message save error:`, error.message);
      socket.emit('private_chat_error', { message: 'Failed to save private message' });
    }
  });

  // Leave private room
  socket.on('leavePrivateDeal', (vehicleId) => {
    if (!vehicleId) return;
    socket.leave(`private_deal_${vehicleId}`);
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
    message: err.message || 'Internal Server Error'
  });
});

// Serve React frontend
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };