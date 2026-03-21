import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Email, Phone } from '@mui/icons-material';
import api from '../services/api';

const NotifyModal = ({ open, onClose, filters }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Clear state when modal opens
  useEffect(() => {
    if (open) {
      setError('');
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/notifications/subscribe', {
        email,
        phone,
        searchCriteria: {
          search: filters.search || '',
          brand: filters.brand || '',
          fuelType: filters.fuelType || '',
          transmission: filters.transmission || '',
          condition: filters.condition || '',
          minPrice: filters.minPrice || 0,
          maxPrice: filters.maxPrice || 50000000,
        },
      });
      setSuccess(true);
      setEmail('');
      setPhone('');
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to subscribe. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
        Get Notified When Vehicle Available
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Subscribe to get instant notifications when vehicles matching these criteria are added to our system.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          💡 You can subscribe to <strong>multiple different searches</strong> with different filters. We'll only notify you once per criteria.
        </Alert>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>✓ Subscribed! We'll notify you when matching vehicles are available.</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />

          <TextField
            label="Phone Number"
            type="tel"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+94 XX XXX XXXX"
            disabled={loading}
            InputProps={{
              startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />

          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              Search Criteria:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {filters.brand && `Brand: ${filters.brand} • `}
              {filters.search && `Search: ${filters.search} • `}
              {filters.fuelType && `Fuel: ${filters.fuelType} • `}
              {filters.condition && `Condition: ${filters.condition}`}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || success}
          sx={{ position: 'relative' }}
        >
          {loading && <CircularProgress size={24} sx={{ position: 'absolute' }} />}
          {loading ? 'Subscribing...' : success ? '✓ Subscribed' : 'Subscribe'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotifyModal;
