/**
 * Vehicle Comparison Page
 * Compare multiple vehicles side by side with suggestions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Autocomplete,
  Link,
  Card,
  CardContent,
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
  CompareArrows,
  Search,
} from '@mui/icons-material';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

export default function ComparisonPage() {
  const navigate = useNavigate();

  const [vehicle1, setVehicle1] = useState(null);
  const [vehicle2, setVehicle2] = useState(null);
  const [allVehicles, setAllVehicles] = useState([]);
  const [compareVehicles, setCompareVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [inputValue1, setInputValue1] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/vehicles?limit=100');
        
        let vehicles = [];
        if (response.data?.data) {
          vehicles = response.data.data;
        } else if (Array.isArray(response.data)) {
          vehicles = response.data;
        }
        
        if (Array.isArray(vehicles) && vehicles.length > 0) {
          setAllVehicles(vehicles);
          setAvailableVehicles(vehicles);
        } else {
          setError('No vehicles available to compare');
          setAllVehicles([]);
          setAvailableVehicles([]);
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError('Failed to load vehicles. Please refresh the page.');
        setAllVehicles([]);
        setAvailableVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Get vehicle option label with price
  const getVehicleOptionLabel = (vehicle) => {
    if (!vehicle) return '';
    return `${vehicle.year} ${vehicle.brand} ${vehicle.model} - Rs. ${vehicle.price?.toLocaleString() || 'N/A'}`;
  };

  // Filter vehicles for autocomplete
  const getFilteredVehicles = (search) => {
    if (!search) {
      return availableVehicles.slice(0, 20);
    }
    const searchLower = search.toLowerCase();
    return availableVehicles.filter((v) =>
      v.brand?.toLowerCase().includes(searchLower) ||
      v.model?.toLowerCase().includes(searchLower) ||
      v.year?.toString().includes(searchLower)
    ).slice(0, 20);
  };

  const removeVehicleFromCompare = (vehicleId) => {
    setCompareVehicles(compareVehicles.filter((v) => v._id !== vehicleId));
  };

  const addThirdVehicle = (vehicle) => {
    if (compareVehicles.length < 3) {
      setCompareVehicles([...compareVehicles, vehicle]);
      setShowAddVehicleModal(false);
      setSearchQuery('');
    }
  };

  const handleViewComparison = () => {
    if (vehicle1 && vehicle2) {
      setCompareVehicles([vehicle1, vehicle2]);
      setShowComparisonView(true);
    }
  };

  const getSpecValue = (vehicle, spec) => {
    const specs = {
      year: vehicle.year,
      mileage: `${vehicle.mileage || 0} km`,
      fuelType: vehicle.fuelType || 'N/A',
      transmission: vehicle.transmission || 'N/A',
      bodyType: vehicle.bodyType || 'N/A',
      engineCapacity: vehicle.engineCapacity || 'N/A',
      color: vehicle.color || 'N/A',
      condition: vehicle.condition || 'N/A',
      price: `Rs. ${vehicle.price?.toLocaleString() || 'N/A'}`,
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

  // Calculate differences between vehicles
  const getKeyDifferences = () => {
    if (compareVehicles.length < 2) return [];

    const v1 = compareVehicles[0];
    const v2 = compareVehicles[1];
    const v3 = compareVehicles[2];
    const differences = [];

    // Price difference
    if (v1.price && v2.price) {
      const priceDiff = Math.abs(v1.price - v2.price);
      const pricePercentage = ((priceDiff / Math.min(v1.price, v2.price)) * 100).toFixed(1);
      let description = v1.price < v2.price ? 'Car 1 is cheaper' : 'Car 2 is cheaper';
      if (v3 && v3.price) {
        const minPrice = Math.min(v1.price, v2.price, v3.price);
        const maxPrice = Math.max(v1.price, v2.price, v3.price);
        const priceDiffAll = maxPrice - minPrice;
        const percentageAll = ((priceDiffAll / minPrice) * 100).toFixed(1);
        description = `Price range: Rs. ${priceDiffAll.toLocaleString()} (${percentageAll}% difference)`;
      }
      differences.push({
        title: 'Price Difference',
        value: `Rs. ${priceDiff.toLocaleString()}`,
        percentage: pricePercentage + '%',
        description: description,
        icon: '💰',
      });
    }

    // Year difference
    if (v1.year && v2.year) {
      const yearDiff = Math.abs(v1.year - v2.year);
      let description = v1.year > v2.year ? 'Car 1 is newer' : 'Car 2 is newer';
      if (v3 && v3.year) {
        const minYear = Math.min(v1.year, v2.year, v3.year);
        const maxYear = Math.max(v1.year, v2.year, v3.year);
        const yearDiffAll = maxYear - minYear;
        description = `Year range: ${yearDiffAll} year(s) (${minYear}-${maxYear})`;
      }
      differences.push({
        title: 'Year Difference',
        value: yearDiff + ' year' + (yearDiff !== 1 ? 's' : ''),
        description: description,
        icon: '📅',
      });
    }

    // Mileage difference
    if (v1.mileage !== undefined && v2.mileage !== undefined) {
      const mileageDiff = Math.abs(v1.mileage - v2.mileage);
      let description = v1.mileage < v2.mileage ? 'Car 1 has lower mileage' : 'Car 2 has lower mileage';
      if (v3 && v3.mileage !== undefined) {
        const minMileage = Math.min(v1.mileage, v2.mileage, v3.mileage);
        const maxMileage = Math.max(v1.mileage, v2.mileage, v3.mileage);
        const mileageDiffAll = maxMileage - minMileage;
        description = `Mileage range: ${mileageDiffAll.toLocaleString()} km (${minMileage.toLocaleString()}-${maxMileage.toLocaleString()} km)`;
      }
      differences.push({
        title: 'Mileage Difference',
        value: mileageDiff.toLocaleString() + ' km',
        description: description,
        icon: '🛣️',
      });
    }

    // Fuel type difference
    if (v1.fuelType !== v2.fuelType || (v3 && v3.fuelType && (v3.fuelType !== v1.fuelType || v3.fuelType !== v2.fuelType))) {
      const fuelTypes = [v1.fuelType];
      if (v2.fuelType && !fuelTypes.includes(v2.fuelType)) fuelTypes.push(v2.fuelType);
      if (v3 && v3.fuelType && !fuelTypes.includes(v3.fuelType)) fuelTypes.push(v3.fuelType);
      differences.push({
        title: 'Fuel Type Difference',
        value: fuelTypes.join(' vs '),
        description: 'Different fuel types',
        icon: '⛽',
      });
    }

    // Transmission type difference
    if (v1.transmission !== v2.transmission || (v3 && v3.transmission && (v3.transmission !== v1.transmission || v3.transmission !== v2.transmission))) {
      const transmissions = [v1.transmission];
      if (v2.transmission && !transmissions.includes(v2.transmission)) transmissions.push(v2.transmission);
      if (v3 && v3.transmission && !transmissions.includes(v3.transmission)) transmissions.push(v3.transmission);
      differences.push({
        title: 'Transmission Difference',
        value: transmissions.join(' vs '),
        description: 'Different transmission types',
        icon: '⚙️',
      });
    }

    // Condition difference
    if (v1.condition && v2.condition && v1.condition !== v2.condition) {
      const conditions = [v1.condition];
      if (!conditions.includes(v2.condition)) conditions.push(v2.condition);
      if (v3 && v3.condition && !conditions.includes(v3.condition)) conditions.push(v3.condition);
      differences.push({
        title: 'Condition Difference',
        value: conditions.join(' vs '),
        description: 'Different conditions',
        icon: '🔧',
      });
    }

    return differences;
  };

  // Get best vehicle recommendation based on differences
  const getBestVehicleRecommendation = () => {
    if (compareVehicles.length < 2) return null;

    let scores = { car1: 0, car2: 0, car3: 0 };
    const v1 = compareVehicles[0];
    const v2 = compareVehicles[1];
    const v3 = compareVehicles[2];

    // Price scoring: Lower price is better (but not too low)
    if (v1.price && v2.price) {
      if (v1.price < v2.price) {
        scores.car1 += 2;
      } else {
        scores.car2 += 2;
      }
      if (v3 && v3.price) {
        const minPrice = Math.min(v1.price, v2.price, v3.price);
        if (minPrice === v1.price) scores.car1 += 2;
        else if (minPrice === v2.price) scores.car2 += 2;
        else scores.car3 += 2;
      }
    }

    // Year/Age scoring: Newer is better
    if (v1.year && v2.year) {
      if (v1.year > v2.year) {
        scores.car1 += 3;
      } else {
        scores.car2 += 3;
      }
      if (v3 && v3.year) {
        const maxYear = Math.max(v1.year, v2.year, v3.year);
        if (maxYear === v1.year) scores.car1 += 3;
        else if (maxYear === v2.year) scores.car2 += 3;
        else scores.car3 += 3;
      }
    }

    // Mileage scoring: Lower mileage is better
    if (v1.mileage !== undefined && v2.mileage !== undefined) {
      if (v1.mileage < v2.mileage) {
        scores.car1 += 3;
      } else {
        scores.car2 += 3;
      }
      if (v3 && v3.mileage !== undefined) {
        const minMileage = Math.min(v1.mileage, v2.mileage, v3.mileage);
        if (minMileage === v1.mileage) scores.car1 += 3;
        else if (minMileage === v2.mileage) scores.car2 += 3;
        else scores.car3 += 3;
      }
    }

    // Condition scoring: Better condition is preferred
    if (v1.condition && v2.condition) {
      const conditionRank = { 'new': 3, 'excellent': 3, 'good': 2, 'fair': 1, 'used': 1 };
      const v1Score = conditionRank[v1.condition.toLowerCase()] || 1;
      const v2Score = conditionRank[v2.condition.toLowerCase()] || 1;
      scores.car1 += v1Score;
      scores.car2 += v2Score;
      if (v3 && v3.condition) {
        const v3Score = conditionRank[v3.condition.toLowerCase()] || 1;
        scores.car3 += v3Score;
      }
    }

    // Engine capacity: Higher is better (more powerful)
    if (v1.engineCapacity && v2.engineCapacity) {
      if (v1.engineCapacity > v2.engineCapacity) {
        scores.car1 += 1;
      } else {
        scores.car2 += 1;
      }
      if (v3 && v3.engineCapacity) {
        const maxEngine = Math.max(v1.engineCapacity, v2.engineCapacity, v3.engineCapacity);
        if (maxEngine === v1.engineCapacity) scores.car1 += 1;
        else if (maxEngine === v2.engineCapacity) scores.car2 += 1;
        else scores.car3 += 1;
      }
    }

    // Determine best car
    let bestCarIndex = 0;
    let maxScore = scores.car1;
    if (scores.car2 > maxScore) {
      bestCarIndex = 1;
      maxScore = scores.car2;
    }
    if (scores.car3 && scores.car3 > maxScore) {
      bestCarIndex = 2;
      maxScore = scores.car3;
    }

    return {
      bestCar: bestCarIndex,
      scores: scores,
      car1: v1,
      car2: v2,
      car3: v3,
    };
  };

  // Generate comparison suggestions
  const getComparisonSuggestions = () => {
    if (allVehicles.length < 2) return { latest: [], popular: [] };
    
    const latestReviewed = allVehicles
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 4);

    const popular = allVehicles
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 4);

    return {
      latest: latestReviewed,
      popular: popular,
    };
  };

  const suggestions = getComparisonSuggestions();

  const handleQuickCompare = (veh1, veh2) => {
    setVehicle1(veh1);
    setVehicle2(veh2);
    setCompareVehicles([veh1, veh2]);
    setShowComparisonView(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Comparison View
  if (showComparisonView && compareVehicles.length > 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => {
            setShowComparisonView(false);
            setCompareVehicles([]);
          }}
          sx={{ mb: 3 }}
        >
          Back to Selection
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
          Compare Vehicles
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {compareVehicles.map((vehicle) => (
            <Grid item xs={12} md={6} lg={compareVehicles.length === 2 ? 6 : 4} key={vehicle._id}>
              <Paper sx={{ p: 2, position: 'relative', border: '2px solid #9e9e9e' }}>
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
                {vehicle.images?.[0] && (
                  <Box
                    sx={{
                      borderRadius: 1,
                      mb: 2,
                      overflow: 'hidden',
                      height: 250,
                      width: '100%',
                      backgroundColor: '#f0f0f0',
                    }}
                  >
                    <img
                      src={getImageUrl(vehicle.images[0])}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                )}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {vehicle.year} {vehicle.brand} {vehicle.model}
                </Typography>
                {specs.map((spec) => (
                  <Box key={spec.key} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {spec.icon && <Box sx={{ color: '#9e9e9e' }}>{spec.icon}</Box>}
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

          {compareVehicles.length < 3 && (
            <Grid item xs={12} md={6} lg={4}>
              <Paper
                sx={{
                  p: 2,
                  border: '2px dashed #bdbdbd',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '400px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#9e9e9e',
                    bgcolor: 'rgba(158, 158, 158, 0.02)',
                  },
                }}
                onClick={() => setShowAddVehicleModal(true)}
              >
                <Add sx={{ fontSize: 48, color: '#9e9e9e', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 500, textAlign: 'center' }}>
                  Add vehicle to compare
                </Typography>
                <Typography variant="caption" sx={{ color: '#bdbdbd', textAlign: 'center', mt: 1 }}>
                  {compareVehicles.length}/3 vehicles compared
                </Typography>
              </Paper>

              {/* Add Vehicle Modal */}
              {showAddVehicleModal && (
                <Paper
                  sx={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1300,
                    p: 4,
                    maxWidth: 500,
                    width: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow: '0 5px 40px rgba(0,0,0,0.3)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Add Third Vehicle
                    </Typography>
                    <IconButton
                      onClick={() => {
                        setShowAddVehicleModal(false);
                        setSearchQuery('');
                      }}
                      size="small"
                    >
                      <Close />
                    </IconButton>
                  </Box>

                  <TextField
                    fullWidth
                    placeholder="Search by brand, model, or year..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '400px', overflowY: 'auto' }}>
                    {getFilteredVehicles(searchQuery).map((vehicle) => {
                      // Filter out already selected vehicles
                      if (compareVehicles.some((v) => v._id === vehicle._id)) {
                        return null;
                      }
                      return (
                        <Card
                          key={vehicle._id}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: 3,
                              transform: 'translateY(-2px)',
                              bgcolor: '#f5f5f5',
                            },
                          }}
                          onClick={() => addThirdVehicle(vehicle)}
                        >
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            {vehicle.images?.[0] && (
                              <Box
                                sx={{
                                  width: 80,
                                  height: 80,
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  backgroundColor: '#f0f0f0',
                                }}
                              >
                                <img
                                  src={getImageUrl(vehicle.images[0])}
                                  alt={vehicle.model}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </Box>
                            )}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {vehicle.year} {vehicle.brand} {vehicle.model}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#9e9e9e', mt: 0.5 }}>
                                Rs. {vehicle.price?.toLocaleString() || 'N/A'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Typography variant="caption" sx={{ bgcolor: '#e0e0e0', px: 1, py: 0.5, borderRadius: 0.5 }}>
                                  {vehicle.fuelType}
                                </Typography>
                                <Typography variant="caption" sx={{ bgcolor: '#e0e0e0', px: 1, py: 0.5, borderRadius: 0.5 }}>
                                  {vehicle.transmission}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>

                  {getFilteredVehicles(searchQuery).filter((v) => !compareVehicles.some((cv) => cv._id === v._id)).length === 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>
                      {searchQuery ? 'No vehicles found' : 'No more vehicles available'}
                    </Typography>
                  )}
                </Paper>
              )}

              {/* Backdrop */}
              {showAddVehicleModal && (
                <Box
                  sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1200,
                  }}
                  onClick={() => {
                    setShowAddVehicleModal(false);
                    setSearchQuery('');
                  }}
                />
              )}
            </Grid>
          )}
        </Grid>

        {/* Key Differences Section - Below Vehicle Comparison */}
        {compareVehicles.length >= 2 && getKeyDifferences().length > 0 && (
          <Paper sx={{ p: { xs: 3, md: 4 }, mb: 6, borderRadius: 2, boxShadow: 2, bgcolor: '#bdbdbd', border: '2px solid #757575' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#424242', display: 'flex', alignItems: 'center', gap: 1 }}>
              KEY DIFFERENCES
            </Typography>
            <Grid container spacing={2}>
              {getKeyDifferences().map((diff, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper sx={{ p: 2, bgcolor: 'white', border: '1px solid #9e9e9e', borderRadius: 1 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>
                        {diff.title}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#9e9e9e', mb: 1 }}>
                      {diff.value}
                    </Typography>
                    {diff.percentage && (
                      <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 600, mb: 1 }}>
                        {diff.percentage} difference
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {diff.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Best Vehicle Recommendation Section */}
        {compareVehicles.length >= 2 && getBestVehicleRecommendation() && (
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: '#bdbdbd', border: '3px solid #757575' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#424242', textAlign: 'center' }}>
              RECOMMENDED VEHICLE
            </Typography>
            
            {(() => {
              const recommendation = getBestVehicleRecommendation();
              const bestVehicle = recommendation.bestCar === 0 ? recommendation.car1 : (recommendation.bestCar === 1 ? recommendation.car2 : recommendation.car3);
              const otherVehicles = compareVehicles.filter((v, idx) => idx !== recommendation.bestCar);
              
              return (
                <Grid container spacing={3} alignItems="center">
                  {/* Best Vehicle Card */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, bgcolor: '#fff', border: '3px solid #9e9e9e', borderRadius: 2 }}>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#424242', fontWeight: 700, mb: 1 }}>
                          ✓ BEST CHOICE
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 2 }}>
                          {bestVehicle.year} {bestVehicle.brand} {bestVehicle.model}
                        </Typography>
                      </Box>
                      {bestVehicle.images?.[0] && (
                        <Box
                          sx={{
                            width: '100%',
                            height: '250px',
                            borderRadius: 1,
                            overflow: 'hidden',
                            mb: 2,
                            backgroundColor: '#f0f0f0',
                          }}
                        >
                          <img
                            src={getImageUrl(bestVehicle.images[0])}
                            alt={bestVehicle.model}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      )}
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: '#e8e8e8', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#555' }}>
                              Price
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#424242', mt: 0.5 }}>
                              Rs. {bestVehicle.price?.toLocaleString() || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: '#e8e8e8', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#555' }}>
                              Year
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#424242', mt: 0.5 }}>
                              {bestVehicle.year}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: '#e8e8e8', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#555' }}>
                              Mileage
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#424242', mt: 0.5 }}>
                              {bestVehicle.mileage?.toLocaleString() || 'N/A'} km
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: '#e8e8e8', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#555' }}>
                              Condition
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#424242', mt: 0.5 }}>
                              {bestVehicle.condition || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Comparison Details */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, bgcolor: '#fff', borderRadius: 2, border: '3px solid #9e9e9e' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#424242' }}>
                        Why This Vehicle?
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                          Based on your comparison, this vehicle scores better overall considering:
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {bestVehicle.price && otherVehicles[0]?.price && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <Typography sx={{ color: '#9e9e9e', fontWeight: 700, minWidth: '20px' }}>✓</Typography>
                              <Typography variant="body2" sx={{ color: '#555' }}>
                                {bestVehicle.price < otherVehicles[0].price 
                                  ? `Most affordable - Rs. ${(otherVehicles[0].price - bestVehicle.price).toLocaleString()} cheaper`
                                  : `Best value for the price at Rs. ${bestVehicle.price?.toLocaleString()}`
                                }
                              </Typography>
                            </Box>
                          )}
                          
                          {bestVehicle.year && otherVehicles[0]?.year && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <Typography sx={{ color: '#9e9e9e', fontWeight: 700, minWidth: '20px' }}>✓</Typography>
                              <Typography variant="body2" sx={{ color: '#555' }}>
                                {bestVehicle.year > otherVehicles[0].year 
                                  ? `Newer model - ${bestVehicle.year - otherVehicles[0].year} year(s) newer`
                                  : `Well-maintained model from ${bestVehicle.year}`
                                }
                              </Typography>
                            </Box>
                          )}
                          
                          {bestVehicle.mileage !== undefined && otherVehicles[0]?.mileage !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <Typography sx={{ color: '#9e9e9e', fontWeight: 700, minWidth: '20px' }}>✓</Typography>
                              <Typography variant="body2" sx={{ color: '#555' }}>
                                {bestVehicle.mileage < otherVehicles[0].mileage
                                  ? `Lower mileage - ${(otherVehicles[0].mileage - bestVehicle.mileage).toLocaleString()} km less`
                                  : `Good overall mileage at ${bestVehicle.mileage?.toLocaleString()} km`
                                }
                              </Typography>
                            </Box>
                          )}
                          
                          {bestVehicle.condition && otherVehicles[0]?.condition && bestVehicle.condition !== otherVehicles[0].condition && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <Typography sx={{ color: '#9e9e9e', fontWeight: 700, minWidth: '20px' }}>✓</Typography>
                              <Typography variant="body2" sx={{ color: '#555' }}>
                                Better condition - {bestVehicle.condition}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      <Button
                        variant="contained"
                        sx={{ bgcolor: '#9e9e9e', color: 'white', fontWeight: 700, width: '100%', py: 1.5 }}
                      >
                        View Details
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              );
            })()}
          </Paper>
        )}
      </Container>
    );
  }

  // Main Selection View
  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ bgcolor: '#bdbdbd', color: '#424242', p: 4, borderRadius: 1, mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            COMPARE VEHICLES
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.95 }}>
            Compare specifications and prices of your favorite vehicles
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Paper sx={{ p: { xs: 3, md: 4 }, mb: 6, borderRadius: 2, boxShadow: 2 }}>
          <Grid container spacing={4} alignItems="flex-end">
            <Grid item xs={12} md={5}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Select Car 1
              </Typography>
              {availableVehicles.length > 0 ? (
                <Autocomplete
                  options={availableVehicles}
                  getOptionLabel={getVehicleOptionLabel}
                  value={vehicle1}
                  inputValue={inputValue1}
                  onInputChange={(event, value) => setInputValue1(value)}
                  onChange={(event, newValue) => setVehicle1(newValue)}
                  filterOptions={(options, state) => getFilteredVehicles(state.inputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Please enter 2 or more characters"
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      key={option._id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1,
                      }}
                    >
                      {option.images?.[0] && (
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1,
                            overflow: 'hidden',
                            flexShrink: 0,
                            backgroundColor: '#f0f0f0',
                          }}
                        >
                          <img
                            src={getImageUrl(option.images[0])}
                            alt={option.model}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.year} {option.brand} {option.model}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Rs. {option.price?.toLocaleString() || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              ) : (
                <TextField fullWidth disabled placeholder="No vehicles available" />
              )}
            </Grid>

            <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  bgcolor: '#9e9e9e',
                  color: 'white',
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  fontWeight: 600,
                  textAlign: 'center',
                  display: 'inline-block',
                }}
              >
                VS
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Select Car 2
              </Typography>
              {availableVehicles.length > 0 ? (
                <Autocomplete
                  options={availableVehicles}
                  getOptionLabel={getVehicleOptionLabel}
                  value={vehicle2}
                  inputValue={inputValue2}
                  onInputChange={(event, value) => setInputValue2(value)}
                  onChange={(event, newValue) => setVehicle2(newValue)}
                  filterOptions={(options, state) => getFilteredVehicles(state.inputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Please enter 2 or more characters"
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      key={option._id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1,
                      }}
                    >
                      {option.images?.[0] && (
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1,
                            overflow: 'hidden',
                            flexShrink: 0,
                            backgroundColor: '#f0f0f0',
                          }}
                        >
                          <img
                            src={getImageUrl(option.images[0])}
                            alt={option.model}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.year} {option.brand} {option.model}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Rs. {option.price?.toLocaleString() || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              ) : (
                <TextField fullWidth disabled placeholder="No vehicles available" />
              )}
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CompareArrows />}
              onClick={handleViewComparison}
              disabled={!vehicle1 || !vehicle2}
              sx={{
                bgcolor: '#9e9e9e',
                px: 6,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#757575',
                },
                '&:disabled': {
                  bgcolor: '#ccc',
                  color: '#999',
                },
              }}
            >
              View Comparison
            </Button>
          </Box>
        </Paper>

        {suggestions.latest.length > 1 && (
          <Paper sx={{ p: { xs: 3, md: 4 }, mb: 6, borderRadius: 2, boxShadow: 1 }}>
            <Box
              sx={{
                bgcolor: '#9e9e9e',
                color: 'white',
                p: 2,
                mb: 3,
                borderRadius: 1,
                fontWeight: 600,
              }}
            >
              COMPARE LATEST REVIEWED MODELS
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {suggestions.latest.map((vehicle, idx) => {
                if (idx >= 3) return null;
                const otherVehicle = suggestions.latest[(idx + 1) % suggestions.latest.length];
                if (idx % 2 === 1 || vehicle._id === otherVehicle._id) return null;

                return (
                  <Box key={`compare-${vehicle._id}-${otherVehicle._id}`}>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={(e) => {
                        e.preventDefault();
                        handleQuickCompare(vehicle, otherVehicle);
                      }}
                      sx={{
                        color: '#9e9e9e',
                        textDecoration: 'none',
                        fontWeight: 500,
                        textAlign: 'left',
                        display: 'block',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {vehicle.year} {vehicle.brand} {vehicle.model} vs {otherVehicle.year} {otherVehicle.brand} {otherVehicle.model}
                    </Link>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        {suggestions.popular.length > 1 && (
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, boxShadow: 1 }}>
            <Box
              sx={{
                bgcolor: '#9e9e9e',
                color: 'white',
                p: 2,
                mb: 3,
                borderRadius: 1,
                fontWeight: 600,
              }}
            >
              COMPARE MORE POPULAR MODELS
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {suggestions.popular.map((vehicle, idx) => {
                if (idx >= 3) return null;
                const otherVehicle = suggestions.popular[(idx + 1) % suggestions.popular.length];
                if (idx % 2 === 1 || vehicle._id === otherVehicle._id) return null;

                return (
                  <Box key={`popular-${vehicle._id}-${otherVehicle._id}`}>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={(e) => {
                        e.preventDefault();
                        handleQuickCompare(vehicle, otherVehicle);
                      }}
                      sx={{
                        color: '#9e9e9e',
                        textDecoration: 'none',
                        fontWeight: 500,
                        textAlign: 'left',
                        display: 'block',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {vehicle.year} {vehicle.brand} {vehicle.model} vs {otherVehicle.year} {otherVehicle.brand} {otherVehicle.model}
                    </Link>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        {availableVehicles.length === 0 && !loading && (
          <Alert severity="info">
            No vehicles available to compare. Please check back later or add vehicles to the system.
          </Alert>
        )}
      </Container>
    </Box>
  );
}
