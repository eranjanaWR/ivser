/**
 * Test Drive Scheduling Page
 * Allows buyers to pick exact date and time within selected availability slot
 */

import React, { useState, useEffect } from 'react';
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
  TextField,
  FormHelperText,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  ErrorOutline,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREVIATIONS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const TestDriveScheduling = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadBookingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, isAuthenticated]);

  const loadBookingData = () => {
    try {
      setLoading(true);
      // Get booking data from session storage
      const bookingData = sessionStorage.getItem('testDriveBookingData');
      if (!bookingData) {
        setError('Please select an availability slot first');
        navigate(`/book-test-drive/${vehicleId}`);
        return;
      }

      const data = JSON.parse(bookingData);
      setSelectedSlot(data.slot);

      // Generate available dates (next 30 days, only for slot's available days)
      const dates = generateAvailableDates(data.slot.days);
      setAvailableDates(dates);

      // Fetch vehicle details
      api.get(`/vehicles/${vehicleId}`).then(res => {
        setVehicle(res.data.data);
      }).catch(err => {
        console.error('Error fetching vehicle:', err);
        setError('Failed to load vehicle information');
      }).finally(() => {
        setLoading(false);
      });
    } catch (err) {
      console.error('❌ Error loading booking data:', err);
      setError('Failed to load booking information');
      setLoading(false);
    }
  };

  const generateAvailableDates = (daysArray) => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Check if this date matches slot's available days
      const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0=Monday format

      if (daysArray[adjustedDay]) {
        dates.push({
          date: date.toISOString().split('T')[0], // YYYY-MM-DD
          displayDate: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          dayOfWeek: DAYS_OF_WEEK[adjustedDay],
        });
      }
    }

    return dates;
  };

  const generateTimeSlots = () => {
    if (!selectedSlot) return [];

    const slots = [];
    const [startHour, startMin] = selectedSlot.startTime.split(':').map(Number);
    const [endHour, endMin] = selectedSlot.endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);

      // Increment by 30 minutes
      currentMin += 30;
      if (currentMin === 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }

    return slots;
  };

  const handleProceedToConfirm = () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    if (!selectedTime) {
      setError('Please select a time');
      return;
    }

    setScheduling(true);
    try {
      // Update booking data with selected date and time
      const bookingData = JSON.parse(sessionStorage.getItem('testDriveBookingData'));
      bookingData.selectedDate = selectedDate;
      bookingData.selectedTime = selectedTime;

      // Find the full date object for display
      const dateObj = availableDates.find(d => d.date === selectedDate);
      bookingData.selectedDateDisplay = {
        date: selectedDate,
        displayDate: dateObj?.displayDate,
        dayOfWeek: dateObj?.dayOfWeek,
      };

      console.log('💾 Scheduled test drive:', bookingData);
      sessionStorage.setItem('testDriveBookingData', JSON.stringify(bookingData));

      navigate(`/book-test-drive/${vehicleId}/confirm`);
    } catch (err) {
      console.error('❌ Error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  const timeSlots = generateTimeSlots();

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" icon={<ErrorOutline />}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/book-test-drive/${vehicleId}`)}
          sx={{ mt: 2 }}
        >
          Back to Slot Selection
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button 
          variant="text" 
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/book-test-drive/${vehicleId}`)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Schedule Your Test Drive
        </Typography>
      </Box>

      {/* Vehicle Info Card */}
      {vehicle && (
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Vehicle</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {vehicle.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Year</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {vehicle.year}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Selected Slot Card */}
      {selectedSlot && (
        <Card sx={{ mb: 3, border: '2px solid #4caf50', bgcolor: '#f1f8e9' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckIcon sx={{ color: '#4caf50', mr: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                Selected Availability Slot
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {selectedSlot.startTime} - {selectedSlot.endTime}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {DAYS_OF_WEEK.map((day, idx) => (
                selectedSlot.days[idx] && (
                  <Chip
                    key={idx}
                    label={DAY_ABBREVIATIONS[idx]}
                    size="small"
                    variant="filled"
                    sx={{ bgcolor: '#4caf50', color: 'white' }}
                  />
                )
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Scheduling Form */}
      <Paper sx={{ p: 3, bgcolor: '#fafafa' }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Pick Your Preferred Date & Time
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Date Selection */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
              <CalendarIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
              Select Date
            </Typography>
            <TextField
              select
              fullWidth
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setError('');
              }}
              variant="outlined"
              size="small"
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Choose a date...</option>
              {availableDates.map((dateObj) => (
                <option key={dateObj.date} value={dateObj.date}>
                  {dateObj.displayDate}
                </option>
              ))}
            </TextField>
            <FormHelperText>
              Only showing available dates ({availableDates.length} days available)
            </FormHelperText>
          </Grid>

          {/* Time Selection */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
              <ScheduleIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
              Select Time
            </Typography>
            <TextField
              select
              fullWidth
              value={selectedTime}
              onChange={(e) => {
                setSelectedTime(e.target.value);
                setError('');
              }}
              variant="outlined"
              size="small"
              disabled={!selectedDate}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Choose a time...</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </TextField>
            <FormHelperText>
              {!selectedDate ? 'Select a date first' : `${timeSlots.length} time slots available`}
            </FormHelperText>
          </Grid>
        </Grid>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <Card sx={{ mt: 3, bgcolor: '#e3f2fd', border: '1px solid #2196f3' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
                📅 Your Selected Schedule
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {availableDates.find(d => d.date === selectedDate)?.displayDate}
              </Typography>
              <Typography variant="body2">
                <strong>Time:</strong> {selectedTime}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: '#555' }}>
                Within availability: {selectedSlot.startTime} - {selectedSlot.endTime}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/book-test-drive/${vehicleId}`)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedDate || !selectedTime || scheduling}
            onClick={handleProceedToConfirm}
            sx={{ minWidth: 200 }}
          >
            {scheduling ? <CircularProgress size={24} /> : 'Proceed to Confirmation'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestDriveScheduling;
