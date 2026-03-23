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
  Edit,
  Delete,
  CompareArrows,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EditVehicleModal from '../components/EditVehicleModal';
import { getImageUrl } from '../utils/imageUrl';
import { getWatermarkedImage } from '../utils/watermark';

const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [watermarkedImageUrl, setWatermarkedImageUrl] = useState(null);
  const [watermarkLoading, setWatermarkLoading] = useState(false);
  
  // Test drive dialog
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const [testDriveDate, setTestDriveDate] = useState('');
  const [testDriveTime, setTestDriveTime] = useState('');
  const [testDriveMessage, setTestDriveMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Admin actions
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const isAdmin = user && ['admin1', 'admin2'].includes(user.role);

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  // Apply watermark to current image
  useEffect(() => {
    if (vehicle && vehicle.images && vehicle.images[currentImage]) {
      setWatermarkLoading(true);
      const originalImageUrl = getImageUrl(vehicle.images[currentImage]);
      getWatermarkedImage(originalImageUrl)
        .then(watermarkedUrl => {
          setWatermarkedImageUrl(watermarkedUrl);
          setWatermarkLoading(false);
        })
        .catch(error => {
          console.error('Failed to apply watermark:', error);
          setWatermarkedImageUrl(originalImageUrl);
          setWatermarkLoading(false);
        });
    }
  }, [vehicle, currentImage]);

  const fetchVehicle = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/vehicles/${id}`);
      setVehicle(data.data);
      
      // Log vehicle search
      try {
        await api.post('/search/log-vehicle', { vehicleId: id });
      } catch (err) {
        console.error('Failed to log vehicle search:', err);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vehicle');
    }
    setLoading(false);
  };

  const handleDeleteVehicle = async () => {
    try {
      await api.delete(`/vehicles/${id}`);
      alert('Vehicle deleted successfully!');
      navigate('/vehicles');
    } catch (err) {
      alert('Error deleting vehicle: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleSold = async () => {
    try {
      const newStatus = vehicle.status === 'available' ? 'sold' : 'available';
      const { data } = await api.put(`/vehicles/${id}`, { status: newStatus });
      // Preserve seller info from original vehicle
      const updatedVehicle = {
        ...data.data,
        sellerId: data.data.sellerId || vehicle.sellerId
      };
      setVehicle(updatedVehicle);
      alert(`Vehicle marked as ${newStatus}!`);
    } catch (err) {
      alert('Error updating vehicle: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditSuccess = (updatedVehicle) => {
    // Preserve seller info from original vehicle if not in updated vehicle
    const vehicleToSet = {
      ...updatedVehicle,
      sellerId: updatedVehicle.sellerId || vehicle.sellerId
    };
    setVehicle(vehicleToSet);
    setEditModalOpen(false);
    alert('Vehicle updated successfully!');
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
      setSuccess('Test drive booked successfully!');
      setTestDriveOpen(false);
      setTestDriveDate('');
      setTestDriveTime('');
      setTestDriveMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book test drive');
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

  // Check if current user is the seller
  const isOwner = user && vehicle.sellerId && (
    String(typeof vehicle.sellerId === 'string' ? vehicle.sellerId : (vehicle.sellerId._id || vehicle.sellerId.id)) === 
    String(user._id || user.id)
  );

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
              {watermarkLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
              <Box
                component="img"
                src={watermarkedImageUrl || getImageUrl(vehicle.images?.[currentImage])}
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
                    src={getImageUrl(img)}
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

            {/* Boost Ad Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#d32f2f',
                  color: 'white',
                  fontWeight: 'bold',
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: '#b71c1c',
                  },
                }}
              >
                Boost Ad
              </Button>
            </Box>
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

              {/* Vehicle Location */}
              {vehicle.location && (vehicle.location.city || vehicle.location.country) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📍 Vehicle Location
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography fontWeight="600" sx={{ mb: 0.5, fontSize: '1rem' }}>
                          {vehicle.location.city || 'City'}{vehicle.location.country && `, ${vehicle.location.country}`}
                        </Typography>
                        {vehicle.location.state && (
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.location.state}
                          </Typography>
                        )}
                        {vehicle.location.address && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            📬 {vehicle.location.address}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Seller Info */}
              {vehicle.sellerId && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    👤 Seller Profile
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#fef5e7', border: '1px solid #f9e79f', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: 'primary.main',
                          width: 50,
                          height: 50,
                          fontSize: '1.25rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {vehicle.sellerId.firstName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {vehicle.sellerId.firstName} {vehicle.sellerId.lastName}
                          </Typography>
                          {vehicle.sellerId.isFaceVerified && (
                            <VerifiedUser fontSize="small" sx={{ color: '#27ae60' }} title="Face Verified" />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Seller ID: {typeof vehicle.sellerId === 'string' ? vehicle.sellerId.slice(0, 8) : vehicle.sellerId._id?.slice(0, 8)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Contact Info */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Phone fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Phone</Typography>
                          <Typography variant="body2" fontWeight="600">{vehicle.sellerId.phone}</Typography>
                        </Box>
                      </Box>
                      {vehicle.sellerId.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Email fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Email</Typography>
                            <Typography variant="body2" fontWeight="600">{vehicle.sellerId.email}</Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Box>
              )}
              {/* Description */}
              {vehicle.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 Description
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.6 }}>
                      {vehicle.description}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />
              {/* Actions */}
              {!isOwner && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Event />}
                    onClick={() => setTestDriveOpen(true)}
                  >
                    Book Vehicle for Test Drive
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<CompareArrows />}
                    onClick={() => navigate(`/compare/${id}`)}
                  >
                    Compare Vehicles
                  </Button>
                </Box>
              )}

              {isOwner && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="info"
                      fullWidth
                      size="large"
                      startIcon={<Edit />}
                      onClick={() => setEditModalOpen(true)}
                    >
                      Edit Vehicle
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      size="large"
                      startIcon={<Delete />}
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      Delete Vehicle
                    </Button>
                  </Box>
                  <Button
                    variant="outlined"
                    color={vehicle.status === 'available' ? 'error' : 'success'}
                    fullWidth
                    size="large"
                    onClick={handleToggleSold}
                  >
                    {vehicle.status === 'available' ? 'Mark as Sold' : 'Mark as Available'}
                  </Button>
                </Box>
              )}

              {isAdmin && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="info"
                      fullWidth
                      size="large"
                      startIcon={<Edit />}
                      onClick={() => setEditModalOpen(true)}
                    >
                      Edit Vehicle
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      size="large"
                      startIcon={<Delete />}
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      Delete Vehicle
                    </Button>
                  </Box>
                  <Button
                    variant="outlined"
                    color={vehicle.status === 'available' ? 'error' : 'success'}
                    fullWidth
                    size="large"
                    onClick={handleToggleSold}
                  >
                    {vehicle.status === 'available' ? 'Mark as Sold' : 'Mark as Available'}
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

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
          <DialogTitle>Book Vehicle for Test Drive</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Book a test drive for {vehicle.brand} {vehicle.model}
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Delete Vehicle</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{vehicle?.brand} {vehicle?.model}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteVehicle} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Vehicle Modal */}
        <EditVehicleModal
          open={editModalOpen}
          vehicle={vehicle}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      </Container>
    </Box>
  );
};

export default VehicleDetailPage;
