/**
 * Seller Test Drive Availability Settings Page
 * Professional Material-UI implementation for managing test drive availability
 * Allows sellers to set custom time slots for test drive availability
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ClockIcon,
  CalendarToday as CalendarIcon,
  Save as SaveIcon,
  ArrowBack,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import api from '../services/api';

const DAYS_OF_WEEK = [
  { short: 'M', full: 'Monday' },
  { short: 'T', full: 'Tuesday' },
  { short: 'W', full: 'Wednesday' },
  { short: 'T', full: 'Thursday' },
  { short: 'F', full: 'Friday' },
  { short: 'S', full: 'Saturday' },
  { short: 'S', full: 'Sunday' },
];

const SellerAvailability = () => {
  const navigate = useNavigate();
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch existing availability on mount
  useEffect(() => {
    fetchAvailability();
    
    // Cleanup function to clear timeout on unmount
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('❌ No token found - user may not be logged in');
        setAvailabilitySlots([]);
        setLoading(false);
        return;
      }
      
      console.log('📥 Fetching availability from API...');
      const response = await api.get('/availability');
      console.log('📦 API Response:', response);
      
      if (response?.data?.data?.availabilitySlots && Array.isArray(response.data.data.availabilitySlots)) {
        console.log('✅ Slots loaded:', response.data.data.availabilitySlots);
        setAvailabilitySlots(response.data.data.availabilitySlots);
      } else {
        console.log('⚠️ No slots in response, starting fresh');
        setAvailabilitySlots([]);
      }
    } catch (error) {
      console.error('❌ Error fetching:', error.message);
      if (error.response?.status === 401) {
        console.error('❌ Unauthorized - invalid or expired token');
        localStorage.removeItem('token');
      }
      setAvailabilitySlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new availability slot
  const addAvailabilitySlot = () => {
    const newSlot = {
      id: Date.now().toString(),
      startTime: '09:00',
      endTime: '17:00',
      days: [true, true, true, true, true, false, false], // Mon-Fri by default
      enabled: true,
    };
    setAvailabilitySlots([...availabilitySlots, newSlot]);
  };

  // Update slot times
  const updateSlotTime = (id, field, value) => {
    setAvailabilitySlots(
      availabilitySlots.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
    triggerAutoSave();
  };

  // Toggle day for a slot
  const toggleDay = (id, dayIndex) => {
    setAvailabilitySlots(
      availabilitySlots.map((slot) => {
        if (slot.id === id) {
          const updatedDays = [...slot.days];
          updatedDays[dayIndex] = !updatedDays[dayIndex];
          return { ...slot, days: updatedDays };
        }
        return slot;
      })
    );
    triggerAutoSave();
  };

  // Toggle slot enabled/disabled
  const toggleSlotEnabled = (id) => {
    setAvailabilitySlots(
      availabilitySlots.map((slot) =>
        slot.id === id ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
    triggerAutoSave();
  };

  // Delete a slot from both UI and database
  const deleteSlot = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Please log in first');
        return;
      }

      console.log('🗑️ Deleting slot:', id);
      
      // Find the slot to get its ID for the database
      const slotToDelete = availabilitySlots.find(slot => slot.id === id);
      
      if (!slotToDelete) {
        console.error('❌ Slot not found:', id);
        return;
      }

      // Call the backend endpoint to delete from database
      const response = await api.delete(`/availability/slot/${slotToDelete.id}`);
      console.log('✅ Slot deleted from database:', response.data);
      
      // Remove from UI state
      setAvailabilitySlots(availabilitySlots.filter((slot) => slot.id !== id));
      setHasUnsavedChanges(false);
      
      setSuccessMessage('✅ Slot deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ Error deleting slot:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete slot';
      setErrorMessage(`❌ ${errorMsg}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Trigger auto-save with debounce
  const triggerAutoSave = () => {
    setHasUnsavedChanges(true);
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for auto-save after 2 seconds of no changes
    const timeout = setTimeout(() => {
      console.log('⏱️ Auto-saving changes...');
      handleAutoSave();
    }, 2000);
    
    setAutoSaveTimeout(timeout);
  };

  // Handle auto-save
  const handleAutoSave = async () => {
    if (availabilitySlots.length === 0) {
      setHasUnsavedChanges(false);
      return;
    }

    try {
      console.log('💾 Auto-saving availability slots...');
      console.log('📊 Slots:', availabilitySlots);
      
      const response = await api.post('/availability', {
        availabilitySlots: availabilitySlots,
      });
      
      console.log('✅ Auto-save successful:', response.data);
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      console.error('Error response:', error.response?.data);
      // Keep hasUnsavedChanges as true so user can manually save
    }
  };

  // Handle save to database
  const handleSave = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setErrorMessage('Please log in first');
      return;
    }

    if (availabilitySlots.length === 0) {
      setErrorMessage('Please add at least one availability slot');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    
    try {
      console.log('💾 Manually saving availability slots...');
      console.log('📊 Slots to save:', availabilitySlots);
      
      const response = await api.post('/availability', {
        availabilitySlots: availabilitySlots,
      });
      
      console.log('✅ Manual save successful:', response.data);
      setSuccessMessage('✅ Test drive availability saved successfully!');
      setHasUnsavedChanges(false);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Refresh the data from backend
      await fetchAvailability();
      
    } catch (error) {
      console.error('❌ Save failed:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.message || 
                      error.message || 
                      'Failed to save availability';
      
      setErrorMessage(`❌ ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const hasAnySlots = availabilitySlots.length > 0;

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading availability settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
          >
            Back
          </Button>

          <Paper
            elevation={2}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              p: 4,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Test Drive Availability
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Set your preferred time slots when buyers can book test drives for your vehicles
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert 
            severity="success" 
            icon={<CheckIcon />}
            onClose={() => setSuccessMessage('')}
            sx={{ mb: 3 }}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert 
            severity="error"
            onClose={() => setErrorMessage('')}
            sx={{ mb: 3 }}
          >
            {errorMessage}
          </Alert>
        )}

        {/* Unsaved Changes Message */}
        {hasUnsavedChanges && !successMessage && (
          <Alert 
            severity="warning"
            sx={{ mb: 3 }}
          >
            ⏱️ Changes will be saved automatically in a moment...
          </Alert>
        )}

        {/* Default State Message */}
        {!hasAnySlots && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: '#f5f5f5',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              mb: 4,
            }}
          >
            <ClockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Default: Available 24/7 (All Days)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create custom time slots below to restrict your availability to specific hours and days of the week.
            </Typography>
          </Paper>
        )}

        {/* Availability Slots */}
        {hasAnySlots && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Box
                sx={{
                  width: 4,
                  height: 24,
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                }}
              />
              <Typography variant="h6" fontWeight="bold">
                Your Availability Slots
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {availabilitySlots.map((slot) => (
                <Grid item xs={12} key={slot.id}>
                  <AvailabilityCard
                    slot={slot}
                    onUpdateTime={updateSlotTime}
                    onToggleDay={toggleDay}
                    onToggleEnabled={toggleSlotEnabled}
                    onDelete={deleteSlot}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Add Slot Button */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'primary.main',
            bgcolor: '#f5f9ff',
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              bgcolor: '#e3f2fd',
              borderColor: 'primary.dark',
            },
            mb: 3,
          }}
          onClick={addAvailabilitySlot}
        >
          <AddIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" color="primary.main" fontWeight="600">
            Add Availability Slot
          </Typography>
        </Paper>

        {/* Action Buttons */}
        {hasAnySlots && (
          <>
            <Divider sx={{ my: 4 }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Box sx={{ textAlign: 'right' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Force Save Now'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  💡 Changes auto-save after 2 seconds
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Info Box */}
        <Alert severity="info" sx={{ mt: 4 }}>
          <strong>💡 Tip:</strong> You can create multiple availability slots to cover different time ranges and days. 
          Only enable the slots that match your schedule.
        </Alert>
      </Container>
    </Box>
  );
};

/**
 * Availability Card Component
 * Represents a single time slot configuration
 */
const AvailabilityCard = ({ slot, onUpdateTime, onToggleDay, onToggleEnabled, onDelete }) => {
  return (
    <Card
      elevation={slot.enabled ? 2 : 0}
      sx={{
        opacity: slot.enabled ? 1 : 0.5,
        filter: slot.enabled ? 'none' : 'grayscale(100%)',
        transition: 'all 0.3s',
        '&:hover': slot.enabled ? { elevation: 4 } : {},
      }}
    >
      <CardContent>
        {/* Header with Toggle and Delete */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={slot.enabled}
                onChange={() => onToggleEnabled(slot.id)}
              />
            }
            label={
              <Typography
                fontWeight="600"
                color={slot.enabled ? 'primary.main' : 'text.secondary'}
              >
                {slot.enabled ? 'Active' : 'Inactive'}
              </Typography>
            }
          />
          <IconButton
            onClick={() => onDelete(slot.id)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Time Range Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            fontWeight="600"
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ClockIcon fontSize="small" color="primary" />
            Time Range
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Start Time
              </Typography>
              <TextField
                fullWidth
                type="time"
                value={slot.startTime}
                onChange={(e) => onUpdateTime(slot.id, 'startTime', e.target.value)}
                disabled={!slot.enabled}
                variant="outlined"
                size="small"
                inputProps={{ step: '300' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                End Time
              </Typography>
              <TextField
                fullWidth
                type="time"
                value={slot.endTime}
                onChange={(e) => onUpdateTime(slot.id, 'endTime', e.target.value)}
                disabled={!slot.enabled}
                variant="outlined"
                size="small"
                inputProps={{ step: '300' }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Days of Week Section */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight="600"
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CalendarIcon fontSize="small" color="primary" />
            Available Days
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {DAYS_OF_WEEK.map((day, index) => (
              <Button
                key={index}
                onClick={() => onToggleDay(slot.id, index)}
                disabled={!slot.enabled}
                variant={slot.days[index] ? 'contained' : 'outlined'}
                size="small"
                sx={{
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  p: 0,
                  fontWeight: 'bold',
                }}
                title={day.full}
              >
                {day.short}
              </Button>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            Selected Days:{' '}
            <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
              {getSelectedDaysText(slot.days)}
            </span>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Helper function to get selected days as readable text
 */
const getSelectedDaysText = (days) => {
  const selected = DAYS_OF_WEEK.filter((_, i) => days[i]).map((d) => d.short);
  if (selected.length === 7) return 'All Days';
  if (selected.length === 5 && days.slice(0, 5).every((d) => d) && !days[5] && !days[6]) {
    return 'Mon - Fri';
  }
  if (selected.length === 0) return 'No Days Selected';
  return selected.join(', ');
};

export default SellerAvailability;
