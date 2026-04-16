/**
 * CountdownTimer Component
 * Display countdown to auction start or end time
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { AccessTime as TimerIcon } from '@mui/icons-material';

const CountdownTimer = ({ 
  targetDate, 
  label = 'Starts in',
  variant = 'compact',
  size = 'small',
  onComplete = null  // ✅ NEW: Callback when countdown reaches 00:00:00
}) => {
  const [countdown, setCountdown] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const difference = new Date(targetDate) - now;

      if (difference <= 0) {
        if (!hasCompleted) {
          setCountdown('Started');
          setPercentage(100);
          setHasCompleted(true);
          // ✅ Trigger onComplete callback when countdown reaches 0
          if (onComplete && typeof onComplete === 'function') {
            onComplete();
          }
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete, hasCompleted]);

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TimerIcon sx={{ fontSize: size === 'small' ? 16 : 20, color: 'warning.main' }} />
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'} 
          sx={{ color: 'warning.main', fontWeight: 600 }}
        >
          {countdown}
        </Typography>
      </Box>
    );
  }

  if (variant === 'detailed') {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TimerIcon sx={{ fontSize: 20, color: 'info.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600, ml: 'auto' }}>
            {countdown}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={percentage}
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 2,
              backgroundColor: 'info.main'
            }
          }}
        />
      </Box>
    );
  }

  return (
    <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
      {label} {countdown}
    </Typography>
  );
};

export default CountdownTimer;
