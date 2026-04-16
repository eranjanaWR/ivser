/**
 * Test Drive Booking Confirmation Page
 * Collects buyer details and confirms the booking after slot selection
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  PersonOutline,
  EmailOutlined,
  PhoneOutlined,
  Schedule as ScheduleIcon,
  ErrorOutline,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREVIATIONS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const TestDriveBooking = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTime, setScheduledTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch data on component mount
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch vehicle details
      const vehicleResponse = await api.get(`/vehicles/${vehicleId}`);
      setVehicle(vehicleResponse.data.data);

      // Get selected slot from sessionStorage
      const bookingData = JSON.parse(sessionStorage.getItem('testDriveBookingData') || '{}');
      if (bookingData.slot) {
        console.log('📌 Selected slot loaded:', bookingData.slot);
        setSelectedSlot(bookingData.slot);
      }
      if (bookingData.selectedDate) {
        console.log('📅 Scheduled date loaded:', bookingData.selectedDate);
        setScheduledDate(bookingData.selectedDate);
      }
      if (bookingData.selectedTime) {
        console.log('⏰ Scheduled time loaded:', bookingData.selectedTime);
        setScheduledTime(bookingData.selectedTime);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setFormError('Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      setFormError('Please enter your email address');
      return false;
    }
    if (!formData.email.includes('@')) {
      setFormError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setFormError('Please enter your phone number');
      return false;
    }
    if (!selectedSlot) {
      setFormError('No time slot selected. Please go back and select a slot.');
      return false;
    }
    if (!scheduledDate) {
      setFormError('No date selected. Please go back and choose a date.');
      return false;
    }
    if (!scheduledTime) {
      setFormError('No time selected. Please go back and choose a time.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      console.log('📝 Submitting test drive booking...');
      console.log('Booking details:', {
        vehicleId,
        buyerId: user._id,
        buyerName: formData.fullName,
        buyerEmail: formData.email,
        buyerPhone: formData.phone,
        selectedSlot: selectedSlot,
      });

      const response = await api.post('/buyer/book-testdrive', {
        vehicleId,
        selectedSlot: selectedSlot,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        buyerInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
      });

      console.log('✅ Booking submitted successfully:', response.data);
      setBookingId(response.data.data.bookingId);
      setSubmitSuccess(true);
      sessionStorage.removeItem('testDriveBookingData');
      
      setTimeout(() => {
        navigate('/test-drives', { 
          state: { message: 'Your test drive booking has been submitted! Awaiting seller confirmation.' } 
        });
      }, 3000);

    } catch (err) {
      console.error('❌ Booking submission failed:', err);
      setFormError(err.response?.data?.message || 'Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysText = (days) => {
    if (!days || days.length !== 7) return 'Unknown';
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
          Loading vehicle details...
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
          {error || 'Vehicle not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/vehicles')}
          variant="contained"
        >
          Back to Vehicles
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '90vh' }}>
      <Container maxWidth="md">
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back to Availability
        </Button>

        {/* Success Message - Booking Pending Status */}
        {submitSuccess && (
          <Card 
            sx={{ 
              mb: 4, 
              background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)',
              border: '2px solid #1976d2',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <CheckIcon sx={{ fontSize: 56, color: 'success.main' }} />
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1565c0', mb: 1 }}>
                Booking Request Submitted!
              </Typography>
              <Typography variant="h6" sx={{ color: '#f57c00', mb: 2, fontWeight: 600 }}>
                Status: PENDING
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ mb: 1.5, color: 'text.primary' }}>
                Your test drive booking has been sent to the seller.
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                The seller will review your request and contact you within 24 hours to confirm or suggest alternative times.
              </Typography>
              
              {bookingId && (
                <Paper sx={{ p: 2, bgcolor: 'white', border: '1px solid #e0e0e0', mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Booking ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#1976d2' }}>
                    {bookingId}
                  </Typography>
                </Paper>
              )}
              
              <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                <strong>What's next?</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>You'll receive an email notification when the seller responds</li>
                  <li>Check your test drives page to see booking status updates</li>
                  <li>Contact the seller directly if urgent</li>
                </ul>
              </Alert>

              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Redirecting to your test drives in a few seconds...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Main Card */}
        <Card 
          elevation={2}
          sx={{ 
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            mb: 3,
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Confirm Your Test Drive Booking
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {vehicle.brand} {vehicle.model} • {vehicle.year}
            </Typography>
          </Box>

          {/* Selected Slot Display */}
          {selectedSlot && (
            <Box
              sx={{
                bgcolor: '#e8f5e9',
                borderBottom: '1px solid #4caf50',
                p: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ScheduleIcon sx={{ color: 'success.main', fontSize: 24 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main' }}>
                  Your Scheduled Test Drive
                </Typography>
              </Box>

              {/* Scheduled Date and Time */}
              {scheduledDate && scheduledTime && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, border: '2px solid #4caf50' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Date</Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
                        📅 {scheduledDate}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Time</Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
                        🕐 {scheduledTime}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Available Slot Info */}
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5 }}>
                Within Available Slot:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>{selectedSlot.startTime} - {selectedSlot.endTime}</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {DAYS_OF_WEEK.map((day, dayIndex) => (
                  <Chip
                    key={dayIndex}
                    label={DAY_ABBREVIATIONS[dayIndex]}
                    size="small"
                    variant={selectedSlot.days[dayIndex] ? 'filled' : 'outlined'}
                    color={selectedSlot.days[dayIndex] ? 'success' : 'default'}
                    sx={{
                      opacity: selectedSlot.days[dayIndex] ? 1 : 0.3,
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                Available on: <strong>{getDaysText(selectedSlot.days)}</strong>
              </Typography>
            </Box>
          )}

          {/* Form Section */}
          <CardContent sx={{ p: 4 }}>
            {/* Error Alert */}
            {formError && (
              <Alert 
                severity="error" 
                icon={<ErrorOutline />}
                onClose={() => setFormError('')}
                sx={{ mb: 3 }}
              >
                {formError}
              </Alert>
            )}

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Your Contact Information
            </Typography>

            {/* Form Fields Grid */}
            <Grid container spacing={3}>
              {/* Full Name Field */}
              <Grid item xs={12}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight="600" 
                  sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <PersonOutline sx={{ fontSize: 20 }} />
                  Full Name *
                </Typography>
                <TextField
                  fullWidth
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  variant="outlined"
                  size="medium"
                  disabled={submitting || submitSuccess}
                />
              </Grid>

              {/* Email Field */}
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight="600" 
                  sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <EmailOutlined sx={{ fontSize: 20 }} />
                  Email Address *
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  variant="outlined"
                  size="medium"
                  disabled={submitting || submitSuccess}
                />
              </Grid>

              {/* Phone Number Field */}
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight="600" 
                  sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <PhoneOutlined sx={{ fontSize: 20 }} />
                  Phone Number *
                </Typography>
                <TextField
                  fullWidth
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}  
                  placeholder="+94 71 234 5678"
                  variant="outlined"
                  size="medium"
                  disabled={submitting || submitSuccess}
                />
              </Grid>

              {/* Information Box */}
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    bgcolor: '#e3f2fd',
                    border: '1px solid #bbdefb',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" color="primary.dark">
                    <strong>📌 Note:</strong> Your booking request will be sent to the seller for confirmation. The seller can accept or suggest alternative times.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Divider */}
            <Divider sx={{ my: 3 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(-1)}
                disabled={submitting || submitSuccess}
              >
                Back
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CheckIcon />}
                onClick={handleSubmit}
                disabled={submitting || submitSuccess}
              >
                {submitting ? 'Submitting...' : 'Confirm & Book Test Drive'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <strong>ℹ️ What happens next?</strong> The seller will review your booking request and will contact you within 24 hours to confirm or suggest alternative times.
        </Alert>
      </Container>
    </Box>
  );
};

export default TestDriveBooking;
