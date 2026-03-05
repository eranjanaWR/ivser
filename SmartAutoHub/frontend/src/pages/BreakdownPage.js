/**
 * Breakdown Page
 * Request breakdown assistance
 */

import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import {
  MyLocation,
  CloudUpload,
  Build,
  Phone,
  CheckCircle,
  LocationOn,
  AccessTime,
} from '@mui/icons-material';
import api from '../services/api';
import io from 'socket.io-client';

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

const steps = ['Describe Issue', 'Your Location', 'Find Repairman'];

const BreakdownPage = () => {
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState({ brand: '', model: '', year: '' });
  
  // Breakdown request state
  const [breakdownId, setBreakdownId] = useState(null);
  const [nearbyRepairmen, setNearbyRepairmen] = useState([]);
  const [assignedRepairman, setAssignedRepairman] = useState(null);
  const [repairmanLocation, setRepairmanLocation] = useState(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Location error:', err);
        }
      );
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (breakdownId) {
      // Connect to socket for real-time updates
      socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
      
      socketRef.current.on('connect', () => {
        socketRef.current.emit('join-breakdown', breakdownId);
      });

      socketRef.current.on('repairman-location-update', (data) => {
        setRepairmanLocation(data.location);
      });

      socketRef.current.on('breakdown-status-update', (data) => {
        if (data.status === 'accepted') {
          setAssignedRepairman(data.repairman);
          setSuccess('A repairman has accepted your request!');
        } else if (data.status === 'completed') {
          setSuccess('Your breakdown has been marked as completed!');
        }
      });
    }
  }, [breakdownId]);

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

  const handleGetLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        (err) => {
          setError('Unable to get your location. Please enable location services.');
          setLoading(false);
        }
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
      formData.append('address', address);
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
      setNearbyRepairmen(data.data.nearbyRepairmen || []);
      setActiveStep(2);
      setSuccess('Breakdown request sent! Waiting for a repairman to accept.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit breakdown request');
    }
    setLoading(false);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Describe Your Issue
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Issue Type</InputLabel>
              <Select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                label="Issue Type"
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
              placeholder="Describe your issue in detail..."
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" gutterBottom>
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
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Model"
                  size="small"
                  value={vehicleInfo.model}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Year"
                  size="small"
                  value={vehicleInfo.year}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" gutterBottom>
              Photos (Optional)
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
                  component="img"
                  src={img}
                  sx={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 1 }}
                />
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
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <CloudUpload color="action" />
                </Box>
              )}
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={() => setActiveStep(1)}
              disabled={!issueType}
            >
              Continue
            </Button>
          </Paper>
        );

      case 1:
        return (
          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Confirm Your Location
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              {location ? (
                <Alert severity="success" icon={<LocationOn />}>
                  Location detected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </Alert>
              ) : (
                <Alert severity="warning">
                  We need your location to find nearby repairmen
                </Alert>
              )}
            </Box>

            <Button
              variant="outlined"
              startIcon={<MyLocation />}
              onClick={handleGetLocation}
              disabled={loading}
              sx={{ mb: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Location'}
            </Button>

            <TextField
              fullWidth
              label="Address / Landmark (Optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Near Colombo Fort Railway Station"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={!location || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Request Help'}
              </Button>
            </Box>
          </Paper>
        );

      case 2:
        return (
          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'grey.200' }}>
            {assignedRepairman ? (
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Repairman On The Way!
                </Typography>
                
                <Card sx={{ mt: 3, textAlign: 'left' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                        {assignedRepairman.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{assignedRepairman.name}</Typography>
                        <Chip
                          icon={<Build />}
                          label="Verified Repairman"
                          size="small"
                          color="primary"
                        />
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<Phone />}
                      fullWidth
                      href={`tel:${assignedRepairman.phone}`}
                    >
                      Call {assignedRepairman.phone}
                    </Button>
                    
                    {repairmanLocation && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Live location tracking enabled
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={64} sx={{ mb: 3 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Looking for Nearby Repairmen
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  We're notifying repairmen in your area...
                </Typography>
                
                {nearbyRepairmen.length > 0 && (
                  <Typography variant="body2">
                    Found {nearbyRepairmen.length} repairmen nearby
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Emergency Breakdown
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Get help from nearby verified repairmen
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </Container>
    </Box>
  );
};

export default BreakdownPage;
