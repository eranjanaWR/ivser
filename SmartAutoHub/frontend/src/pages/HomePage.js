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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
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
  TrendingDown,
} from '@mui/icons-material';

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

const trendingSearches = [
  { name: 'Corolla', status: 'available', availability: 'Available to Sell' },
  { name: 'Premio', status: 'out-of-stock', availability: 'Out of Stock' },
  { name: 'BMW', status: 'available', availability: 'Available to Sell' },
  { name: 'Honda Civic', status: 'out-of-stock', availability: 'Out of Stock' },
  { name: 'Nissan Skyline', status: 'available', availability: 'Available to Sell' },
  { name: 'Toyota Aqua', status: 'available', availability: 'Available to Sell' },
];

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleType, setVehicleType] = useState('all');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to vehicles page with search query
      window.location.href = `/vehicles?q=${encodeURIComponent(searchQuery)}&type=${vehicleType}`;
    }
  };

  return (
    <Box>
      {/* Hero Section with Search */}
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          color: 'white',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: 'url(/images/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
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

          {/* Trending Searches */}
          <Box sx={{ mt: 8 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ mb: 3, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            >
              Trending Searches
            </Typography>

            <Grid container spacing={2}>
              {trendingSearches.map((vehicle, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      bgcolor: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a1a1a', mb: 1 }}>
                          {vehicle.name}
                        </Typography>
                        <Chip
                          label={vehicle.availability}
                          size="small"
                          sx={{
                            bgcolor: vehicle.status === 'available' ? '#e8f5e9' : '#fff3e0',
                            color: vehicle.status === 'available' ? '#2e7d32' : '#e65100',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                          }}
                        />
                      </Box>
                      <Box sx={{ color: '#999', fontSize: '1.5rem' }}>→</Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          textAlign="center"
          sx={{ mb: 2 }}
        >
          Why Choose SmartAuto Hub?
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
        >
          Everything you need in one platform
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  {feature.icon}
                  <Typography variant="h6" fontWeight="bold" sx={{ my: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
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
    </Box>
  );
};

export default HomePage;
