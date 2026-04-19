/**
 * Bidding Page
 * Allow users to place bids on vehicles
 * Displays live, upcoming, completed, user auctions, and won bids
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  LocalOffer as BiddingIcon,
  Info,
  TrendingUp,
  Schedule,
  EmojiEvents as TrophyIcon,
  CheckCircle,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AddVehicleBiddingDialog from '../components/AddVehicleBiddingDialog';
import BiddingCard from '../components/BiddingCard';

const BiddingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [liveVehicles, setLiveVehicles] = useState([]);
  const [upcomingVehicles, setUpcomingVehicles] = useState([]);
  const [closedVehicles, setClosedVehicles] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [wonBids, setWonBids] = useState([]);
  
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

  // Catch prefilled vehicle from navigation state
  const [prefilledData, setPrefilledData] = useState(null);

  useEffect(() => {
    if (location.state && location.state.prefilledVehicle) {
      console.log('📝 [BIDDING-PAGE] Detected pre-filled vehicle data:', location.state.prefilledVehicle);
      setPrefilledData(location.state.prefilledVehicle);
      setAddDialogOpen(true);
      
      // Clear state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchAuctionVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch all public vehicles (Live, Upcoming, Closed)
      const publicResponse = await api.get('/auction-vehicles?limit=100');
      const allVehicles = publicResponse.data.data || [];

      const now = new Date();
      const live = allVehicles.filter(v => {
        const startDate = new Date(v.auctionStartDate);
        const endDate = new Date(v.auctionEndDate);
        return v.status === 'live' || (startDate <= now && endDate > now);
      });
      
      const upcoming = allVehicles.filter(v => {
        const startDate = new Date(v.auctionStartDate);
        const endDate = new Date(v.auctionEndDate);
        return (v.status === 'upcoming' || startDate > now) && endDate > now;
      });
      
      const closed = allVehicles.filter(v => {
        const endDate = new Date(v.auctionEndDate);
        return ['closed', 'completed', 'cancelled'].includes(v.status) || endDate <= now;
      });

      setLiveVehicles(live);
      setUpcomingVehicles(upcoming);
      setClosedVehicles(closed);

      // 2. Fetch User-Specific Data (My Auctions and Won Bids)
      // Note: We use try-catch for these individually in case the user has no seller profile or similar
      try {
        const myAuctionsRes = await api.get('/auction-vehicles/my-auctions');
        setMyAuctions(myAuctionsRes.data.data || []);
      } catch (err) {
        console.error('❌ Error fetching my auctions:', err);
      }

      try {
        const wonBidsRes = await api.get('/auction-vehicles/won-bids');
        setWonBids(wonBidsRes.data.data || []);
      } catch (err) {
        console.error('❌ Error fetching won bids:', err);
      }

    } catch (err) {
      console.error('❌ Error fetching vehicles:', err);
      setError(err.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleCountdownComplete = (vehicleId) => {
    console.log(`⏱️ Countdown completed for vehicle ${vehicleId}, re-fetching data...`);
    fetchAuctionVehicles();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

  const renderVehicleGrid = (vehicles, type) => {
    if (vehicles.length === 0) {
      let icon = <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />;
      let title = 'No vehicles found';
      let sub = 'Check back soon for more opportunities!';

      if (type === 'live') {
        title = 'No live bidding sessions at the moment.';
      } else if (type === 'upcoming') {
        icon = <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />;
        title = 'No upcoming bidding sessions scheduled.';
      } else if (type === 'completed') {
        icon = <TrophyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />;
        title = 'No completed auctions yet.';
      } else if (type === 'my-auctions') {
        icon = <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />;
        title = "You haven't listed any vehicles yet.";
        sub = "Promote your vehicles to auction to see them here.";
      } else if (type === 'won-bids') {
        icon = <CheckCircle sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />;
        title = 'You haven’t won any bids yet.';
        sub = 'Keep bidding to win your dream vehicle!';
      }

      return (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          {icon}
          <Typography variant="h6" color="textSecondary">
            {title}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {sub}
          </Typography>
        </Paper>
      );
    }

    return (
      <Grid container spacing={3}>
        {vehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle._id}>
            <BiddingCard 
              vehicle={vehicle} 
              user={user} 
              onCountdownComplete={handleCountdownComplete} 
            />
          </Grid>
        ))}
      </Grid>
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

        {/* Status Messages */}
        {successMessage && (
          <Alert icon={<CheckCircle />} severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (liveVehicles.length === 0 && upcomingVehicles.length === 0) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Unified Tabs */}
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
                <Tab icon={<TrendingUp />} iconPosition="start" label={`Live (${liveVehicles.length})`} />
                <Tab icon={<Schedule />} iconPosition="start" label={`Upcoming (${upcomingVehicles.length})`} />
                <Tab icon={<TrophyIcon />} iconPosition="start" label={`Completed (${closedVehicles.length})`} />
                <Tab icon={<PersonIcon />} iconPosition="start" label={`My Auctions (${myAuctions.length})`} />
                <Tab icon={<CheckCircle />} iconPosition="start" label={`Won Bids (${wonBids.length})`} />
              </Tabs>
            </Paper>

            {/* Content Rendering */}
            {activeTab === 0 && renderVehicleGrid(liveVehicles, 'live')}
            {activeTab === 1 && renderVehicleGrid(upcomingVehicles, 'upcoming')}
            {activeTab === 2 && renderVehicleGrid(closedVehicles, 'completed')}
            {activeTab === 3 && renderVehicleGrid(myAuctions, 'my-auctions')}
            {activeTab === 4 && renderVehicleGrid(wonBids, 'won-bids')}
          </>
        )}
      </Container>

      {/* Add Vehicle for Bidding Dialog */}
      <AddVehicleBiddingDialog
        open={addDialogOpen}
        onClose={() => {
          handleCloseAddDialog();
          setPrefilledData(null);
        }}
        prefilledVehicle={prefilledData}
        onSuccess={() => {
          handleCloseAddDialog();
          setPrefilledData(null);
          setSuccessMessage('Vehicle added for bidding successfully!');
          fetchAuctionVehicles();
          setTimeout(() => setSuccessMessage(''), 3000);
        }}
      />
    </Box>
  );
};

export default BiddingPage;
