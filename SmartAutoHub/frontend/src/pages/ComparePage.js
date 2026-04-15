/**
 * Compare Vehicles Page
 * Compare specifications and prices of vehicles
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Autocomplete,
  TextField,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { CompareArrows } from '@mui/icons-material';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import ListImage from '../components/ListImage';

const ComparePage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedCar1, setSelectedCar1] = useState(null);
  const [selectedCar2, setSelectedCar2] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const { data } = await api.get('/vehicles?limit=10000');
      const vehicleList = data.data || [];
      setVehicles(vehicleList);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setVehicles([]);
    }
    setLoadingVehicles(false);
  };

  const vehicleOptions = vehicles.map((v) => ({
    label: `${v.brand} ${v.model} (${v.year})`,
    id: v._id,
    ...v,
  }));

  const handleViewComparison = () => {
    if (!selectedCar1 || !selectedCar2) {
      alert('Please select both vehicles to compare');
      return;
    }
    setShowComparison(true);
  };

  const ComparisonTable = ({ car1, car2 }) => {
    const specs = [
      { label: 'Brand', key: 'brand' },
      { label: 'Model', key: 'model' },
      { label: 'Year', key: 'year' },
      { label: 'Price (LKR)', key: 'price', format: (v) => (v ? `${v.toLocaleString('en-LK')}` : 'N/A') },
      { label: 'Mileage (km)', key: 'mileage', format: (v) => (v ? v.toLocaleString() : 'N/A') },
      { label: 'Fuel Type', key: 'fuelType' },
      { label: 'Transmission', key: 'transmission' },
      { label: 'Condition', key: 'condition' },
      { label: 'Body Type', key: 'bodyType' },
    ];

    return (
      <TableContainer component={Card} sx={{ mb: 4 }}>
        <Table>
          <TableBody>
            {specs.map((spec) => (
              <TableRow key={spec.key}>
                <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>
                  {spec.label}
                </TableCell>
                <TableCell sx={{ width: '35%', bgcolor: '#f9f9f9' }}>
                  {spec.format ? spec.format(car1[spec.key]) : car1[spec.key] || 'N/A'}
                </TableCell>
                <TableCell sx={{ width: '35%' }}>
                  {spec.format ? spec.format(car2[spec.key]) : car2[spec.key] || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center', bgcolor: '#b8b7b7', py: 4, borderRadius: 2 }}>
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 2, color: '#040404' }}>
            COMPARE VEHICLES
          </Typography>
          <Typography variant="body1" color="#050505">
            Compare specifications and prices of your favorite vehicles
          </Typography>
        </Box>

        {!showComparison ? (
          <>
            {/* Selection Section */}
            <Card sx={{ mb: 6, p: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Car 1 Selection */}
                  <Grid item xs={12} md={5}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                      Select Car 1
                    </Typography>
                    <Autocomplete
                      options={vehicleOptions}
                      getOptionLabel={(option) => option.label || ''}
                      value={selectedCar1}
                      onChange={(event, newValue) => setSelectedCar1(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Please enter 2 or more characters"
                          fullWidth
                          size="small"
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box
                          component="li"
                          {...props}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 1,
                            '&:hover': {
                              bgcolor: '#f0f0f0',
                            },
                          }}
                        >
                          <ListImage
                            src={getImageUrl(option.images?.[0])}
                            alt={`${option.brand} ${option.model}`}
                            sx={{
                              height: 60,
                              width: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {option.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              LKR {option.price?.toLocaleString('en-LK')}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      loading={loadingVehicles}
                      filterOptions={(options, { inputValue }) => {
                        if (inputValue.length < 2) return [];
                        return options.filter((option) =>
                          option.label.toLowerCase().includes(inputValue.toLowerCase())
                        );
                      }}
                      noOptionsText="Type at least 2 Letters"
                    />
                  </Grid>

                  {/* VS Badge */}
                  <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        bgcolor: '#e0160f',
                        color: 'white',
                        py: 2,
                        px: 2,
                        borderRadius: 1,
                        display: 'inline-block',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                      }}
                    >
                      VS
                    </Box>
                  </Grid>

                  {/* Car 2 Selection */}
                  <Grid item xs={12} md={5}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                      Select Car 2
                    </Typography>
                    <Autocomplete
                      options={vehicleOptions}
                      getOptionLabel={(option) => option.label || ''}
                      value={selectedCar2}
                      onChange={(event, newValue) => setSelectedCar2(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Please enter 2 or more Letters"
                          fullWidth
                          size="small"
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box
                          component="li"
                          {...props}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 1,
                            '&:hover': {
                              bgcolor: '#f0f0f0',
                            },
                          }}
                        >
                          <ListImage
                            src={getImageUrl(option.images?.[0])}
                            alt={`${option.brand} ${option.model}`}
                            sx={{
                              height: 60,
                              width: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {option.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              LKR {option.price?.toLocaleString('en-LK')}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      loading={loadingVehicles}
                      filterOptions={(options, { inputValue }) => {
                        if (inputValue.length < 2) return [];
                        return options.filter((option) =>
                          option.label.toLowerCase().includes(inputValue.toLowerCase())
                        );
                      }}
                      noOptionsText="Type at least 2 characters"
                    />
                  </Grid>
                </Grid>

                {/* View Comparison Button */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<CompareArrows />}
                    onClick={handleViewComparison}
                    disabled={loadingVehicles}
                    sx={{
                      bgcolor: '#080808',
                      color: 'white',
                      px: 4,
                      py: 1.2,
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: '#777',
                      },
                      '&:disabled': {
                        bgcolor: '#ccc',
                      },
                    }}
                  >
                    View Comparison
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Latest Reviewed Models */}
            {vehicles.length > 0 && (
              <Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: '#b8b7b7',
                    color: 'black',
                    borderRadius: '4px 4px 0 0',
                  }}
                >
                  COMPARE LATEST REVIEWED MODELS
                </Typography>

                <Grid container spacing={2}>
                  {vehicles.slice(0, 4).map((vehicle, index) => (
                    <Grid item xs={12} md={6} key={vehicle._id}>
                      <Card
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          border: '1px solid #e0e0e0',
                          '&:hover': {
                            boxShadow: 2,
                            bgcolor: '#f9f9f9',
                          },
                        }}
                        onClick={() => {
                          setSelectedCar1({
                            label: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
                            id: vehicle._id,
                            ...vehicle,
                          });
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'primary.main',
                            fontWeight: 600,
                          }}
                        >
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </>
        ) : (
          <>
            {/* Comparison View */}
            <Button
              variant="outlined"
              onClick={() => setShowComparison(false)}
              sx={{ mb: 4 }}
            >
              ← Back to Selection
            </Button>

            {/* Car Images */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <ListImage
                    src={getImageUrl(selectedCar1.images?.[0])}
                    alt={`${selectedCar1.brand} ${selectedCar1.model}`}
                    sx={{
                      height: 300,
                      width: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedCar1.brand} {selectedCar1.model}
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                      LKR {selectedCar1.price?.toLocaleString('en-LK')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <ListImage
                    src={getImageUrl(selectedCar2.images?.[0])}
                    alt={`${selectedCar2.brand} ${selectedCar2.model}`}
                    sx={{
                      height: 300,
                      width: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedCar2.brand} {selectedCar2.model}
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                      LKR {selectedCar2.price?.toLocaleString('en-LK')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Comparison Table */}
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, mt: 4 }}>
              Detailed Comparison
            </Typography>
            <ComparisonTable car1={selectedCar1} car2={selectedCar2} />

            {/* Key Differences Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: '#000',
                  color: 'white',
                  borderRadius: '4px',
                }}
              >
                KEY DIFFERENCES
              </Typography>

              <Grid container spacing={2}>
                {/* Price Difference */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Price Difference
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      LKR {Math.abs(selectedCar1.price - selectedCar2.price).toLocaleString('en-LK')}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: selectedCar1.price > selectedCar2.price ? '#d32f2f' : '#2e7d32',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      {(Math.abs(selectedCar1.price - selectedCar2.price) / Math.max(selectedCar1.price, selectedCar2.price) * 100).toFixed(1)}% difference
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedCar1.price > selectedCar2.price ? 'Car 2 is cheaper' : 'Car 1 is cheaper'}
                    </Typography>
                  </Card>
                </Grid>

                {/* Year Difference */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Year Difference
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      {Math.abs(selectedCar1.year - selectedCar2.year)} years
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedCar1.year > selectedCar2.year ? 'Car 2 is older' : 'Car 1 is older'}
                    </Typography>
                  </Card>
                </Grid>

                {/* Mileage Difference */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Mileage Difference
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      {Math.abs((selectedCar1.mileage || 0) - (selectedCar2.mileage || 0)).toLocaleString()} km
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedCar1.mileage > selectedCar2.mileage ? 'Car 1 has higher mileage' : 'Car 2 has higher mileage'}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Recommended Vehicle Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: '#000',
                  color: 'white',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              >
                RECOMMENDED VEHICLE
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {/* Best Choice Card */}
                  <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#2e7d32' }}>
                      ✓ BEST CHOICE
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                      {selectedCar1.price < selectedCar2.price ? selectedCar1.brand : selectedCar2.brand}{' '}
                      {selectedCar1.price < selectedCar2.price ? selectedCar1.model : selectedCar2.model}
                    </Typography>
                    <ListImage
                      src={getImageUrl(
                        (selectedCar1.price < selectedCar2.price ? selectedCar1 : selectedCar2).images?.[0]
                      )}
                      alt="Recommended vehicle"
                      sx={{
                        height: 250,
                        width: '100%',
                        objectFit: 'cover',
                        borderRadius: 1,
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      color="primary"
                      fontWeight="bold"
                    >
                      LKR{' '}
                      {(selectedCar1.price < selectedCar2.price
                        ? selectedCar1.price
                        : selectedCar2.price
                      ).toLocaleString('en-LK')}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  {/* Why This Vehicle Card */}
                  <Card sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      Why This Vehicle?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Based on your comparison, this vehicle scores better overall considering:
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedCar1.price < selectedCar2.price && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>✓</Typography>
                          <Typography variant="body2">
                            Better pricing at LKR{' '}
                            {Math.abs(selectedCar1.price - selectedCar2.price).toLocaleString('en-LK')} cheaper
                          </Typography>
                        </Box>
                      )}
                      {selectedCar2.price < selectedCar1.price && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>✓</Typography>
                          <Typography variant="body2">
                            Better pricing at LKR{' '}
                            {Math.abs(selectedCar1.price - selectedCar2.price).toLocaleString('en-LK')} cheaper
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>✓</Typography>
                        <Typography variant="body2">
                          {selectedCar1.year > selectedCar2.year && selectedCar1.price < selectedCar2.price
                            ? 'Newer model with better value'
                            : selectedCar2.year > selectedCar1.year && selectedCar2.price < selectedCar1.price
                            ? 'Newer model with better value'
                            : 'Reliable choice for your needs'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>✓</Typography>
                        <Typography variant="body2">
                          {selectedCar1.mileage < selectedCar2.mileage && selectedCar1.price < selectedCar2.price
                            ? 'Lower mileage at lower cost'
                            : selectedCar2.mileage < selectedCar1.mileage && selectedCar2.price < selectedCar1.price
                            ? 'Lower mileage at lower cost'
                            : 'Good overall specifications'}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default ComparePage;
