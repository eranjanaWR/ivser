/**
 * Add Vehicle Page
 * Form to add new vehicle listing
 */

import React, { useState, useRef } from 'react';
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
  IconButton,
} from '@mui/material';
import { CloudUpload, Delete, Add } from '@mui/icons-material';
import api from '../services/api';

const brands = ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'BMW', 'Mercedes', 'Audi', 'Mazda', 'Mitsubishi', 'Hyundai', 'Ford', 'Volkswagen'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const transmissions = ['Manual', 'Automatic'];
const conditions = ['New', 'Used', 'Certified Pre-Owned'];
const colors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Brown', 'Beige'];

const AddVehiclePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: '',
    price: '',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engineCapacity: '',
    color: '',
    condition: 'Used',
    description: '',
    features: '',
    location: '',
  });

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    if (!formData.brand || !formData.model || !formData.price) {
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
          // Convert comma-separated features to array
          const featuresArray = value.split(',').map((f) => f.trim()).filter(Boolean);
          featuresArray.forEach((feature) => submitData.append('features', feature));
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
      
      navigate(`/vehicles/${data.data._id}`);
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
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Add New Vehicle
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Fill in the details to list your vehicle for sale
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={0}
          sx={{ p: 4, border: '1px solid', borderColor: 'grey.200' }}
        >
          {/* Image Upload */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Photos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add up to 10 photos. First image will be the cover.
          </Typography>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
            {images.map((img, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  width: 120,
                  height: 90,
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={img}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeImage(index)}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
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
                      py: 0.25,
                    }}
                  >
                    Cover
                  </Typography>
                )}
              </Box>
            ))}
            
            {images.length < 10 && (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  width: 120,
                  height: 90,
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.light' },
                }}
              >
                <Add color="action" />
                <Typography variant="caption" color="text.secondary">
                  Add Photo
                </Typography>
              </Box>
            )}
          </Box>

          {/* Basic Info */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Basic Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Brand</InputLabel>
                <Select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  label="Brand"
                >
                  {brands.map((b) => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  label="Year"
                >
                  {years.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Mileage (km)"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  label="Condition"
                >
                  {conditions.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Price (LKR)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>

          {/* Technical Specs */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Technical Specifications
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Fuel Type</InputLabel>
                <Select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  label="Fuel Type"
                >
                  {fuelTypes.map((f) => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Transmission</InputLabel>
                <Select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                  label="Transmission"
                >
                  {transmissions.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Engine (cc)"
                name="engineCapacity"
                type="number"
                value={formData.engineCapacity}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  label="Color"
                >
                  {colors.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Additional Info */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Additional Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Colombo, Sri Lanka"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your vehicle's condition, history, and any other relevant details..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="Air Conditioning, Power Steering, ABS, etc. (comma separated)"
                helperText="Separate features with commas"
              />
            </Grid>
          </Grid>

          {/* Submit */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ px: 4 }}
            >
              {loading ? <CircularProgress size={24} /> : 'List Vehicle'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/my-vehicles')}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AddVehiclePage;
