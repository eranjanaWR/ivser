/**
 * Live Bid History Component
 * WhatsApp-style read-only chat feed for real-time bid updates
 * Features: Auto-scroll, live Socket.io integration, avatars, highest bid highlighting
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  AvatarGroup,
  useTheme,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  FiberNew as NewIcon,
} from '@mui/icons-material';
import { io } from 'socket.io-client';

/**
 * Get avatar initials from name
 */
const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || 'U';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

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
 * Format currency to LKR
 */
const formatLKR = (value) => {
  if (!value && value !== 0) return 'LKR 0';
  return `LKR ${Math.round(value).toLocaleString()}`;
};

/**
 * Get avatar color based on bidder ID
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

/**
 * Live Bid History Component
 * @param {string} vehicleId - ID of the vehicle being auctioned
 * @param {Object} highestBidder - Current highest bidder info
 * @param {string} socketUrl - Socket.io server URL
 * @param {Function} onPlaceBid - Callback to open bid placement form
 * @param {boolean} isLive - Whether auction is currently live
 */
const LiveBidHistory = ({ vehicleId, highestBidder = null, socketUrl = 'http://localhost:5000', onPlaceBid = null, isLive = true }) => {
  const theme = useTheme();
  const [bidHistory, setBidHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  /**
   * Auto-scroll to bottom when new bids arrive
   */
  const scrollToBottom = useCallback(() => {
    if (!scrollContainerRef?.current || !shouldAutoScrollRef?.current) return;
    
    try {
      setTimeout(() => {
        if (scrollContainerRef?.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 0);
    } catch (error) {
      console.error('❌ Error scrolling to bottom:', error);
    }
  }, []);

  /**
   * Handle scroll to detect user scrolling
   * Disable auto-scroll if user scrolls up manually
   */
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef?.current) return;
    
    try {
      const { scrollHeight, clientHeight, scrollTop } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - clientHeight - scrollTop < 50;
      shouldAutoScrollRef.current = isAtBottom;
    } catch (error) {
      console.error('❌ Error handling scroll:', error);
    }
  }, []);

  /**
   * Fetch initial bid history from backend on component mount
   */
  useEffect(() => {
    const fetchBidHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!vehicleId) {
          console.warn('⚠️ LiveBidHistory: vehicleId is not provided');
          setIsLoading(false);
          return;
        }

        console.log(`📡 LiveBidHistory: Fetching bid history for vehicle: ${vehicleId}`);
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const endpoint = `${apiUrl}/bidding/${vehicleId}/history`;
        console.log(`🌐 LiveBidHistory: API Endpoint: ${endpoint}`);

        const response = await fetch(endpoint);
        console.log(`📊 LiveBidHistory: Response status: ${response.status}`);

        const data = await response.json();
        console.log('📦 LiveBidHistory: Response data:', data);

        if (!response.ok) {
          throw new Error(data.message || `Failed to fetch bid history: ${response.statusText}`);
        }

        if (data.success && Array.isArray(data.data)) {
          setBidHistory(data.data);
          console.log(`✅ LiveBidHistory: Loaded ${data.data.length} initial bids`);
        } else {
          console.warn('⚠️ LiveBidHistory: Invalid response format:', data);
          setBidHistory([]); // Set empty array if no valid data
        }
      } catch (err) {
        console.error('❌ LiveBidHistory: Error fetching bid history:', err);
        setError(err.message);
        setBidHistory([]); // Set empty array on error to allow Socket.io updates
      } finally {
        setIsLoading(false);
      }
    };

    fetchBidHistory();
  }, [vehicleId]);

  /**
   * Initialize Socket.io connection and listen for bid updates
   */
