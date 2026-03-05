/**
 * My Vehicles Page
 * Seller's vehicle management
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Speed,
  CalendarToday,
} from '@mui/icons-material';
import api from '../services/api';

const MyVehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vehicles/my-vehicles');
      setVehicles(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
    }
    setLoading(false);
  };

  const handleMenuOpen = (event, vehicle) => {
    setAnchorEl(event.currentTarget);
    setSelectedVehicle(vehicle);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleToggleStatus = async () => {
    handleMenuClose();
    try {
      const newStatus = selectedVehicle.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/vehicles/${selectedVehicle._id}`, { status: newStatus });
      setVehicles(vehicles.map((v) => 
        v._id === selectedVehicle._id ? { ...v, status: newStatus } : v
      ));
      setSuccess(`Vehicle ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/vehicles/${selectedVehicle._id}`);
      setVehicles(vehicles.filter((v) => v._id !== selectedVehicle._id));
      setSuccess('Vehicle deleted successfully');
      setDeleteOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
    }
    setDeleting(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'sold': return 'info';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              My Vehicles
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your vehicle listings
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/add-vehicle"
            variant="contained"
            startIcon={<Add />}
          >
            Add Vehicle
          </Button>
        </Box>

        {/* Alerts */}
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

        {/* Vehicles */}
        {vehicles.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No vehicles listed yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your first vehicle to start selling
            </Typography>
            <Button
              component={Link}
              to="/add-vehicle"
              variant="contained"
              startIcon={<Add />}
            >
              Add Vehicle
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {vehicles.map((vehicle) => (
              <Grid item xs={12} sm={6} md={4} key={vehicle._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* Status Badge */}
                  <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                    <Chip
                      label={vehicle.status}
                      size="small"
                      color={getStatusColor(vehicle.status)}
                    />
                  </Box>
                  
                  {/* Menu Button */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      zIndex: 1,
                    }}
                    onClick={(e) => handleMenuOpen(e, vehicle)}
                  >
                    <MoreVert />
                  </IconButton>

                  <CardMedia
                    component="img"
                    height="180"
                    image={vehicle.images?.[0] || '/placeholder-car.jpg'}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {formatPrice(vehicle.price)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.year}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Speed fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.mileage?.toLocaleString()} km
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      component={Link}
                      to={`/vehicles/${vehicle._id}`}
                      variant="outlined"
                      fullWidth
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem component={Link} to={`/vehicles/${selectedVehicle?._id}`}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            View
          </MenuItem>
          <MenuItem onClick={handleToggleStatus}>
            {selectedVehicle?.status === 'active' ? (
              <>
                <VisibilityOff sx={{ mr: 1 }} fontSize="small" />
                Deactivate
              </>
            ) : (
              <>
                <Visibility sx={{ mr: 1 }} fontSize="small" />
                Activate
              </>
            )}
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>Delete Vehicle</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedVehicle?.brand} {selectedVehicle?.model}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={deleting}
            >
              {deleting ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default MyVehiclesPage;
