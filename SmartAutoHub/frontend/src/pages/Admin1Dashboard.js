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
} from '@mui/icons-material';
import api from '../services/api';

const Admin1Dashboard = () => {
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
  
  // Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('');

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
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
      }
    } catch (err) {
      setError('Failed to fetch data');
    }
    setLoading(false);
  };

  const handleMenuOpen = (event, item) => {
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
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
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
                          <IconButton onClick={(e) => handleMenuOpen(e, user)}>
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
                          <IconButton onClick={(e) => handleMenuOpen(e, vehicle)}>
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
        </Menu>

        {/* Confirmation Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {dialogAction} this {tab === 0 ? 'user' : 'vehicle'}?
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
      </Container>
    </Box>
  );
};

export default Admin1Dashboard;