useEffect(() => {
  try {
    // Connect to Socket.io server
    const socket = io(socketUrl, {
      query: { vehicleId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔗 LiveBidHistory: Socket connected:', socket.id);
      setIsConnected(true);
      
      // Join the auction room for this specific vehicle
      if (vehicleId) {
        socket.emit('joinAuctionRoom', vehicleId);
        console.log(`📍 LiveBidHistory: Joined auction room for vehicle: ${vehicleId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ LiveBidHistory: Socket disconnected');
      setIsConnected(false);
    });

    /**
     * Listen for bidPlaced event
     * Backend sends: { bidAmount, bidder: { firstName, lastName, _id }, timestamp, ... }
     */
    socket.on('bidPlaced', (bidData) => {
      console.log('🎯 LiveBidHistory: Received bidPlaced event:', bidData);
      
      if (!bidData) {
        console.warn('⚠️ LiveBidHistory: Received empty bidData');
        return;
      }

      // Map backend data to component state
      const newBid = {
        id: bidData._id || `bid-${Date.now()}`,
        firstName: bidData.bidder?.firstName || 'Bidder',
        lastName: bidData.bidder?.lastName || '',
        amount: bidData.bidAmount || 0,
        timestamp: bidData.timestamp || new Date().toISOString(),
        bidderId: bidData.bidder?._id,
        isHighest: false,
      };

      console.log('✅ LiveBidHistory: Processed bid data:', newBid);
      
      // Use functional setState pattern to ensure we're working with latest state
      setBidHistory((prevHistory) => {
        const updated = [...prevHistory, newBid];
        console.log('📊 LiveBidHistory: Updated bidHistory, total bids:', updated.length);
        return updated;
      });
    });

    /**
     * Optional: Listen for biddersUpdate to sync highest bidder
     */
    socket.on('biddersUpdate', (data) => {
      console.log('👥 LiveBidHistory: Bidders updated:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ LiveBidHistory: Socket connection error:', error);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('❌ LiveBidHistory: Socket error:', error);
    });

    return () => {
      console.log('🧹 LiveBidHistory: Cleaning up socket connection');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('bidPlaced');
      socket.off('biddersUpdate');
      socket.off('connect_error');
      socket.off('error');
      socket.disconnect();
    };
  } catch (error) {
    console.error('❌ LiveBidHistory: Socket.io initialization error:', error);
  }
}, [vehicleId, socketUrl]);

  /**
   * Auto-scroll when new bids arrive
   */
  useEffect(() => {
    if (bidHistory.length > 0) {
      scrollToBottom();
    }
  }, [bidHistory, scrollToBottom]);

  if (isLoading) {
    // Show minimal loading indicator while fetching history
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <CircularProgress
          size={40}
          sx={{
            color: theme.palette.primary.main,
          }}
        />
      </Box>
    );
  }

  if (error && bidHistory.length === 0) {
    // Show empty container without text or border - Socket.io may still receive updates
    return (
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      />
    );
  }

  if (bidHistory.length === 0) {
    // Return nothing - completely remove empty state box
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Header - Fixed at top */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 2, borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        <TrophyIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            🏆 Live Bid History
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            {bidHistory.length} bid{bidHistory.length !== 1 ? 's' : ''} placed
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={isConnected ? '● Live' : '○ Offline'}
            sx={{
              bgcolor: isConnected ? theme.palette.success.light : theme.palette.action.disabledBackground,
              color: isConnected ? theme.palette.success.dark : theme.palette.text.secondary,
              fontWeight: 600,
              height: 24,
            }}
          />
        </Box>
      </Box>

      {/* Scrollable Bid Feed - Only scrollable area */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          pr: 1.5,
          pb: 1,
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
        {bidHistory.map((bid, index) => {
          const isHighestBid = highestBidder?._id === bid.bidderId;
          const avatarColor = getAvatarColor(theme, index);

          return (
            <Box
              key={bid.id || index}
              sx={{
                display: 'flex',
                gap: 1.5,
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
              {/* Avatar */}
              <Avatar
                sx={{
                  bgcolor: avatarColor,
                  color: 'white',
                  fontWeight: 700,
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  boxShadow: isHighestBid ? `0 0 12px ${theme.palette.warning.main}40` : 'none',
                }}
              >
                {getInitials(bid.firstName, bid.lastName)}
              </Avatar>

              {/* Chat Bubble */}
              <Paper
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isHighestBid ? theme.palette.warning.light + '20' : theme.palette.background.paper,
                  border: isHighestBid
                    ? `2px solid ${theme.palette.warning.main}`
                    : `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 4px 12px ${theme.palette.primary.main}20`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Bidder Info Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      flex: 1,
                    }}
                  >
                    {bid.firstName} {bid.lastName}
                  </Typography>

                  {isHighestBid && (
                    <Chip
                      icon={<TrophyIcon />}
                      label="Leading"
                      size="small"
                      sx={{
                        height: 20,
                        bgcolor: theme.palette.warning.main,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 11,
                        '& .MuiChip-icon': {
                          fontSize: 14,
                          color: 'white !important',
                          ml: 0.5,
                        },
                      }}
                    />
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatTime(bid.timestamp)}
                  </Typography>
                </Box>

                {/* Bid Amount */}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: isHighestBid ? theme.palette.warning.main : theme.palette.primary.main,
                    fontSize: 15,
                  }}
                >
                  {formatLKR(bid.amount)}
                </Typography>

                {/* Bid Number Badge */}
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    display: 'block',
                    mt: 0.5,
                    fontSize: '10px',
                  }}
                >
                  Bid #{index + 1}
                </Typography>
              </Paper>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default LiveBidHistory;
