/**
 * Not Found Page
 * 404 error page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';
import { Home, DirectionsCar } from '@mui/icons-material';

const NotFoundPage = () => {
  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#fafafa',
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <DirectionsCar sx={{ fontSize: 100, color: 'grey.300', mb: 2 }} />
        
        <Typography
          variant="h1"
          fontWeight="bold"
          sx={{ fontSize: '6rem', color: 'grey.800', mb: 1 }}
        >
          404
        </Typography>
        
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Oops! The page you're looking for doesn't exist or has been moved.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            component={Link}
            to="/"
            variant="contained"
            startIcon={<Home />}
            size="large"
          >
            Go Home
          </Button>
          <Button
            component={Link}
            to="/vehicles"
            variant="outlined"
            startIcon={<DirectionsCar />}
            size="large"
          >
            Browse Vehicles
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFoundPage;
