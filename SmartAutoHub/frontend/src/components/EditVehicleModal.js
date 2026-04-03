import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Box,
  Alert,
  Paper,
  IconButton,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const fuelTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'other'];
const transmissions = ['automatic', 'manual', 'cvt', 'other'];
const bodyTypes = ['sedan', 'suv', 'hatchback', 'coupe', 'truck', 'van', 'wagon', 'convertible', 'other', 'bus', 'three wheeler', 'motorcycle', 'pickup', 'jeep'];
const conditions = ['new', 'used', 'excellent', 'good', 'fair', 'poor'];

const EditVehicleModal = ({ open, vehicle, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin1' || user?.role === 'admin2';

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'sedan',
    condition: 'good',
    color: '',
    engineSize: '',
    seats: 5,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const fileInputRef = React.useRef(null);

  // Fetch vehicle images on mount
  useEffect(() => {
    if (vehicle && open) {
      setFormData({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        price: vehicle.price || '',
        mileage: vehicle.mileage || '',
        fuelType: vehicle.fuelType || 'petrol',
        transmission: vehicle.transmission || 'automatic',
        bodyType: vehicle.bodyType || 'sedan',
        condition: vehicle.condition || 'good',
        color: vehicle.color || '',
        engineSize: vehicle.engineSize || '',
        seats: vehicle.seats || 5,
        description: vehicle.description || '',
      });
      setError(null);
      
      // Fetch vehicle images if admin
      if (isAdmin) {
        fetchVehicleImages();
      }
    }
  }, [vehicle, open, isAdmin]);

  const fetchVehicleImages = async () => {
    try {
      setLoadingImages(true);
      const response = await api.get(`/vehicles/${vehicle._id}/images`);
      if (response.data.success) {
        setImages(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      setDeletingImageId(imageId);
      const response = await api.delete(`/vehicles/${vehicle._id}/images/${imageId}`);
      
      if (response.data.success) {
        setImages(prevImages => prevImages.filter(img => img._id !== imageId));
        // Call onSuccess to update parent component with new vehicle data
        onSuccess && onSuccess(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to delete image');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting image');
      console.error('Delete image error:', err);
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formDataUpload = new FormData();
    files.forEach(file => {
      formDataUpload.append('images', file);
    });

    try {
      setLoading(true);
      const response = await api.post(`/vehicles/${vehicle._id}/images`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        // Refresh images list
        await fetchVehicleImages();
        // Call onSuccess to update parent component with new vehicle data
        onSuccess && onSuccess(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to upload images');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading images');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.brand || !formData.model || !formData.price || !formData.year) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/vehicles/${vehicle._id}`, formData);
      
      if (response.data.success) {
        onSuccess && onSuccess(response.data.data);
        onClose();
      } else {
        setError(response.data.message || 'Failed to update vehicle');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating vehicle');
      console.error('Update vehicle error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageObj) => {
    if (!imageObj) return '';
    if (imageObj.imageData) {
      return `data:${imageObj.mimeType};base64,${imageObj.imageData}`;
    }
    return `/api/images/${imageObj._id}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit Vehicle - {vehicle?.brand} {vehicle?.model}
      </DialogTitle>
      <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          {/* Brand */}
          <Grid item xs={6}>
            <TextField
              label="Brand *"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="e.g., Toyota"
            />
          </Grid>

          {/* Model */}
          <Grid item xs={6}>
            <TextField
              label="Model *"
              name="model"
              value={formData.model}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="e.g., Corolla"
            />
          </Grid>

          {/* Year */}
          <Grid item xs={6}>
            <TextField
              label="Year *"
              name="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              fullWidth
              size="small"
              inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
            />
          </Grid>

          {/* Mileage */}
          <Grid item xs={6}>
            <TextField
              label="Mileage (km)"
              name="mileage"
              type="number"
              value={formData.mileage}
              onChange={handleChange}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Price */}
          <Grid item xs={6}>
            <TextField
              label="Price (LKR) *"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Color */}
          <Grid item xs={6}>
            <TextField
              label="Color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>

          {/* Fuel Type */}
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Fuel Type</InputLabel>
              <Select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                label="Fuel Type"
              >
                {fuelTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Transmission */}
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Transmission</InputLabel>
              <Select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                label="Transmission"
              >
                {transmissions.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Body Type */}
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Body Type</InputLabel>
              <Select
                name="bodyType"
                value={formData.bodyType}
                onChange={handleChange}
                label="Body Type"
              >
                {bodyTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Condition */}
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Condition</InputLabel>
              <Select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                label="Condition"
              >
                {conditions.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Engine Size */}
          <Grid item xs={6}>
            <TextField
              label="Engine Size"
              name="engineSize"
              value={formData.engineSize}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="e.g., 1.8L"
            />
          </Grid>

          {/* Seats */}
          <Grid item xs={6}>
            <TextField
              label="Seats"
              name="seats"
              type="number"
              value={formData.seats}
              onChange={handleChange}
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 12 }}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="Add any additional details about the vehicle..."
            />
          </Grid>

          {/* Admin-only Photo Management Section */}
          {isAdmin && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                  📷 Photo Management (Admin Only)
                </Typography>
              </Grid>

              {/* Current Images */}
              {loadingImages ? (
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={30} />
                </Grid>
              ) : images.length > 0 ? (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    Current Images ({images.length})
                  </Typography>
                  <Grid container spacing={1}>
                    {images.map((image) => (
                      <Grid item xs={6} sm={4} key={image._id}>
                        <Paper sx={{ position: 'relative', overflow: 'hidden', pt: '100%' }}>
                          <Box
                            component="img"
                            src={getImageUrl(image)}
                            alt={image.filename}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteImage(image._id)}
                            disabled={deletingImageId === image._id}
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              borderRadius: 0,
                              '&:hover': {
                                backgroundColor: 'rgba(211, 47, 47, 0.8)',
                              },
                            }}
                          >
                            {deletingImageId === image._id ? (
                              <CircularProgress size={20} sx={{ color: 'white' }} />
                            ) : (
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    No images uploaded yet
                  </Typography>
                </Grid>
              )}

              {/* Add Photos Button */}
              <Grid item xs={12}>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddPhotoAlternateIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  Add Photos
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditVehicleModal;
