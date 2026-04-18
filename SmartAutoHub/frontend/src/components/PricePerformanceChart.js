/**
 * Price Performance Chart Component
 * Advanced area chart showing bid price progression over time with dark theme
 * Features: gradient fill, bid labels, live updates, LKR formatting, tooltips, smooth animations
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  Label,
  LabelList,
} from 'recharts';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TrendingUp, FiberNew } from '@mui/icons-material';

/**
 * Format currency to LKR with enhanced precision for chart labels
 * Shows up to 2 decimals for millions to help differentiate close bids
 */
const formatLKRAxis = (value) => {
  if (!value && value !== 0) return '0';
  
  const num = Math.abs(value);
  if (num >= 1000000) {
    // Show up to 3 decimals for M to differentiate very close bids
    return (value / 1000000).toLocaleString(undefined, { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 3 
    }) + 'M';
  }
  if (num >= 1000) {
    // Show 1-2 decimals for K for granularity (e.g., 600.15K)
    return (value / 1000).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }) + 'K';
  }
  return Math.round(value).toString();
};

/**
 * Format currency to LKR with FULL precision for Tooltips and notifications
 * Shows exact amount with commas and no rounding
 * @param {number} value - The value to format
 * @returns {string} - Formatted currency string
 */
const formatLKR = (value) => {
  if (!value && value !== 0) return 'LKR 0';
  
  // Use toLocaleString for full precision with comma separators (e.g., 9,019,250)
  return `LKR ${Number(value).toLocaleString()}`;
};

/**
 * Format time to absolute time (HH:MM AM/PM)
 * @param {string|number} timestamp - ISO string or milliseconds
 * @returns {string} - Formatted time
 */
const formatAbsoluteTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (err) {
    return '';
  }
};

/**
 * Custom Tooltip Component - Dark theme with professional styling
 */
const CustomTooltip = ({ active, payload, label, theme, bidderName }) => {
  if (active && payload && payload[0]) {
    const data = payload[0].payload;
    return (
      <Paper
        sx={{
          p: 1.5,
          bgcolor: '#ffffff',
          border: `2px solid ${theme.palette.primary.main}`,
          borderRadius: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 700, 
            color: theme.palette.text.primary, 
            display: 'block',
            mb: 0.5 
          }}
        >
          Current Top: {bidderName || 'User'}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 600, 
            display: 'block', 
            mb: 0.5 
          }}
        >
          {formatLKR(data.price)}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: theme.palette.text.secondary, 
            display: 'block',
            opacity: 0.8
          }}
        >
          {formatAbsoluteTime(data.timestamp)}
        </Typography>
      </Paper>
    );
  }
  return null;
};

/**
 * Custom Dot Component - Blue stroke with white fill for exact grid positioning
 */
const CustomDot = ({ cx, cy, payload, isLatest, theme }) => {
  if (!payload || payload.price === undefined) return null;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={theme.palette.primary.light}
        stroke={theme.palette.primary.main}
        strokeWidth={2}
      />
    </g>
  );
};

