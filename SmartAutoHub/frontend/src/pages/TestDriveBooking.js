import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Check } from '@mui/icons-material';
import api from '../services/api';

const TestDriveBooking = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const schedule = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('testDriveSchedule');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const selectedSlot = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('selectedTestDriveSlot');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('A valid email is required');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!schedule?.date || !schedule?.time) {
      setError('Selected slot/date/time is required');
      return;
    }

    if (!selectedSlot?.startTime || !selectedSlot?.endTime || !Array.isArray(selectedSlot.days)) {
      setError('Selected slot/date/time is required');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await api.post('/buyer/book-testdrive', {
        vehicleId,
        selectedSlot,
        scheduledDate: schedule.date,
        scheduledTime: schedule.time,
        buyerInfo: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim()
        }
      });

      navigate('/test-drives');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book test drive');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Confirm Test Drive Booking
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Date: {schedule?.date || 'N/A'} | Time: {schedule?.time || 'N/A'}
          </Typography>

          <Stack spacing={2}>
            <TextField label="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} fullWidth />
            <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
            <TextField label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} fullWidth />
          </Stack>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Check />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Booking...' : 'Confirm & Book Test Drive'}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default TestDriveBooking;
