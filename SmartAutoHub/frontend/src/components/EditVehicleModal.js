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
} from '@mui/material';
import api from '../services/api';

const fuelTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'other'];
const transmissions = ['automatic', 'manual', 'cvt', 'other'];
const bodyTypes = ['sedan', 'suv', 'hatchback', 'coupe', 'truck', 'van', 'wagon', 'convertible', 'other', 'bus', 'three wheeler', 'motorcycle', 'pickup', 'jeep'];
const conditions = ['new', 'used', 'excellent', 'good', 'fair', 'poor'];

const EditVehicleModal = ({ open, vehicle, onClose, onSuccess }) => {
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

  useEffect(() => {
    if (vehicle) {
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
    }
  }, [vehicle, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit Vehicle - {vehicle?.brand} {vehicle?.model}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
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
