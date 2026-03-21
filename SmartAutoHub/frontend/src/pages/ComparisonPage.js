/**
 * Vehicle Comparison Page
 * Compare multiple vehicles side by side
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Close,
  Speed,
  CalendarToday,
  LocalGasStation,
  Settings,
  ColorLens,
  DirectionsCar,
} from '@mui/icons-material';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

export default function ComparisonPage() {
  const navigate = useNavigate();
  const { id: baseVehicleId } = useParams();

  const [baseVehicle, setBaseVehicle] = useState(null);
  const [compareVehicles, setCompareVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState([]);

  // Fetch all vehicles and set up base vehicle
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/vehicles');
        const vehicles = response.data;

        // Find base vehicle
        if (baseVehicleId) {
          const base = vehicles.find((v) => v._id === baseVehicleId);
          if (base) {
            setBaseVehicle(base);
            // Filter out base vehicle from available vehicles
            const available = vehicles.filter((v) => v._id !== baseVehicleId);
            setAvailableVehicles(available);
            // Show first 12 available vehicles
            setFilteredVehicles(available.slice(0, 12));
          }
        } else {
          setAvailableVehicles(vehicles);
          setFilteredVehicles(vehicles.slice(0, 12));
        }
      } catch (err) {
        setError('Failed to load vehicles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [baseVehicleId]);

  // Handle search
  useEffect(() => {
    if (!searchTerm) {
      // Show all vehicles not yet compared
      const available = availableVehicles.filter((v) => !compareVehicles.some((cv) => cv._id === v._id));
      setFilteredVehicles(available.slice(0, 12)); // Show 12 at a time
      return;
    }

    const search = searchTerm.toLowerCase();
    const filtered = availableVehicles.filter(
      (v) =>
        !compareVehicles.some((cv) => cv._id === v._id) &&
        (v.brand.toLowerCase().includes(search) ||
          v.model.toLowerCase().includes(search) ||
          v.year.toString().includes(search))
    );
    setFilteredVehicles(filtered.slice(0, 12));
  }, [searchTerm, compareVehicles, availableVehicles]);

  const addVehicleToCompare = (vehicle) => {
    if (compareVehicles.length < 3) {
      setCompareVehicles([...compareVehicles, vehicle]);
      setSearchTerm('');
    }
  };

  const removeVehicleFromCompare = (vehicleId) => {
    setCompareVehicles(compareVehicles.filter((v) => v._id !== vehicleId));
  };

  const getSpecValue = (vehicle, spec) => {
    const specs = {
      year: vehicle.year,
      mileage: `${vehicle.mileage} km`,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      bodyType: vehicle.bodyType,
      engineCapacity: vehicle.engineCapacity,
      color: vehicle.color,
      condition: vehicle.condition,
      price: `Rs. ${vehicle.price.toLocaleString()}`,
    };
    return specs[spec] || 'N/A';
  };

  const specs = [
    { key: 'year', label: 'Year', icon: <CalendarToday /> },
    { key: 'price', label: 'Price', icon: null },
    { key: 'mileage', label: 'Mileage', icon: <Speed /> },
    { key: 'fuelType', label: 'Fuel Type', icon: <LocalGasStation /> },
    { key: 'transmission', label: 'Transmission', icon: <Settings /> },
    { key: 'bodyType', label: 'Body Type', icon: null },
    { key: 'engineCapacity', label: 'Engine Capacity', icon: <DirectionsCar /> },
    { key: 'color', label: 'Color', icon: <ColorLens /> },
    { key: 'condition', label: 'Condition', icon: null },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Compare Vehicles
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Comparison Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Base Vehicle */}
        {baseVehicle && (
          <Grid item xs={12} md={6} lg={baseVehicle && compareVehicles.length === 0 ? 6 : compareVehicles.length === 1 ? 6 : 4}>
            <Paper sx={{ p: 2, border: '2px solid #1976d2' }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1 }}>
                  Base Vehicle
                </Typography>
              </Box>
              <CardMedia
                component="img"
                height="250"
                image={getImageUrl(baseVehicle.images?.[0])}
                alt={`${baseVehicle.brand} ${baseVehicle.model}`}
                sx={{ borderRadius: 1, mb: 2, objectFit: 'cover' }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {baseVehicle.year} {baseVehicle.brand} {baseVehicle.model}
              </Typography>
              {specs.map((spec) => (
                <Box key={spec.key} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {spec.icon && <Box sx={{ color: '#1976d2' }}>{spec.icon}</Box>}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {spec.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {getSpecValue(baseVehicle, spec.key)}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        )}

        {/* Compare Vehicles */}
        {compareVehicles.map((vehicle, index) => (
          <Grid item xs={12} md={6} lg={compareVehicles.length === 1 ? 6 : 4} key={vehicle._id}>
            <Paper sx={{ p: 2, position: 'relative', border: '2px solid #81c784' }}>
              <IconButton
                size="small"
                onClick={() => removeVehicleFromCompare(vehicle._id)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(211, 47, 47, 0.1)',
                  color: '#d32f2f',
                  '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.2)' },
                }}
              >
                <Close fontSize="small" />
              </IconButton>
              <CardMedia
                component="img"
                height="250"
                image={getImageUrl(vehicle.images?.[0])}
                alt={`${vehicle.brand} ${vehicle.model}`}
                sx={{ borderRadius: 1, mb: 2, objectFit: 'cover' }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {vehicle.year} {vehicle.brand} {vehicle.model}
              </Typography>
              {specs.map((spec) => (
                <Box key={spec.key} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {spec.icon && <Box sx={{ color: '#1976d2' }}>{spec.icon}</Box>}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {spec.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {getSpecValue(vehicle, spec.key)}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        ))}

        {/* Add Vehicle Button */}
        {compareVehicles.length < 3 && (
          <Grid item xs={12} md={6} lg={compareVehicles.length === 0 ? 6 : compareVehicles.length === 1 ? 6 : 4}>
            <Paper
              sx={{
                p: 2,
                border: '2px dashed #bdbdbd',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
              }}
            >
              <Add sx={{ fontSize: 48, color: '#9e9e9e', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 500, textAlign: 'center' }}>
                Add vehicle to compare
              </Typography>
              <Typography variant="caption" sx={{ color: '#bdbdbd', textAlign: 'center', mt: 1 }}>
                {compareVehicles.length}/3 vehicles added
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Search and Add Vehicles */}
      {compareVehicles.length < 3 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Select Vehicles to Compare
          </Typography>
          <TextField
            fullWidth
            placeholder="Search by brand, model, or year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => (
                <Card key={vehicle._id} sx={{ cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}>
                  <CardMedia
                    component="img"
                    height="150"
                    image={getImageUrl(vehicle.images?.[0])}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Rs. {vehicle.price.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Chip
                        label={vehicle.fuelType}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={vehicle.transmission}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => addVehicleToCompare(vehicle)}
                      sx={{ mt: 2 }}
                    >
                      Add
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : searchTerm ? (
              <Typography variant="body2" color="textSecondary" sx={{ gridColumn: '1 / -1' }}>
                No vehicles found matching your search.
              </Typography>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ gridColumn: '1 / -1' }}>
                No more vehicles available to compare.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Info Message */}
      {compareVehicles.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Click "Add" on any vehicle to compare it with the base vehicle. You can compare up to 3 vehicles side by side.
        </Alert>
      )}
    </Container>
  );
}
