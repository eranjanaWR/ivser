/**
 * Chat Message Controller
 * Handles chat message operations for live auction group chat
 */

const ChatMessage = require('../models/ChatMessage');
const BiddingChat = require('../models/BiddingChat');

/**
 * @desc    Get chat history for an auction
 * @route   GET /api/auction/:auctionId/chat-history
 * @access  Public
 */
const getChatHistory = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID is required',
      });
    }

    // Fetch messages, sorted by timestamp ascending (oldest first)
    const messages = await ChatMessage.find({ auctionId })
      .sort({ timestamp: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const totalMessages = await ChatMessage.countDocuments({ auctionId });

    res.status(200).json({
      success: true,
      messages,
      totalMessages,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message,
    });
  }
};

/**
 * @desc    Save a new chat message (used by Socket.io handler)
 * @route   POST /api/auction/:auctionId/chat-message
 * @access  Private
 */
const saveChatMessage = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { senderId, senderName, message } = req.body;

    if (!auctionId || !senderId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId, senderId, message',
      });
    }

    // Create new chat message for ChatMessage collection (legacy support)
    const chatMessage = new ChatMessage({
      auctionId,
      senderId,
      senderName: senderName || 'Anonymous',
      message: message.trim(),
      timestamp: new Date(),
    });

    // ALSO save to BiddingChat collection for permanent persistent record
    const biddingChatMessage = new BiddingChat({
      auctionId,
      senderId,
      senderName: senderName || 'Anonymous',
      message: message.trim(),
      timestamp: new Date(),
    });

    await Promise.all([
      chatMessage.save(),
      biddingChatMessage.save(),
    ]);

    console.log(`💬 Chat message saved to both ChatMessage and BiddingChat: ${biddingChatMessage._id}`);

    res.status(201).json({
      success: true,
      message: 'Message saved successfully',
      data: chatMessage,
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving chat message',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete old chat messages (cleanup routine)
 * @route   DELETE /api/auction/:auctionId/chat-messages
 * @access  Private (Admin)
 */
const deleteChatMessages = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { daysOld = 7 } = req.query;

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID is required',
      });
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    // Delete messages older than cutoff
    const result = await ChatMessage.deleteMany({
      auctionId,
      timestamp: { $lt: cutoffDate },
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} messages older than ${daysOld} days`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chat messages',
      error: error.message,
    });
  }
};

module.exports = {
  getChatHistory,
  saveChatMessage,
  deleteChatMessages,
};
