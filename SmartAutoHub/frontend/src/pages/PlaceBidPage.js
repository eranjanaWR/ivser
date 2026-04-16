/**
 * Place Bid Page
 * Dedicated page for placing bids on auction vehicles
 * Shows vehicle details and bidding form
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  LocalOffer as BiddingIcon,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PlaceBidPage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // State management
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchVehicleDetails();
  }, [isAuthenticated, vehicleId, navigate]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/auction-vehicles/${vehicleId}`);
      const vehicleData = response.data.data;
      
      // Check if vehicle exists and is valid for bidding
      if (!vehicleData) {
        setError('Vehicle not found');
        return;
      }

      // Check if auction has ended
      const endDate = new Date(vehicleData.auctionEndDate);
      if (endDate <= new Date()) {
        setError('This auction has already ended');
        return;
      }

      // Check if auction has started
      const startDate = new Date(vehicleData.auctionStartDate);
      if (startDate > new Date()) {
        setError('This auction has not started yet');
        return;
      }

      setVehicle(vehicleData);
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      setError(err.response?.data?.message || 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async () => {
    setBidError('');

    // Validation
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    if (parseFloat(bidAmount) <= vehicle.currentBid) {
      setBidError(`Bid must be higher than the current bid of LKR ${vehicle.currentBid.toLocaleString()}`);
      return;
    }

    setSubmitting(true);

    try {
      // Submit bid to backend
      await api.post(`/auction-vehicles/${vehicleId}/bid`, {
        bidAmount: parseFloat(bidAmount),
        message: bidMessage,
      });

      // Show success dialog
      setSuccessDialogOpen(true);
    } catch (err) {
      console.error('Error placing bid:', err);
      setBidError(err.response?.data?.message || 'Failed to place bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialogOpen(false);
    navigate('/bidding');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: '#fafafa', minHeight: 'calc(100vh - 80px)', py: 4 }}>
        <Container maxWidth="md">
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/bidding')}
            sx={{ mb: 3 }}
          >
            Back to Bidding
          </Button>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/bidding')}>
            Return to Bidding Platform
          </Button>
        </Container>
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box sx={{ bgcolor: '#fafafa', minHeight: 'calc(100vh - 80px)', py: 4 }}>
        <Container maxWidth="md">
          <Alert severity="error">Vehicle not found.</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: 'calc(100vh - 80px)', py: 4 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/bidding')}
          sx={{ mb: 3 }}
        >
          Back to Bidding
        </Button>

        <Paper sx={{ p: 4 }}>
          {/* Page Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
            <BiddingIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Place Your Bid
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Make an offer on this vehicle
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={4}>
            {/* Vehicle Details Section */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Vehicle Details
              </Typography>

              {/* Vehicle Image */}
              <Card sx={{ mb: 3, overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="280"
                  image={vehicle.images?.[0]?.url || 'https://via.placeholder.com/400x280?text=Vehicle+Image'}
                  alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
                  sx={{ objectFit: 'cover' }}
                />
              </Card>

              {/* Vehicle Info */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {vehicle.year} {vehicle.brand} {vehicle.model}
                </Typography>

                {/* Details Grid */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Mileage
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {vehicle.mileage?.toLocaleString()} km
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Fuel Type
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {vehicle.fuelType}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Transmission
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {vehicle.transmission}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Body Type
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {vehicle.bodyType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Location
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      📍 {vehicle.location?.city || 'Location not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Condition
                    </Typography>
                    <Chip
                      label={vehicle.condition}
                      size="small"
                      color={vehicle.condition === 'Excellent' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Current Bid Info */}
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffe0b2' }}>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                  Current Highest Bid
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main', mb: 1 }}>
                  LKR {vehicle.currentBid?.toLocaleString()}
                </Typography>

                {vehicle.highestBidder && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                      Highest Bidder
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {vehicle.highestBidder.firstName} {vehicle.highestBidder.lastName}
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>

            {/* Bidding Form Section */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Enter Your Bid
              </Typography>

              {/* Error Alert */}
              {bidError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBidError('')}>
                  {bidError}
                </Alert>
              )}

              {/* Bid Amount Input */}
              <TextField
                fullWidth
                label="Your Bid Amount (LKR)"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={Math.round(vehicle.currentBid * 1.1).toLocaleString()}
                variant="outlined"
                sx={{ mb: 3 }}
                disabled={submitting}
                inputProps={{
                  step: '50000',
                  min: Math.round(vehicle.currentBid + 1),
                }}
                helperText={`Minimum bid: LKR ${(vehicle.currentBid + 1).toLocaleString()}`}
              />

              {/* Bid Message Input */}
              <TextField
                fullWidth
                label="Message to Seller (Optional)"
                multiline
                rows={4}
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
                placeholder="Add any message for the seller (e.g., 'Interested in immediate purchase', 'Can arrange pickup')"
                variant="outlined"
                sx={{ mb: 3 }}
                disabled={submitting}
              />

              {/* Terms & Conditions */}
              <Box sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  📋 By placing a bid, you agree to the bidding terms and conditions. 
                  If you win, you're committed to completing the transaction.
                </Typography>
              </Box>

              {/* Submit Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<BiddingIcon />}
                onClick={handleBidSubmit}
                disabled={submitting || !bidAmount}
                sx={{ p: 1.5, fontWeight: 600 }}
              >
                {submitting ? 'Placing Bid...' : 'Place Bid'}
              </Button>

              {/* Cancel Button */}
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigate('/bidding')}
                disabled={submitting}
                sx={{ mt: 2, p: 1.5 }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={handleSuccessClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', display: 'block', mb: 1, mx: 'auto' }} />
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Bid Placed Successfully!
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            You are now the highest bidder for the {vehicle.year} {vehicle.brand} {vehicle.model}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Bid Amount: LKR {bidAmount ? parseFloat(bidAmount).toLocaleString() : '0'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={handleSuccessClose} autoFocus>
            Back to Bidding
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlaceBidPage;
