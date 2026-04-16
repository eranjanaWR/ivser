/**
 * Socket.io Chat Handler - Add this to your server.js Socket.io setup
 * 
 * This code should be integrated into your existing Socket.io connection handler
 * in the server.js file, typically within the socket.on('connection') handler.
 */

// ============================================================================
// ADD THIS TO YOUR server.js Socket.io SETUP (within socket.on('connection'))
// ============================================================================

// Import the ChatMessage model at the top of server.js
// const { ChatMessage } = require('./models');

/**
 * Socket.io Chat Handler - Add within io.on('connection', (socket) => { ... })
 */

// Store active users per auction room
const auctionRoomUsers = new Map();

// Join chat room
socket.on('joinChatRoom', async (data) => {
  const { auctionId } = data;
  const roomName = `auction-chat-${auctionId}`;

  try {
    // Join the room
    socket.join(roomName);

    // Track user in room
    if (!auctionRoomUsers.has(auctionId)) {
      auctionRoomUsers.set(auctionId, new Set());
    }
    auctionRoomUsers.get(auctionId).add(socket.id);

    // Broadcast active user count
    const activeCount = auctionRoomUsers.get(auctionId).size;
    io.to(roomName).emit('activeUsers', activeCount);

    console.log(`✅ User joined chat room: ${roomName} (Active: ${activeCount})`);
  } catch (error) {
    console.error('Error joining chat room:', error);
    socket.emit('error', { message: 'Failed to join chat room' });
  }
});

// Handle incoming chat messages
socket.on('sendChatMessage', async (messageData) => {
  try {
    const { auctionId, senderId, senderName, message, timestamp } = messageData;

    if (!auctionId || !senderId || !message) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }

    // Save message to database
    const chatMessage = new ChatMessage({
      auctionId,
      senderId,
      senderName: senderName || 'Anonymous',
      message: message.trim(),
      timestamp: timestamp || new Date().toISOString(),
    });

    await chatMessage.save();

    // Broadcast message to all users in the room
    const roomName = `auction-chat-${auctionId}`;
    io.to(roomName).emit('chatMessage', {
      id: chatMessage._id,
      auctionId,
      senderId,
      senderName,
      message: message.trim(),
      timestamp: chatMessage.timestamp,
    });

    console.log(`📨 Chat message saved for auction ${auctionId}`);
  } catch (error) {
    console.error('Error sending chat message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
});

// Handle user disconnection
socket.on('disconnect', () => {
  try {
    // Remove user from all auction rooms they were tracking
    auctionRoomUsers.forEach((users, auctionId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);

        // Broadcast updated active user count
        const roomName = `auction-chat-${auctionId}`;
        const activeCount = users.size;
        io.to(roomName).emit('activeUsers', activeCount);

        console.log(`👋 User left chat room for auction ${auctionId} (Active: ${activeCount})`);
      }
    });

    console.log('❌ User disconnected:', socket.id);
  } catch (error) {
    console.error('Error on disconnect:', error);
  }
});

// ============================================================================
// EXAMPLE INTEGRATION IN server.js
// ============================================================================
/*
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3002',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Existing socket handlers...
  
  // ===== ADD CHAT HANDLERS HERE =====
  
  // Join chat room
  socket.on('joinChatRoom', async (data) => {
    // ... chat handler code ...
  });

  // Send chat message
  socket.on('sendChatMessage', async (messageData) => {
    // ... chat handler code ...
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // ... disconnect handler code ...
  });
});
*/

// ============================================================================
// EXAMPLE: HOW TO MOUNT THE ROUTES IN server.js
// ============================================================================
/*
const chatRoutes = require('./routes/chat');

// After other route mounts
app.use('/api', chatRoutes);
*/

module.exports = {
  // Export for reference if needed
  handleChatSocket: true,
};
