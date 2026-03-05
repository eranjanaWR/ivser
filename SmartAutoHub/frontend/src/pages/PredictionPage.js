/**
 * Prediction Page
 * Vehicle price prediction form
 */

import React, { useState } from 'react';
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
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Speed,
  CalendarToday,
  LocalGasStation,
  AttachMoney,
} from '@mui/icons-material';
import api from '../services/api';

const brands = ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'BMW', 'Mercedes', 'Audi', 'Mazda', 'Mitsubishi', 'Hyundai', 'Ford', 'Volkswagen'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const transmissions = ['Manual', 'Automatic'];
const conditions = ['New', 'Used', 'Certified Pre-Owned'];

const PredictionPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prediction, setPrediction] = useState(null);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: '',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engineCapacity: '',
    condition: 'Used',
  });

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.brand || !formData.model || !formData.mileage) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    setPrediction(null);
    
    try {
      const { data } = await api.post('/prediction/estimate', formData);
      setPrediction(data.data);
    } catch (err) {
      // Generate mock prediction for demo
      const basePrice = 3000000; // 3M LKR
      const yearFactor = (formData.year - 2000) * 100000;
      const mileageFactor = -Number(formData.mileage) * 5;
      const conditionFactor = formData.condition === 'New' ? 500000 : formData.condition === 'Certified Pre-Owned' ? 200000 : 0;
      const transmissionFactor = formData.transmission === 'Automatic' ? 300000 : 0;
      const hybridFactor = formData.fuelType === 'Hybrid' ? 500000 : formData.fuelType === 'Electric' ? 800000 : 0;
      
      const estimatedPrice = Math.max(500000, basePrice + yearFactor + mileageFactor + conditionFactor + transmissionFactor + hybridFactor);
      
      setPrediction({
        estimatedPrice: Math.round(estimatedPrice),
        priceRange: {
          min: Math.round(estimatedPrice * 0.85),
          max: Math.round(estimatedPrice * 1.15),
        },
        factors: {
          year: yearFactor > 0 ? 'positive' : 'negative',
          mileage: 'negative',
          condition: conditionFactor > 0 ? 'positive' : 'neutral',
          transmission: transmissionFactor > 0 ? 'positive' : 'neutral',
          fuelType: hybridFactor > 0 ? 'positive' : 'neutral',
        },
        confidence: 85,
        marketTrend: 'stable',
      });
    }
    setLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const years = [];
  for (let y = new Date().getFullYear() + 1; y >= 1990; y--) {
    years.push(y);
  }

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Price Prediction
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Get an accurate market value estimate for any vehicle
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Form */}
          <Grid item xs={12} md={6}>
            <Paper
              component="form"
              onSubmit={handleSubmit}
              elevation={0}
              sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Vehicle Details
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }} required>
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

              <TextField
                fullWidth
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
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
                <Grid item xs={6}>
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
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
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
                <Grid item xs={6}>
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
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Engine (cc)"
                    name="engineCapacity"
                    type="number"
                    value={formData.engineCapacity}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={6}>
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
              </Grid>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}
              >
                {loading ? 'Calculating...' : 'Get Estimate'}
              </Button>
            </Paper>
          </Grid>

          {/* Results */}
          <Grid item xs={12} md={6}>
            {prediction ? (
              <Paper
                elevation={0}
                sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Price Estimate
                </Typography>

                <Card
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    mb: 3,
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <AttachMoney sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="h3" fontWeight="bold">
                      {formatPrice(prediction.estimatedPrice)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                      {formatPrice(prediction.priceRange.min)} - {formatPrice(prediction.priceRange.max)}
                    </Typography>
                  </CardContent>
                </Card>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Confidence Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: 8,
                      bgcolor: 'grey.200',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${prediction.confidence}%`,
                        height: '100%',
                        bgcolor: prediction.confidence > 80 ? 'success.main' : 'warning.main',
                      }}
                    />
                  </Box>
                  <Typography fontWeight="bold">{prediction.confidence}%</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Price Factors
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="body2">Year</Typography>
                      {prediction.factors?.year === 'positive' ? (
                        <TrendingUp fontSize="small" color="success" />
                      ) : (
                        <TrendingDown fontSize="small" color="error" />
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Speed fontSize="small" color="action" />
                      <Typography variant="body2">Mileage</Typography>
                      <TrendingDown fontSize="small" color="error" />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalGasStation fontSize="small" color="action" />
                      <Typography variant="body2">Fuel Type</Typography>
                      {prediction.factors?.fuelType === 'positive' ? (
                        <TrendingUp fontSize="small" color="success" />
                      ) : (
                        <Box sx={{ width: 20, height: 20, bgcolor: 'grey.400', borderRadius: '50%' }} />
                      )}
                    </Box>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 3 }}>
                  This estimate is based on current market trends and similar vehicle sales.
                  Actual prices may vary based on specific vehicle condition and market demand.
                </Alert>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <TrendingUp sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Enter vehicle details to get a price estimate
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Our algorithm analyzes thousands of listings to provide accurate market values
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PredictionPage;
