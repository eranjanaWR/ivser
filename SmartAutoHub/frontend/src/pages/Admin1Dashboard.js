/**
 * Admin1 Dashboard
 * Full admin with reports and user management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  People,
  DirectionsCar,
  Build,
  TrendingUp,
  MoreVert,
  Block,
  CheckCircle,
  Delete,
  Refresh,
  Search,
  NewReleases,
  Image as ImageIcon,
  Bolt,
} from '@mui/icons-material';
import api from '../services/api';
import io from 'socket.io-client';

const Admin1Dashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    totalBreakdowns: 0,
    pendingVerifications: 0,
  });
  
  // Data
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [breakdowns, setBreakdowns] = useState([]);
  const [advertisingRequests, setAdvertisingRequests] = useState([]);
  const [boostRequests, setBoostRequests] = useState([]);
  
  // Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhotoRequest, setSelectedPhotoRequest] = useState(null);
  const [paymentProofDialogOpen, setPaymentProofDialogOpen] = useState(false);
  const [selectedPaymentProofRequest, setSelectedPaymentProofRequest] = useState(null);

  const getUploadUrl = (uploadPath) => {
    if (!uploadPath) return '';
    if (uploadPath.startsWith('http://') || uploadPath.startsWith('https://')) {
      return uploadPath;
    }

    const backendUrl = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const normalizedPath = uploadPath.replace(/^\/+/, '').replace(/^uploads\//, '');
    return `${backendUrl}/uploads/${normalizedPath}`;
  };

  // Socket.IO connection for real-time advertising request updates
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    // Listen for new advertising requests
    socket.on('newAdvertisingRequest', (newRequest) => {
      console.log('📬 New advertising request received via socket:', newRequest);
      // Auto-refresh if on advertising requests tab
      if (tab === 3) {
        console.log('🔄 Auto-refreshing advertising requests...');
        fetchAdvertisingRequests();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [tab]);

  // Auto-refresh advertising requests every 5 seconds when on that tab
  useEffect(() => {
    if (tab !== 3) return;
    
    // Fetch immediately when tab changes to 3
    fetchAdvertisingRequests();
    
    const interval = setInterval(() => {
      fetchAdvertisingRequests();
    }, 5000); // Reduced from 10s to 5s for faster updates

    return () => clearInterval(interval);
  }, [tab]);



  const fetchData = async () => {
    setLoading(true);
    
    // Set a timeout to stop loading after 15 seconds
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Data fetch timeout - stopping loader');
      setLoading(false);
    }, 15000);
    
    try {
      // Fetch stats
      try {
        const { data: statsData } = await api.get('/admin/stats');
        setStats(statsData.data);
      } catch (e) {
        // Mock stats
        setStats({
          totalUsers: 150,
          totalVehicles: 85,
          totalBreakdowns: 32,
          pendingVerifications: 12,
        });
      }
      
      // Fetch data based on tab
      if (tab === 0) {
        try {
          const { data } = await api.get('/admin/users');
          setUsers(data.data || []);
        } catch (e) {
          setUsers([
            { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'seller', isEmailVerified: true, isIDVerified: true, isFaceVerified: true, status: 'active' },
            { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'buyer', isEmailVerified: true, isIDVerified: false, isFaceVerified: false, status: 'active' },
            { _id: '3', name: 'Mike Mechanic', email: 'mike@example.com', role: 'repairman', isEmailVerified: true, isIDVerified: true, isFaceVerified: true, status: 'active' },
          ]);
        }
      } else if (tab === 1) {
        try {
          const { data } = await api.get('/admin/vehicles');
          setVehicles(data.data || []);
        } catch (e) {
          setVehicles([
            { _id: '1', brand: 'Toyota', model: 'Camry', year: 2020, price: 4500000, status: 'active', seller: { name: 'John Doe' } },
            { _id: '2', brand: 'Honda', model: 'Civic', year: 2019, price: 3800000, status: 'pending', seller: { name: 'Jane Smith' } },
          ]);
        }
      } else if (tab === 2) {
        try {
          const { data } = await api.get('/admin/breakdowns');
          setBreakdowns(data.data || []);
        } catch (e) {
          setBreakdowns([
            { _id: '1', issueType: 'Flat Tire', status: 'completed', user: { name: 'User 1' }, repairman: { name: 'Mike Mechanic' }, createdAt: new Date() },
            { _id: '2', issueType: 'Engine Problem', status: 'in_progress', user: { name: 'User 2' }, repairman: { name: 'Mike Mechanic' }, createdAt: new Date() },
          ]);
        }
      } else if (tab === 3) {
        try {
          console.log('📨 Fetching advertising requests...');
          
          let retries = 3;
          let lastError;
          let adRequests = [];
          
          while (retries > 0) {
            try {
              const response = await api.get('/admin/advertising-requests');
              console.log('✅ API Response received:', {
                success: response.data?.success,
                dataType: typeof response.data?.data,
                dataLength: response.data?.data?.length,
                total: response.data?.total
              });
              
              const { data } = response;
              
              // Extract the array from the response
              if (data && data.data && Array.isArray(data.data)) {
                adRequests = data.data;
                console.log(`✅ Got ${adRequests.length} real advertising requests from database`);
              } else if (data && Array.isArray(data)) {
                adRequests = data;
                console.log(`✅ Got ${adRequests.length} requests (direct array)`);
              } else {
                console.warn('⚠️ Unexpected response format:', data);
                adRequests = [];
              }
              
              // Successfully got data, break the retry loop
              break;
              
            } catch (err) {
              lastError = err;
              retries--;
              console.warn(`⚠️ Request attempt failed (${retries} retries left):`, err.message);
              
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 800));
              }
            }
          }
          
          // Set whatever data we got (could be real or empty array)
          console.log(`📊 Setting ${adRequests.length} requests to state`);
          setAdvertisingRequests(adRequests);
          
        } catch (e) {
          console.error('❌ Outer error fetching advertising requests:', e.message);
          // Set empty array on complete failure
          setAdvertisingRequests([]);
        }
      } else if (tab === 4) {
        try {
          const { data } = await api.get('/vehicles/boost/all');
          console.log('✓ Boost requests fetched:', data);
          console.log('Sample boost data:', data.data?.[0]);
          if (data.data && data.data.length > 0) {
            console.log('📄 [FETCH] First boost payment proof fields:');
            data.data.forEach((boost, idx) => {
              console.log(`  Boost ${idx}:`, {
                _id: boost._id,
                paymentMethod: boost.paymentMethod,
                bankSlipPath: boost.bankSlipPath,
                cardProofPath: boost.cardProofPath,
                hasProof: !!(boost.bankSlipPath || boost.cardProofPath)
              });
            });
          }
          setBoostRequests(data.data || []);
        } catch (e) {
          console.error('❌ Failed to fetch boost requests:', e);
          console.error('Error response:', e.response?.data);
          console.error('Error status:', e.response?.status);
          setBoostRequests([]);
        }
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Separate function to fetch advertising requests for auto-refresh
  const fetchAdvertisingRequests = async () => {
    try {
      console.log('🔄 [AUTO-REFRESH] Fetching advertising requests...');
      
      const { data } = await api.get('/admin/advertising-requests');
      
      // Handle the response
      let adRequests = [];
      if (data && data.data && Array.isArray(data.data)) {
        adRequests = data.data;
      } else if (data && Array.isArray(data)) {
        adRequests = data;
      }
      
      console.log(`✅ Got ${adRequests.length} advertising requests`);
      setAdvertisingRequests(adRequests);
    } catch (err) {
      console.error('❌ Failed to fetch advertising requests:', err.message);
      // Keep previous data on error instead of showing stale mock data
      // This allows users to see what they had until the API recovers
    }
  };

  const handleMenuOpen = (event, item) => {
    console.log('📋 [MENU] Opened for boost request:', item._id);
    console.log('  - paymentMethod:', item?.paymentMethod);
    console.log('  - bankSlipPath:', item?.bankSlipPath);
    console.log('  - cardProofPath:', item?.cardProofPath);
    console.log('  - Has proof?:', !!(item?.bankSlipPath || item?.cardProofPath));
    console.log('  - All keys:', Object.keys(item || {}));
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    setDialogAction(action);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleOpenPaymentDetails = (request) => {
    console.log('Opening payment details for request:', request);
    console.log('Card number:', request.cardNumber);
    console.log('Cardholder name:', request.cardholderName);
    console.log('Expiry date:', request.expiryDate);
    console.log('Payment Ref Number:', request.paymentRefNumber);
    console.log('Full request object keys:', Object.keys(request));
    setSelectedPaymentRequest(request);
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDetails = () => {
    setPaymentDialogOpen(false);
    setSelectedPaymentRequest(null);
  };

  const handleOpenPhotoPreview = (request) => {
    console.log('Opening photo preview for request:', request);
    console.log('Ad photo base64 exists:', !!request.adPhotoBase64);
    if (request.adPhotoBase64) {
      console.log('Photo base64 length:', request.adPhotoBase64.length);
      console.log('Photo base64 first 50 chars:', request.adPhotoBase64.substring(0, 50));
    }
    setSelectedPhotoRequest(request);
    setPhotoDialogOpen(true);
  };

  const handleClosePhotoPreview = () => {
    setPhotoDialogOpen(false);
    setSelectedPhotoRequest(null);
  };

  const handleOpenPaymentProof = (request) => {
    console.log('Opening payment proof for request:', request);
    console.log('Payment slip base64 exists:', !!request.paymentSlipBase64);
    if (request.paymentSlipBase64) {
      console.log('Payment slip base64 length:', request.paymentSlipBase64.length);
    }
    setSelectedPaymentProofRequest(request);
    setPaymentProofDialogOpen(true);
  };

  const handleClosePaymentProof = () => {
    setPaymentProofDialogOpen(false);
    setSelectedPaymentProofRequest(null);
  };

  const handleOpenVehicleDetail = (vehicle) => {
    console.log('🚗 Opening vehicle detail page:', vehicle);
    handleMenuClose();
    if (vehicle && vehicle._id) {
      navigate(`/vehicles/${vehicle._id}`);
    }
  };

  const getBankNameFromCard = (cardNumber) => {
    if (!cardNumber) return 'N/A';
    // Simple logic - in production, use card bin lookup service
    const lastFourDigits = cardNumber.slice(-4);
    // Mock bank names based on patterns
    const bankMap = {
      '4': 'Visa Bank',
      '5': 'Mastercard Bank',
      '3': 'American Express'
    };
    return bankMap[cardNumber.charAt(0)] || 'Credit Card Bank';
  };

  const getPhotoDataUri = (base64Data) => {
    if (!base64Data) return null;
    // Check if it already has a data URI prefix
    if (base64Data.startsWith('data:')) {
      return base64Data;
    }
    return `data:image/jpeg;base64,${base64Data}`;
  };

  const confirmAction = async () => {
    try {
      if (tab === 0) {
        // User actions
        if (dialogAction === 'block') {
          await api.patch(`/admin/users/${selectedItem._id}/status`, { status: 'blocked' });
          setSuccess('User blocked successfully');
        } else if (dialogAction === 'activate') {
          await api.patch(`/admin/users/${selectedItem._id}/status`, { status: 'active' });
          setSuccess('User activated successfully');
        } else if (dialogAction === 'delete') {
          await api.delete(`/admin/users/${selectedItem._id}`);
          setSuccess('User deleted successfully');
        }
      } else if (tab === 1) {
        // Vehicle actions
        if (dialogAction === 'approve') {
          await api.patch(`/admin/vehicles/${selectedItem._id}`, { status: 'active' });
          setSuccess('Vehicle approved successfully');
        } else if (dialogAction === 'reject') {
          await api.patch(`/admin/vehicles/${selectedItem._id}`, { status: 'rejected' });
          setSuccess('Vehicle rejected successfully');
        } else if (dialogAction === 'delete') {
          await api.delete(`/admin/vehicles/${selectedItem._id}`);
          setSuccess('Vehicle deleted successfully');
        }
      } else if (tab === 3) {
        // Advertising request actions
        if (dialogAction === 'approve') {
          await api.put(`/admin/advertising-requests/${selectedItem._id}/status`, {
            status: 'approved',
            adminMessage: 'Request approved by admin'
          });
          setSuccess('Advertising request approved successfully');
          fetchAdvertisingRequests();
        } else if (dialogAction === 'reject') {
          await api.put(`/admin/advertising-requests/${selectedItem._id}/status`, {
            status: 'rejected',
            adminMessage: 'Request rejected by admin'
          });
          setSuccess('Advertising request rejected successfully');
          fetchAdvertisingRequests();
        } else if (dialogAction === 'deactivate') {
          console.log('🔄 [DEACTIVATE] Starting deactivation for ad:', selectedItem._id);
          console.log('🔄 [DEACTIVATE] Selected item:', selectedItem);
          const deactivateResponse = await api.put(`/admin/advertising-requests/${selectedItem._id}/status`, {
            status: 'deactivated',
            adminMessage: 'Ad deactivated by admin'
          });
          console.log('✅ [DEACTIVATE] Response:', deactivateResponse);
          setSuccess('Advertising request deactivated successfully');
          console.log('✅ [DEACTIVATE] Success message set, fetching requests...');
          fetchAdvertisingRequests();
        }
      } else if (tab === 4) {
        // Boost request actions
        if (dialogAction === 'approve') {
          console.log('📊 Approving boost:', selectedItem._id);
          try {
            const response = await api.put(`/vehicles/boost/${selectedItem._id}/approve`, {
              adminNotes: 'Boost approved by admin'
            });
            console.log('✅ Approval response:', response);
            setSuccess('Boost request approved successfully');
          } catch (approveErr) {
            console.error('❌ Approval error details:', {
              status: approveErr.response?.status,
              message: approveErr.response?.data?.message,
              fullResponse: approveErr.response?.data,
              error: approveErr.message
            });
            throw approveErr;
          }
        } else if (dialogAction === 'reject') {
          await api.put(`/vehicles/boost/${selectedItem._id}/reject`, {
            adminNotes: 'Boost rejected by admin'
          });
          setSuccess('Boost request rejected successfully');
        } else if (dialogAction === 'deactivate') {
          await api.put(`/vehicles/boost/${selectedItem._id}/reject`, {
            adminNotes: 'Boost deactivated by admin'
          });
          setSuccess('Boost request deactivated successfully');
        }
      }
      fetchData();
    } catch (err) {
      console.error('❌ Action error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      const errorMessage = err.response?.data?.message || err.message || 'Action failed';
      setError(errorMessage);
    }
    setDialogOpen(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDueDate = (submittedAt, packageName) => {
    const submitted = new Date(submittedAt);
    let daysToAdd = 30; // default to 30 days
    
    if (packageName === 'Free Trial') {
      daysToAdd = 28; // 4 weeks
    } else if (packageName === 'Starter' || packageName === 'Professional' || packageName === 'Premium') {
      daysToAdd = 30; // 1 month
    }
    
    const dueDate = new Date(submitted);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate.toLocaleDateString();
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <People />, color: 'primary.main' },
    { label: 'Total Vehicles', value: stats.totalVehicles, icon: <DirectionsCar />, color: 'success.main' },
    { label: 'Breakdowns', value: stats.totalBreakdowns, icon: <Build />, color: 'warning.main' },
    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: <TrendingUp />, color: 'info.main' },
  ];

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage users, vehicles, and breakdowns
            </Typography>
          </Box>
          <Button
            startIcon={<Refresh />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: stat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
            <Tab label="Users" icon={<People />} iconPosition="start" />
            <Tab label="Vehicles" icon={<DirectionsCar />} iconPosition="start" />
            <Tab label="Breakdowns" icon={<Build />} iconPosition="start" />
            <Tab label="Advertising Requests" icon={<NewReleases />} iconPosition="start" />
            <Tab label="Boost Requests" icon={<Bolt />} iconPosition="start" />
          </Tabs>

          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              {tab === 0 && (
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>User</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Verification</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {user.name?.[0]}
                            </Avatar>
                            <Typography>{user.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip
                              label="E"
                              size="small"
                              color={user.isEmailVerified ? 'success' : 'default'}
                              sx={{ minWidth: 30 }}
                            />
                            <Chip
                              label="ID"
                              size="small"
                              color={user.isIDVerified ? 'success' : 'default'}
                              sx={{ minWidth: 35 }}
                            />
                            <Chip
                              label="F"
                              size="small"
                              color={user.isFaceVerified ? 'success' : 'default'}
                              sx={{ minWidth: 30 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status || 'active'}
                            size="small"
                            color={user.status === 'blocked' ? 'error' : 'success'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={(e) => handleMenuOpen(e, user)}
                            sx={{
                              borderRadius: '8px',
                              bgcolor: '#f0f0f0',
                              '&:hover': {
                                bgcolor: '#e0e0e0',
                              },
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {tab === 1 && (
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Seller</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle._id} hover>
                        <TableCell>
                          <Typography fontWeight="medium">
                            {vehicle.brand} {vehicle.model}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.year}
                          </Typography>
                        </TableCell>
                        <TableCell>{vehicle.seller?.name}</TableCell>
                        <TableCell>{formatPrice(vehicle.price)}</TableCell>
                        <TableCell>
                          <Chip
                            label={vehicle.status}
                            size="small"
                            color={
                              vehicle.status === 'active' ? 'success' :
                              vehicle.status === 'pending' ? 'warning' :
                              'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={(e) => handleMenuOpen(e, vehicle)}
                            sx={{
                              borderRadius: '8px',
                              bgcolor: '#f0f0f0',
                              '&:hover': {
                                bgcolor: '#e0e0e0',
                              },
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {tab === 2 && (
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Issue</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Repairman</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {breakdowns.map((breakdown) => (
                      <TableRow key={breakdown._id} hover>
                        <TableCell>{breakdown.issueType}</TableCell>
                        <TableCell>{breakdown.user?.name}</TableCell>
                        <TableCell>{breakdown.repairman?.name || '-'}</TableCell>
                        <TableCell>
                          {new Date(breakdown.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={breakdown.status}
                            size="small"
                            color={
                              breakdown.status === 'completed' ? 'success' :
                              breakdown.status === 'in_progress' ? 'warning' :
                              'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {tab === 3 && (
                <>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<Refresh />}
                      onClick={fetchAdvertisingRequests}
                      variant="outlined"
                    >
                      Refresh Requests
                    </Button>
                  </Box>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell>Company</TableCell>
                        <TableCell>Contact</TableCell>
                        <TableCell>Package</TableCell>
                        <TableCell>Placement</TableCell>
                        <TableCell>Submitted Date</TableCell>
                        <TableCell>Reference Number</TableCell>
                        <TableCell>Payment Status</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {advertisingRequests.map((request) => (
                        <TableRow key={request._id} hover>
                          <TableCell>
                            <Box>
                              <Typography fontWeight="medium">
                                {request.company}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {request.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">{request.email}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.phone}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {request.packageName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                request.placement === 'home'
                                  ? 'Home Page'
                                  : request.placement === 'browse'
                                  ? 'Browse Page'
                                  : 'Not Specified'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {request.paymentRefNumber ? (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  color: '#1565c0',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {request.paymentRefNumber}
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#999' }}>
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.paymentStatus || 'pending'}
                              size="small"
                              color={
                                request.paymentStatus === 'completed'
                                  ? 'success'
                                  : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.status}
                              size="small"
                              color={
                                request.status === 'approved'
                                  ? 'success'
                                  : request.status === 'rejected'
                                  ? 'error'
                                  : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, request)}
                              disabled={request.status === 'completed' || request.status === 'deactivated'}
                              sx={{
                                borderRadius: '8px',
                                bgcolor: '#f0f0f0',
                                '&:hover': { bgcolor: '#e0e0e0' },
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {advertisingRequests.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                      <Typography variant="body2" color="text.secondary">
                        No advertising requests found. 📭
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {tab === 4 && (
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Package</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reference Number</TableCell>
                      <TableCell>Submitted Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {boostRequests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>
                          <Box>
                            <Typography fontWeight="medium">
                              {request.vehicleId?.brand} {request.vehicleId?.model}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.vehicleId?.year}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{request.contactPerson}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.contactPhone}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {request.packageType}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.duration} days
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {request.amount === 0 ? 'Free' : `LKR ${request.amount?.toLocaleString()}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {request.paymentRefNumber ? (
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                color: '#1565c0',
                                fontSize: '0.75rem',
                                letterSpacing: '0.5px'
                              }}
                            >
                              {request.paymentRefNumber}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#999', fontStyle: 'italic' }}>
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            size="small"
                            color={
                              request.status === 'active'
                                ? 'success'
                                : request.status === 'approved'
                                ? 'success'
                                : request.status === 'rejected'
                                ? 'error'
                                : request.status === 'completed'
                                ? 'success'
                                : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={(e) => handleMenuOpen(e, request)}
                            disabled={request.status === 'completed'}
                            sx={{
                              borderRadius: '8px',
                              bgcolor: '#f0f0f0',
                              '&:hover': {
                                bgcolor: '#e0e0e0',
                              },
                              '&.Mui-disabled': {
                                bgcolor: '#f5f5f5',
                              },
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          )}
        </Paper>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {tab === 0 && [
            selectedItem?.status !== 'blocked' && (
              <MenuItem key="block" onClick={() => handleAction('block')}>
                <Block sx={{ mr: 1 }} fontSize="small" />
                Block User
              </MenuItem>
            ),
            selectedItem?.status === 'blocked' && (
              <MenuItem key="activate" onClick={() => handleAction('activate')}>
                <CheckCircle sx={{ mr: 1 }} fontSize="small" />
                Activate User
              </MenuItem>
            ),
            <MenuItem key="delete" onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
              <Delete sx={{ mr: 1 }} fontSize="small" />
              Delete User
            </MenuItem>,
          ]}
          {tab === 1 && [
            selectedItem?.status === 'pending' && (
              <MenuItem key="approve" onClick={() => handleAction('approve')}>
                <CheckCircle sx={{ mr: 1 }} fontSize="small" />
                Approve
              </MenuItem>
            ),
            selectedItem?.status === 'pending' && (
              <MenuItem key="reject" onClick={() => handleAction('reject')}>
                <Block sx={{ mr: 1 }} fontSize="small" />
                Reject
              </MenuItem>
            ),
            <MenuItem key="delete" onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
              <Delete sx={{ mr: 1 }} fontSize="small" />
              Delete Vehicle
            </MenuItem>,
          ]}
          {tab === 3 && [
            selectedItem?.status === 'pending' && (
              <MenuItem key="approve" onClick={() => handleAction('approve')}>
                <CheckCircle sx={{ mr: 1 }} fontSize="small" />
                Approve Request
              </MenuItem>
            ),
            selectedItem?.status === 'pending' && (
              <MenuItem key="reject" onClick={() => handleAction('reject')}>
                <Block sx={{ mr: 1 }} fontSize="small" />
                Reject Request
              </MenuItem>
            ),
            selectedItem?.status === 'approved' && (
              <MenuItem key="deactivate" onClick={() => handleAction('deactivate')}>
                <Block sx={{ mr: 1 }} fontSize="small" />
                Deactivate Ad
              </MenuItem>
            ),
          ].filter(Boolean)}
          {tab === 4 && [
            <MenuItem key="viewProof" onClick={() => {
              console.log('💳 [PROOF] Viewing payment proof for:', selectedItem._id);
              handleOpenPaymentProof(selectedItem);
              handleMenuClose();
            }}>
              <ImageIcon sx={{ mr: 1 }} fontSize="small" />
              View Payment Proof
            </MenuItem>,
            <MenuItem key="viewVehicle" onClick={() => handleOpenVehicleDetail(selectedItem.vehicleId)}>
              <DirectionsCar sx={{ mr: 1 }} fontSize="small" />
              View Vehicle Card
            </MenuItem>,
            selectedItem?.status === 'pending' && (
              <MenuItem key="approve" onClick={() => handleAction('approve')}>
                <CheckCircle sx={{ mr: 1 }} fontSize="small" />
                Approve Boost
              </MenuItem>
            ),
            selectedItem?.status === 'pending' && (
              <MenuItem key="reject" onClick={() => handleAction('reject')}>
                <Block sx={{ mr: 1 }} fontSize="small" />
                Reject Boost
              </MenuItem>
            ),
            (selectedItem?.status === 'active' || selectedItem?.status === 'approved') && (
              <MenuItem key="deactivate" onClick={() => handleAction('deactivate')}>
                <Block sx={{ mr: 1 }} fontSize="small" />
                Deactivate Boost
              </MenuItem>
            ),
          ].filter(Boolean)}
        </Menu>

        {/* Confirmation Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {dialogAction} this{' '}
              {tab === 0
                ? 'user'
                : tab === 1
                ? 'vehicle'
                : tab === 2
                ? 'breakdown'
                : tab === 3
                ? 'advertising request'
                : tab === 4
                ? 'boost request'
                : 'item'}
              ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color={dialogAction === 'delete' ? 'error' : 'primary'}
              onClick={confirmAction}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Details Dialog */}
        <Dialog
          open={paymentDialogOpen}
          onClose={handleClosePaymentDetails}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              bgcolor: '#f5f5f5',
              borderBottom: '1px solid #ddd',
            }}
          >
            Payment Details
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            {selectedPaymentRequest ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Payment Reference Number - Prominent Display */}
                {selectedPaymentRequest?.paymentRefNumber && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#e3f2fd',
                      border: '2px solid #2196f3',
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#1976d2',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        letterSpacing: '1px'
                      }}
                    >
                      Payment Reference Number
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#1565c0',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        mt: 1,
                        letterSpacing: '1px',
                        wordBreak: 'break-all'
                      }}
                    >
                      {selectedPaymentRequest?.paymentRefNumber}
                    </Typography>
                  </Box>
                )}

                {/* Client Info */}
                <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#666',
                      fontWeight: 600,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Client Name
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#000',
                    }}
                  >
                    {selectedPaymentRequest?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                    {selectedPaymentRequest?.email || 'N/A'}
                  </Typography>
                </Box>

                {/* Cardholder Name */}
                <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#666',
                      fontWeight: 600,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Cardholder Name
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: selectedPaymentRequest?.cardholderName ? '#000' : '#999',
                    }}
                  >
                    {selectedPaymentRequest?.cardholderName || '(Not provided)'}
                  </Typography>
                </Box>

                {/* Bank Name */}
                {selectedPaymentRequest?.cardNumber && (
                  <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#666',
                        fontWeight: 600,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Bank / Card Type
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: '#000',
                      }}
                    >
                      {getBankNameFromCard(selectedPaymentRequest?.cardNumber)}
                    </Typography>
                  </Box>
                )}

                {/* Card Number */}
                {selectedPaymentRequest?.cardNumber && (
                  <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#666',
                        fontWeight: 600,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Card Number (Last 4 Digits)
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: '#000',
                        fontFamily: 'monospace',
                        letterSpacing: '2px'
                      }}
                    >
                      •••• •••• •••• {selectedPaymentRequest?.cardNumber}
                    </Typography>
                  </Box>
                )}

                {/* Expiry Date */}
                {selectedPaymentRequest?.expiryDate && (
                  <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#666',
                        fontWeight: 600,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Expiry Date
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: '#000',
                      }}
                    >
                      {selectedPaymentRequest?.expiryDate}
                    </Typography>
                  </Box>
                )}

                {/* If no payment data available */}
                {!selectedPaymentRequest?.cardNumber && !selectedPaymentRequest?.cardholderName && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#856404' }}>
                      No payment card details have been recorded for this request yet.
                    </Typography>
                  </Box>
                )}

                {/* Payment Status Info Box */}
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>Package:</strong> {selectedPaymentRequest?.packageName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>Placement:</strong> {selectedPaymentRequest?.placement === 'home' ? 'Home Page' : selectedPaymentRequest?.placement === 'browse' ? 'Browse Page' : 'Not specified'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>Payment Status:</strong>{' '}
                    <Chip
                      label={selectedPaymentRequest?.paymentStatus || 'Pending'}
                      size="small"
                      color={
                        selectedPaymentRequest?.paymentStatus === 'completed'
                          ? 'success'
                          : 'warning'
                      }
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>

                {/* Payment Slip Section */}
                {selectedPaymentRequest?.paymentSlipBase64 && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: '2px solid #2196f3' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#1976d2',
                        fontWeight: 600,
                        mb: 1.5,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      📎 Payment Proof / Slip
                    </Typography>
                    <Box
                      component="img"
                      src={getPhotoDataUri(selectedPaymentRequest?.paymentSlipBase64)}
                      alt="Payment Slip"
                      onError={(e) => {
                        console.error('Payment slip load error:', e);
                        e.target.style.display = 'none';
                      }}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: 1,
                        border: '1px solid #2196f3',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.9,
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <Typography>Loading...</Typography>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleClosePaymentDetails}
              variant="contained"
              sx={{
                bgcolor: '#000',
                color: '#fff',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#333',
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Photo Preview Dialog */}
        <Dialog
          open={photoDialogOpen}
          onClose={handleClosePhotoPreview}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              bgcolor: '#f5f5f5',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ImageIcon />
            Advertising Photo Preview
          </DialogTitle>

          <DialogContent sx={{ p: 3, textAlign: 'center' }}>
            {selectedPhotoRequest?.adPhotoBase64 ? (
              <Box>
                <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                  <strong>Company:</strong> {selectedPhotoRequest?.company || 'N/A'} | 
                  <strong sx={{ ml: 1 }}>Contact:</strong> {selectedPhotoRequest?.name || 'N/A'}
                </Typography>
                <Box
                  component="img"
                  src={getPhotoDataUri(selectedPhotoRequest?.adPhotoBase64)}
                  alt="Advertising Photo"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML += '<div style="padding: 40px; color: #d32f2f; fontSize: 14px;">Failed to load image. Base64 data may be corrupted.</div>';
                  }}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    borderRadius: 1,
                    border: '1px solid #ddd',
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  p: 3,
                  bgcolor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ImageIcon sx={{ fontSize: 48, color: '#856404' }} />
                <Typography sx={{ color: '#856404' }}>
                  No photo available for this advertising request.
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleClosePhotoPreview}
              variant="contained"
              sx={{
                bgcolor: '#000',
                color: '#fff',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#333',
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Proof Dialog */}
        <Dialog
          open={paymentProofDialogOpen}
          onClose={handleClosePaymentProof}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              bgcolor: '#f5f5f5',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ImageIcon />
            Payment Proof / Slip
          </DialogTitle>

          <DialogContent sx={{ p: 3, textAlign: 'center' }}>
            {selectedPaymentProofRequest?.bankSlipPath || selectedPaymentProofRequest?.cardProofPath ? (
              <Box>
                <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                  <strong>Reference:</strong> {selectedPaymentProofRequest?.paymentRefNumber || 'N/A'}{' '}
                  {selectedPaymentProofRequest?.paymentMethod && (
                    <span>
                      | <strong>Method:</strong> {selectedPaymentProofRequest.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Credit Card'}
                    </span>
                  )}
                </Typography>
                {selectedPaymentProofRequest?.bankSlipPath && (
                  <Box>
                    {selectedPaymentProofRequest.bankSlipPath.endsWith('.pdf') ? (
                      <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <ImageIcon sx={{ fontSize: 64, color: '#d32f2f' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>PDF Document</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Bank transfer proof document</Typography>
                        <Button 
                          variant="contained" 
                          href={getUploadUrl(selectedPaymentProofRequest.bankSlipPath)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download PDF
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={getUploadUrl(selectedPaymentProofRequest.bankSlipPath)}
                        alt="Bank Slip"
                        onError={(e) => {
                          console.error('Bank slip load error:', e, 'URL:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML += '<div style="padding: 40px; color: #d32f2f; fontSize: 14px;">Failed to load image. URL: ' + e.target.src + '</div>';
                        }}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: '500px',
                          borderRadius: 1,
                          border: '2px solid #2196f3',
                          objectFit: 'contain',
                        }}
                      />
                    )}
                  </Box>
                )}
                {selectedPaymentProofRequest?.cardProofPath && (
                  <Box>
                    {selectedPaymentProofRequest.cardProofPath.endsWith('.pdf') ? (
                      <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <ImageIcon sx={{ fontSize: 64, color: '#d32f2f' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>PDF Document</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Card payment proof document</Typography>
                        <Button 
                          variant="contained" 
                          href={getUploadUrl(selectedPaymentProofRequest.cardProofPath)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download PDF
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={getUploadUrl(selectedPaymentProofRequest.cardProofPath)}
                        alt="Card Proof"
                        onError={(e) => {
                          console.error('Card proof load error:', e, 'URL:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML += '<div style="padding: 40px; color: #d32f2f; fontSize: 14px;">Failed to load image. URL: ' + e.target.src + '</div>';
                        }}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: '500px',
                          borderRadius: 1,
                          border: '2px solid #2196f3',
                          objectFit: 'contain',
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            ) : selectedPaymentProofRequest?.paymentSlipBase64 ? (
              <Box>
                <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                  <strong>Reference:</strong> {selectedPaymentProofRequest?.paymentRefNumber || 'N/A'}
                </Typography>
                <Box
                  component="img"
                  src={getPhotoDataUri(selectedPaymentProofRequest?.paymentSlipBase64)}
                  alt="Payment Proof"
                  onError={(e) => {
                    console.error('Payment proof load error:', e);
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML += '<div style="padding: 40px; color: #d32f2f; fontSize: 14px;">Failed to load image. Base64 data may be corrupted.</div>';
                  }}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    borderRadius: 1,
                    border: '2px solid #2196f3',
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  p: 3,
                  bgcolor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ImageIcon sx={{ fontSize: 48, color: '#856404' }} />
                <Typography sx={{ color: '#856404' }}>
                  No payment proof available for this request.
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleClosePaymentProof}
              variant="contained"
              sx={{
                bgcolor: '#000',
                color: '#fff',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#333',
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Admin1Dashboard;
