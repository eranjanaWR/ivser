/**
 * Test Drive Availability Selection Page
 * Allows buyers to view seller's availability and select preferred time slots
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  ErrorOutline,
  Info as InfoIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREVIATIONS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const TestDriveAvailabilitySelection = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [seller, setSeller] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchVehicleAndAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, isAuthenticated]);

  const fetchVehicleAndAvailability = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch vehicle details
      const vehicleResponse = await api.get(`/vehicles/${vehicleId}`);
      const vehicleData = vehicleResponse.data.data;
      setVehicle(vehicleData);

      // Extract seller ID (sellerId might be populated object with _id)
      const sellerId = typeof vehicleData.sellerId === 'object' && vehicleData.sellerId._id 
        ? vehicleData.sellerId._id 
        : vehicleData.sellerId;

      if (!sellerId) {
        throw new Error('Seller ID not found in vehicle data');
      }

      // Fetch seller availability using public endpoint
      console.log('📥 Fetching seller availability for seller:', sellerId);
      const availabilityResponse = await api.get(`/availability/seller/${sellerId}`);
      console.log('📦 Seller availability:', availabilityResponse.data);
      
      setAvailability(availabilityResponse.data.data);
      
      // Set seller details if already populated in vehicle response
      if (vehicleData.sellerId && typeof vehicleData.sellerId === 'object') {
        setSeller(vehicleData.sellerId);
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load availability information');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slotId) => {
    console.log('🎯 Selected slot:', slotId);
    setSelectedSlot(slotId);
  };

  const handleProceedToBooking = async () => {
    if (!selectedSlot) {
      setError('Please select a preferred time slot');
      return;
    }

    setSelecting(true);
    try {
      // Find selected slot details
      const slot = availability?.availabilitySlots?.find(s => s.id === selectedSlot);
      
      if (!slot) {
        setError('Selected slot not found');
        setSelecting(false);
        return;
      }

      // Create bookingData with selected slot information
      const bookingData = {
        vehicleId: vehicleId,
        sellerId: vehicle.sellerId,
        selectedSlotId: selectedSlot,
        slot: {
          startTime: slot.startTime,
          endTime: slot.endTime,
          days: slot.days,
          enabled: slot.enabled,
        },
      };

      console.log('💾 Selected slot for booking:', bookingData);
      sessionStorage.setItem('testDriveBookingData', JSON.stringify(bookingData));

      // Navigate to date/time scheduling
      navigate(`/book-test-drive/${vehicleId}/schedule`, { 
        state: { selectedSlot: slot } 
      });
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSelecting(false);
    }
  };

  const getDaysText = (days) => {
    const selectedDays = DAYS_OF_WEEK.filter((_, i) => days[i]).map(d => d.substring(0, 3)).join(', ');
    if (!selectedDays) return 'No days available';
    return selectedDays;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading seller's availability...
        </Typography>
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          icon={<ErrorOutline />}
          sx={{ mb: 3 }}
        >
          {error || 'Unable to load vehicle details'}
        </Alert>
        <Button
          component={Link}
          to="/vehicles"
          startIcon={<ArrowBack />}
          variant="contained"
        >
          Back to Vehicles
        </Button>
      </Container>
    );
  }

  const isDefault24x7 = !availability?.availabilitySlots || availability.availabilitySlots.length === 0;
  const hasAvailability = !isDefault24x7 && availability?.availabilitySlots;

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '90vh' }}>
      <Container maxWidth="md">
        {/* Back Button */}
        <Button
          component={Link}
          to={`/vehicles/${vehicleId}`}
          startIcon={<ArrowBack />}
          sx={{ mb: 3 }}
        >
          Back to Vehicle
        </Button>

        {/* Header Card */}
        <Paper
          elevation={2}
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            p: 4,
            borderRadius: 2,
            mb: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CalendarIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Check Availability
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95 }}>
                {vehicle.brand} {vehicle.model} • {vehicle.year}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            icon={<ErrorOutline />}
            onClose={() => setError('')}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Seller Info Card */}
        {seller && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Seller Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight="600">
                    {seller.firstName} {seller.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1" fontWeight="600">
                    {seller.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1" fontWeight="600">
                    {seller.phone || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">City</Typography>
                  <Typography variant="body1" fontWeight="600">
                    {seller.city || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Availability Status */}
        {isDefault24x7 ? (
          <Card sx={{ mb: 4, border: '2px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main' }}>
                    Available 24/7
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This seller is available for test drives at any time, any day of the week
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                Since the seller has flexible availability, you can propose any date and time for your test drive.
              </Alert>

              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                Choose your preferred time:
              </Typography>
              
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <RadioGroup value={selectedSlot || '24x7'} onChange={(e) => handleSlotSelect(e.target.value)}>
                  <FormControlLabel
                    value="24x7"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="600">
                          Flexible Time (24/7)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          I'll propose my preferred date and time
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Paper>
            </CardContent>
          </Card>
        ) : null}

        {/* Custom Availability Slots */}
        {hasAvailability && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ScheduleIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Available Time Slots
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select one of the seller's available time slots:
              </Typography>

              <RadioGroup value={selectedSlot || ''} onChange={(e) => handleSlotSelect(e.target.value)}>
                <Grid container spacing={2}>
                  {availability.availabilitySlots
                    ?.filter(slot => slot.enabled)
                    .map((slot, index) => (
                      <Grid item xs={12} key={slot.id}>
                        <Paper
                          elevation={selectedSlot === slot.id ? 2 : 0}
                          sx={{
                            p: 2,
                            border: '2px solid',
                            borderColor: selectedSlot === slot.id ? 'primary.main' : 'divider',
                            bgcolor: selectedSlot === slot.id ? '#f5f9ff' : 'background.paper',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: '#f5f9ff',
                            },
                          }}
                        >
                          <FormControlLabel
                            value={slot.id}
                            control={<Radio />}
                            label={
                              <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <ScheduleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    Slot {index + 1}: {slot.startTime} - {slot.endTime}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {DAYS_OF_WEEK.map((day, dayIndex) => (
                                    <Chip
                                      key={dayIndex}
                                      label={DAY_ABBREVIATIONS[dayIndex]}
                                      size="small"
                                      variant={slot.days[dayIndex] ? 'filled' : 'outlined'}
                                      color={slot.days[dayIndex] ? 'primary' : 'default'}
                                      sx={{
                                        opacity: slot.days[dayIndex] ? 1 : 0.4,
                                      }}
                                    />
                                  ))}
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  Available: {getDaysText(slot.days)}
                                </Typography>
                              </Box>
                            }
                            sx={{ width: '100%', alignItems: 'flex-start', mt: 0 }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                </Grid>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Information Box */}
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 4 }}>
          <strong>📌 Next Step:</strong> After confirming your slot selection, you'll provide your contact details and complete the booking request.
        </Alert>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            component={Link}
            to={`/vehicles/${vehicleId}`}
            variant="outlined"
            size="large"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={selectedSlot ? <CheckIcon /> : null}
            onClick={handleProceedToBooking}
            disabled={!selectedSlot || selecting}
          >
            {selecting ? 'Processing...' : 'Proceed to Booking'}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default TestDriveAvailabilitySelection;
