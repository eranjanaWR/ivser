/**
 * Bidding Page
 * Auction and bidding platform for vehicles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Gavel as GavelIcon,
  Timer,
  CheckCircle,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const BiddingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bidDialog, setBidDialog] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [stats, setStats] = useState({
    live: 0,
    upcoming: 0,
    completed: 0,
    myAuctions: 0,
    wonBids: 0,
  });

  // Fetch auctions based on tab
  useEffect(() => {
    const tabStatus = tabs[currentTab]?.label || 'Live';
    if (tabStatus === 'My Auctions') {
      fetchAuctions('My Auctions');
    } else if (tabStatus === 'Won Bids') {
      fetchAuctions('Won Bids');
    } else {
      fetchAuctions(tabStatus);
    }
    fetchStats();
  }, [currentTab, isAuthenticated, user]);

  const fetchAuctions = async (status) => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/bidding/auctions';
      let params = { limit: 12 };
      
      if (status === 'My Auctions') {
        endpoint = '/bidding/my-auctions';
      } else if (status === 'Won Bids') {
        endpoint = '/bidding/won-bids';
      } else {
        params.status = status;
      }
      
      const response = await api.get(endpoint, { params });
      setAuctions(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch auctions');
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [liveRes, upcomingRes, completedRes] = await Promise.all([
        api.get('/bidding/auctions?status=Live&limit=1'),
        api.get('/bidding/auctions?status=Upcoming&limit=1'),
        api.get('/bidding/auctions?status=Completed&limit=1'),
      ]);

      let myAuctionsCount = 0;
      let wonBidsCount = 0;

      if (isAuthenticated) {
        try {
          const myAuctionsRes = await api.get('/bidding/my-auctions?limit=1');
          myAuctionsCount = myAuctionsRes.data.pagination?.total || 0;
        } catch (err) {
          console.error('Failed to fetch my auctions:', err);
        }

        try {
          const wonBidsRes = await api.get('/bidding/won-bids?limit=1');
          wonBidsCount = wonBidsRes.data.pagination?.total || 0;
        } catch (err) {
          console.error('Failed to fetch won bids:', err);
        }
      }

      setStats({
        live: liveRes.data.pagination?.total || 0,
        upcoming: upcomingRes.data.pagination?.total || 0,
        completed: completedRes.data.pagination?.total || 0,
        myAuctions: myAuctionsCount,
        wonBids: wonBidsCount,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleOpenBidDialog = (auction) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedAuction(auction);
    setBidAmount('');
    setBidDialog(true);
  };

  const handleCloseBidDialog = () => {
    setBidDialog(false);
    setSelectedAuction(null);
    setBidAmount('');
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || isNaN(bidAmount)) {
      setError('Please enter a valid bid amount');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (amount <= selectedAuction.currentPrice) {
      setError(
        `Bid must be higher than LKR ${selectedAuction.currentPrice.toLocaleString()}`
      );
      return;
    }

    try {
      await api.post('/bidding/bids', {
        auctionId: selectedAuction._id,
        bidAmount: amount,
      });
      
      setError('');
      handleCloseBidDialog();
      const tabStatus = tabs[currentTab]?.label || 'Live';
      if (tabStatus === 'My Auctions') {
        fetchAuctions('My Auctions');
      } else if (tabStatus === 'Won Bids') {
        fetchAuctions('Won Bids');
      } else {
        fetchAuctions(tabStatus);
      }
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid');
    }
  };

  const handleAddVehicleForBidding = () => {
    navigate('/add-vehicle');
  };

  const tabs = [
    { label: 'Live', count: stats.live },
    { label: 'Upcoming', count: stats.upcoming },
    { label: 'Completed', count: stats.completed },
  ];

  if (isAuthenticated && user && ['seller', 'buyer/seller', 'admin1'].includes(user.role)) {
    tabs.push({ label: 'My Auctions', count: stats.myAuctions });
  }

  if (isAuthenticated) {
    tabs.push({ label: 'Won Bids', count: stats.wonBids });
  }

  const getTabStatus = (tabLabel) => {
    const statusMap = {
      'Live': 'Live',
      'Upcoming': 'Upcoming',
      'Completed': 'Completed',
      'My Auctions': 'My Auctions',
      'Won Bids': 'Won Bids',
    };
    return statusMap[tabLabel] || tabLabel;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 8 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Bidding Platform
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bid on vehicles and get the best deals
          </Typography>
        </Box>
        {isAuthenticated && user && ['seller', 'buyer/seller', 'admin1'].includes(user.role) && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={handleAddVehicleForBidding}
          >
            + Add Vehicle for Bidding
          </Button>
        )}
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 4 }}>
        Place your bids on live vehicles and secure the best deals. The highest bidder
        at the end time wins!
      </Alert>

      {/* Tabs */}
      {tabs.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            {tabs.map((tab, index) => (
              <Tab
                key={tab.label}
                label={`${tab.label} (${tab.count})`}
                value={index}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : auctions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No auctions available
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {auctions.map((auction) => (
            <Grid item xs={12} sm={6} md={4} key={auction._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                {/* Image */}
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={
                      auction.vehicleId?.images?.[0] ||
                      '/images/placeholder-vehicle.png'
                    }
                    alt={`${auction.vehicleId?.year} ${auction.vehicleId?.model}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  {/* Status Badge */}
                  <Chip
                    label={auction.status}
                    size="small"
                    color={
                      auction.status === 'Live'
                        ? 'success'
                        : auction.status === 'Completed'
                        ? 'default'
                        : 'warning'
                    }
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                    }}
                  />
                </Box>

                {/* Content */}
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Vehicle Info */}
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {auction.vehicleId?.year} {auction.vehicleId?.model}
                  </Typography>

                  {/* Vehicle Details */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={auction.vehicleId?.transmission || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={auction.vehicleId?.condition || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${auction.vehicleId?.mileage || 0} km`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {/* Starting Price */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Starting Price
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                      LKR {auction.currentPrice.toLocaleString()}
                    </Typography>
                  </Box>

                  {/* Total Bids */}
                  <Typography variant="caption" color="text.secondary">
                    Total Bids: {auction.totalBids || 0}
                  </Typography>
                </CardContent>

                {/* Actions */}
                <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexDirection: 'column' }}>
                  {auction.status === 'Completed' ? (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircle />}
                      fullWidth
                      disabled
                    >
                      Auction Completed
                    </Button>
                  ) : auction.status === 'Live' ? (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<GavelIcon />}
                      fullWidth
                      onClick={() => handleOpenBidDialog(auction)}
                    >
                      Place Bid
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      disabled
                    >
                      Coming Soon
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => navigate(`/bidding/${auction._id}`)}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Bid Dialog */}
      <Dialog open={bidDialog} onClose={handleCloseBidDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Place a Bid</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedAuction && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Vehicle: {selectedAuction.vehicleId?.year} {selectedAuction.vehicleId?.model}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current Highest Bid: LKR{' '}
                <span style={{ fontWeight: 700, color: '#1976d2' }}>
                  {selectedAuction.currentPrice.toLocaleString()}
                </span>
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Bid Amount (LKR)"
                placeholder={`Enter amount higher than ${selectedAuction.currentPrice}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                inputProps={{ min: selectedAuction.currentPrice + 1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBidDialog}>Cancel</Button>
          <Button
            onClick={handlePlaceBid}
            variant="contained"
            color="primary"
          >
            Place Bid
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BiddingPage;
