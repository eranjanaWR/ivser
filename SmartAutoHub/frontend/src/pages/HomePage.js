/**
 * Home Page
 * Landing page with professional, minimal design
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  DirectionsCar,
  Build,
  TrendingUp,
  VerifiedUser,
  Speed,
  Support,
  Search,
  ArrowForward,
  CalendarToday,
  Favorite,
} from '@mui/icons-material';
import api from '../services/api';
import AlertsModal from '../components/AlertsModal';
import CommercialAdsBanner from '../components/CommercialAdsBanner';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import WatermarkedImage from '../components/WatermarkedImage';
import ListImage from '../components/ListImage';

const features = [
  {
    icon: <DirectionsCar sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Buy & Sell Vehicles',
    description: 'Browse thousands of verified listings or sell your vehicle with ease.',
  },
  {
    icon: <Build sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Emergency Repair',
    description: 'Stranded? Find nearby repairmen instantly with live location tracking.',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Price Prediction',
    description: 'Get accurate market value estimates using our smart pricing algorithm.',
  },
  {
    icon: <VerifiedUser sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Verified Users',
    description: 'All sellers and repairmen are ID and face verified for your safety.',
  },
  {
    icon: <Speed sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Test Drives',
    description: 'Schedule test drives directly with sellers through our platform.',
  },
  {
    icon: <Support sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: '24/7 Support',
    description: 'Our dedicated team is always here to help you with any issues.',
  },
];

const heroBgImages = [
  '/images/24767650148_a49fa76406_b.jpg',
  '/images/26863955009_f3c0415d3f_b.jpg',
  '/images/37752007875_b752891949_b.jpg',
];

const HomePage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleType, setVehicleType] = useState('all');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [trendingVehicles, setTrendingVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleAvailability, setVehicleAvailability] = useState({});
  const [unseeAlerts, setUnseenAlerts] = useState([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroBgImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch unseen alerts for logged-in user
  useEffect(() => {
    const fetchUnseenAlerts = async () => {
      if (!user || !user._id) {
        console.log('⏭ Skipping fetch - user not authenticated');
        return;
      }
      
      try {
        console.log(' Fetching unseen alerts for user:', user._id);
        const response = await api.get('/notifications/alerts/unseen');
        const alertsData = response.data?.data || [];
        
        console.log(' Alerts fetch response:', {
          success: response.data?.success,
          count: response.data?.count,
          alertsLength: alertsData.length,
          alerts: alertsData
        });
        
        if (alertsData && alertsData.length > 0) {
          console.log(` Found ${alertsData.length} unseen alerts - showing modal`);
          setUnseenAlerts(alertsData);
          setShowAlertsModal(true); // Show modal immediately
        } else {
          console.log(' No unseen alerts found');
        }
      } catch (err) {
        console.error('Failed to fetch unseen alerts:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
      }
    };

    fetchUnseenAlerts();
  }, [user]);

  useEffect(() => {
    const fetchTrendingSearches = async () => {
      setLoadingTrends(true);
      try {
        const { data } = await api.get('/search/trending?limit=6&status=all');
        console.log(' Trending API Response:', data);
        setTrendingSearches(data.data || []);
        
        // Extract availability - default to Available for all vehicles in response
        const availability = {};
        if (data.data && data.data.length > 0) {
          data.data.forEach(vehicle => {
            // Always show as Available - if vehicle is in response, it exists in system
            availability[vehicle.model] = 'Available';
            console.log(` Set ${vehicle.model} to "Available" (raw model: "${vehicle.model}")`);
          });
        } else {
          console.log(' No data in trending response or data is empty');
        }
        console.log(' Final availability map:', availability);
        setVehicleAvailability(availability);
      } catch (err) {
        console.error('Failed to fetch trending searches:', err);
        setTrendingSearches([]);
      }
      setLoadingTrends(false);
    };

    fetchTrendingSearches();
  }, []);

  // Fetch actual vehicles matching trending searches
  useEffect(() => {
    console.log(' Rendering trending section with availability:', vehicleAvailability);
    console.log(' Trending searches data:', trendingSearches);
    
    const fetchTrendingVehicles = async () => {
      if (trendingSearches.length === 0) return;
      
      setLoadingVehicles(true);
      try {
        console.log(' Fetching vehicles for trending models...');
        const allVehicles = [];
        
        // Fetch vehicles for each trending model (including unavailable ones)
        for (const trend of trendingSearches.slice(0, 6)) {
          try {
            // Fetch vehicles regardless of status to show complete list
            const { data } = await api.get(
              `/vehicles?search=${encodeURIComponent(trend.model)}&limit=5&status=all`
            );
            if (data.data && data.data.length > 0) {
              allVehicles.push(...data.data);
            }
          } catch (err) {
            console.error(`Failed to fetch vehicles for ${trend.model}:`, err);
          }
        }
        
        console.log(' Fetched trending vehicles:', allVehicles.length);
        setTrendingVehicles(allVehicles.slice(0, 6)); // Show max 6 vehicles
      } catch (err) {
        console.error('Failed to fetch trending vehicles:', err);
        setTrendingVehicles([]);
      }
      setLoadingVehicles(false);
    };

    fetchTrendingVehicles();
  }, [trendingSearches]);

  // Fetch featured/boosted vehicles
  useEffect(() => {
    const fetchFeaturedVehicles = async () => {
      setLoadingFeatured(true);
      try {
        console.log('🎯 Fetching featured vehicles...');
        const response = await api.get('/vehicles/featured/active?limit=6');
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to vehicles page with search query
      window.location.href = `/vehicles?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <Box>
      {/* Alerts Modal for notifications */}
      <AlertsModal
        open={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
        alerts={unseeAlerts}
      />

      {/* Hero Section with Search */}
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          color: 'white',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `url(${heroBgImages[currentImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          transition: 'background-image 1s ease-in-out',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1,
            transition: 'background-color 0.3s ease-in-out',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          {/* Heading */}
          <Typography
            variant="h2"
            fontWeight="bold"
            sx={{
              mb: 2,
              fontSize: { xs: '2rem', md: '3.5rem' },
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            Find your next vehicle
          </Typography>

          {/* Subheading */}
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              maxWidth: 600,
            }}
          >
            Search by make, model, year, price and more.
          </Typography>

          {/* Search Bar */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mb: 6,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <TextField
              fullWidth
              placeholder="Search by model or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                flexGrow: 1,
                bgcolor: 'white',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  color: '#333',
                  padding: '0 12px',
                  height: 56,
                  fontSize: '0.95rem',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: '#999', mr: 1 }}>
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl sx={{ minWidth: 180, bgcolor: 'white', borderRadius: 1, height: 56 }}>
              <Select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                sx={{ height: 56 }}
                displayEmpty
              >
                <MenuItem value="all">All Vehicle Types</MenuItem>
                <MenuItem value="sedan">Sedans</MenuItem>
                <MenuItem value="suv">SUVs</MenuItem>
                <MenuItem value="truck">Trucks</MenuItem>
                <MenuItem value="coupe">Coupes</MenuItem>
                <MenuItem value="hatchback">Hatchbacks</MenuItem>
                <MenuItem value="van">Vans</MenuItem>
              </Select>
            </FormControl>

            <Button
              onClick={handleSearch}
              variant="contained"
              sx={{
                px: 4,
                py: 1.5,
                height: 56,
                fontSize: '1rem',
                fontWeight: 600,
                bgcolor: '#000',
                color: 'white',
                border: 'none',
                '&:hover': {
                  bgcolor: '#222',
                },
              }}
            >
              Search
            </Button>
          </Box>

          {/* Trending Searches - Inside Hero */}
          <Box sx={{ 
            mt: 6, 
            p: { xs: 2, md: 2 },
            bgcolor: 'rgba(255,255,255,0.95)',
            borderRadius: 3,
          }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ mb: 2, color: '#1a1a1a' }}
            >
              Trending Now
            </Typography>

            {loadingTrends ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : trendingSearches.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No trending vehicles yet
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={1.5}>
                {trendingSearches.slice(0, 6).map((vehicle, index) => (
                  <Grid 
                    item 
                    xs={6}
                    sm={4}
                    md={2}
                    key={vehicle._id || index}
                  >
                    <Card
                      sx={{
                        bgcolor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        },
                      }}
                      onClick={() => {
                        window.location.href = `/vehicles?search=${encodeURIComponent(vehicle.model)}`;
                      }}
                    >
                      <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="h6" fontWeight="700" sx={{ color: '#1a1a1a', fontSize: '1.1rem', mb: 0.5 }}>
                          {vehicle.model}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#4caf50',
                              fontSize: '0.8rem', 
                              fontWeight: 600 
                            }}
                          >
                            {vehicleAvailability[vehicle.model] || 'Available'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Container>
      </Box>

      {/* Commercial Ads Banner Section */}
      <CommercialAdsBanner />

      {/* Premium Posts Section */}
      <Box sx={{ py: 2, bgcolor: '#f5f5f5' }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'left' }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
              Premium Posts
            </Typography>
          </Box>

            {loadingFeatured ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : featuredVehicles.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  No featured vehicles at the moment
                </Typography>
              </Box>
            ) : (
              <>
                <Box 
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    justifyContent: 'flex-start',
                  }}
                >
                  {featuredVehicles.slice(0, 6).map((vehicle) => (
                    <Box
                      key={vehicle._id}
                      sx={{
                        width: {
                          xs: '100%',
                          sm: 'calc(50% - 12px)',
                          md: 'calc(33.333% - 12px)',
                          lg: 'calc(20% - 12px)',
                        },
                      }}
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
                        {/* Premium Badge */}
                        <Chip
                          label="PREMIUM"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 10,
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />

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
                    </Box>
                  ))}
                </Box>

                {/* See All Featured Button */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                  <Button
                    component={Link}
                    to="/premium-posts"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  >
                    See All Premium Posts
                  </Button>
                </Box>
              </>
            )}
          </Container>
        </Box>

      {/* Trending Vehicles Section - Below Hero */}
      {trendingVehicles.length > 0 && !loadingVehicles && (
        <Box sx={{ bgcolor: '#f5f5f5', py: 3 }}>
          <Container maxWidth="lg">
            <Box sx={{ mb: 8 }}>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{ mb: 2, color: '#1a1a1a' }}
              >
                Trending Vehicles
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {trendingVehicles.map((vehicle) => (
                <Grid 
                  item 
                  xs={12}
                  sm={6}
                  md={4}
                  lg={2.4}
                  key={vehicle._id}
                  sx={{
                    '@media (min-width: 1280px)': {
                      flexBasis: 'calc(20% - 12px)',
                      maxWidth: 'calc(20% - 12px)',
                    },
                  }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' },
                      position: 'relative',
                    }}
                  >
                    <ListImage
                      src={getImageUrl(vehicle.images?.[0])}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      sx={{
                        height: 200,
                        objectFit: 'cover',
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={vehicle.condition}
                          size="small"
                          color={vehicle.condition === 'New' ? 'success' : 'default'}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.fuelType}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {vehicle.brand} {vehicle.model}
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        LKR {vehicle.price?.toLocaleString('en-LK', { maximumFractionDigits: 0 }) || 'N/A'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.year}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Speed fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.mileage?.toLocaleString() || 'N/A'} km
                          </Typography>
                        </Box>
                      </Box>

                      {/* Location */}
                      {vehicle.location && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="caption" color="text.secondary">
                            📍 Location
                          </Typography>
                          <Typography variant="body2" fontWeight="600" color="#1976d2">
                            {typeof vehicle.location === 'string' 
                              ? vehicle.location 
                              : `${vehicle.location.city || 'City'}, ${vehicle.location.country || 'Country'}`}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ 
                      p: 2, 
                      pt: 1, 
                      display: 'flex', 
                      gap: 1, 
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      backgroundColor: '#fafafa'
                    }}>
                      <Button
                        component={Link}
                        to={`/vehicles/${vehicle._id}`}
                        variant="contained"
                        size="small"
                        sx={{ flex: 1, minWidth: '100px' }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* See All Vehicles Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Button
                component={Link}
                to="/vehicles"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  backgroundColor: '#9E9E9E',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#616161',
                    transform: 'translateX(4px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                See All Vehicles
              </Button>
            </Box>
          </Container>
        </Box>
      )}

      {/* CTA Section - Only show if user is not logged in */}
      {!user && (
        <Box sx={{ bgcolor: 'primary.main', py: 8 }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="white" sx={{ mb: 2 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" color="rgba(255,255,255,0.8)" sx={{ mb: 4 }}>
              Join thousands of satisfied users on SmartAuto Hub
            </Typography>
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 6,
                py: 1.5,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Create Free Account
            </Button>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default HomePage;
