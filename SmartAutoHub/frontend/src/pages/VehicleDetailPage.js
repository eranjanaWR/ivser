/**
 * Vehicle Detail Page
 * Single vehicle view with contact seller option
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Speed,
  CalendarToday,
  LocalGasStation,
  Settings,
  ColorLens,
  DirectionsCar,
  Person,
  Phone,
  Email,
  Event,
  ChevronLeft,
  ChevronRight,
  VerifiedUser,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  
  // Test drive dialog
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const [testDriveDate, setTestDriveDate] = useState('');
  const [testDriveTime, setTestDriveTime] = useState('');
  const [testDriveMessage, setTestDriveMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const fetchVehicle = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/vehicles/${id}`);
      setVehicle(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vehicle');
    }
    setLoading(false);
  };

  const handleTestDriveSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/test-drives', {
        vehicle: id,
        preferredDate: testDriveDate,
        preferredTime: testDriveTime,
        message: testDriveMessage,
      });
      setSuccess('Test drive request sent successfully!');
      setTestDriveOpen(false);
      setTestDriveDate('');
      setTestDriveTime('');
      setTestDriveMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request test drive');
    }
    setSubmitting(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % (vehicle?.images?.length || 1));
  };

  const prevImage = () => {
    setCurrentImage((prev) => 
      prev === 0 ? (vehicle?.images?.length || 1) - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Vehicle not found'}</Alert>
        <Button
          component={Link}
          to="/vehicles"
          startIcon={<ArrowBack />}
          sx={{ mt: 2 }}
        >
          Back to Vehicles
        </Button>
      </Container>
    );
  }

  const isOwner = user && vehicle.seller?._id === user._id;

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        {/* Back Button */}
        <Button
          component={Link}
          to="/vehicles"
          startIcon={<ArrowBack />}
          sx={{ mb: 3 }}
        >
          Back to Vehicles
        </Button>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Image Gallery */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Box
                component="img"
                src={vehicle.images?.[currentImage] || '/placeholder-car.jpg'}
                alt={`${vehicle.brand} ${vehicle.model}`}
                sx={{
                  width: '100%',
                  height: 400,
                  objectFit: 'cover',
                }}
              />
              
              {vehicle.images?.length > 1 && (
                <>
                  <IconButton
                    onClick={prevImage}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': { bgcolor: 'white' },
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton
                    onClick={nextImage}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': { bgcolor: 'white' },
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    {vehicle.images.map((_, index) => (
                      <Box
                        key={index}
                        onClick={() => setCurrentImage(index)}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: index === currentImage ? 'primary.main' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Paper>
            
            {/* Thumbnail Strip */}
            {vehicle.images?.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto' }}>
                {vehicle.images.map((img, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={img}
                    onClick={() => setCurrentImage(index)}
                    sx={{
                      width: 80,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      opacity: index === currentImage ? 1 : 0.6,
                      border: index === currentImage ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                    }}
                  />
                ))}
              </Box>
            )}
          </Grid>

          {/* Vehicle Details */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}
            >
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={vehicle.condition}
                  color={vehicle.condition === 'New' ? 'success' : 'default'}
                  size="small"
                />
                <Chip label={vehicle.status} size="small" variant="outlined" />
              </Box>

              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {vehicle.brand} {vehicle.model}
              </Typography>

              <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mb: 3 }}>
                {formatPrice(vehicle.price)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Specs Grid */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Year</Typography>
                      <Typography fontWeight="medium">{vehicle.year}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Speed color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Mileage</Typography>
                      <Typography fontWeight="medium">{vehicle.mileage?.toLocaleString()} km</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalGasStation color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Fuel Type</Typography>
                      <Typography fontWeight="medium">{vehicle.fuelType}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Settings color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Transmission</Typography>
                      <Typography fontWeight="medium">{vehicle.transmission}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ColorLens color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Color</Typography>
                      <Typography fontWeight="medium">{vehicle.color}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsCar color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Engine</Typography>
                      <Typography fontWeight="medium">{vehicle.engineCapacity} cc</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Seller Info */}
              {vehicle.seller && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Seller
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {vehicle.seller.name?.[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight="bold">{vehicle.seller.name}</Typography>
                        {vehicle.seller.isFaceVerified && (
                          <VerifiedUser fontSize="small" color="primary" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.seller.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Actions */}
              {!isOwner && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Event />}
                    onClick={() => setTestDriveOpen(true)}
                  >
                    Request Test Drive
                  </Button>
                </Box>
              )}

              {isOwner && (
                <Button
                  component={Link}
                  to={`/my-vehicles`}
                  variant="outlined"
                  fullWidth
                  size="large"
                >
                  Manage Your Listings
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Description */}
        {vehicle.description && (
          <Paper
            elevation={0}
            sx={{ p: 3, mt: 4, border: '1px solid', borderColor: 'grey.200' }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Description
            </Typography>
            <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {vehicle.description}
            </Typography>
          </Paper>
        )}

        {/* Features */}
        {vehicle.features?.length > 0 && (
          <Paper
            elevation={0}
            sx={{ p: 3, mt: 3, border: '1px solid', borderColor: 'grey.200' }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Features
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {vehicle.features.map((feature, index) => (
                <Chip key={index} label={feature} variant="outlined" />
              ))}
            </Box>
          </Paper>
        )}

        {/* Test Drive Dialog */}
        <Dialog open={testDriveOpen} onClose={() => setTestDriveOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Request Test Drive</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Request a test drive for {vehicle.brand} {vehicle.model}
            </Typography>
            <TextField
              fullWidth
              label="Preferred Date"
              type="date"
              value={testDriveDate}
              onChange={(e) => setTestDriveDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Preferred Time"
              type="time"
              value={testDriveTime}
              onChange={(e) => setTestDriveTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Message to Seller (Optional)"
              multiline
              rows={3}
              value={testDriveMessage}
              onChange={(e) => setTestDriveMessage(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestDriveOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleTestDriveSubmit}
              disabled={!testDriveDate || !testDriveTime || submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Send Request'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default VehicleDetailPage;
