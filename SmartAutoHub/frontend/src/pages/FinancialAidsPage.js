/**
 * Financial Aids Page
 * Clean white page with back button
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Paper,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const FinancialAidsPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page (vehicle details)
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#ffffff', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            sx={{
              color: '#1976d2',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#f5f5f5',
              }
            }}
          >
            Back to Vehicle Details
          </Button>
        </Box>

        {/* Content Area - Blank White Page */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: '#999999',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            Financial Aids Content Coming Soon
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default FinancialAidsPage;
