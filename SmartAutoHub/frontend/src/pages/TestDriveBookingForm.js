/**
 * Test Drive Booking - All-in-One Form
 * Select slot, pick date/time, and confirm booking all on one page
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  ErrorOutline,
  PersonOutline,
  EmailOutlined,
  PhoneOutlined,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREVIATIONS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const TestDriveBookingForm = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [seller, setSeller] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [formData, setFormData] = useState({
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [timeValidationError, setTimeValidationError] = useState(''); // Track real-time validation

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchData();
    // Clear all errors when component mounts
    setFormError('');
    setTimeValidationError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('📥 Fetching vehicle:', vehicleId);
      const vehicleResponse = await api.get(`/vehicles/${vehicleId}`);
      const vehicleData = vehicleResponse.data.data;
      console.log('✓ Vehicle fetched:', vehicleData);
      setVehicle(vehicleData);

      const sellerId =
        typeof vehicleData.sellerId === 'object' && vehicleData.sellerId._id
          ? vehicleData.sellerId._id
          : vehicleData.sellerId;

      console.log('Seller ID extracted:', sellerId);
      
      if (!sellerId) {
        throw new Error('Seller ID not found in vehicle data');
      }

      console.log('📥 Fetching availability for seller:', sellerId);
      const availabilityResponse = await api.get(`/availability/seller/${sellerId}`);
      console.log('✓ Availability fetched:', availabilityResponse.data);
      setAvailability(availabilityResponse.data.data);

      if (vehicleData.sellerId && typeof vehicleData.sellerId === 'object') {
        setSeller(vehicleData.sellerId);
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load information';
      console.error('❌ Error detail:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slotId) => {
    console.log('🎯 Switching to slot:', slotId);
    setSelectedSlot(slotId);
    // Reset form fields when switching slots
    setSelectedDate('');
    setSelectedTime('');
    // Reset all validation errors immediately
    setFormError('');
    setTimeValidationError('');
    console.log('✓ Slot switched, errors and form cleared');
  };

  // Check if seller has defined slots
  const hasAvailabilitySlots = availability?.availabilitySlots && availability.availabilitySlots.length > 0;

  // Get the currently selected slot - properly memoized to avoid stale references
  const currentSlot = useMemo(() => {
    if (!selectedSlot || !availability?.availabilitySlots) return null;
    
    // Find the slot by ID if available, otherwise by index
    return availability.availabilitySlots.find((slot, idx) => {
      const slotIdentifier = slot.id !== undefined ? slot.id : idx;
      return slotIdentifier === selectedSlot;
    });
  }, [selectedSlot, availability]);

  // Update time validation error in real-time whenever slot or time changes
  useEffect(() => {
    // Reset validation whenever slot changes
    if (!currentSlot) {
      setTimeValidationError('');
      return;
    }

    // Only validate if we have a time entered
    if (!selectedTime) {
      setTimeValidationError('');
      return;
    }

    // Check if time is valid for current slot
    const isValid = validateTimeRange(selectedTime);
    
    if (!isValid) {
      // Time is outside the slot's range
      setTimeValidationError(
        `❌ Please enter a valid time within the allowed range: ${convertTo12Hour(currentSlot.startTime)} - ${convertTo12Hour(currentSlot.endTime)}`
      );
    } else {
      // Time is valid - clear both field and form errors
      setTimeValidationError('');
      setFormError('');
    }
  }, [selectedTime, currentSlot]); // Track currentSlot, not selectedSlot

  // Generate allowed dates for the selected slot (starting from TODAY)
  const getAllowedDates = () => {
    if (!currentSlot) return [];
    
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    // Loop through next 30 days starting from TODAY (i=0)
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i); // i=0 is today, i=1 is tomorrow, etc
      
      const dayOfWeek = date.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday=0
      
      // Only add if this day is available in the slot
      if (currentSlot.days[adjustedDay]) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        });
      }
    }
    return dates;
  };

  const allowedDates = getAllowedDates();

  // Validate if typed time is within the slot's time range
  const validateTimeRange = (time) => {
    if (!currentSlot || !time) return true; // No validation if no slot or no time
    
    const [inputHour, inputMin] = time.split(':').map(Number);
    // Convert 12-hour format to 24-hour for comparison
    const start24 = convertTo24Hour(currentSlot.startTime);
    const end24 = convertTo24Hour(currentSlot.endTime);
    const [startHour, startMin] = start24.split(':').map(Number);
    const [endHour, endMin] = end24.split(':').map(Number);
    
    const inputTime = inputHour * 60 + inputMin;
    const startTimeMinutes = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;
    
    return inputTime >= startTimeMinutes && inputTime <= endTimeMinutes;
  };

  // Convert 12-hour format (HH:MM AM/PM) to 24-hour format (HH:MM)
  const convertTo24Hour = (time12) => {
    if (!time12) return '';
    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Convert 24-hour format (HH:MM) to 12-hour AM/PM format
  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    
    // If it's already in 12-hour format (contains space + AM/PM), return as is
    if (time24.includes('AM') || time24.includes('PM')) {
      return time24;
    }
    
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFormError('');
  };

  const validateForm = () => {
    // If slots are available, must select one
    if (hasAvailabilitySlots && !selectedSlot) {
      setFormError('Please select a time slot');
      return false;
    }
    if (!selectedDate) {
      setFormError('Please select a date');
      return false;
    }
    if (!selectedTime) {
      setFormError('Please enter a time');
      return false;
    }
    
    // If slots are available, validate time is within range
    if (hasAvailabilitySlots && !validateTimeRange(selectedTime)) {
      setFormError(`Time must be between ${convertTo12Hour(currentSlot.startTime)} and ${convertTo12Hour(currentSlot.endTime)}`);
      return false;
    }
    
    if (!formData.fullName.trim()) {
      setFormError('Please enter your full name');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setFormError('Please enter your phone number');
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
      console.log('📝 Submitting booking to /api/test-drives/...');
      const response = await api.post('/test-drives', {
        vehicleId,
        date: selectedDate,
        time: selectedTime,
        buyerNotes: formData.fullName,
        contactPreference: 'email',
      });

      console.log('✅ Booking success:', response.data);
      setSubmitSuccess(true);

      // Redirect after 3 seconds to test-drives page
      setTimeout(() => {
        navigate('/test-drives', {
          state: { message: 'Your test drive booking has been submitted!' },
        });
      }, 3000);
    } catch (err) {
      console.error('❌ Booking error:', err);
      setFormError(err.response?.data?.message || 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !vehicle) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" icon={<ErrorOutline />}>
          {error || 'Vehicle not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/vehicles')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Book Test Drive
          </Typography>
        </Box>

        {/* Success Message */}
        {submitSuccess && (
          <Card
            sx={{
              mb: 4,
              background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)',
              border: '2px solid #1976d2',
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" sx={{ color: '#1565c0', mb: 1, fontWeight: 'bold' }}>
                Booking Submitted!
              </Typography>
              <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 600, mb: 2 }}>
                Status: PENDING
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The seller will review your request and contact you within 24 hours.
              </Typography>
            </CardContent>
          </Card>
        )}

        {!submitSuccess && (
          <>
            {/* Vehicle Info */}
            <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Vehicle
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </Typography>
                  </Grid>
                  {seller && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Seller
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {seller.firstName} {seller.lastName}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Free Booking Info Alert */}
            {!hasAvailabilitySlots && (
              <Alert severity="info" sx={{ mb: 3 }}>
                The seller hasn't set specific availability times yet. You can book a test drive for any date and time that works for you.
              </Alert>
            )}

            {/* Availability Slots Selection */}
            {availability?.availabilitySlots && availability.availabilitySlots.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Step 1: Select Available Time Slot
                  </Typography>

                  <RadioGroup
                    value={selectedSlot || ''}
                    onChange={(e) => handleSlotSelect(e.target.value)}
                  >
                    <Grid container spacing={2}>
                      {availability.availabilitySlots.map((slot, idx) => {
                        const days = DAYS_OF_WEEK.filter((_, i) => slot.days[i])
                          .map(d => d.substring(0, 3))
                          .join(', ');

                        return (
                          <Grid item xs={12} key={slot.id || idx}>
                            <Paper
                              sx={{
                                p: 2,
                                border: selectedSlot === (slot.id || idx) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                bgcolor: selectedSlot === (slot.id || idx) ? '#e3f2fd' : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                '&:hover': {
                                  border: '2px solid #1976d2',
                                  boxShadow: 2,
                                },
                              }}
                            >
                              <FormControlLabel
                                value={slot.id || idx}
                                control={<Radio />}
                                label={
                                  <Box sx={{ ml: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      {convertTo12Hour(slot.startTime)} - {convertTo12Hour(slot.endTime)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                      {DAYS_OF_WEEK.map((day, i) => (
                                        <Chip
                                          key={i}
                                          label={DAY_ABBREVIATIONS[i]}
                                          size="small"
                                          variant={slot.days[i] ? 'filled' : 'outlined'}
                                          color={slot.days[i] ? 'primary' : 'default'}
                                          sx={{ opacity: slot.days[i] ? 1 : 0.3 }}
                                        />
                                      ))}
                                    </Box>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                      Available: {days}
                                    </Typography>
                                  </Box>
                                }
                                sx={{ width: '100%', alignItems: 'flex-start' }}
                              />
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Step 2 & 3: Date, Time & Contact Info */}
            {(selectedSlot || !hasAvailabilitySlots) && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {hasAvailabilitySlots ? 'Step 2: Select Date & Time' : 'Step 1: Select Date & Time'}
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    {hasAvailabilitySlots ? (
                      <>
                        {/* Date SELECT - Only for slot-based booking */}
                        <Grid item xs={12} sm={6}>
                          <Select
                            fullWidth
                            value={selectedDate}
                            onChange={(e) => {
                              setSelectedDate(e.target.value);
                              setFormError('');
                            }}
                            disabled={!currentSlot}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Choose a date...</em>
                            </MenuItem>
                            {allowedDates.length > 0 ? (
                              allowedDates.map((date) => (
                                <MenuItem key={date.value} value={date.value}>
                                  {date.label}
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem disabled>
                                No available dates for this slot
                              </MenuItem>
                            )}
                          </Select>
                          <FormHelperText>
                            {currentSlot ? 'Select from available dates (starting from today)' : 'Select a time slot first'}
                          </FormHelperText>
                        </Grid>

                        {/* Time TEXT INPUT - With real-time validation */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Time"
                            type="time"
                            value={selectedTime}
                            onChange={(e) => {
                              const newTime = e.target.value;
                              setSelectedTime(newTime);
                              // Clear form error immediately on any change
                              setFormError('');
                              
                              // Real-time validation feedback
                              if (newTime && currentSlot) {
                                if (!validateTimeRange(newTime)) {
                                  setTimeValidationError(
                                    `❌ Please enter a valid time within the allowed range: ${convertTo12Hour(currentSlot.startTime)} - ${convertTo12Hour(currentSlot.endTime)}`
                                  );
                                } else {
                                  setTimeValidationError('');
                                }
                              } else {
                                setTimeValidationError('');
                              }
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            disabled={!currentSlot}
                            error={selectedTime && currentSlot && !validateTimeRange(selectedTime)}
                            helperText={
                              timeValidationError || (
                                currentSlot 
                                  ? `✓ Allowed range: ${convertTo12Hour(currentSlot.startTime)} - ${convertTo12Hour(currentSlot.endTime)}`
                                  : 'Select a time slot first'
                              )
                            }
                            FormHelperTextProps={{
                              sx: {
                                color: timeValidationError ? '#d32f2f' : '#4caf50',
                                fontWeight: timeValidationError ? 600 : 500,
                              }
                            }}
                          />
                        </Grid>
                      </>
                    ) : (
                      <>
                        {/* Free Date Input - For buyers when no slots defined */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Preferred Date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                              setSelectedDate(e.target.value);
                              setFormError('');
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            inputProps={{
                              min: new Date().toISOString().split('T')[0] // Prevent past dates
                            }}
                          />
                          <FormHelperText>
                            Choose any date from today onwards (within 30 days)
                          </FormHelperText>
                        </Grid>

                        {/* Free Time Input - For buyers when no slots defined */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Preferred Time"
                            type="time"
                            value={selectedTime}
                            onChange={(e) => {
                              setSelectedTime(e.target.value);
                              setFormError('');
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                          <FormHelperText>
                            Choose a time that works for you
                          </FormHelperText>
                        </Grid>
                      </>
                    )}
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    <PersonOutline sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {hasAvailabilitySlots ? 'Step 3: Your Contact Information' : 'Step 2: Your Contact Information'}
                  </Typography>

                  {formError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {formError}
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        InputProps={{
                          startAdornment: <PersonOutline sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        InputProps={{
                          startAdornment: <EmailOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        InputProps={{
                          startAdornment: <PhoneOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>

                    {selectedDate && selectedTime && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#e8f5e9', border: '2px solid #4caf50' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32', mb: 1 }}>
                            📅 Your Scheduled Time
                          </Typography>
                          <Typography variant="body2">
                            <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Time:</strong> {selectedTime}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={() => setSelectedSlot(null)}>
                      Back to Slots
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      disabled={submitting || !selectedDate || !selectedTime}
                      onClick={handleSubmit}
                      startIcon={submitting ? <CircularProgress size={20} /> : <CheckIcon />}
                    >
                      {submitting ? 'Booking...' : 'Confirm & Book'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default TestDriveBookingForm;
