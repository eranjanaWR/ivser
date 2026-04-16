/**
 * Bid Placement Form Component
 * Handles bidding with validation and real-time feedback
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  LocalOffer as BidIcon,
} from '@mui/icons-material';
import api from '../services/api';

const BidPlacementForm = ({ open, onClose, vehicle, currentBid, onBidSuccess }) => {
  const theme = useTheme();
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setBidAmount('');
      setMessage('');
      setError('');
      setSuccessMessage('');
      setValidationError('');
    }
  }, [open]);

  // Validate bid amount in real-time
  useEffect(() => {
    if (bidAmount) {
      const amount = parseFloat(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        setValidationError('Bid amount must be a positive number');
      } else if (amount <= currentBid) {
        setValidationError(`Bid must be higher than current bid (LKR ${currentBid?.toLocaleString() || '0'})`);
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [bidAmount, currentBid]);

  const handleBidAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBidAmount(value);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');

    // Final validation
    if (!bidAmount || bidAmount.trim() === '') {
      setError('Please enter a bid amount');
      return;
    }

    const amount = parseFloat(bidAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Bid amount must be a positive number');
      return;
    }

    if (amount <= currentBid) {
      setError(`Bid must be higher than current bid (LKR ${currentBid?.toLocaleString() || '0'})`);
      return;
    }

    setLoading(true);

    try {
      // Capture bidder's current location using Geolocation API
      let bidderLocation = null;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true,
            });
          });

          bidderLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch (geoError) {
          console.warn('Geolocation not available or denied:', geoError.message);
          // Continue without location if geolocation fails
        }
      }

      const payload = {
        bidAmount: amount,
      };

      // Add optional message if provided
      if (message.trim()) {
        payload.message = message.trim();
      }

      // Add location data if captured
      if (bidderLocation) {
        payload.location = bidderLocation;
      }

      const response = await api.post(`/auction-vehicles/${vehicle._id}/bid`, payload);

      if (response.data.success) {
        setSuccessMessage(`Bid of LKR ${amount.toLocaleString()} placed successfully! 🎉`);

        // Call success callback
        if (onBidSuccess) {
          onBidSuccess(response.data.data);
        }

        // Close dialog after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to place bid');
      }
    } catch (err) {
      console.error('Bid submission error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to place bid. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setBidAmount('');
    setMessage('');
    setError('');
    setSuccessMessage('');
    setValidationError('');
    onClose();
  };

  const isFormValid = bidAmount && !validationError && parseFloat(bidAmount) > currentBid;
  const bidIncrement = currentBid ? Math.ceil(currentBid * 0.05) : 1000; // 5% increase suggestion
  const suggestedBid = currentBid + bidIncrement;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
        },
      }}
    >
      {/* Dialog Title */}
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 2,
        }}
      >
        <BidIcon sx={{ fontSize: 28 }} />
        Place Your Bid
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Success Message */}
        {successMessage && (
          <Alert
            severity="success"
            icon={<CheckIcon />}
            sx={{ mb: 2, animation: 'pulse 0.5s ease-in-out' }}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Bid Info */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: theme.palette.action.hover,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                CURRENT HIGHEST BID
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: theme.palette.primary.main, mt: 0.5 }}
              >
                LKR {currentBid?.toLocaleString() || '0'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                VEHICLE
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: theme.palette.text.primary, mt: 0.5, fontSize: 14 }}
              >
                {vehicle?.year} {vehicle?.brand} {vehicle?.model}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Bid Amount Input */}
        <TextField
          label="Bid Amount (LKR)"
          value={bidAmount}
          onChange={handleBidAmountChange}
          placeholder="Enter bid amount"
          fullWidth
          type="text"
          inputMode="decimal"
          margin="normal"
          error={!!validationError && bidAmount !== ''}
          helperText={validationError}
          disabled={loading || !!successMessage}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <Typography sx={{ mr: 1, color: theme.palette.text.secondary, fontWeight: 600 }}>
                LKR
              </Typography>
            ),
          }}
        />

        {/* Suggested Bid */}
        {currentBid > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              💡 Suggested bid: LKR {suggestedBid?.toLocaleString()}
            </Typography>
            <Button
              size="small"
              variant="text"
              sx={{
                ml: 1,
                color: theme.palette.primary.main,
                textTransform: 'none',
                fontSize: 12,
                '&:hover': {
                  bgcolor: theme.palette.primary.light + '20',
                },
              }}
              onClick={() => setBidAmount(suggestedBid.toString())}
              disabled={loading || !!successMessage}
            >
              Use This Amount
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Optional Message */}
        <TextField
          label="Message (Optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message with your bid..."
          fullWidth
          multiline
          rows={3}
          margin="normal"
          disabled={loading || !!successMessage}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
        />

        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 1 }}>
          {message.length}/200 characters
        </Typography>

        {/* Validation Info */}
        {bidAmount && isFormValid && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 2,
              p: 1.5,
              bgcolor: theme.palette.success.light + '20',
              border: `1px solid ${theme.palette.success.main}`,
              borderRadius: 1,
            }}
          >
            <CheckIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
              Your bid is valid and ready to submit
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || loading || !!successMessage}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            '&:disabled': {
              bgcolor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
            },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
              Submitting...
            </>
          ) : successMessage ? (
            <>
              <CheckIcon sx={{ mr: 1, fontSize: 20 }} />
              Bid Submitted
            </>
          ) : (
            `Submit Bid (LKR ${bidAmount ? parseFloat(bidAmount).toLocaleString() : '0'})`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BidPlacementForm;
