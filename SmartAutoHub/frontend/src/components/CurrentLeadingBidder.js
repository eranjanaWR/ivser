/**
 * Current Leading Bidder Component
 * Displays real-time information about the highest bidder
 * Features: Avatar, bid amount, bid count, bid history timeline
 */

import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  useTheme,
  Grid,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

/**
 * Format currency to LKR with full precision and commas
 */
const formatLKR = (value) => {
  if (!value && value !== 0) return 'LKR 0';
  return `LKR ${Number(value).toLocaleString()}`;
};

/**
 * Format currency with abbreviations for small badges
 */
const formatShortLKR = (value) => {
  if (!value && value !== 0) return '0';
  const num = Math.abs(value);
  if (num >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return Math.round(value).toString();
};

/**
 * Get avatar initials from name
 */
const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || 'U';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

/**
 * Current Leading Bidder Component
 * @param {Object} highestBidder - Current highest bidder info
 * @param {Array} bidHistory - Array of all bids for the auction
 */
const CurrentLeadingBidder = ({ highestBidder = null, bidHistory = [] }) => {
  const theme = useTheme();

  /**
   * Calculate statistics for the current leading bidder
   * REWRITTEN: Strict filtering based ONLY on the identified leader
   */
  const bidderStats = useMemo(() => {
    if (!bidHistory || bidHistory.length === 0) {
      return null;
    }

    // 1. Identify the absolute highest bid to find the true leader
    const sortedAllBids = [...bidHistory].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    const leadingBid = sortedAllBids[0];
    const leadingUserId = leadingBid.bidderId?.toString();
    const leadingUserName = leadingBid.firstName; // Fallback if ID is missing

    // 2. Filter specifically for the Leader's bids ONLY
    const leadingUserBids = bidHistory.filter((bid) => {
      const bidUserId = bid.bidderId?.toString();
      if (leadingUserId && bidUserId) {
        return bidUserId === leadingUserId;
      }
      // Fallback to name ONLY if IDs are unavailable
      return bid.firstName === leadingUserName;
    });

    if (leadingUserBids.length === 0) {
      return null;
    }

    // 3. Derive Stats from the Filtered Array ONLY
    const sortedLeaderBids = [...leadingUserBids].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    const winningBidAmount = sortedLeaderBids[0].amount || 0;
    const minBidAmount = Math.min(...leadingUserBids.map(b => b.amount || 0));

    // Previous bids (all except the current winning bid)
    const previousBids = sortedLeaderBids.slice(1).map((bid) => ({
      amount: bid.amount,
      formatted: `LKR ${formatShortLKR(bid.amount)}`,
    }));

    return {
      totalBids: leadingUserBids.length,
      currentBid: winningBidAmount,
      minBid: minBidAmount,
      previousBids,
    };
  }, [bidHistory]);

  // Empty state
  if (!highestBidder || !bidderStats) {
    return (
      <Paper
        sx={{
          p: 1.8,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          border: `2px dashed ${theme.palette.divider}`,
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <TrophyIcon
          sx={{
            fontSize: 40,
            color: theme.palette.action.disabled,
            mb: 0.5,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 600,
            mb: 0.3,
            fontSize: '0.9rem',
          }}
        >
          No Leading Bidder
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}>
          Be first! 🚀
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 1.8,
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: 2,
        border: `3px solid ${theme.palette.warning.main}`, // Gold/Orange border
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background accent */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          bgcolor: theme.palette.warning.light,
          opacity: 0.1,
          zIndex: 0,
        }}
      />

      {/* Header with Title and Badge */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
          mb: 1.2,
          pb: 1.2,
          borderBottom: `2px solid ${theme.palette.divider}`,
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        <TrophyIcon
          sx={{
            color: theme.palette.warning.main,
            fontSize: 22,
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            flex: 1,
            fontSize: '0.95rem',
          }}
        >
          🏆 Leading Bidder
        </Typography>
        <Chip
          label="Leading"
          sx={{
            bgcolor: theme.palette.warning.main,
            color: 'white',
            fontWeight: 700,
            height: 24,
            fontSize: '11px',
          }}
        />
      </Box>

      {/* Bidder Info Section */}
      <Box sx={{ position: 'relative', zIndex: 1, overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Bidder Name and Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2, flexShrink: 0 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: theme.palette.warning.main,
              color: 'white',
              fontWeight: 700,
              fontSize: '16px',
              boxShadow: `0 2px 8px ${theme.palette.warning.main}40`,
              flexShrink: 0,
            }}
          >
            {getInitials(
              highestBidder.firstName,
              highestBidder.lastName
            )}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: '0.9rem',
              }}
            >
              {highestBidder.firstName} {highestBidder.lastName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
              }}
            >
              Bid #{bidderStats.totalBids}
            </Typography>
          </Box>
        </Box>

        {/* Current Bid - Large Display */}
        <Box
          sx={{
            mb: 1.2,
            p: 1.2,
            bgcolor: theme.palette.warning.light + '15',
            borderRadius: 1.5,
            borderLeft: `3px solid ${theme.palette.warning.main}`,
            flexShrink: 0,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              display: 'block',
              mb: 0.3,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            Winning Bid
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              color: theme.palette.warning.main,
              lineHeight: 1.2,
              fontSize: '1.1rem',
            }}
          >
            {formatLKR(bidderStats.currentBid)}
          </Typography>
        </Box>

        {/* Bid Statistics Grid */}
        <Grid container spacing={1} sx={{ mb: 1.2, flexShrink: 0 }}>
          {/* Total Bids Card */}
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1,
                bgcolor: theme.palette.primary.light + '10',
                borderRadius: 1,
                border: `1px solid ${theme.palette.primary.light}`,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  display: 'block',
                  mb: 0.2,
                  fontSize: '0.7rem',
                }}
              >
                Total
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  fontSize: '0.95rem',
                }}
              >
                {bidderStats.totalBids}
              </Typography>
            </Box>
          </Grid>

          {/* Min Bid Card */}
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1,
                bgcolor: theme.palette.success.light + '10',
                borderRadius: 1,
                border: `1px solid ${theme.palette.success.light}`,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  display: 'block',
                  mb: 0.2,
                  fontSize: '0.7rem',
                }}
              >
                Min Bid
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.success.main,
                  fontSize: '0.8rem',
                  wordBreak: 'break-word',
                }}
              >
                {formatLKR(bidderStats.minBid)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Previous Bids Timeline */}
        {bidderStats.previousBids && bidderStats.previousBids.length > 0 && (
          <Box sx={{ flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6 }}>
              <TrendingIcon
                sx={{
                  fontSize: 16,
                  color: theme.palette.text.secondary,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: 0.4,
                }}
              >
                Bid History
              </Typography>
            </Box>

            {/* Bid Chips */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
              }}
            >
              {bidderStats.previousBids.slice(0, 6).map((bid, index) => (
                <Chip
                  key={`bid-${index}`}
                  label={bid.formatted}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    height: 24,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      bgcolor: theme.palette.primary.light + '20',
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                />
              ))}

              {/* Show more indicator */}
              {bidderStats.previousBids.length > 6 && (
                <Chip
                  label={`+${bidderStats.previousBids.length - 6} more`}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.warning.light + '20',
                    color: theme.palette.warning.main,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    height: 24,
                    border: `1px dashed ${theme.palette.warning.main}`,
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Status Bar */}
      <Box
        sx={{
          mt: 1,
          pt: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 0.6,
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: theme.palette.success.main,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.5,
              },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.success.main,
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          Live • Currently Winning
        </Typography>
      </Box>
    </Paper>
  );
};

export default CurrentLeadingBidder;
