/**
 * Notification History Page
 * Display all price change notifications with filtering options
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  MarkEmailRead,
} from '@mui/icons-material';
import api from '../services/api';

const NotificationHistoryPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('all'); // all, increase, decrease
  const [filterRead, setFilterRead] = useState('all'); // all, read, unread
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [page, rowsPerPage, filterType, filterRead]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const unreadOnly = filterRead === 'unread' ? 'true' : 'false';
      const response = await api.get(
        `/user/price-notifications?page=${page + 1}&limit=${rowsPerPage}&unreadOnly=${unreadOnly}`
      );
      setNotifications(response.data.data.notifications);
      setTotal(response.data.data.pagination.totalItems);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
    setLoading(false);
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/user/price-notifications/count/unread');
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/user/price-notifications/${notificationId}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/user/price-notifications/mark-all-read');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await api.delete(`/user/price-notifications/${notificationId}`);
        fetchNotifications();
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const handleViewVehicle = (vehicleId) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    return true;
  });

  return (
    <Box sx={{ minHeight: '80vh', bgcolor: '#fafafa', py: 4 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}
        >
          Price Change Notifications
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              color="error"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
          Track price changes for vehicles in your wishlist
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Filter by Type"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(0);
                }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="all">All</option>
                <option value="price_increase">Price Increase</option>
                <option value="price_decrease">Price Decrease</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Filter by Status"
                value={filterRead}
                onChange={(e) => {
                  setFilterRead(e.target.value);
                  setPage(0);
                }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </TextField>
            </Grid>
          </Grid>
          {unreadCount > 0 && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllAsRead}
                size="small"
              >
                Mark All as Read
              </Button>
            </Box>
          )}
        </Card>

        {/* Notifications Table */}
        <TableContainer component={Paper}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 300,
              }}
            >
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                No notifications found
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Price Change
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow
                      key={notification._id}
                      sx={{
                        bgcolor: notification.isRead ? 'transparent' : '#f9f9f9',
                        '&:hover': { bgcolor: '#f0f0f0' },
                      }}
                    >
                      {/* Vehicle */}
                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                          }}
                          onClick={() => handleViewVehicle(notification.vehicleId)}
                        >
                          <Box
                            sx={{
                              bgcolor:
                                notification.type === 'price_increase'
                                  ? '#ffebee'
                                  : '#e8f5e9',
                              p: 1,
                              borderRadius: 1,
                            }}
                          >
                            {notification.type === 'price_increase' ? (
                              <TrendingUp
                                sx={{
                                  color: '#d32f2f',
                                  fontSize: 20,
                                }}
                              />
                            ) : (
                              <TrendingDown
                                sx={{
                                  color: '#2e7d32',
                                  fontSize: 20,
                                }}
                              />
                            )}
                          </Box>
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {notification.vehicleInfo?.brand}{' '}
                              {notification.vehicleInfo?.model}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {notification.vehicleInfo?.year}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Type */}
                      <TableCell align="right">
                        <Chip
                          label={
                            notification.type === 'price_increase'
                              ? 'Increased'
                              : 'Decreased'
                          }
                          color={
                            notification.type === 'price_increase'
                              ? 'error'
                              : 'success'
                          }
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>

                      {/* Amount */}
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            notification.type === 'price_increase'
                              ? '#d32f2f'
                              : '#2e7d32',
                          fontWeight: 600,
                        }}
                      >
                        {notification.type === 'price_increase' ? '+' : '-'}
                        {formatPrice(Math.abs(notification.priceChange))}
                        <br />
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              notification.type === 'price_increase'
                                ? '#d32f2f'
                                : '#2e7d32',
                          }}
                        >
                          ({notification.type === 'price_increase' ? '+' : ''}
                          {notification.priceChangePercent}%)
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">
                        {notification.isRead ? (
                          <Chip label="Read" size="small" variant="outlined" />
                        ) : (
                          <Chip
                            label="Unread"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell align="center">
                        <Typography variant="body2">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        {!notification.isRead && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              size="small"
                              onClick={() => handleMarkAsRead(notification._id)}
                            >
                              <CheckCircle sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(notification._id)}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </TableContainer>
      </Container>
    </Box>
  );
};

export default NotificationHistoryPage;
