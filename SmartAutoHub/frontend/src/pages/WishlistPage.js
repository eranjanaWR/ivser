/**
 * Wishlist Page
 * Display saved vehicles in a dedicated page
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Favorite,
  Close,
  Speed,
  CalendarToday,
  LocalGasStation,
} from '@mui/icons-material';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removing, setRemoving] = useState(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [vehicleToRemove, setVehicleToRemove] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      console.log('Fetching wishlist from /vehicles/saved');
      const response = await api.get('/vehicles/saved');
      console.log('Full Wishlist response:', response);
      console.log('Response data:', response.data);
      console.log('Vehicles array:', response.data?.data);
      console.log('Number of vehicles:', response.data?.data?.length);
      
      const vehiclesList = response.data?.data || [];
      console.log('Setting vehicles to:', vehiclesList);
      setVehicles(vehiclesList);
      setError('');
    } catch (err) {
      console.error('Wishlist fetch error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to fetch wishlist');
      setVehicles([]);
    }
    setLoading(false);
  };

  const handleRemoveClick = (vehicle) => {
    setVehicleToRemove(vehicle);
    setRemoveConfirmOpen(true);
  };

  const handleRemoveConfirm = async () => {
    setRemoving(vehicleToRemove._id);
    try {
      await api.post(`/vehicles/${vehicleToRemove._id}/save`);
      setVehicles(vehicles.filter(v => v._id !== vehicleToRemove._id));
      setSuccess('Removed from wishlist');
      setRemoveConfirmOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove from wishlist');
    } finally {
      setRemoving(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        {/* Back Button and Header */}
        <Button
          component={Link}
          to="/profile"
          startIcon={<ArrowBack />}
          sx={{ mb: 3 }}
        >
          Back to Profile
        </Button>

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

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Favorite sx={{ fontSize: 32, color: 'error.main' }} />
            <Typography variant="h3" fontWeight="bold">
              My Wishlist
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} saved
          </Typography>
        </Box>

        {vehicles.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'grey.200' }}>
            <Favorite sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No vehicles in your wishlist yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start adding vehicles to your wishlist to compare and keep track of your favorites.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/vehicles')}
            >
              Browse Vehicles
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {vehicles.map((vehicle) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={vehicle._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, boxShadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onClick={() => navigate(`/vehicles/${vehicle._id}`)}
                >
                  {/* Image with Remove Button */}
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={vehicle.images?.[0] ? getImageUrl(vehicle.images[0]) : '/placeholder.jpg'}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      sx={{ objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveClick(vehicle);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'white',
                        '&:hover': { bgcolor: 'error.light' },
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Condition and Fuel Type */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={vehicle.condition}
                        size="small"
                        color={vehicle.condition === 'New' ? 'success' : 'default'}
                      />
                    </Box>

                    {/* Title */}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {vehicle.brand} {vehicle.model}
                    </Typography>

                    {/* Price */}
                    <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ mb: 2 }}>
                      {formatPrice(vehicle.price)}
                    </Typography>

                    {/* Specs */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.year}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Speed sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.mileage?.toLocaleString()} km
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocalGasStation sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.fuelType}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Location */}
                    {vehicle.location?.city && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        📍 {vehicle.location.city}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vehicles/${vehicle._id}`);
                      }}
                      sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeConfirmOpen} onClose={() => setRemoveConfirmOpen(false)}>
        <DialogTitle>Remove from Wishlist?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {vehicleToRemove?.brand} {vehicleToRemove?.model} from your wishlist?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRemoveConfirm}
            variant="contained"
            color="error"
            disabled={removing === vehicleToRemove?._id}
          >
            {removing === vehicleToRemove?._id ? <CircularProgress size={24} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WishlistPage;
