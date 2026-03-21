/**
 * Add Vehicle Page
 * Multi-step form to add new vehicle listing
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Card,
  CardContent,
} from '@mui/material';
import { ArrowBack, CloudUpload, Delete, Add } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const brands = ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'BMW', 'Mercedes', 'Audi', 'Mazda', 'Mitsubishi', 'Hyundai', 'Ford', 'Volkswagen'];
const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Pickup', 'Coupe', 'Hatchback', 'Van', 'Convertible', 'Wagon', 'Bus', 'Three Wheeler', 'Motorcycle', 'Jeep'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const transmissions = ['Manual', 'Automatic'];
const conditions = ['New', 'Used'];
const colors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Brown', 'Beige'];

const AddVehiclePage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleConfirmed, setRoleConfirmed] = useState(false);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    vehicleType: '',
    condition: '',
    fuelType: '',
    transmission: '',
    mileage: '',
    location: '',
    color: '',
    manufacturedCountry: '',
    engineCapacity: '',
    description: '',
    features: '',
  });

  // Update user role to "buyer/seller" if user is a buyer visiting this page
  useEffect(() => {
    if (user && user.role === 'buyer') {
      // Show the confirmation card instead of auto-updating
      // The user will click the button to confirm
    }
  }, [user]);

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConfirmRole = async () => {
    try {
      setLoading(true);
      await api.put('/users/update-role', { role: 'seller' });
      if (refreshUser) {
        await refreshUser();
      }
      setRoleConfirmed(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages([...images, ...newImages]);
    setImageFiles([...imageFiles, ...files]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newFiles = [...imageFiles];
    newImages.splice(index, 1);
    newFiles.splice(index, 1);
    setImages(newImages);
    setImageFiles(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.brand || !formData.model || !formData.price || !formData.vehicleType || !formData.fuelType || !formData.transmission || !formData.mileage || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (imageFiles.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const submitData = new FormData();
      
      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'features') {
          const featuresArray = value.split(',').map((f) => f.trim()).filter(Boolean);
          featuresArray.forEach((feature) => submitData.append('features', feature));
        } else if (key === 'vehicleType') {
          submitData.append('type', value); // Map vehicleType to type
        } else if (key === 'engineCapacity') {
          submitData.append('engineCapacity', value);
        } else if (key === 'location') {
          // Convert location string to proper object format
          submitData.append('location', JSON.stringify({
            city: value || 'Unknown',
            state: '',
            country: 'Sri Lanka'
          }));
        } else {
          submitData.append(key, value);
        }
      });
      
      // Append images
      imageFiles.forEach((file) => {
        submitData.append('images', file);
      });
      
      const { data } = await api.post('/vehicles', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      navigate('/vehicles');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vehicle');
    }
    setLoading(false);
  };

  const years = [];
  for (let y = new Date().getFullYear() + 1; y >= 1990; y--) {
    years.push(y);
  }

  return (
    <Box sx={{ py: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Paper elevation={1} sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Sell Your Vehicle
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter all the details about your vehicle. Photos and information are required.
          </Typography>

          {/* Debug info */}
          {/* Current role: {user?.role || 'Not loaded'}, roleConfirmed: {roleConfirmed.toString()} */}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {user && (user.role === 'buyer' || user.role === 'buyer/seller') && !roleConfirmed && (
            <Card sx={{ mb: 4, p: 3, bgcolor: '#e3f2fd', border: '2px solid #2196f3' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#1565c0' }}>
                Change Your Role
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#0d47a1' }}>
                To sell a vehicle, you need to switch your role to Seller. Click the button below to confirm this change.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmRole}
                disabled={loading}
                sx={{ fontWeight: 600 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Confirm & Continue as Seller'}
              </Button>
            </Card>
          )}

          {user?.role !== 'buyer' || roleConfirmed ? (
            <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              {/* Left Side: Photo Upload */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 4, mb: 2 }}>
                  Vehicle Photos
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Upload at least 1 photo, maximum 10. First image will be the cover photo.
                </Typography>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                  {images.map((img, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 120,
                        height: 100,
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '2px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        component="img"
                        src={img}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Button
                        size="small"
                        onClick={() => removeImage(index)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          minWidth: 'auto',
                          p: 0.5,
                          bgcolor: 'rgba(244, 67, 54, 0.8)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(244, 67, 54, 1)' },
                        }}
                      >
                        <Delete fontSize="small" />
                      </Button>
                      {index === 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: 'primary.main',
                            color: 'white',
                            textAlign: 'center',
                            py: 0.5,
                            fontWeight: 600,
                          }}
                        >
                          Cover
                        </Typography>
                      )}
                    </Box>
                  ))}
                  
                  {images.length < 10 && (
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        width: 120,
                        height: 100,
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        bgcolor: 'rgba(33, 150, 243, 0.05)',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(33, 150, 243, 0.1)' },
                        textTransform: 'none',
                        color: 'text.primary',
                      }}
                    >
                      <CloudUpload sx={{ mb: 1, color: 'primary.main' }} />
                      <Typography variant="caption" color="primary">
                        Add Photo
                      </Typography>
                    </Button>
                  )}
                </Box>
              </Grid>

              {/* Right Side: Vehicle Details Form */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 4, mb: 2 }}>
                  Vehicle Details
                </Typography>

                {/* Row 1: Make, Model, Year */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Make"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Toyota"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Camry"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      required
                      type="number"
                      placeholder="2026"
                    />
                  </Grid>
                </Grid>

                {/* Row 2: Price, Vehicle Type, Condition */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Price (Rs.)"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      type="number"
                      placeholder="25000"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Vehicle Type</InputLabel>
                      <Select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        label="Vehicle Type"
                      >
                        <MenuItem value="">—</MenuItem>
                        {vehicleTypes.map((vt) => (
                          <MenuItem key={vt} value={vt}>{vt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Condition</InputLabel>
                      <Select
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        label="Condition"
                      >
                        <MenuItem value="">—</MenuItem>
                        {conditions.map((c) => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Row 3: Fuel Type, Transmission, Mileage */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Fuel Type</InputLabel>
                      <Select
                        name="fuelType"
                        value={formData.fuelType}
                        onChange={handleChange}
                        label="Fuel Type"
                      >
                        <MenuItem value="">—</MenuItem>
                        {fuelTypes.map((ft) => (
                          <MenuItem key={ft} value={ft}>{ft}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Transmission</InputLabel>
                      <Select
                        name="transmission"
                        value={formData.transmission}
                        onChange={handleChange}
                        label="Transmission"
                      >
                        <MenuItem value="">—</MenuItem>
                        {transmissions.map((t) => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Mileage (km)"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleChange}
                      required
                      type="number"
                      placeholder="15000"
                    />
                  </Grid>
                </Grid>

                {/* Row 4: Location, Color */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Located City"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="Colombo"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      placeholder="e.g. White"
                    />
                  </Grid>
                </Grid>

                {/* Row 5: Manufactured Country, Engine Capacity */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Manufactured Country"
                      name="manufacturedCountry"
                      value={formData.manufacturedCountry}
                      onChange={handleChange}
                      placeholder="Japan"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cubic Capacity (CC)"
                      name="engineCapacity"
                      value={formData.engineCapacity}
                      onChange={handleChange}
                      type="number"
                      placeholder="1800"
                    />
                  </Grid>
                </Grid>

                {/* Description */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      multiline
                      rows={3}
                      placeholder="Describe the vehicle condition, features, and reason for selling..."
                    />
                  </Grid>
                </Grid>

                {/* Features */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Features (comma-separated)"
                      name="features"
                      value={formData.features}
                      onChange={handleChange}
                      placeholder="e.g. Air Conditioning, Power Steering, Cruise Control"
                    />
                  </Grid>
                </Grid>

                {/* Submit Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'List Vehicle'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Please confirm your role change above to continue.
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
};


export default AddVehiclePage;
