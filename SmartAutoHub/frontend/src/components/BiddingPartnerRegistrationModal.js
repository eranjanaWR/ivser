/**
 * Bidding Partner Registration Modal
 * Collects hierarchical location data and consent from first-time bidders
 */

import React, { useState, useEffect } from 'react';
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
  Autocomplete,
  TextField,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  LocationOn as LocationIcon,
  Close as CloseIcon,
  Info,
} from '@mui/icons-material';
import api from '../services/api';
import LocationPickerModal from './LocationPickerModal';

// Predefined Sri Lankan Provinces
const SRI_LANKAN_PROVINCES = [
  'Western', 'Central', 'Southern', 'North Western', 'Sabaragamuwa',
  'North Central', 'Uva', 'Eastern', 'Northern'
];

// Predefined Sri Lankan Districts
const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle'
];

const BiddingPartnerRegistrationModal = ({
  open,
  onClose,
  auctionId,
  vehicleInfo,
  onRegistrationComplete,
  socket, // Socket.io instance passed from parent
}) => {
  // Form state
  const [formData, setFormData] = useState({
    province: '',
    district: '',
    town: '',
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

  // Map Picker State
  const [pickerOpen, setPickerOpen] = useState(false);

  // Pre-center map on Town/District/Province before opening picker
  const handleOpenPicker = async () => {
    if (!formData.town || !formData.district || !formData.province) {
      setError('Please fill in Province, District, and Town before choosing on map');
      return;
    }
    
    setVerifying(true);
    setError('');
    
    try {
      const searchAddress = `${formData.town}, ${formData.district}, ${formData.province}, Sri Lanka`;
      console.log('🔍 [REGISTRATION] Geocoding for map centering:', searchAddress);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`
      );
      
      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          setLocation({
            latitude: parseFloat(results[0].lat),
            longitude: parseFloat(results[0].lon),
          });
        }
      }
      setPickerOpen(true);
    } catch (err) {
      console.error('❌ [REGISTRATION] Search failed:', err);
      setPickerOpen(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleLocationConfirm = (coords) => {
    const [lat, lon] = coords;
    setLocation({ latitude: lat, longitude: lon });
    setLocationVerified(true);
    setSuccess('📍 Precise location confirmed on map!');
    setError('');
  };

  const handleSubmit = async () => {
    if (!consent || !locationVerified) {
      setError('Please verify your location on the map and agree to the terms');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const registrationData = {
        auctionId,
        hasConsented: consent,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          province: formData.province,
          district: formData.district,
          mainTown: formData.town,
        },
      };

      console.log('📤 [REGISTRATION] Sending data to backend:', registrationData);
      const response = await api.post('/bidding/join-partner', registrationData);

      if (response.data.success) {
        setSuccess('✅ Successfully registered as bidding partner!');
        
        // 🚀 Real-time Update: Emit location to everyone via Socket.io
        if (socket) {
          console.log('📡 [SOCKET] Broadcasting new partner location...');
          const partnerId = (response.data.partner?.userId?._id || response.data.partner?.userId || 'me')?.toString();
          socket.emit('newPartnerLocation', {
            vehicleId: auctionId,
            partner: {
              userId: partnerId,
              latitude: location.latitude,
              longitude: location.longitude,
              town: formData.town,
              province: formData.province,
              district: formData.district
            }
          });
        }

        setTimeout(() => {
          onRegistrationComplete();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('❌ [REGISTRATION] Failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        sx: { borderRadius: 3, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#f8f9fa',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #eee',
        }}
      >
        Bidding Partner Registration
        <IconButton onClick={onClose} size="small" disabled={loading}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Alert icon={<Info />} severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          You are placing your first bid for this vehicle. Please register your location to appear on the live auction map.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
          <Autocomplete
            options={SRI_LANKAN_PROVINCES}
            value={formData.province}
            onChange={(e, v) => setFormData(p => ({ ...p, province: v || '' }))}
            renderInput={(params) => <TextField {...params} label="Province" required size="small" />}
          />

          <Autocomplete
            options={SRI_LANKAN_DISTRICTS}
            value={formData.district}
            onChange={(e, v) => setFormData(p => ({ ...p, district: v || '' }))}
            renderInput={(params) => <TextField {...params} label="District" required size="small" />}
          />
          
          <TextField
            fullWidth
            label="Town / City"
            value={formData.town}
            onChange={(e) => setFormData(p => ({ ...p, town: e.target.value }))}
            size="small"
            required
            placeholder="e.g. Kaduwela, Malabe"
          />

          <Button
            variant="contained"
            color={locationVerified ? "success" : "primary"}
            fullWidth
            onClick={handleOpenPicker}
            disabled={verifying || loading || !formData.province || !formData.district || !formData.town}
            startIcon={verifying ? <CircularProgress size={20} color="inherit" /> : <LocationIcon />}
            sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            {verifying ? 'Locating...' : locationVerified ? '✅ Location Confirmed' : '📍 Pinpoint on Map'}
          </Button>

          {locationVerified && (
            <Box sx={{ p: 1.5, bgcolor: '#f1f8e9', borderRadius: 2, border: '1px solid #c5e1a5', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: '#4caf50', fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#33691e' }}>
                Map location set: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Typography>
            </Box>
          )}
        </Box>

        <FormControlLabel
          control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={loading} />}
          label={<Typography variant="body2">I agree to the terms and wish to join this auction as a partner.</Typography>}
        />

        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>{success}</Alert>}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !locationVerified || !consent}
          sx={{ px: 4, borderRadius: 2, fontWeight: 700, minWidth: '150px' }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Register & Bid'}
        </Button>
      </DialogActions>

      <LocationPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={location.latitude ? [location.latitude, location.longitude] : null}
        district={formData.district}
      />
    </Dialog>
  );
};

export default BiddingPartnerRegistrationModal;
