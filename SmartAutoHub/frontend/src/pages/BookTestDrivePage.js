import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  AccessTime,
  ArrowBack,
  CalendarToday,
  Check,
  CheckCircle,
  Event,
  PersonOutline
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const AVAILABLE_DATES_HORIZON_DAYS = 60;

const dateLabelFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});

const toMinutes = (timeString) => {
  const [hours, minutes] = String(timeString || '').split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return NaN;
  }
  return (hours * 60) + minutes;
};

const parseLocalIsoDate = (isoDate) => {
  if (!isoDate) {
    return null;
  }

  const [year, month, day] = String(isoDate).split('-').map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const mondayFirstIndex = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : parseLocalIsoDate(dateValue);
  if (!date || Number.isNaN(date.getTime())) {
    return -1;
  }

  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

const todayIso = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const toLocalIsoDate = (date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const formatTime = (timeString) => {
  if (!timeString) {
    return '';
  }

  const [hours, minutes] = String(timeString).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeString;
  }

  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${meridiem}`;
};

const generateAvailableDates = (slot, horizonDays = AVAILABLE_DATES_HORIZON_DAYS) => {
  if (!slot) {
    return [];
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dates = [];

  for (let i = 0; i < horizonDays; i += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    const dayIndex = mondayFirstIndex(candidate);

    if (slot.days?.[dayIndex]) {
      dates.push({
        value: toLocalIsoDate(candidate),
        label: dateLabelFormatter.format(candidate)
      });
    }
  }

  return dates;
};

const StepHeader = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
    {icon}
    <Typography variant="h6" fontWeight={700}>
      {title}
    </Typography>
  </Box>
);

const BookTestDrivePage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicle, setVehicle] = useState(null);

  const [slots, setSlots] = useState([]);
  const [hasSlots, setHasSlots] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const vehicleResponse = await api.get(`/vehicles/${vehicleId}`);
        const vehicleData = vehicleResponse.data?.data;
        setVehicle(vehicleData);

        const sellerRaw = vehicleData?.sellerId;
        const sellerId = typeof sellerRaw === 'object' ? (sellerRaw._id || sellerRaw.id) : sellerRaw;

        if (!sellerId) {
          setSlots([]);
          setHasSlots(false);
          setLoading(false);
          return;
        }

        const availabilityResponse = await api.get(`/availability/seller/${sellerId}`);
        const availabilityData = availabilityResponse.data?.data || {};
        const enabledSlots = (availabilityData.availabilitySlots || []).filter((slot) => slot.enabled);

        setSlots(enabledSlots);
        setHasSlots(enabledSlots.length > 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load booking data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate, vehicleId]);

  const handleSlotSelect = (slot) => {
    const nextDates = generateAvailableDates(slot);
    setSelectedSlot(slot);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableDates(nextDates);
    setFormError('');
  };

  const handleBackToSlots = () => {
    setSelectedSlot(null);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableDates([]);
    setFormError('');
  };

  const validateSlotFlow = () => {
    if (!selectedSlot) {
      return 'Please select a slot first';
    }

    if (!selectedDate) {
      return 'Please select a date';
    }

    const dayIndex = mondayFirstIndex(parseLocalIsoDate(selectedDate));
    if (!selectedSlot.days?.[dayIndex]) {
      return 'Selected date is not available for this slot';
    }

    if (!selectedTime) {
      return 'Please select a time';
    }

    const selectedMinutes = toMinutes(selectedTime);
    const startMinutes = toMinutes(selectedSlot.startTime);
    const endMinutes = toMinutes(selectedSlot.endTime);

    if (
      Number.isNaN(selectedMinutes) ||
      Number.isNaN(startMinutes) ||
      Number.isNaN(endMinutes) ||
      selectedMinutes < startMinutes ||
      selectedMinutes >= endMinutes
    ) {
      return `Selected time must be within the allowed range (${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)})`;
    }

    if (!formData.fullName.trim()) {
      return 'Full name is required';
    }

    if (!formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      return 'Phone number is required';
    }

    return '';
  };

  const handleSlotBooking = async () => {
    const validationError = validateSlotFlow();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const response = await api.post('/buyer/book-testdrive', {
        vehicleId,
        selectedSlot: {
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          days: selectedSlot.days
        },
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        buyerInfo: {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim()
        }
      });

      setBookingId(response.data?.data?.bookingId || '');
      setSuccess(true);
      setTimeout(() => navigate('/test-drives'), 3500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoSlotBooking = async () => {
    if (!preferredDate) {
      setFormError('Preferred date is required');
      return;
    }

    if (!preferredTime) {
      setFormError('Preferred time is required');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const response = await api.post('/test-drives', {
        vehicleId,
        date: preferredDate,
        time: preferredTime,
        preferredDate,
        buyerNotes: requestMessage
      });

      setBookingId(response.data?.data?._id || '');
      setSuccess(true);
      setTimeout(() => navigate('/test-drives'), 3500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
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
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ color: '#1976d2', fontWeight: 600, mb: 2 }}
        >
          Back
        </Button>

        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Book Vehicle for Test Drive
        </Typography>

        {vehicle && (
          <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Box
                    component="img"
                    src={getImageUrl(vehicle.images?.[0])}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="h6" fontWeight={700}>
                    {vehicle.year} {vehicle.brand} {vehicle.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Complete the flow below to submit your test drive request.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {formError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        {success ? (
          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'grey.200', textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 54, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Test Drive Request Sent
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {bookingId ? `Booking ID: ${bookingId}` : 'Your request has been submitted successfully.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Redirecting to your test drives...
            </Typography>
          </Paper>
        ) : hasSlots ? (
          <>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}
            >
              <StepHeader
                icon={<AccessTime sx={{ color: '#555', fontSize: 22 }} />}
                title="Step 1: Select Available Time Slot"
              />

              <Grid container spacing={2}>
                {slots.map((slot) => {
                  const slotKey = slot.id || `${slot.startTime}-${slot.endTime}-${(slot.days || []).join('-')}`;
                  const isSelected = selectedSlot?.id === slot.id;

                  return (
                    <Grid item xs={12} sm={6} key={slotKey}>
                      <Box
                        onClick={() => handleSlotSelect(slot)}
                        sx={{
                          p: 2,
                          mb: 1.5,
                          borderRadius: 2,
                          borderStyle: 'solid',
                          borderWidth: isSelected ? '2px' : '1px',
                          borderColor: isSelected ? '#1976d2' : '#e0e0e0',
                          bgcolor: isSelected ? '#e3f2fd' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#1976d2',
                            bgcolor: isSelected ? '#e3f2fd' : '#f7fbff'
                          }
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: isSelected ? '6px solid #1976d2' : '2px solid #bdbdbd',
                              boxSizing: 'border-box',
                              backgroundColor: '#ffffff'
                            }}
                          />
                          <Typography fontWeight={600}>
                            {formatTime(slot.startTime)} {'\u2013'} {formatTime(slot.endTime)}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={0.5}>
                          {dayLabels.map((label, index) => (
                            <Box
                              key={`${slotKey}-${label}-${index}`}
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: slot.days?.[index] ? 'primary.main' : 'grey.300',
                                color: slot.days?.[index] ? '#fff' : 'text.secondary'
                              }}
                            >
                              {label}
                            </Box>
                          ))}
                        </Stack>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Available: {dayLabels
                            .map((_, index) => (slot.days?.[index] ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] : null))
                            .filter(Boolean)
                            .join(', ') || 'No days selected'}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>

            {selectedSlot && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2
                }}
              >
                <StepHeader
                  icon={<CalendarToday sx={{ color: '#555', fontSize: 22 }} />}
                  title="Step 2: Select Date and Time"
                />

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Date"
                      value={selectedDate}
                      onChange={(event) => {
                        setSelectedDate(event.target.value);
                        setFormError('');
                      }}
                      SelectProps={{ native: true }}
                      InputLabelProps={{ shrink: true }}
                    >
                      <option value="">Choose a date...</option>
                      {availableDates.map((dateOption) => (
                        <option key={dateOption.value} value={dateOption.value}>
                          {dateOption.label}
                        </option>
                      ))}
                    </TextField>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Select from available dates (starting from today)
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Time"
                      type="time"
                      value={selectedTime}
                      onChange={(event) => {
                        setSelectedTime(event.target.value);
                        setFormError('');
                      }}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: selectedSlot.startTime,
                        max: selectedSlot.endTime
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Select a time within the selected slot
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 0.5,
                        display: 'block',
                        color: '#2e7d32',
                        fontWeight: 500
                      }}
                    >
                      {`✓ Allowed range: ${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}
            >
              <StepHeader
                icon={<PersonOutline sx={{ color: '#555', fontSize: 22 }} />}
                title="Step 3: Contact Information"
              />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Full Name"
                    fullWidth
                    value={formData.fullName}
                    onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone"
                    fullWidth
                    value={formData.phone}
                    onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleBackToSlots}
                >
                  Back to Slots
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Check />}
                  onClick={handleSlotBooking}
                  disabled={submitting}
                >
                  {submitting ? 'Booking...' : 'Confirm & Book'}
                </Button>
              </Stack>
            </Paper>
          </>
        ) : (
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No Seller Slots Available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You can still send a request with your preferred date and time.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preferred Date"
                  type="date"
                  value={preferredDate}
                  onChange={(event) => setPreferredDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: todayIso() }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preferred Time"
                  type="time"
                  value={preferredTime}
                  onChange={(event) => setPreferredTime(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message to Seller"
                  multiline
                  rows={3}
                  value={requestMessage}
                  onChange={(event) => setRequestMessage(event.target.value)}
                  placeholder="Share any preferred details for your request"
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Event />}
                onClick={handleNoSlotBooking}
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </Button>
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default BookTestDrivePage;
