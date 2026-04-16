/**
 * My Auctions Page
 * Display all vehicles listed by the currently logged-in seller
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Gavel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MyAuctionsPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyAuctions();
  }, []);

  const fetchMyAuctions = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('📋 [FETCH] Fetching MY AUCTIONS from /auction-vehicles/my-auctions...');
      const response = await api.get('/auction-vehicles/my-auctions');
      console.log('✅ [FETCH] My Auctions Response:', response.data);
      const auctionsData = response.data.data || [];
      setVehicles(auctionsData);
      console.log(`📋 [MY AUCTIONS] Fetched ${auctionsData.length} personal auctions`);
    } catch (err) {
      console.error('❌ Error fetching my auctions:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load your auctions');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'live':
        return 'error';
      case 'upcoming':
        return 'warning';
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'live':
        return 'LIVE';
      case 'upcoming':
        return 'UPCOMING';
      case 'closed':
        return 'AUCTION ENDED';
      default:
        return status?.toUpperCase() || 'UNKNOWN';
    }
  };

  // Vehicle Card Component
  const VehicleCard = ({ vehicle }) => {
    const finalId = vehicle._id;
    const status = vehicle.status || 'unknown';

    const isLiveStatus = status.toLowerCase() === 'live';

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-4px)',
          },
        }}
      >
        {/* Status Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
          }}
        >
          <Chip
            label={getStatusLabel(status)}
            color={getStatusColor(status)}
            variant="filled"
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              animation: isLiveStatus ? 'pulse 1.5s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': {
                  boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.7)',
                },
                '50%': {
                  boxShadow: '0 0 0 8px rgba(255, 0, 0, 0)',
                },
              },
            }}
          />
        </Box>

        {/* Vehicle Image */}
        {vehicle.images && vehicle.images.length > 0 && (
          <CardMedia
            component="img"
            height="200"
            image={vehicle.images[0]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            sx={{ objectFit: 'cover' }}
          />
        )}

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Vehicle Title */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {vehicle.year} {vehicle.brand} {vehicle.model}
          </Typography>

          {/* Divider */}
          <Divider sx={{ my: 1 }} />

          {/* Current Bid Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>
              Current Bid
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'error.main', 
                fontWeight: 700 
              }}
            >
              LKR {vehicle.currentBid?.toLocaleString() || vehicle.startingPrice?.toLocaleString()}
            </Typography>
          </Box>

          {/* Highest Bidder Info (if exists) */}
          {vehicle.highestBidder && (
            <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Highest Bidder
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {vehicle.highestBidder.firstName} {vehicle.highestBidder.lastName}
              </Typography>
            </Box>
          )}

          {/* Location */}
          <Typography variant="body2" color="textSecondary" sx={{ mb: 'auto' }}>
            📍 {vehicle.location?.city || 'Location not specified'}
          </Typography>

          {/* Manage Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<Gavel />}
            onClick={() => navigate(`/bidding/${finalId}`)}
            sx={{
              mt: 2,
              backgroundColor: '#1a1a1a',
              color: 'white',
              fontWeight: 700,
              textTransform: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#1976d2',
                color: 'white',
              },
              '&:active': {
                backgroundColor: '#1976d2',
              }
            }}
          >
            Monitor Bids
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header with Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/bidding')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              My Listed Vehicles
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage your active and completed auctions
            </Typography>
          </Box>
        </Box>

        {/* Error Message */}
        {error && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee', borderLeft: '4px solid #f44336' }}>
            <Typography color="error">
              ❌ {error}
            </Typography>
          </Paper>
        )}

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : vehicles.length === 0 ? (
          // Empty State
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#f5f5f5' }}>
            <Gavel sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
              You haven't listed any vehicles for auction yet.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Start selling! Go back to the bidding platform to add your first vehicle.
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={() => navigate('/bidding')}
            >
              Go to Bidding Platform
            </Button>
          </Paper>
        ) : (
          // Vehicles Grid
          <>
            <Typography variant="body2" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
              📊 You have {vehicles.length} vehicle(s) listed
            </Typography>
            <Grid container spacing={3}>
              {vehicles.map((vehicle) => (
                <Grid item xs={12} sm={6} md={4} key={vehicle._id}>
                  <VehicleCard vehicle={vehicle} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
};

export default MyAuctionsPage;
