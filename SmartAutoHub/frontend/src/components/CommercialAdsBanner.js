/**
 * Commercial Ads Banner Component
 * Displays promotional banners for vehicle brands and dealers
 */

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Card, CardContent, Grid, Chip } from '@mui/material';

const CommercialAdsBanner = () => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Sample commercial ads data with 2 ads
  const commercialAds = [
    {
      id: 1,
      brand: 'Premium Space',
      title: 'EXCLUSIVE OFFER',
      image: '/images/addsspace.jpg.png',
      price: 'Call for Price',
    },
    {
      id: 2,
      brand: 'Luxury Comfort',
      title: 'LIMITED TIME',
      image: '/images/takgala.jpg.png',
      price: 'Contact Us',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % commercialAds.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    setCurrentAdIndex((prev) => (prev - 1 + commercialAds.length) % commercialAds.length);
  };

  const handleNext = () => {
    setCurrentAdIndex((prev) => (prev + 1) % commercialAds.length);
  };

  const currentAd = commercialAds[currentAdIndex];

  if (!currentAd) {
    return null;
  }

  return (
    <Box sx={{ py: 1, background: 'transparent', position: 'relative' }}>
      <Container maxWidth="lg">
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 280,
            position: 'relative',
          }}
        >
          {/* Background Image with Fade Transition */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${currentAd.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'opacity 0.8s ease-in-out',
              opacity: 1,
            }}
          />

          {/* Overlay Content - Text Removed */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              py: 3,
              px: 2,
              background: 'transparent',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          />


          {/* Indicator Dots */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              display: 'flex',
              gap: 1,
            }}
          >
            {commercialAds.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: index === currentAdIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default CommercialAdsBanner;
