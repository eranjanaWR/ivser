/**
 * Footer Component
 * Professional, minimal footer
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Grid, IconButton, Divider } from '@mui/material';
import { DirectionsCar, Email, Phone, LocationOn } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1a1a1a',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DirectionsCar />
              <Typography variant="h6" fontWeight="bold">
                SmartAuto Hub
              </Typography>
            </Box>
            <Typography variant="body2" color="grey.400" sx={{ mb: 2 }}>
              Your trusted platform for buying, selling, and repairing vehicles.
              Professional service, transparent pricing.
            </Typography>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                component={Link}
                to="/vehicles"
                variant="body2"
                sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
              >
                Browse Vehicles
              </Typography>
              <Typography
                component={Link}
                to="/prediction"
                variant="body2"
                sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
              >
                Price Prediction
              </Typography>
              <Typography
                component={Link}
                to="/breakdown"
                variant="body2"
                sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
              >
                Breakdown Assist
              </Typography>
            </Box>
          </Grid>

          {/* Account */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Account
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                component={Link}
                to="/login"
                variant="body2"
                sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
              >
                Login
              </Typography>
              <Typography
                component={Link}
                to="/signup"
                variant="body2"
                sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
              >
                Sign Up
              </Typography>
              <Typography
                component={Link}
                to="/profile"
                variant="body2"
                sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
              >
                My Profile
              </Typography>
            </Box>
          </Grid>

          {/* Contact */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email fontSize="small" sx={{ color: 'grey.400' }} />
                <Typography variant="body2" color="grey.400">
                  support@smartautohub.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" sx={{ color: 'grey.400' }} />
                <Typography variant="body2" color="grey.400">
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" sx={{ color: 'grey.400' }} />
                <Typography variant="body2" color="grey.400">
                  123 Auto Street, Car City, CC 12345
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'grey.800' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="grey.500">
            © {new Date().getFullYear()} SmartAuto Hub. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography
              component="a"
              href="#"
              variant="body2"
              sx={{ color: 'grey.500', textDecoration: 'none', '&:hover': { color: 'white' } }}
            >
              Privacy Policy
            </Typography>
            <Typography
              component="a"
              href="#"
              variant="body2"
              sx={{ color: 'grey.500', textDecoration: 'none', '&:hover': { color: 'white' } }}
            >
              Terms of Service
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
