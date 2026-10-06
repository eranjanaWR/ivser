/**
 * Commercial Ads Banner Component
 * Displays promotional banners for vehicle brands and dealers
 */

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Card, CardContent, Grid, Chip, CircularProgress } from '@mui/material';
import api from '../services/api';

const CommercialAdsBanner = () => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [homePageAds, setHomePageAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [preloadedImages, setPreloadedImages] = useState({});

  // Fetch ads with Home Page placement on component mount
  useEffect(() => {
    const fetchHomePageAds = async () => {
      try {
        console.log('📢 Fetching Home Page ads...');
        const response = await api.get('/advertising/approved');
        const allAds = response.data?.data || [];
        
        // Filter only Home Page placement ads (placement stored as 'home' in database)
        const homepageAds = allAds.filter(ad => ad.placement === 'home' && ad.status === 'approved');
        console.log(`✅ Found ${homepageAds.length} Home Page ads`);
        
        setHomePageAds(homepageAds);
        
        // Preload first ad image
        if (homepageAds.length > 0) {
          preloadAdImage(homepageAds[0]._id, homepageAds[0].adPhotoBase64);
        }
      } catch (error) {
        console.error('❌ Failed to fetch Home Page ads:', error);
        setHomePageAds([]);
      } finally {
        setLoadingAds(false);
      }
    };

    fetchHomePageAds();
  }, []);

  // Preload ad images to avoid loading delays
  const preloadAdImage = (adId, imageData) => {
    if (!preloadedImages[adId] && imageData) {
      setPreloadedImages(prev => ({
        ...prev,
        [adId]: imageData
      }));
    }
  };

  // Auto-rotate ads every 3 seconds
  useEffect(() => {
    if (homePageAds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => {
        const nextIndex = (prev + 1) % homePageAds.length;
        // Preload next ad image
        if (homePageAds[nextIndex]) {
          preloadAdImage(homePageAds[nextIndex]._id, homePageAds[nextIndex].adPhotoBase64);
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [homePageAds, preloadedImages]);

  const handlePrevious = () => {
    setCurrentAdIndex((prev) => (prev - 1 + homePageAds.length) % homePageAds.length);
  };

  const handleNext = () => {
    setCurrentAdIndex((prev) => (prev + 1) % homePageAds.length);
  };

  // If loading, show spinner
  if (loadingAds) {
    return (
      <Box sx={{ py: 4, background: 'transparent', position: 'relative' }}>
        <Container maxWidth="lg">
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              background: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 280,
              position: 'relative',
            }}
          >
            <CircularProgress />
          </Card>
        </Container>
      </Box>
    );
  }

  // If no ads, show placeholder
  if (homePageAds.length === 0) {
    return (
      <Box sx={{ py: 4, background: 'transparent', position: 'relative' }}>
        <Container maxWidth="lg">
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              background: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 280,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                px: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#333' }}>
                Ads space available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Premium ad space for your business
              </Typography>
            </Box>
          </Card>
        </Container>
      </Box>
    );
  }

  const currentAd = homePageAds[currentAdIndex];

  return (
    <Box sx={{ py: 4, background: 'transparent', position: 'relative' }}>
      <Container maxWidth="lg">
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            background: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 280,
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          {/* Ad Image with Fade Transition */}
          <Box
            component="img"
            src={preloadedImages[currentAd._id] || currentAd.adPhotoBase64}
            alt={currentAd.company}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.8s ease-in-out',
              opacity: 1,
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
            {homePageAds.map((_, index) => (
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
