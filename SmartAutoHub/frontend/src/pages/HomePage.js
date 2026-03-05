/**
 * Home Page
 * Landing page with professional, minimal design
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  DirectionsCar,
  Build,
  TrendingUp,
  VerifiedUser,
  Speed,
  Support,
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

const HomePage = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                fontWeight="bold"
                sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
              >
                Your Trusted
                <br />
                <Box component="span" sx={{ color: 'primary.main' }}>
                  Auto Marketplace
                </Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{ mb: 4, color: 'grey.400', fontWeight: 400 }}
              >
                Buy, sell, and repair vehicles with confidence. 
                Verified users, transparent pricing, and emergency roadside assistance.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  to="/vehicles"
                  variant="contained"
                  size="large"
                  sx={{ px: 4, py: 1.5 }}
                >
                  Browse Vehicles
                </Button>
                <Button
                  component={Link}
                  to="/signup"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { borderColor: 'grey.300', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Get Started
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <DirectionsCar sx={{ fontSize: 300, color: 'grey.800' }} />
              </Box>
            </Grid>
          </Grid>
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
