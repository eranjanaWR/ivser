import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import {
  Add,
  ArrowBack,
  Delete,
  Save,
  Schedule
} from '@mui/icons-material';
import api from '../services/api';

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const createDefaultSlot = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  startTime: '09:00',
  endTime: '17:00',
  days: [true, true, true, true, true, false, false],
  enabled: true
});

const SellerAvailability = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState([]);

  const initialLoadRef = useRef(true);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    const loadAvailability = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/availability');
        const currentSlots = response.data?.data?.availabilitySlots || [];
        setSlots(currentSlots);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, []);

  const saveAvailability = async (isAutoSave = false, nextSlots = slots) => {
    setSaving(true);
    try {
      await api.post('/availability', { availabilitySlots: nextSlots });
      if (!isAutoSave) {
        setSuccess('Availability saved successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveAvailability(true, slots);
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [slots, loading]);

  const updateSlot = (slotId, updates) => {
    setSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, ...updates } : slot)));
  };

  const toggleDay = (slotId, dayIndex) => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId) {
          return slot;
        }

        const nextDays = [...slot.days];
        nextDays[dayIndex] = !nextDays[dayIndex];
        return { ...slot, days: nextDays };
      })
    );
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, createDefaultSlot()]);
  };

  const deleteSlot = async (slotId) => {
    try {
      await api.delete(`/availability/slot/${slotId}`);
      setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
      setSuccess('Availability slot deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete slot');
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
          Manage Test Drive Availability
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure your test drive slots. Changes auto-save every 2 seconds.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Paper
          elevation={0}
          onClick={addSlot}
          sx={{
            p: 2,
            mb: 2,
            border: '2px dashed',
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'primary.100' }
          }}
        >
          <Add />
          <Typography fontWeight={600}>Add Availability Slot</Typography>
        </Paper>

        <Stack spacing={2}>
          {slots.map((slot) => (
            <Paper key={slot.id} elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'grey.200' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Schedule color="primary" fontSize="small" />
                  <Typography fontWeight={700}>Availability Slot</Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={slot.enabled}
                        onChange={(event) => updateSlot(slot.id, { enabled: event.target.checked })}
                      />
                    }
                    label={slot.enabled ? 'Active' : 'Inactive'}
                  />

                  <IconButton color="error" onClick={() => deleteSlot(slot.id)}>
                    <Delete />
                  </IconButton>
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  value={slot.startTime}
                  onChange={(event) => updateSlot(slot.id, { startTime: event.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type="time"
                  label="End Time"
                  value={slot.endTime}
                  onChange={(event) => updateSlot(slot.id, { endTime: event.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Stack direction="row" spacing={1}>
                {dayLabels.map((label, dayIndex) => {
                  const selected = slot.days?.[dayIndex];
                  return (
                    <Button
                      key={`${slot.id}-${label}-${dayIndex}`}
                      size="small"
                      variant={selected ? 'contained' : 'outlined'}
                      onClick={() => toggleDay(slot.id, dayIndex)}
                      sx={{ minWidth: 36, px: 0 }}
                    >
                      {label}
                    </Button>
                  );
                })}
              </Stack>
            </Paper>
          ))}
        </Stack>

        {slots.length > 0 && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
              onClick={() => saveAvailability(false)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Force Save Now'}
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default SellerAvailability;
