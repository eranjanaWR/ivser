/**
 * Bidding Page
 * Allow users to place bids on vehicles
 * Displays both live and upcoming auction vehicles
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Button,
  Alert,
  Chip,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  LocalOffer as BiddingIcon,
  Info,
  TrendingUp,
  Schedule,
  EmojiEvents as TrophyIcon,
  Gavel,
  CheckCircle,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AddVehicleBiddingDialog from '../components/AddVehicleBiddingDialog';
import CountdownTimer from '../components/CountdownTimer';

const BiddingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [liveVehicles, setLiveVehicles] = useState([]);
  const [upcomingVehicles, setUpcomingVehicles] = useState([]);
  const [closedVehicles, setClosedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAuctionVehicles();
    // Refresh every 30 seconds to update countdown timers
    const refreshInterval = setInterval(() => {
      fetchAuctionVehicles();
    }, 30000);
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, navigate]);

  const fetchAuctionVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all available vehicles for bidding (both live and upcoming)
      const response = await api.get('/auction-vehicles?limit=50');
      const allVehicles = response.data.data || [];

      // ✅ IMPROVED FILTERING: Use both status and time-based logic for redundancy
      const now = new Date();
      const live = allVehicles.filter(v => {
        const startDate = new Date(v.auctionStartDate);
        const endDate = new Date(v.auctionEndDate);
        // Live if: status=live OR (startDate <= now AND endDate > now)
        return v.status === 'live' || (startDate <= now && endDate > now);
      });
      
      const upcoming = allVehicles.filter(v => {
        const startDate = new Date(v.auctionStartDate);
        const endDate = new Date(v.auctionEndDate);
        // Upcoming if: status=upcoming AND startDate > now, or (startDate > now AND endDate > now)
        return (v.status === 'upcoming' || startDate > now) && endDate > now;
      });
      
      // ✅ NEW: Filter closed auctions
      const closed = allVehicles.filter(v => {
        const endDate = new Date(v.auctionEndDate);
        // Closed if: status=closed OR (endDate <= now)
        return v.status === 'closed' || endDate <= now;
      });

      console.log(`📊 [FRONTEND] Received ${allVehicles.length} total vehicles`);
      console.log(`   Breakdown - Live: ${live.length}, Upcoming: ${upcoming.length}, Closed: ${closed.length}`);
      if (allVehicles.length > 0) {
        console.log(`   Sample vehicle:`, allVehicles[0].brand, allVehicles[0].model, `Status: ${allVehicles[0].status}`);
      }

      setLiveVehicles(live);
      setUpcomingVehicles(upcoming);
      setClosedVehicles(closed);
    } catch (err) {
      console.error('❌ Error fetching vehicles:', err);
      setError(err.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleCountdownComplete = (vehicleId) => {
    console.log(`⏱️ Countdown completed for vehicle ${vehicleId}, re-fetching data...`);
    // Re-fetch vehicles to reflect status change from 'upcoming' to 'live'
    fetchAuctionVehicles();
  };

  const handleTabChange = (event, newValue) => {
    if (newValue === 3) {
      // My Auctions tab - navigate to separate page
      navigate('/my-auctions');
    } else if (newValue === 4) {
      // Won Bids tab - navigate to separate page
      navigate('/won-bids');
    } else {
      setActiveTab(newValue);
    }
  };

  const handleBidClick = (vehicle) => {
    // Navigate to dedicated bidding page
    navigate(`/bidding/${vehicle._id}/place-bid`);
  };

  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  const VehicleCard = ({ vehicle, isLive = true, isClosed = false }) => {
    const finalId = vehicle._id || vehicle.id;

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
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Chip
          icon={isClosed ? <TrophyIcon /> : isLive ? <TrendingUp /> : <Schedule />}
          label={isClosed ? 'CLOSED' : isLive ? 'LIVE' : 'UPCOMING'}
          color={isClosed ? 'success' : isLive ? 'error' : 'warning'}
          variant="filled"
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.7rem',
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

        {/* Vehicle Info Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label={vehicle.transmission || 'Auto'}
            variant="outlined"
          />
          <Chip
            size="small"
            label={vehicle.condition || 'Good'}
            variant="outlined"
          />
          {vehicle.mileage && (
            <Chip
              size="small"
              label={`${vehicle.mileage.toLocaleString()} km`}
              variant="outlined"
            />
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Starting/Current Price Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>
            {isLive ? 'Current Bid' : 'Starting Price'}
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: isLive ? 'error.main' : 'primary.main', 
              fontWeight: 700 
            }}
          >
            LKR {vehicle.currentBid?.toLocaleString() || vehicle.startingPrice?.toLocaleString()}
          </Typography>
        </Box>

        {/* Highest Bidder for Live Vehicles */}
        {isLive && vehicle.highestBidder && (
          <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Highest Bidder
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {vehicle.highestBidder.firstName} {vehicle.highestBidder.lastName}
            </Typography>
          </Box>
        )}

        {/* Status Display for Closed Vehicles */}
        {isClosed && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1, border: '1px solid #4caf50' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon fontSize="small" />
              Auction Closed
            </Typography>
            {vehicle.highestBidder && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                Winner: {vehicle.highestBidder.firstName} {vehicle.highestBidder.lastName}
              </Typography>
            )}
          </Box>
        )}

        {/* Countdown for Upcoming Vehicles */}
        {!isLive && !isClosed && (
          <Box sx={{ mb: 2 }}>
            <CountdownTimer 
              targetDate={vehicle.auctionStartDate}
              label="Bidding Starts"
              variant="detailed"
              onComplete={() => handleCountdownComplete(vehicle._id)}
            />
          </Box>
        )}

        {/* Location */}
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          📍 {vehicle.location?.city || 'Location not specified'}
        </Typography>

        {/* ========== BUTTON SECTION ========== */}
        {!finalId ? (
          <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600, mt: 'auto', mb: 1 }}>
            ❌ Error: Missing Vehicle ID
          </Typography>
        ) : (
          <>
            {/* Place Bid (Live) / View Results (Closed) / Bidding Not Started (Upcoming) */}
            {isLive ? (
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<Gavel />}
                onClick={() => handleBidClick(vehicle)}
                sx={{
                  mt: 'auto',
                  mb: 1,
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
                Place Bid
              </Button>
            ) : isClosed ? (
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<TrophyIcon />}
                onClick={() => navigate(`/bidding/${finalId}`)}
                sx={{
                  mt: 'auto',
                  mb: 1,
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
                View Results
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled
                sx={{
                  mt: 'auto',
                  mb: 1,
                  backgroundColor: '#cccccc',
                  color: '#666666',
                }}
              >
                Bidding Not Started
              </Button>
            )}

            {/* View Details Link Button */}
            <Button
              component={Link}
              to={`/auction-vehicles/${finalId}`}
              variant="outlined"
              fullWidth
              size="small"
              sx={{
                mt: 0.5,
                borderColor: '#1a1a1a',
                color: '#1a1a1a',
                fontWeight: 700,
                textTransform: 'none',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#1a1a1a',
                  textDecoration: 'none',
                }
              }}
            >
              View Details
            </Button>
          </>
        )}
      </CardContent>
    </Card>
    );
  };

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: 'calc(100vh - 80px)', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="text"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <BiddingIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Bidding Platform
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Bid on vehicles and get the best deals
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="success"
            onClick={handleOpenAddDialog}
            sx={{ fontWeight: 600 }}
          >
            + Add Vehicle for Bidding
          </Button>
        </Box>

        {/* Info Alert */}
        <Alert icon={<Info />} severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Place your bids on live vehicles and secure the best deals. The highest bidder at the end time wins!
          </Typography>
        </Alert>

        {/* Success Message */}
        {successMessage && (
          <Alert 
            icon={<CheckCircle />} 
            severity="success" 
            sx={{ mb: 3 }} 
            onClose={() => setSuccessMessage('')}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : liveVehicles.length === 0 && upcomingVehicles.length === 0 && closedVehicles.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
              No vehicles available for bidding at the moment.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/vehicles')}
            >
              Browse All Vehicles
            </Button>
          </Paper>
        ) : (
          <>
            {/* Tabs for Live/Upcoming/Closed/MyAuctions/WonBids */}
            <Paper sx={{ mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Tab 
                  icon={<TrendingUp />}
                  iconPosition="start"
                  label={`Live (${liveVehicles.length})`}
                  sx={{ fontWeight: 600 }}
                />
                <Tab 
                  icon={<Schedule />}
                  iconPosition="start"
                  label={`Upcoming (${upcomingVehicles.length})`}
                  sx={{ fontWeight: 600 }}
                />
                <Tab 
                  icon={<TrophyIcon />}
                  iconPosition="start"
                  label={`Completed (${closedVehicles.length})`}
                  sx={{ fontWeight: 600 }}
                />
                <Tab 
                  icon={<PersonIcon />}
                  iconPosition="start"
                  label="My Auctions"
                  sx={{ fontWeight: 600 }}
                />
                <Tab 
                  icon={<CheckCircle />}
                  iconPosition="start"
                  label="Won Bids"
                  sx={{ fontWeight: 600 }}
                />
              </Tabs>
            </Paper>

            {/* Live Vehicles Section */}
            {activeTab === 0 && (
              <>
                {liveVehicles.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      No live bidding sessions at the moment.
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Check back soon for exciting bidding opportunities!
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {liveVehicles.map((vehicle) => (
                      <Grid item xs={12} sm={6} md={4} key={vehicle._id}>
                        <VehicleCard vehicle={vehicle} isLive={true} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}

            {/* Upcoming Vehicles Section */}
            {activeTab === 1 && (
              <>
                {upcomingVehicles.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      No upcoming bidding sessions scheduled.
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      More vehicles will be added soon!
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {upcomingVehicles.map((vehicle) => (
                      <Grid item xs={12} sm={6} md={4} key={vehicle._id}>
                        <VehicleCard vehicle={vehicle} isLive={false} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}

            {/* 🏆 NEW: Completed/Closed Vehicles Section */}
            {activeTab === 2 && (
              <>
                {closedVehicles.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <TrophyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      No completed auctions yet.
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Check back to see completed auctions and winners!
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {closedVehicles.map((vehicle) => (
                      <Grid item xs={12} sm={6} md={4} key={vehicle._id}>
                        <VehicleCard vehicle={vehicle} isClosed={true} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </>
        )}
      </Container>

      {/* Add Vehicle for Bidding Dialog */}
      <AddVehicleBiddingDialog
        open={addDialogOpen}
        onClose={handleCloseAddDialog}
        onSuccess={() => {
          handleCloseAddDialog();
          setSuccessMessage('Vehicle added for bidding successfully!');
          fetchAuctionVehicles();
          setTimeout(() => setSuccessMessage(''), 3000);
        }}
      />
    </Box>
  );
};

export default BiddingPage;
