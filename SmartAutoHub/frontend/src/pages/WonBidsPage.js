/**
 * Won Bids Page
 * Display user's won auctions
 */

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const WonBidsPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header with Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/bidding')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            My Won Bids
          </Typography>
        </Box>

        {/* Page Content will go here */}
        <Typography variant="body1" color="textSecondary">
          Your won bids will appear here soon.
        </Typography>
      </Container>
    </Box>
  );
};

export default WonBidsPage;
