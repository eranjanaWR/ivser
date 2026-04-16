/**
 * Bidder Leaderboard Component
 * Displays live-updating list of top bidders with avatars, usernames, total bids, and last bid amounts
 * Sorted by highest bid amount, updates in real-time via Socket.IO
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  AvatarGroup,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Timer as RecentIcon,
} from '@mui/icons-material';

/**
 * Get a consistent color based on bidder ID
 */
const getAvatarColor = (theme, index) => {
  const colors = [theme.palette.primary.main, theme.palette.error.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.secondary.main];
  return colors[index % colors.length];
};

/**
 * Format currency to LKR
 */
const formatLKR = (value) => {
  if (!value && value !== 0) return 'LKR 0';
  return `LKR ${Math.round(value).toLocaleString()}`;
};

/**
 * Bidder Leaderboard Component
 * @param {Array} topBidders - Array of top bidders with {firstName, lastName, bidCount, lastBid, _id}
 * @param {Object} highestBidder - Current highest bidder info
 * @param {Number} totalBids - Total number of bids made
 */
const BidderLeaderboard = ({ topBidders = [], highestBidder = null, totalBids = 0 }) => {
  const theme = useTheme();

  // Sort bidders by highest bid amount
  const sortedBidders = useMemo(() => {
    return [...topBidders]
      .sort((a, b) => (b.lastBid || 0) - (a.lastBid || 0))
      .slice(0, 5); // Show top 5
  }, [topBidders]);

  // Find max bid for progress bar
  const maxBid = useMemo(() => {
    if (sortedBidders.length === 0) return 0;
    return Math.max(...sortedBidders.map((b) => b.lastBid || 0));
  }, [sortedBidders]);

  if (sortedBidders.length === 0) {
    // Return nothing - completely remove empty state box
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrophyIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            🏆 Top Bidders
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Sorted by highest bid amount
          </Typography>
        </Box>
      </Box>

      {/* Stats Summary - Top */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={6}>
          <Paper
            sx={{
              p: 2,
              bgcolor: theme.palette.primary.light + '20',
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <TrendingIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Leading Bidder
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              {sortedBidders[0]?.firstName} {sortedBidders[0]?.lastName}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {formatLKR(sortedBidders[0]?.lastBid)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Paper
            sx={{
              p: 2,
              bgcolor: theme.palette.success.light + '20',
              border: `1px solid ${theme.palette.success.main}`,
              borderRadius: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <RecentIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Total Activity
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
              {sortedBidders.length} Active · {totalBids} Bids
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Bidders List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {sortedBidders.map((bidder, index) => {
          const isHighest = highestBidder?._id === bidder._id;
          const bidPercentage = maxBid > 0 ? (bidder.lastBid / maxBid) * 100 : 0;

          return (
            <Card
              key={bidder._id || index}
              sx={{
                bgcolor: isHighest ? theme.palette.warning.light + '15' : theme.palette.background.paper,
                border: `2px solid ${
                  isHighest ? theme.palette.warning.main : theme.palette.divider
                }`,
                borderRadius: 1.5,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: `0 8px 24px ${theme.palette.primary.main}30`,
                  bgcolor: isHighest ? theme.palette.warning.light + '25' : theme.palette.background.default,
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Rank and Bidder Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  {/* Rank Avatar */}
                  <Avatar
                    sx={{
                      background: isHighest 
                        ? `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.error.main})` 
                        : `linear-gradient(135deg, ${getAvatarColor(theme, index)}, ${getAvatarColor(theme, index + 1)})`,
                      color: 'white',
                      fontWeight: 700,
                      width: 40,
                      height: 40,
                      fontSize: 18,
                      boxShadow: isHighest ? `0 0 16px ${theme.palette.warning.main}60` : 'none',
                    }}
                  >
                    {isHighest ? '👑' : index + 1}
                  </Avatar>

                  {/* Bidder Details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          truncate: true,
                        }}
                      >
                        {bidder.firstName} {bidder.lastName}
                      </Typography>
                      {isHighest && (
                        <Chip
                          label="Leading"
                          size="small"
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
                            color: 'white',
                            height: 20,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {bidder.bidCount || 0} bids
                    </Typography>
                  </Box>

                  {/* Last Bid Amount */}
                  <Box sx={{ textAlign: 'right', minWidth: 'fit-content' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: isHighest ? theme.palette.warning.main : theme.palette.primary.main,
                      }}
                    >
                      {formatLKR(bidder.lastBid)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      Last Bid
                    </Typography>
                  </Box>
                </Box>

                {/* Progress Bar - Shows bid relative to highest */}
                <Box sx={{ mt: 1.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={bidPercentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: theme.palette.primary.light + '20',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: isHighest
                          ? `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`
                          : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        transition: 'all 0.5s ease',
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {bidPercentage.toFixed(0)}% of leading bid
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Additional Info Footer */}
      <Paper
        sx={{
          mt: 2,
          p: 2,
          bgcolor: theme.palette.primary.light + '10',
          borderRadius: 1.5,
          border: `1px dashed ${theme.palette.primary.main}`,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          ⚡ Leaderboard updates in real-time as bids are placed
        </Typography>
      </Paper>
    </Box>
  );
};

export default BidderLeaderboard;
