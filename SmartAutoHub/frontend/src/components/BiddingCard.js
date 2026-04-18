/**
 * BiddingCard Component
 * Displays a vehicle card for bidding with proper winner/owner detection
 * Fixes: Strict ID comparison, correct winner detection on closed auctions
 */

import React from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  EmojiEvents as TrophyIcon,
  Gavel,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';

const BiddingCard = ({ vehicle, isLive = true, isClosed = false, user, onCountdownComplete }) => {
  const navigate = useNavigate();
  const finalId = vehicle._id || vehicle.id;

  // ========== STRICT ID COMPARISON WITH .toString() ==========
  // Ensures both MongoDB ObjectId and String IDs are compared correctly
  const currentUserId = user?._id?.toString() || user?.id?.toString();
  const vehicleSellerId = vehicle?.sellerId?._id?.toString() || vehicle?.sellerId?.toString();

  // ✅ ALL THREE possible winner fields from the backend:
  // 1. vehicle.highestBidder — populated User object (main field in AuctionVehicle schema)
  // 2. vehicle.highestBidderId — alternative flat-ID field (some responses)
  // 3. vehicle.winnerId — set explicitly after seller clicks 'Accept Bid'
  const highestBidderObjId  = vehicle?.highestBidder?._id?.toString()  || (typeof vehicle?.highestBidder  === 'string' ? vehicle.highestBidder  : null);
  const highestBidderFlatId = vehicle?.highestBidderId?._id?.toString() || vehicle?.highestBidderId?.toString();
  const vehicleWinnerId     = vehicle?.winnerId?._id?.toString()         || vehicle?.winnerId?.toString();

  // ========== PERMISSIONS LOGIC ==========
  const isOwner = Boolean(currentUserId && vehicleSellerId && currentUserId === vehicleSellerId);
  const isWinner = Boolean(
    currentUserId && (
      (highestBidderObjId  && currentUserId === highestBidderObjId)  ||
      (highestBidderFlatId && currentUserId === highestBidderFlatId) ||
      (vehicleWinnerId     && currentUserId === vehicleWinnerId)
    )
  );
  // Case-insensitive closed check to handle 'closed', 'Completed', 'cancelled' etc.
  const statusLower = vehicle?.status?.toLowerCase() || '';
  const auctionIsClosed = isClosed || ['closed', 'completed', 'cancelled'].includes(statusLower) || new Date(vehicle?.auctionEndDate) <= new Date();

  const handleContactClick = () => {
    navigate(`/auction-result/${finalId}`);
  };

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
          icon={auctionIsClosed ? <TrophyIcon /> : isLive ? <TrendingUp /> : <Schedule />}
          label={auctionIsClosed ? 'CLOSED' : isLive ? 'LIVE' : 'UPCOMING'}
          color={auctionIsClosed ? 'success' : isLive ? 'error' : 'warning'}
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
        {auctionIsClosed && (
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
        {!isLive && !auctionIsClosed && (
          <Box sx={{ mb: 2 }}>
            <CountdownTimer 
              targetDate={vehicle.auctionStartDate}
              label="Bidding Starts"
              variant="detailed"
              onComplete={() => {
                if (onCountdownComplete) {
                  onCountdownComplete(vehicle._id);
                }
              }}
            />
          </Box>
        )}

        {/* Location */}
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          📍 {vehicle.location?.city || 'Location not specified'}
        </Typography>

        {/* ========== BUTTON SECTION WITH FIXED LOGIC ========== */}
        {!finalId ? (
          <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600, mt: 'auto', mb: 1 }}>
            ❌ Error: Missing Vehicle ID
          </Typography>
        ) : (
          <>
            {/* CLOSED AUCTION BUTTONS */}
            {auctionIsClosed ? (
              <>
                {isWinner ? (
                  // ✅ WINNER: Show green "Contact Seller" button
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<TrophyIcon />}
                    onClick={handleContactClick}
                    sx={{
                      mt: 'auto',
                      mb: 1,
                      backgroundColor: '#2e7d32',
                      color: 'white',
                      fontWeight: 700,
                      textTransform: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#1b5e20',
                      },
                    }}
                  >
                    🏆 Contact Seller
                  </Button>
                ) : isOwner ? (
                  // ✅ OWNER: Show blue "Contact Winner" button
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<TrophyIcon />}
                    onClick={handleContactClick}
                    sx={{
                      mt: 'auto',
                      mb: 1,
                      backgroundColor: '#1976d2',
                      color: 'white',
                      fontWeight: 700,
                      textTransform: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      },
                    }}
                  >
                    🤝 Contact Winner
                  </Button>
                ) : (
                  // ✅ OTHER BIDDERS: Show enabled "Auction Ended" button
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleContactClick}
                    sx={{
                      mt: 'auto',
                      mb: 1,
                      backgroundColor: '#616161',
                      color: 'white',
                      fontWeight: 700,
                      textTransform: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#424242',
                      },
                    }}
                  >
                    Auction Ended
                  </Button>
                )}
              </>
            ) : isLive ? (
              // LIVE AUCTION: Show "Place Bid" or "Manage Auction" button
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<Gavel />}
                onClick={() => navigate(`/bidding/${finalId}/place-bid`)}
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
                {isOwner ? 'Manage Auction' : 'Place Bid'}
              </Button>
            ) : (
              // UPCOMING AUCTION: Show disabled button
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

export default BiddingCard;
