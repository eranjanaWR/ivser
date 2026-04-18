import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Stack,
  Paper,
  Tooltip,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import api from '../services/api';

/**
 * PrivateDealChat Component
 * Functional and visual clone of LiveDiscussion for post-auction private deals.
 */
const PrivateDealChat = ({ vehicleId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef();
  const scrollRef = useRef();

  // Load chat history and setup socket
  useEffect(() => {
    // 1. Fetch History
    const fetchHistoryAndConnect = async () => {
      try {
        const response = await api.get(`/bidding/deal-chat/${vehicleId}`);
        if (response.data.success) {
          console.log('History loaded:', response.data.messages);
          setMessages(response.data.messages || []);
        }
      } catch (err) {
        console.error('❌ Error fetching private chat history:', err);
      }

      // 2. Setup Socket (Only after history is fetched to prevent race conditions)
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

      socketRef.current.on('connect', () => {
        console.log('🔒 [SOCKET] Connected to private chat');
        socketRef.current.emit('joinPrivateDeal', vehicleId);
      });

      socketRef.current.on('receive_private_message', (data) => {
        setMessages((prev) => {
          // Prevent duplicates using either clientMessageId or DB _id
          if (
            (data._id && prev.some((m) => m._id === data._id)) ||
            (data.clientMessageId && prev.some((m) => m.clientMessageId === data.clientMessageId))
          ) {
            return prev;
          }
          return [...prev, data];
        });
      });
    };

    fetchHistoryAndConnect();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leavePrivateDeal', vehicleId);
        socketRef.current.disconnect();
      }
    };
  }, [vehicleId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageData = {
      clientMessageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vehicleId,
      senderId: user._id || user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      message: newMessage.trim(),
    };

    // Optimistic update for instant feedback
    setMessages((prev) => [...prev, { ...messageData, timestamp: new Date().toISOString() }]);

    // Emit via socket
    socketRef.current.emit('sendPrivateMessage', messageData);
    setNewMessage('');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f1f5f9' }}>
      {/* Messages List */}
      <Box 
        ref={scrollRef}
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.6 }}>
            <Typography variant="body2">No messages yet. Start the conversation!</Typography>
          </Box>
        ) : (
          messages.map((msg, index) => {
            // Strict ID comparison for side persistence
            const senderIdStr = msg.senderId?._id?.toString() || msg.senderId?.toString();
            const myIdStr = user?._id?.toString() || user?.id?.toString();
            const isMe = Boolean(senderIdStr && myIdStr && senderIdStr === myIdStr);
            
            // Resolve name correctly (handles populated DB and raw socket payload)
            const resolvedName = msg.senderName || `${msg.senderId?.firstName || ''} ${msg.senderId?.lastName || ''}`.trim() || 'Unknown';
            const initial = resolvedName.charAt(0).toUpperCase();

            // Resolve time (handles DB createdAt and socket timestamp)
            const timeRaw = msg.createdAt || msg.timestamp || new Date();
            const formattedTime = new Date(timeRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <Box 
                key={msg._id || msg.clientMessageId || index}
                sx={{ 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  gap: 1.5,
                  mb: 1
                }}
              >
                {/* Unified Avatar for both sides */}
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: isMe ? '#2563eb' : '#1e293b', 
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                >
                  {initial}
                </Avatar>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {/* Unified Sender Name */}
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: 'text.secondary' }}>
                    {isMe ? 'You' : resolvedName}
                  </Typography>

                  {/* Message Bubble */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      px: 2,
                      py: 1.5,
                      borderRadius: 3,
                      borderTopRightRadius: isMe ? 0 : 3,
                      borderTopLeftRadius: !isMe ? 0 : 3,
                      bgcolor: isMe ? '#2563eb' : '#fff',
                      color: isMe ? '#fff' : '#1e293b',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
                      {msg.message}
                    </Typography>
                  </Paper>

                  {/* Unified Timestamp */}
                  <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.7, fontSize: '0.7rem', color: 'text.secondary' }}>
                    {formattedTime}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Input Area */}
      <Box 
        component="form" 
        onSubmit={handleSendMessage}
        sx={{ 
          p: 2, 
          bgcolor: '#fff', 
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: 1
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a private message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          autoComplete="off"
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: '#f8fafc'
            }
          }}
        />
        <Tooltip title="Send Message">
          <IconButton 
            color="primary" 
            type="submit" 
            disabled={!newMessage.trim()}
            sx={{ 
              bgcolor: '#1e293b', 
              color: '#fff',
              '&:hover': { bgcolor: '#0f172a' },
              '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#94a3b8' }
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default PrivateDealChat;
