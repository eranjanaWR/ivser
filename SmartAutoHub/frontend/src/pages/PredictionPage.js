import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';

const PredictionPage = () => {
  const [formData, setFormData] = useState({
    Brand: 'Toyota',
    Model: 'Camry',
    Year: 2020,
    Engine_cc: 1800,
    Gear: 'Automatic',
    Fuel_Type: 'Petrol',
    Millage_KM: 50000,
  });

  const [predictedPrice, setPredictedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const brands = ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'Hyundai', 'Mitsubishi', 'BMW', 'Mercedes'];
  const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
  const gears = ['Automatic', 'Manual'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const predictPrice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate Vehicle Age (2026 - year)
      const currentYear = new Date().getFullYear();
      const vehicleAge = currentYear - formData.Year;
      
      // Send data in the EXACT format your pipeline expects
      const requestData = {
        brand: formData.Brand,
        model: formData.Model,
        year: parseInt(formData.Year),
        mileage: parseInt(formData.Millage_KM),
        fuelType: formData.Fuel_Type,
        transmission: formData.Gear
      };
      
      console.log('Sending to backend:', requestData);
      
      const response = await axios.post('/api/prediction/predict', requestData);
      const { predictedPrice, priceRange, factors } = response.data.data;
      setPredictedPrice(predictedPrice);
      console.log('Prediction result:', { predictedPrice, priceRange, factors });
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to get prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
           Vehicle Price Predictor
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          Get instant market price estimates for your vehicle
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Brand"
              name="Brand"
              value={formData.Brand}
              onChange={handleChange}
            >
              {brands.map((brand) => (
                <MenuItem key={brand} value={brand}>{brand}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model"
              name="Model"
              placeholder="e.g., Camry, Corolla, Civic"
              value={formData.Model}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Year of Manufacture"
              name="Year"
              placeholder="e.g., 2020"
              value={formData.Year}
              onChange={handleChange}
              inputProps={{ min: 1980, max: 2026 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Engine (cc)"
              name="Engine_cc"
              placeholder="e.g., 1800"
              value={formData.Engine_cc}
              onChange={handleChange}
              inputProps={{ min: 600, max: 6000 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Gear"
              name="Gear"
              value={formData.Gear}
              onChange={handleChange}
            >
              {gears.map((gear) => (
                <MenuItem key={gear} value={gear}>{gear}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Fuel Type"
              name="Fuel_Type"
              value={formData.Fuel_Type}
              onChange={handleChange}
            >
              {fuelTypes.map((fuel) => (
                <MenuItem key={fuel} value={fuel}>{fuel}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Mileage (KM)"
              name="Millage_KM"
              placeholder="e.g., 50000"
              value={formData.Millage_KM}
              onChange={handleChange}
              inputProps={{ min: 0, max: 500000 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={predictPrice}
              disabled={loading}
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : '🔮 Predict Price'}
            </Button>
          </Grid>
        </Grid>

        {predictedPrice && (
          <Box sx={{ mt: 4, p: 3, bgcolor: '#e8f5e9', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              Predicted Market Price
            </Typography>
            <Typography variant="h3" color="primary" fontWeight="bold">
              LKR {predictedPrice.toLocaleString()} Lakhs
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              *Estimated price based on market trends
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default PredictionPage;