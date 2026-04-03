import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  DirectionsCar,
  ArrowBack,
  CalendarToday,
  Speed,
} from '@mui/icons-material';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import ListImage from '../components/ListImage';

const PremiumPostsPage = () => {
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);

  // Fetch all featured/boosted vehicles
  useEffect(() => {
    const fetchFeaturedVehicles = async () => {
      setLoadingFeatured(true);
      try {
        console.log('🎯 Fetching all featured vehicles...');
        const response = await api.get('/vehicles/featured/active?limit=100');
        console.log('📊 Featured vehicles response:', response.data);
        const vehicles = response.data.data || [];
        console.log(`✅ Fetched ${vehicles.length} featured vehicles`);
        setFeaturedVehicles(vehicles);
      } catch (err) {
        console.error('❌ Failed to fetch featured vehicles:', err);
        setFeaturedVehicles([]);
      }
      setLoadingFeatured(false);
    };

    fetchFeaturedVehicles();
  }, []);

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              component={Link}
              to="/"
              startIcon={<ArrowBack />}
              sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Back
            </Button>
          </Box>
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
            Premium Posts
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Browse all featured vehicles with maximum visibility
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Box sx={{ bgcolor: '#f5f5f5', py: 8, minHeight: '100vh' }}>
        <Container maxWidth="lg">
          {loadingFeatured ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress size={60} />
            </Box>
          ) : featuredVehicles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                No premium posts available at the moment
              </Typography>
              <Button
                component={Link}
                to="/"
                variant="contained"
              >
                Back to Home
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Showing {featuredVehicles.length} featured vehicle{featuredVehicles.length !== 1 ? 's' : ''}
              </Typography>

              <Grid container spacing={3}>
                {featuredVehicles.map((vehicle) => (
                  <Grid 
                    item 
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={vehicle._id}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 24px rgba(25,118,210,0.2)',
                        },
                        position: 'relative',
                      }}
                    >
                      {/* Vehicle Image */}
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <ListImage
                          src={getImageUrl(vehicle.images[0])}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          sx={{
                            height: 280,
                            width: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 280,
                            bgcolor: '#e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <DirectionsCar sx={{ fontSize: 80, color: '#9e9e9e' }} />
                        </Box>
                      )}

                      <CardContent sx={{ flex: 1, pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {vehicle.brand} {vehicle.model}
                            </Typography>
                            <Typography variant="h6" color="primary" fontWeight="bold">
                              LKR {vehicle.price?.toLocaleString('en-LK', { maximumFractionDigits: 0 }) || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarToday fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="500">
                              {vehicle.year}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Speed fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="500">
                              {vehicle.mileage?.toLocaleString() || 'N/A'} km
                            </Typography>
                          </Box>
                        </Box>

                        {/* Boost info */}
                        {vehicle.boost && (
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                            <Typography variant="caption" color="text.secondary">
                              Featured until {new Date(vehicle.boost.endDate).toLocaleDateString('en-LK')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>

                      <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                        <Button
                          component={Link}
                          to={`/vehicles/${vehicle._id}`}
                          variant="contained"
                          fullWidth
                          size="small"
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default PremiumPostsPage;