const PricePerformanceChart = ({ priceHistory = [], highestBidder = null, startingPrice = 0, startTime = null }) => {
  const theme = useTheme();
  const [isNewBidReceived, setIsNewBidReceived] = useState(false);
  const [previousDataLength, setPreviousDataLength] = useState(0);

  // Detect new bid arrival and trigger animation
  useEffect(() => {
    if (priceHistory.length > previousDataLength) {
      setIsNewBidReceived(true);
      setPreviousDataLength(priceHistory.length);
      
      // Remove animation indicator after 2 seconds
      const timer = setTimeout(() => {
        setIsNewBidReceived(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [priceHistory.length, previousDataLength]);

  // Prepare chart data with labels and formatting
  const chartData = useMemo(() => {
    // Start with the base price node
    const baseNode = {
      price: Number(startingPrice) || 0,
      timestamp: startTime || new Date().toISOString(),
      bidLabel: 'Start',
      bidderName: 'Starting Price',
      formattedPrice: formatLKR(startingPrice),
      formattedTime: 'Start',
      isBase: true
    };

    if (!priceHistory || priceHistory.length === 0) {
      return [baseNode];
    }

    const bids = priceHistory.map((item, index) => ({
      ...item,
      index: index + 1,
      bidIndex: index + 1,
      bidLabel: item.bidLabel || `Bid ${index + 1}`,
      price: Number(item.price) || 0,
      timestamp: item.timestamp || new Date().toISOString(),
      formattedPrice: formatLKR(item.price),
      formattedTime: formatAbsoluteTime(item.timestamp),
    }));

    return [baseNode, ...bids];
  }, [priceHistory, startingPrice, startTime]);

  // Get latest bid for highlighting
  const latestBid = chartData.length > 1 ? chartData[chartData.length - 1] : null;

  // Calculate dynamic ticks for granular Y-axis visibility
  const dynamicTicks = useMemo(() => {
    const start = Number(startingPrice);
    const currentMax = latestBid ? latestBid.price : start;
    
    // Add a small buffer at the top (5%) for the maximum tick
    const chartMax = Math.max(currentMax * 1.05, start + 1000); 
    
    // Calculate interval for 6 ticks
    const range = chartMax - start;
    const step = range / 5;
    
    // Generate exactly 6 ticks starting from startingPrice
    return [0, 1, 2, 3, 4, 5].map(i => Math.round(start + (step * i)));
  }, [startingPrice, latestBid]);

  if (chartData.length === 0) {
    // Return nothing - completely remove empty state box
    return null;
  }

  return (
    <Box sx={{ width: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* New Bid Notification Badge */}
      {isNewBidReceived && latestBid && (
        <Paper
          sx={{
            mb: 0.5,
            p: 0.75,
            bgcolor: theme.palette.error.light + '20',
            border: `2px solid ${theme.palette.error.main}`,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            flexShrink: 0,
          }}
        >
          <FiberNew sx={{ color: theme.palette.error.main, fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.error.main, fontSize: '0.75rem' }}>
            🚀 NEW BID: {latestBid.bidderName} bid LKR {latestBid.formattedPrice}
          </Typography>
        </Paper>
      )}

      {/* Chart Container with Subtle Dark Gradient Background */}
      <Box 
        sx={{ 
          width: '100%', 
          flex: 1,
          minHeight: 0,
          position: 'relative', 
          mb: 0.5,
          background: 'linear-gradient(135deg, #f0f0f5 0%, #e8e8f0 100%)',
          borderRadius: 2,
          p: 1,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 45, bottom: 45 }}
          >
            {/* Gradient Definition - Enhanced colors for subtle dark background */}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#64b5f6" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#ba68c8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ef9a9a" stopOpacity={0.08} />
              </linearGradient>
            </defs>

            {/* Grid - Subtle with improved visibility */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
              opacity={0.6}
              vertical={false}
              horizontal={true}
            />

            {/* X-Axis: Absolute Time - Horizontal labels with improved contrast */}
            <XAxis
              dataKey="formattedTime"
              angle={0}
              textAnchor="middle"
              height={50}
              tick={{ fill: theme.palette.text.primary, fontSize: 10, opacity: 0.85 }}
              axisLine={{ stroke: theme.palette.divider, opacity: 0.6, strokeWidth: 1 }}
              tickLine={{ stroke: theme.palette.divider, opacity: 0.6 }}
            >
              <Label
                value="Time"
                position="insideBottom"
                offset={-12}
                style={{ fill: theme.palette.text.primary, fontWeight: 600, fontSize: 12 }}
              />
            </XAxis>

            {/* Y-Axis: Price in LKR - Anchored at Starting Price for clean baseline visibility */}
            <YAxis
              scale="linear"
              domain={[
                Number(startingPrice), 
                (dataMax) => Math.max(dataMax * 1.05, Number(startingPrice) + 1000) 
              ]}
              ticks={dynamicTicks}
              allowDataOverflow={true}
              tickFormatter={formatLKRAxis}
              label={{
                value: 'Price (LKR)',
                angle: -90,
                position: 'insideLeft',
                style: {
                  fill: theme.palette.text.primary,
                  fontSize: 12,
                  fontWeight: 600,
                  textAnchor: 'middle',
                },
                offset: 5,
              }}
              tick={{ fill: theme.palette.text.primary, fontSize: 10, opacity: 0.85 }}
              axisLine={{ stroke: theme.palette.divider, opacity: 0.6, strokeWidth: 1 }}
              tickLine={{ stroke: theme.palette.divider, opacity: 0.6 }}
              width={55} // Increased width for larger labels
            />

            {/* Tooltip with bidder name */}
            <Tooltip
              content={<CustomTooltip theme={theme} bidderName={highestBidder?.firstName} />}
              cursor={{
                strokeDasharray: '5 5',
                stroke: theme.palette.primary.main,
                opacity: 0.6,
                strokeWidth: 1,
              }}
              wrapperStyle={{ outline: 'none' }}
            />

            {/* Area Chart with Linear segments and Direct Data Labels */}
            <Area
              type="linear"
              dataKey="price"
              stroke={theme.palette.primary.main}
              strokeWidth={2.5}
              fill="url(#chartGradient)"
              dot={<CustomDot theme={theme} />}
              activeDot={<CustomDot theme={theme} />}
              isAnimationActive={true}
              animationDuration={500}
            >
              {/* Direct Price Labels above each dot */}
              <LabelList 
                dataKey="price" 
                position="top" 
                formatter={formatLKRAxis}
                offset={15}
                style={{ 
                  fill: theme.palette.primary.main, 
                  fontSize: 11, 
                  fontWeight: 700,
                  pointerEvents: 'none'
                }} 
              />
            </Area>

            {/* Vertical Reference Line at Latest Bid */}
            {latestBid && !latestBid.isBase && (
              <ReferenceLine
                x={latestBid.formattedTime}
                stroke={theme.palette.error.main}
                strokeDasharray="5 5"
                opacity={0.4}
              />
            )}

            {/* Current Top Bid Label */}
            {latestBid && (
              <ReferenceDot
                x={latestBid.formattedTime}
                y={latestBid.price}
                r={6}
                fill={theme.palette.error.main}
                stroke={theme.palette.error.light}
                strokeWidth={2}
                label={{
                  value: `Top: ${highestBidder?.firstName || 'User'}`,
                  position: 'top',
                  fill: theme.palette.error.main,
                  fontSize: 11,
                  fontWeight: 700,
                  offset: 20,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      {/* Legend Section */}
      <Paper sx={{ p: 1, bgcolor: theme.palette.background.paper, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 16, color: theme.palette.primary.main }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.8rem' }}>
              Price Intensity Legend
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={0.8} sx={{ mt: 0 }}>
          {/* Blue - Low/Starting Bids */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.main,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', fontSize: '0.7rem' }}>
                  Low
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.75rem' }}>
                  Start
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Purple - Medium Bids */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: theme.palette.secondary.main,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', fontSize: '0.7rem' }}>
                  Medium
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.75rem' }}>
                  Progress
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Red - High Bids */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: theme.palette.error.main,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', fontSize: '0.7rem' }}>
                  High
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.75rem' }}>
                  Top Bid
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 0.75, bgcolor: theme.palette.primary.light + '10', borderRadius: 1, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.2, fontSize: '0.7rem' }}>
                Total
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '0.95rem' }}>
                {chartData.length}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PricePerformanceChart;
