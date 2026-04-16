/**
 * Bidding Consent Modal
 * First-time bidder registration modal with location verification and consent
 * Appears when user clicks 'Place Your Bid' for the first time in an auction
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  CheckCircle,
  LocationOn,
  Email,
  Info,
} from '@mui/icons-material';
import api from '../services/api';

// ✅ NEW: Predefined Sri Lankan Provinces
const SRI_LANKAN_PROVINCES = [
  'Western',
  'Central',
  'Southern',
  'North Western',
  'Sabaragamuwa',
  'North Central',
  'Uva',
  'Eastern',
  'Northern',
];

// ✅ NEW: Sample Major Sri Lankan Cities (free solo mode allows custom input)
const SRI_LANKAN_CITIES = [
  'Colombo',
  'Kandy',
  'Galle',
  'Jaffna',
  'Gampaha',
  'Negombo',
  'Kurunegala',
  'Matara',
  'Batticaloa',
  'Ratnapura',
  'Anuradhapura',
  'Trincomalee',
  'Polonnaruwa',
  'Badulla',
  'Nuwara Eliya',
  'Kalutara',
  'Kegalle',
  'Moratuwa',
];

const BiddingConsentModal = ({
  open,
  onClose,
  auctionId,
  vehicleInfo,
  onConsentComplete,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    city: '',
    province: '',
  });

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
  });

  const [consent, setConsent] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ Verify location using Nominatim API (same logic as Add Vehicle form)
  const handleVerifyLocation = async () => {
    setError('');
    setSuccess('');

    if (!formData.city || !formData.province) {
      setError('Please select both city and province');
      return;
    }

    setVerifying(true);
    try {
      const query = `${formData.city}, ${formData.province}, Sri Lanka`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );

      if (!response.ok) {
        throw new Error('Failed to verify location');
      }

      const data = await response.json();

      if (data.length === 0) {
        setError('Location not found. Please verify the city and province names.');
        return;
      }

      const result = data[0];
      setLocation({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      });
      setLocationVerified(true);
      setSuccess(
        `✅ Location verified: ${formData.city}, ${formData.province}`
      );
    } catch (err) {
      console.error('❌ Location verification error:', err);
      setError('Unable to verify location. Please check your internet connection and try again.');
      setLocationVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  // ✅ NEW: Handle Province Autocomplete change
  const handleProvinceChange = (event, value) => {
    setFormData((prev) => ({
      ...prev,
      province: value || '',
    }));
    // Reset verification when user changes province
    if (locationVerified) {
      setLocationVerified(false);
      setSuccess('');
    }
  };

  // ✅ NEW: Handle City Autocomplete change
  const handleCityChange = (event, value) => {
    setFormData((prev) => ({
      ...prev,
      city: value || '',
    }));
    // Reset verification when user changes city
    if (locationVerified) {
      setLocationVerified(false);
      setSuccess('');
    }
  };

  // Handle consent checkbox change
  const handleConsentChange = (e) => {
    setConsent(e.target.checked);
  };

  // Submit consent and location to backend
  const handleStartBidding = async () => {
    if (!consent || !locationVerified) {
      setError('Please verify your location and check the consent box to proceed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/bidding/join-partner', {
        auctionId,
        hasConsented: consent,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          city: formData.city,
          province: formData.province,
        },
      });

      if (response.data.success) {
        setSuccess('✅ Successfully registered as bidding partner!');
        // Delay to show success message
        setTimeout(() => {
          onConsentComplete();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('❌ Error joining partner:', err);
      setError(
        err.response?.data?.message ||
        'Failed to register. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          bgcolor: '#f4f6f8',
          fontWeight: 700,
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
        Registration as a Bidding Partner
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ pt: 3 }}>
        {/* Info Message */}
        <Alert
          icon={<Info />}
          severity="info"
          sx={{ mb: 2.5 }}
        >
          By joining this auction, you will become a bidding partner for this
          vehicle. You will receive real-time email updates and notifications
          until the auction ends.
        </Alert>

        {/* Vehicle Info */}
        {vehicleInfo && (
          <Box
            sx={{
              p: 2,
              bgcolor: '#f9f9f9',
              borderRadius: 1.5,
              mb: 3,
              border: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Auction Details:
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {vehicleInfo.year} {vehicleInfo.brand} {vehicleInfo.model}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Starting Price: {vehicleInfo.startingPrice}
            </Typography>
            <Chip
              label={vehicleInfo.condition}
              size="small"
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Chip
              label={vehicleInfo.location}
              size="small"
              variant="outlined"
              icon={<LocationOn />}
            />
          </Box>
        )}

        <Divider sx={{ my: 2.5 }} />

        {/* Location Verification Section */}
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <LocationOn sx={{ color: 'primary.main' }} />
          Your Location
        </Typography>

        {/* ✅ NEW: Province Autocomplete */}
        <Autocomplete
          freeSolo
          options={SRI_LANKAN_PROVINCES}
          value={formData.province}
          onChange={handleProvinceChange}
          disabled={verifying || loading}
          sx={{ mb: 2 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Province"
              placeholder="e.g., Western"
              margin="normal"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f9f9f9',
                },
              }}
            />
          )}
        />

        {/* ✅ NEW: City Autocomplete */}
        <Autocomplete
          freeSolo
          options={SRI_LANKAN_CITIES}
          value={formData.city}
          onChange={handleCityChange}
          disabled={verifying || loading}
          sx={{ mb: 2 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="City"
              placeholder="e.g., Colombo"
              margin="normal"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f9f9f9',
                },
              }}
            />
          )}
        />

        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={handleVerifyLocation}
          disabled={verifying || loading || !formData.city || !formData.province}
          sx={{ mt: 1.5, mb: 2 }}
        >
          {verifying ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Verifying Location...
            </>
          ) : locationVerified ? (
            '✅ Location Verified'
          ) : (
            'Verify Location'
          )}
        </Button>

        {/* Consent Section */}
        <Divider sx={{ my: 2.5 }} />

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Email sx={{ color: 'primary.main' }} />
          Consent & Notifications
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={consent}
              onChange={handleConsentChange}
              disabled={loading}
            />
          }
          label={
            <Typography variant="body2">
              I agree to become a bidding partner and receive email updates
            </Typography>
          }
          sx={{ mb: 1.5 }}
        />

        {/* Error & Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions
        sx={{
          borderTop: '1px solid #e0e0e0',
          p: 2,
          backgroundColor: '#f9f9f9',
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 500 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleStartBidding}
          variant="contained"
          color="primary"
          disabled={!consent || !locationVerified || loading}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Starting Bidding...
            </>
          ) : (
            'Start Bidding'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BiddingConsentModal;
