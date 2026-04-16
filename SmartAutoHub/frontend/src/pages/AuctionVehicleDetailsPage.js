/**
 * Auction Vehicle Details Page
 * Professional showroom-style view for auction vehicles
 * Displays comprehensive vehicle information and bidding details
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  ArrowBack,
  NavigateNext,
  LocalOffer,
  Speed,
  CalendarToday,
  LocalGasStation,
  Settings,
  ColorLens,
  DirectionsCar,
  Place,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Landscape,
  DoorSliding,
  Person,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import api from '../services/api';
import CountdownTimer from '../components/CountdownTimer';

const AuctionVehicleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchAuctionVehicle();
  }, [id]);

  const fetchAuctionVehicle = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/auction-vehicles/${id}`);
      setVehicle(data.data);
    } catch (err) {
      console.error('❌ Failed to fetch auction vehicle:', err.message);
      setError(err.response?.data?.message || 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? vehicle.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === vehicle.images.length - 1 ? 0 : prev + 1
    );
  };

  // ✅ NEW: Callback when countdown timer completes
  const handleCountdownComplete = () => {
    console.log(`⏱️ Countdown completed, re-fetching vehicle data...`);
    // Re-fetch vehicle to reflect status change from 'upcoming' to 'live'
    fetchAuctionVehicle();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 80px)',
          bgcolor: '#f4f6f8',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Box sx={{ bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 80px)', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Vehicle not found'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/bidding')}
          >
            Back to Auctions
          </Button>
        </Container>
      </Box>
    );
  }

  const auctionStartDate = new Date(vehicle.auctionStartDate);
  const auctionEndDate = new Date(vehicle.auctionEndDate);
  const now = new Date();
  const isLive = auctionStartDate <= now && auctionEndDate > now;
  const isUpcoming = auctionStartDate > now;
  const isClosed = auctionEndDate <= now;

  const getStatusColor = () => {
    if (isLive) return 'error';
    if (isUpcoming) return 'warning';
    return 'info';
  };

  const getStatusLabel = () => {
    if (isLive) return 'LIVE';
    if (isUpcoming) return 'UPCOMING';
    return 'CLOSED';
  };

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 80px)', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header with Back Button and Breadcrumbs */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Button
              variant="text"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/bidding')}
              sx={{ mb: 2 }}
            >
              Back to Auctions
            </Button>
            <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
              <MuiLink color="inherit" href="/" sx={{ cursor: 'pointer', textDecoration: 'none' }}>
                Home
              </MuiLink>
              <MuiLink color="inherit" href="/bidding" sx={{ cursor: 'pointer', textDecoration: 'none' }}>
                Auctions
              </MuiLink>
              <Typography color="textPrimary">
                {vehicle.year} {vehicle.brand} {vehicle.model}
              </Typography>
            </Breadcrumbs>
          </Box>
          <Chip
            icon={isLive ? <TrendingUp /> : isUpcoming ? <Schedule /> : <CheckCircle />}
            label={getStatusLabel()}
            color={getStatusColor()}
            variant="filled"
            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Left Column: Media Gallery */}
          <Grid item xs={12} md={7}>
            {/* Main Image with Navigation */}
            <Paper
              elevation={2}
              sx={{
                bgcolor: '#ffffff',
                borderRadius: 2,
                overflow: 'hidden',
                mb: 3,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '66.67%', // 3:2 aspect ratio
                  backgroundColor: '#f0f0f0',
                }}
              >
                {vehicle.images && vehicle.images.length > 0 ? (
                  <>
                    <Box
                      component="img"
                      src={vehicle.images[currentImageIndex]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />

                    {/* Navigation Arrows */}
                    {vehicle.images.length > 1 && (
                      <>
                        <IconButton
                          onClick={handlePrevImage}
                          sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.7)',
                            },
                            zIndex: 10,
                          }}
                        >
                          <ChevronLeft />
                        </IconButton>
                        <IconButton
                          onClick={handleNextImage}
                          sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.7)',
                            },
                            zIndex: 10,
                          }}
                        >
                          <ChevronRight />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                    }}
                  >
                    <Typography>No images available</Typography>
                  </Box>
                )}
              </Box>

              {/* Image Thumbnails */}
              {vehicle.images && vehicle.images.length > 1 && (
                <Box sx={{ p: 2, display: 'flex', gap: 1, overflowX: 'auto' }}>
                  {vehicle.images.map((img, idx) => (
                    <Box
                      key={idx}
                      component="img"
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      onClick={() => setCurrentImageIndex(idx)}
                      sx={{
                        width: 80,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 1,
                        cursor: 'pointer',
                        border:
                          idx === currentImageIndex ? '3px solid #1976d2' : '2px solid #ddd',
                        opacity: idx === currentImageIndex ? 1 : 0.6,
                        transition: 'all 0.3s',
                        '&:hover': {
                          opacity: 1,
                          borderColor: '#1976d2',
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Paper>

            {/* Vehicle Title & Header */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: '#1a1a1a',
                }}
              >
                {vehicle.year} {vehicle.brand} {vehicle.model}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={vehicle.condition?.toUpperCase() || 'GOOD'}
                  variant="outlined"
                  size="medium"
                />
                <Chip
                  label={vehicle.transmission?.toUpperCase() || 'AUTO'}
                  icon={<Settings />}
                  variant="outlined"
                  size="medium"
                />
                {vehicle.mileage && (
                  <Chip
                    label={`${vehicle.mileage.toLocaleString()} km`}
                    icon={<Speed />}
                    variant="outlined"
                    size="medium"
                  />
                )}
              </Box>
            </Box>

            {/* Specifications Grid */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#ffffff' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Specifications
              </Typography>
              <Grid container spacing={2}>
                {vehicle.engineCapacity && (
                  <Grid item xs={6} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Settings sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Engine Capacity
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {vehicle.engineCapacity}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {vehicle.fuelType && (
                  <Grid item xs={6} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LocalGasStation sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Fuel Type
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {vehicle.fuelType?.toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {vehicle.doors && (
                  <Grid item xs={6} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <DoorSliding sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Doors
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {vehicle.doors}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {vehicle.seats && (
                  <Grid item xs={6} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Person sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Seats
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {vehicle.seats}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {vehicle.bodyType && (
                  <Grid item xs={6} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <DirectionsCar sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Body Type
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {vehicle.bodyType?.toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {vehicle.color && (
                  <Grid item xs={6} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <ColorLens sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Color
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {vehicle.color}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {vehicle.location?.city && (
                  <Grid item xs={6} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Place sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Location
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {vehicle.location.city}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Key Features Section */}
            {vehicle.features && vehicle.features.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#ffffff' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Key Features
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 1.5 }}>
                  {vehicle.features.map((feature, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ color: 'success.main', fontSize: '1.25rem' }} />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Description Section */}
            {vehicle.description && (
              <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#ffffff' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.8, color: '#555' }}>
                  {vehicle.description}
                </Typography>
              </Paper>
            )}
          </Grid>

          {/* Right Column: Pricing & Auction Info */}
          <Grid item xs={12} md={5}>
            {/* Auction Status & Timer */}
            <Card
              elevation={2}
              sx={{
                mb: 3,
                bgcolor: '#ffffff',
                borderLeft: `4px solid ${isLive ? '#d32f2f' : isUpcoming ? '#ff9800' : '#2196f3'}`,
              }}
            >
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                    Auction Status
                  </Typography>
                  <Chip
                    icon={isLive ? <TrendingUp /> : isUpcoming ? <Schedule /> : <CheckCircle />}
                    label={getStatusLabel()}
                    color={getStatusColor()}
                    variant="filled"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                {!isClosed ? (
                  <CountdownTimer
                    targetDate={isLive ? auctionEndDate : auctionStartDate}
                    label={isLive ? 'Auction Ends In' : 'Bidding Starts In'}
                    variant="compact"
                    onComplete={handleCountdownComplete}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    ✓ This auction has ended. Final result: <strong>Closed</strong>
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card elevation={2} sx={{ mb: 3, bgcolor: '#ffffff' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Pricing Information
                </Typography>

                {/* Starting Price */}
                <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                    Starting Price
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    LKR {vehicle.startingPrice?.toLocaleString() || '0'}
                  </Typography>
                </Box>

                {/* Current Bid */}
                <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                    {isLive ? 'Current Bid' : 'Reserve Price'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                    LKR {vehicle.currentBid?.toLocaleString() || vehicle.startingPrice?.toLocaleString() || '0'}
                  </Typography>
                </Box>

                {/* Highest Bidder (if live and has active bid) */}
                {isLive && vehicle.highestBidder && (
                  <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                      Highest Bidder
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {vehicle.highestBidder.firstName} {vehicle.highestBidder.lastName}
                    </Typography>
                  </Box>
                )}

                {/* Views Counter */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Landscape fontSize="small" />
                    {vehicle.views || 0} people viewed this
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Seller Information */}
            {vehicle.sellerId && (
              <Card elevation={2} sx={{ mb: 3, bgcolor: '#ffffff' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Seller Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                      }}
                    >
                      {vehicle.sellerId.firstName?.charAt(0)}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {vehicle.sellerId.firstName} {vehicle.sellerId.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Verified Seller
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AuctionVehicleDetailsPage;
