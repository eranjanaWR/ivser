/**
 * Breakdown Page - Enhanced with Leaflet Maps
 * Request breakdown assistance with real-time tracking
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  MyLocation,
  CloudUpload,
  Build,
  Phone,
  CheckCircle,
  LocationOn,
  AccessTime,
  Star,
  NearMe,
  ArrowForward,
  Refresh,
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import api from '../services/api';
import { RepairmanMap, RepairmanTracker } from '../components';
import { reverseGeocode } from '../utils/geocoding';

const issueTypes = [
  'Engine Problem',
  'Flat Tire',
  'Battery Issue',
  'Overheating',
  'Brake Failure',
  'Fuel Problem',
  'Electrical Issue',
  'Accident',
  'Other',
];

const steps = ['Describe Issue', 'Confirm Location', 'Track Repairman'];

const BreakdownPage = () => {
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [detectedAddress, setDetectedAddress] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState({ brand: '', model: '', year: '' });
  
  // Breakdown request state
  const [breakdownId, setBreakdownId] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [nearbyRepairmen, setNearbyRepairmen] = useState([]);
  const [selectedRepairman, setSelectedRepairman] = useState(null);
  const [assignedRepairman, setAssignedRepairman] = useState(null);
  const [repairmanLocation, setRepairmanLocation] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('pending');

  // Fetch breakdown details
  const fetchBreakdownDetails = useCallback(async () => {
    if (!breakdownId) return;
    try {
      const { data } = await api.get(`/breakdowns/${breakdownId}`);
      if (data.success) {
        setBreakdown(data.data);
        setCurrentStatus(data.data.status);
        if (data.data.repairmanId) {
          setAssignedRepairman(data.data.repairmanId);
        }
      }
    } catch (err) {
      console.error('Error fetching breakdown:', err);
    }
  }, [breakdownId]);

  // Get user's location on mount
  useEffect(() => {
    const getLocation = () => {
      setLocationLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocation(loc);
            
            // Reverse geocode the location
            const addressResult = await reverseGeocode(loc.lat, loc.lng);
            if (addressResult) {
              setDetectedAddress(addressResult.shortAddress);
            }
            setLocationLoading(false);
          },
          (err) => {
            console.error('Location error:', err);
            setError('Unable to get your location. Please enable location services.');
            setLocationLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setError('Geolocation is not supported by your browser');
        setLocationLoading(false);
      }
    };
    
    getLocation();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Connect to socket when breakdown is created
  useEffect(() => {
    if (breakdownId) {
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
        transports: ['websocket', 'polling'],
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to socket');
        socket.emit('joinBreakdownRoom', breakdownId);
      });

      socket.on('repairmanLocationUpdate', (data) => {
        if (data.breakdownId === breakdownId) {
          setRepairmanLocation({
            lat: data.latitude,
            lng: data.longitude,
          });
        }
      });

      socket.on('breakdownAccepted', (data) => {
        if (data.breakdownId === breakdownId) {
          // Fetch updated breakdown details
          fetchBreakdownDetails();
          setSuccess('A repairman has accepted your request!');
        }
      });

      socket.on('breakdownStatusUpdate', (data) => {
        if (data.breakdownId === breakdownId) {
          setCurrentStatus(data.status);
          if (data.status === 'completed') {
            setSuccess('Your breakdown has been marked as completed!');
          }
        }
      });

      return () => {
        socket.emit('leaveBreakdownRoom', breakdownId);
        socket.disconnect();
      };
    }
  }, [breakdownId, fetchBreakdownDetails]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages([...images, ...newImages]);
    setImageFiles([...imageFiles, ...files]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleRefreshLocation = async () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
          
          const addressResult = await reverseGeocode(loc.lat, loc.lng);
          if (addressResult) {
            setDetectedAddress(addressResult.shortAddress);
          }
          setLocationLoading(false);
        },
        (err) => {
          setError('Unable to update your location');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      setError('Please enable location to continue');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('issueType', issueType);
      formData.append('description', description);
      formData.append('latitude', location.lat);
      formData.append('longitude', location.lng);
      formData.append('address', address || detectedAddress);
      formData.append('vehicleBrand', vehicleInfo.brand);
      formData.append('vehicleModel', vehicleInfo.model);
      formData.append('vehicleYear', vehicleInfo.year);
      
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
      
      const { data } = await api.post('/breakdowns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setBreakdownId(data.data._id);
      setBreakdown(data.data);
      setNearbyRepairmen(data.data.nearbyRepairmen || []);
      setActiveStep(2);
      setSuccess('Breakdown request sent! Waiting for a repairman to accept.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit breakdown request');
    }
    setLoading(false);
  };

  const handleStatusChange = (status) => {
    setCurrentStatus(status);
  };

  const handleComplete = async (ratingData) => {
    try {
      if (ratingData.rating) {
        await api.post(`/breakdowns/${breakdownId}/rate`, ratingData);
      }
      setSuccess('Thank you for your feedback!');
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };

  // Step 0: Describe Issue
  const renderIssueStep = () => (
    <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'grey.200', borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        What's the problem?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the type of issue and provide details to help the repairman prepare
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Issue Type *</InputLabel>
        <Select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          label="Issue Type *"
        >
          {issueTypes.map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Description"
        multiline
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your issue in detail. What happened? Any warning signs?"
        sx={{ mb: 3 }}
      />

      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Vehicle Information
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Brand"
            size="small"
            value={vehicleInfo.brand}
            onChange={(e) => setVehicleInfo({ ...vehicleInfo, brand: e.target.value })}
            placeholder="e.g., Toyota"
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Model"
            size="small"
            value={vehicleInfo.model}
            onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
            placeholder="e.g., Corolla"
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Year"
            size="small"
            value={vehicleInfo.year}
            onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
            placeholder="e.g., 2020"
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Photos (Optional - helps diagnose the issue)
      </Typography>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleImageSelect}
      />
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {images.map((img, index) => (
          <Box
            key={index}
            sx={{ position: 'relative' }}
          >
            <Box
              component="img"
              src={img}
              sx={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 1 }}
            />
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': { bgcolor: 'error.dark' },
                width: 20,
                height: 20,
              }}
              onClick={() => handleRemoveImage(index)}
            >
              ×
            </IconButton>
          </Box>
        ))}
        {images.length < 5 && (
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              width: 80,
              height: 60,
              border: '2px dashed',
              borderColor: 'grey.300',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
            }}
          >
            <CloudUpload color="action" />
          </Box>
        )}
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={() => setActiveStep(1)}
        disabled={!issueType}
        endIcon={<ArrowForward />}
      >
        Continue to Location
      </Button>
    </Paper>
  );

  // Step 1: Confirm Location
  const renderLocationStep = () => (
    <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'grey.200', borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Confirm Your Location
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        We'll use this to find repairmen near you
      </Typography>
      
      {/* Location Status */}
      <Box sx={{ mb: 3 }}>
        {locationLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Getting your location...</Typography>
          </Box>
        ) : location ? (
          <Alert 
            severity="success" 
            icon={<LocationOn />}
            action={
              <IconButton size="small" onClick={handleRefreshLocation}>
                <Refresh />
              </IconButton>
            }
          >
            <Typography variant="body2" fontWeight="bold">
              {detectedAddress || 'Location detected'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Typography>
          </Alert>
        ) : (
          <Alert severity="warning">
            Unable to get your location. Please enable location services.
          </Alert>
        )}
      </Box>

      {/* Map Preview */}
      {location && (
        <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <RepairmanMap
            userLocation={location}
            height={250}
            showRoute={false}
          />
        </Box>
      )}

      <TextField
        fullWidth
        label="Additional Address Details / Landmark"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="e.g., Near Colombo Fort Railway Station, opposite to ABC shop"
        sx={{ mb: 3 }}
        helperText="This helps the repairman find you faster"
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => setActiveStep(0)}
          sx={{ flex: 1 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!location || loading}
          sx={{ flex: 2 }}
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <NearMe />}
        >
          {loading ? 'Finding Repairmen...' : 'Request Help Now'}
        </Button>
      </Box>
    </Paper>
  );

  // Step 2: Track Repairman
  const renderTrackingStep = () => (
    <Box>
      {assignedRepairman ? (
        // Show tracking when repairman is assigned
        <RepairmanTracker
          breakdownId={breakdownId}
          breakdown={breakdown}
          repairman={assignedRepairman}
          userLocation={location}
          onStatusChange={handleStatusChange}
          onComplete={handleComplete}
        />
      ) : (
        // Show waiting state with nearby repairmen
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 3, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.50' }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Looking for Nearby Repairmen
            </Typography>
            <Typography color="text.secondary">
              We've notified {nearbyRepairmen.length || 'all'} repairmen in your area
            </Typography>
          </Box>

          {/* Map with nearby repairmen */}
          {location && (
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <RepairmanMap
                userLocation={location}
                nearbyRepairmen={nearbyRepairmen}
                onSelectRepairman={setSelectedRepairman}
                height={300}
                showRoute={false}
              />
            </Box>
          )}

          {/* Nearby Repairmen List */}
          {nearbyRepairmen.length > 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Nearby Repairmen ({nearbyRepairmen.length})
              </Typography>
              <List>
                {nearbyRepairmen.slice(0, 5).map((rm, index) => (
                  <React.Fragment key={rm._id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        bgcolor: selectedRepairman?._id === rm._id ? 'primary.50' : 'transparent',
                        borderRadius: 1,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedRepairman(rm)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={rm.profileImage}
                          sx={{ 
                            bgcolor: 'success.main',
                            border: selectedRepairman?._id === rm._id ? '2px solid' : 'none',
                            borderColor: 'primary.main',
                          }}
                        >
                          {rm.firstName?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography fontWeight="medium">
                            {rm.firstName} {rm.lastName}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <NearMe sx={{ fontSize: 14 }} />
                            <Typography variant="caption">
                              {rm.distance?.toFixed(1)} km away
                            </Typography>
                            {rm.repairmanDetails?.rating && (
                              <>
                                <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                                <Typography variant="caption">
                                  {rm.repairmanDetails.rating.toFixed(1)}
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={rm.repairmanDetails?.isAvailable ? 'Available' : 'Notified'}
                          size="small"
                          color={rm.repairmanDetails?.isAvailable ? 'success' : 'default'}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}

          {/* Waiting Info */}
          <Box sx={{ p: 3, bgcolor: 'grey.50', textAlign: 'center' }}>
            <AccessTime sx={{ color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Repairmen typically respond within 2-5 minutes.
              <br />
              You'll be notified when someone accepts your request.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderIssueStep();
      case 1:
        return renderLocationStep();
      case 2:
        return renderTrackingStep();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '80vh' }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Emergency Breakdown
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Get help from nearby verified repairmen in minutes
          </Typography>
        </Box>

        {error && (
          <Fade in>
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          </Fade>
        )}
        {success && (
          <Fade in>
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </Fade>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={activeStep > index}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: activeStep === index ? 'bold' : 'normal',
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Fade in key={activeStep}>
          <Box>{renderStepContent()}</Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default BreakdownPage;
