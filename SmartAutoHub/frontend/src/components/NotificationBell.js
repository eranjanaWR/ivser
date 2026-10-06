/**
 * Notification Bell Component
 * Displays unread notifications count and bell icon
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Box,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import api from '../services/api';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  useEffect(() => {
    fetchUnreadCount();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/user/price-notifications/count/unread');
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/price-notifications?limit=5&unreadOnly=true');
      setNotifications(response.data.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
    setLoading(false);
  };

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/user/price-notifications/${notificationId}/read`);
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const open = Boolean(anchorEl);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          position: 'relative',
          color: 'inherit',
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box
          sx={{
            width: 360,
            maxHeight: 500,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#1976d2',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Price Alerts
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} new`}
                size="small"
                sx={{
                  bgcolor: '#ff6b6b',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>

          {/* Content */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 0,
            }}
          >
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 200,
                }}
              >
                <CircularProgress size={24} />
              </Box>
            ) : notifications.length === 0 ? (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">
                  No new price alerts
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {notifications.map((notification, index) => (
                  <Box key={notification._id}>
                    <ListItem
                      sx={{
                        bgcolor: '#f9f9f9',
                        p: 2,
                        borderBottom: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#f0f0f0',
                        },
                      }}
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        {/* Icon */}
                        <Box
                          sx={{
                            bgcolor: notification.type === 'price_increase' ? '#ffebee' : '#e8f5e9',
                            p: 1,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {notification.type === 'price_increase' ? (
                            <TrendingUp sx={{ color: '#d32f2f' }} />
                          ) : (
                            <TrendingDown sx={{ color: '#2e7d32' }} />
                          )}
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {notification.vehicleInfo?.brand} {notification.vehicleInfo?.model}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color:
                                notification.type === 'price_increase' ? '#d32f2f' : '#2e7d32',
                              fontWeight: 600,
                            }}
                          >
                            {notification.type === 'price_increase' ? '↑' : '↓'}{' '}
                            {formatPrice(Math.abs(notification.priceChange))} (
                            {notification.type === 'price_increase' ? '+' : ''}
                            {notification.priceChangePercent}%)
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: 1,
            }}
          >
            <Button
              size="small"
              fullWidth
              variant="outlined"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button
              size="small"
              fullWidth
              variant="contained"
              onClick={handleViewAll}
            >
              View All
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
