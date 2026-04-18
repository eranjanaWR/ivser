/**
 * Auction Group Chat Component
 * WhatsApp-style real-time group chat for active bidders
 * Features: Message history, real-time Socket.io, auto-scroll, user presence
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  useTheme,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, Reply as ReplyIcon, Close as CloseIcon } from '@mui/icons-material';

/**
 * Format timestamp to readable time
 */
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (err) {
    return '';
  }
};

/**
 * Get avatar initials from name
 */
const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || 'U';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

/**
 * Get avatar color based on sender
 */
const getAvatarColor = (theme, index) => {
  const colors = [
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];
  return colors[index % colors.length];
};

const AuctionGroupChat = ({
  vehicleId = null,
  socketRef = null,
  currentUserId = null,
  currentUserName = 'You',
  initialMessages = null,
  vehicle = null, // Vehicle object with brand, model, year, price, condition, location
  isClosed = false, // ✅ NEW: Whether auction is closed
}) => {
  const theme = useTheme();
  const [chatMessages, setChatMessages] = useState(() => {
    // Initialize with messages from parent if provided
    return initialMessages && Array.isArray(initialMessages) ? initialMessages : [];
  });
  const [msg, setMsg] = useState(''); // Simplified state name for reliability
  const [activeUsers, setActiveUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // Reply quote state: { id, text, sender }
  const scrollContainerRef = useRef(null);
  const inputFieldRef = useRef(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  const scrollToBottom = () => {
    if (!scrollContainerRef?.current) return;

    try {
      setTimeout(() => {
        if (scrollContainerRef?.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 50);
    } catch (error) {
      console.warn('Error scrolling to bottom:', error);
    }
  };

  /**
   * Handle scroll detection (disable auto-scroll if user manually scrolls)
   */
  const handleScroll = () => {
    if (!scrollContainerRef?.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (isNearBottom && !scrollContainerRef.current.shouldAutoScroll) {
      scrollContainerRef.current.shouldAutoScroll = true;
    }
  };

  /**
   * Fetch chat history on component mount
   */
  // STEP 3: Fetch and restore chat history from database on component mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!vehicleId) {
        console.warn('⚠️ [PERSISTENCE-MOUNT] vehicleId not available');
        return;
      }

      try {
        console.log('📥 [PERSISTENCE-MOUNT] Fetching chat history for vehicleId:', vehicleId);
        setIsLoading(true);
        
        // STEP 3A: Call backend API to fetch persisted messages
        const response = await fetch(`/api/bidding/${vehicleId}/chat-history`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.messages && Array.isArray(data.messages)) {
          console.log(`✅ [PERSISTENCE-MOUNT] Restored ${data.messages.length} messages from database`);
          if (data.messages.length > 0) {
            console.log(`📋 [PERSISTENCE-MOUNT] Sample: "${data.messages[0].message}"`);
            // Log first message's reply fields if they exist
            const firstMsg = data.messages[0];
            if (firstMsg.replyToId) {
              console.log(`   ↩️ First msg has reply:`);
              console.log(`   - replyToId: ${firstMsg.replyToId}`);
              console.log(`   - replyToText: "${firstMsg.replyToText}"`);
              console.log(`   - replyToSender: ${firstMsg.replyToSender}`);
            }
            // Count total messages with replies
            const repliesCount = data.messages.filter(m => m.replyToId).length;
            console.log(`   Total restored messages with replies: ${repliesCount}`);
          }
          
          // STEP 3B: Transform messages to ensure consistent id field and reply data
          const transformedMessages = data.messages.map(msg => ({
            id: msg._id, // Ensure we have 'id' field for rendering
            _id: msg._id, // Keep _id as well
            senderId: msg.senderId,
            senderName: msg.senderName,
            message: msg.message,
            timestamp: msg.timestamp,
            replyToId: msg.replyToId || null,
            replyToText: msg.replyToText || null,
            replyToSender: msg.replyToSender || null,
          }));
          
          console.log('🔄 [PERSISTENCE-MOUNT] Transformed ' + transformedMessages.length + ' messages');
          const repliesInTransform = transformedMessages.filter(m => m.replyToId).length;
          console.log('🔄 [PERSISTENCE-MOUNT] Found ' + repliesInTransform + ' replies in transformed messages');
          if (repliesInTransform > 0) {
            const sampleReply = transformedMessages.find(m => m.replyToId);
            console.log('🔄 [PERSISTENCE-MOUNT] Sample reply message:', sampleReply);
          }
          
          // Populate chat component with transformed messages
          setChatMessages(transformedMessages);
          
          // Small delay to ensure rendering before scroll
          setTimeout(() => scrollToBottom(), 50);
        } else {
          console.log('ℹ️ [PERSISTENCE-MOUNT] No previous messages found, starting fresh');
          setChatMessages([]);
        }
      } catch (error) {
        console.error('❌ [PERSISTENCE-MOUNT] Error fetching chat history:', error);
        // Fallback: start with empty chat
        setChatMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [vehicleId]);

  /**
   * Set up Socket.io listeners for chat and presence
   */
  /**
   * Set up Socket.io listeners for chat and presence
   */
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) {
      console.warn('⚠️ AuctionGroupChat: Socket reference not available');
      return;
    }

    // Join auction room
    if (vehicleId) {
      socket.emit('joinAuction', vehicleId);
      console.log(`🔗 Joined auction room: ${vehicleId}`);
    }

    const handleConnect = () => {
      setIsConnected(true);
      if (vehicleId) socket.emit('joinAuction', vehicleId);
    };

    const handleDisconnect = () => setIsConnected(false);

    // ✅ GUARANTEED DEDUPLICATION LOGIC
    const handleReceiveChatMessage = (messageData) => {
      if (!messageData) return;

      setChatMessages((prev) => {
        // 1. Check for duplicates using multiple identifiers
        const isDuplicate = prev.some((m) => {
          // Check by Database ID
          if (messageData._id && (m._id === messageData._id || m.id === messageData._id)) return true;
          // Check by Client-side unique ID (Optimistic match)
          if (messageData.clientMessageId && (m.clientMessageId === messageData.clientMessageId || m.id === messageData.clientMessageId)) return true;
          return false;
        });

        if (isDuplicate) {
          console.log('🚫 duplicate message blocked:', messageData._id || messageData.clientMessageId);
          // If it's a duplicate but we don't have the real ID yet, update it
          if (messageData._id) {
            return prev.map(m => 
              (m.clientMessageId === messageData.clientMessageId || m.id === messageData.clientMessageId) && !m._id
                ? { ...m, _id: messageData._id, id: messageData._id }
                : m
            );
          }
          return prev;
        }

        // 2. Add as new message if not found
        const newMessage = {
          id: messageData._id || messageData.id || `msg-${Date.now()}`,
          _id: messageData._id,
          clientMessageId: messageData.clientMessageId,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          message: messageData.message,
          timestamp: messageData.timestamp || new Date().toISOString(),
          replyToId: messageData.replyToId || null,
          replyToText: messageData.replyToText || null,
          replyToSender: messageData.replyToSender || null,
        };

        return [...prev, newMessage];
      });

      scrollToBottom();
    };

    const handleActiveUsers = (count) => setActiveUsers(count);

    // Register listeners
    socket.on('connect', handleConnect);
    socket.on('receive_chat_message', handleReceiveChatMessage);
    socket.on('activeUsers', handleActiveUsers);
    socket.on('disconnect', handleDisconnect);

    // ✅ PROPER CLEANUP
    return () => {
      socket.off('connect', handleConnect);
      socket.off('receive_chat_message', handleReceiveChatMessage);
      socket.off('activeUsers', handleActiveUsers);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socketRef, vehicleId]);

  /**
   * Handle sending a message with Optimistic Update
   */
  const sendMessage = () => {
    const socket = socketRef?.current;
    if (!msg.trim() || !socket) return;

    // Generate a unique client ID for this message
    const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const messageData = {
      clientMessageId,
      auctionId: vehicleId,
      senderId: currentUserId,
      senderName: currentUserName,
      message: msg.trim(),
      timestamp: new Date().toISOString(),
      replyingTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        sender: replyingTo.sender,
      } : null,
    };

    // 1. Add to local state immediately (Optimistic UI)
    setChatMessages((prev) => [
      ...prev,
      {
        id: clientMessageId,
        clientMessageId,
        senderId: currentUserId,
        senderName: currentUserName,
        message: msg.trim(),
        timestamp: messageData.timestamp,
        replyToId: replyingTo?.id || null,
        replyToText: replyingTo?.text || null,
        replyToSender: replyingTo?.sender || null,
      },
    ]);

    // 2. Emit to server
    socket.emit('send_chat_message', messageData);
    
    // 3. Reset input UI
    setMsg('');
    setReplyingTo(null);
    scrollToBottom();
  };

  /**
   * Handle Enter key to send message (onKeyDown)
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Memoized message list with system intro message prepended
   */
  const renderedMessages = useMemo(() => {
    // Create system intro message from vehicle data
    const systemMessage = vehicle ? {
      id: 'system-intro',
      _id: 'system-intro',
      senderId: null,
      senderName: '🚀 Auction System',
      message: `Welcome to the auction!\n\nVehicle: ${vehicle.brand} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}\nStarting Price: LKR ${vehicle.startingPrice?.toLocaleString?.() || vehicle.startingPrice}\nCondition: ${vehicle.condition}\nLocation: ${vehicle.location}\n\nFeel free to ask any questions here!`,
      timestamp: new Date().toISOString(),
      isSystemMessage: true,
      replyToId: null,
      replyToText: null,
      replyToSender: null,
    } : null;

    // Combine system message with chat messages
    return systemMessage ? [systemMessage, ...chatMessages] : chatMessages;
  }, [vehicle, chatMessages]);

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: 2,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        position: 'relative',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, flex: 1 }}>
          💬 Live Discussion
        </Typography>
        <Chip
          label={`${activeUsers} Active`}
          size="small"
          sx={{
            bgcolor: isConnected ? theme.palette.success.light : theme.palette.action.disabledBackground,
            color: isConnected ? theme.palette.success.dark : theme.palette.text.secondary,
            fontWeight: 600,
            height: 24,
          }}
        />
      </Box>

      {/* Messages Container - scrollable area (600px total height) */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          pr: 1,
          mb: 2,
          minHeight: 0,
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: theme.palette.action.hover,
            borderRadius: 1,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: theme.palette.primary.light,
            borderRadius: 1,
            '&:hover': {
              bgcolor: theme.palette.primary.main,
            },
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={40} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : renderedMessages.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: theme.palette.text.secondary }}>
            <Typography variant="body2">No messages yet</Typography>
          </Box>
        ) : (
          <>
            {renderedMessages.map((msg, index) => {
              const isOwnMessage = msg.senderId === currentUserId;
              const isSystemMessage = msg.isSystemMessage;
              const avatarColor = getAvatarColor(theme, index);

              return (
                <Box
                  key={msg.id || index}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    justifyContent: isSystemMessage ? 'center' : (isOwnMessage ? 'flex-end' : 'flex-start'),
                    animation: 'slideIn 0.3s ease-in-out',
                    '@keyframes slideIn': {
                      from: {
                        opacity: 0,
                        transform: 'translateY(10px)',
                      },
                      to: {
                        opacity: 1,
                        transform: 'translateY(0)',
                      },
                    },
                  }}
                >
                  {/* Avatar (only for other users) */}
                  {!isOwnMessage && !isSystemMessage && (
                    <Avatar
                      sx={{
                        bgcolor: avatarColor,
                        color: 'white',
                        fontWeight: 700,
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(msg.senderName?.split(' ')[0], msg.senderName?.split(' ')[1])}
                    </Avatar>
                  )}

                  {/* Message Bubble with Reply Icon */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      maxWidth: isSystemMessage ? '85%' : '70%',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Message Content */}
                    <Box
                      sx={{
                        bgcolor: isSystemMessage ? '#fef3c7' : (isOwnMessage ? '#dcf8c6' : theme.palette.action.hover),
                        borderRadius: isSystemMessage ? '12px' : (isOwnMessage ? '12px 12px 0 12px' : '12px 12px 12px 0'),
                        p: 1.5,
                        wordWrap: 'break-word',
                        flex: 1,
                        border: isSystemMessage ? `2px solid ${theme.palette.warning.light}` : 'none',
                      }}
                    >
                      {/* Sender name (only for other users) */}
                      {!isOwnMessage && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          {msg.senderName}
                        </Typography>
                      )}

                      {/* Quoted Message Block (if replying to something) */}
                      {msg.replyToId && msg.replyToText && (
                        <Box
                          sx={{
                            borderLeft: `4px solid ${isOwnMessage ? theme.palette.primary.main : theme.palette.info.main}`,
                            bgcolor: isOwnMessage ? '#fff' : theme.palette.background.paper,
                            p: 1,
                            mb: 1,
                            borderRadius: '4px',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: isOwnMessage ? theme.palette.primary.main : theme.palette.info.main,
                              display: 'block',
                              mb: 0.25,
                            }}
                          >
                            {msg.replyToSender}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {msg.replyToText}
                          </Typography>
                        </Box>
                      )}

                      {/* Message text */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.primary,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.message}
                      </Typography>

                      {/* Timestamp */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          display: 'block',
                          mt: 0.5,
                          fontSize: '11px',
                          textAlign: isOwnMessage ? 'right' : 'left',
                        }}
                      >
                        {formatTime(msg.timestamp)}
                      </Typography>
                    </Box>

                    {/* ✅ UPDATED: Reply Icon Button (hidden for closed auctions) */}
                    {!isSystemMessage && !isClosed && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          const previewText = msg.message.length > 50
                            ? msg.message.substring(0, 50) + '...'
                            : msg.message;

                          setReplyingTo({
                            id: msg.id || msg._id,
                            text: previewText,
                            sender: msg.senderName,
                          });
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                          opacity: 0.7,
                          '&:hover': {
                            opacity: 1,
                            bgcolor: theme.palette.action.hover,
                          },
                          mt: 0.5,
                        }}
                      >
                        <ReplyIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {/* Avatar (only for own messages) */}
                  {isOwnMessage && !isSystemMessage && (
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        fontWeight: 700,
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(msg.senderName?.split(' ')[0], msg.senderName?.split(' ')[1])}
                    </Avatar>
                  )}
                </Box>
              );
            })}
          </>
        )}
      </Box>

      {/* ✅ UPDATED: Reply Preview Bar - hidden when auction is closed */}
      {replyingTo && !isClosed && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: theme.palette.info.light,
            borderLeft: `4px solid ${theme.palette.info.main}`,
            p: 1,
            mb: 1,
            borderRadius: '4px',
            flexShrink: 0,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: theme.palette.info.main,
                display: 'block',
              }}
            >
              ↩️ Replying to {replyingTo.sender}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {replyingTo.text}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => {
              setReplyingTo(null);
              console.log('❌ Reply cancelled');
            }}
            sx={{
              color: theme.palette.info.main,
              ml: 1,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Input Area - PINNED AT BOTTOM (sticky) */}
      {isClosed ? (
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'auto',
            position: 'relative',
            flexShrink: 0,
            pb: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            pt: 1,
            bgcolor: '#f5f5f5',
            flexDirection: 'column',
            py: 2
          }}
        >
          <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
            🔒 Discussion is closed for this auction.
          </Typography>
          <Typography variant="caption" sx={{ color: '#999', mt: 0.5 }}>
            Scroll up to view the complete bid history and discussion.
          </Typography>
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            alignItems: 'flex-end',
            zIndex: 10,
            pointerEvents: 'auto',
            position: 'relative',
          flexShrink: 0,
          pb: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          pt: 1,
        }}
      >
        <TextField
          ref={inputFieldRef}
          placeholder="Type a message..."
          multiline
          maxRows={3}
          fullWidth
          size="small"
          value={msg} // Direct state binding - no conditional logic
          onChange={(e) => setMsg(e.target.value)} // Update state on every character
          onKeyDown={handleKeyDown} // Enter key handling
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            inputFieldRef.current?.focus(); // Force focus on click
          }}
          disabled={false} // FORCE ENABLED - critical fix
          autoComplete="off"
          autoFocus={true}
          sx={{
            // FORCE FIX: All styling to enable interaction
            pointerEvents: 'auto', // Enable clicks
            cursor: 'text', // Show text cursor
            zIndex: 10,
            
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#ffffff', // Ensure visible
              pointerEvents: 'auto', // Enable clicks on input
              cursor: 'text',
              
              // Remove any opacity or visibility issues
              opacity: 1,
              visibility: 'visible',
              
              '& fieldset': {
                borderColor: theme.palette.divider,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
              },
            },
            
            '& .MuiOutlinedInput-input': {
              pointerEvents: 'auto', // Enable clicks on the actual input
              cursor: 'text',
              padding: '12px 14px',
              fontSize: '14px',
              fontFamily: theme.typography.fontFamily,
              color: theme.palette.text.primary,
              
              // Ensure text is visible
              backgroundColor: 'transparent',
              opacity: 1,
              
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 0.7,
              },
              
              // Remove any webkit input styling that might interfere
              '-webkit-appearance': 'none',
              '-moz-appearance': 'none',
              appearance: 'none',
              
              // Ensure native browser input works
              WebkitTouchCallout: 'auto',
              WebkitUserSelect: 'text',
              userSelect: 'text',
            },
          }}
        />
        <IconButton
          onClick={() => {
            console.log('📤 Send button clicked, msg:', msg);
            sendMessage();
          }}
          disabled={!msg.trim()} // Only disabled if empty
          sx={{
            color: msg.trim() ? theme.palette.primary.main : theme.palette.action.disabled,
            pointerEvents: 'auto',
            zIndex: 10,
            '&:hover': {
              backgroundColor: theme.palette.primary.light + '20',
            },
          }}
        >
          <SendIcon />
            </IconButton>
        </Box>
      )}

      {/* Connection Status - PINNED AT BOTTOM */}
      <Box sx={{ mt: 0.5, textAlign: 'center', flexShrink: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: socketRef?.current?.connected ? theme.palette.success.main : theme.palette.warning.main,
            fontWeight: 600,
          }}
        >
          {socketRef?.current?.connected ? '✅ Connected' : '⚠️ Reconnecting...'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default AuctionGroupChat;
