import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';

const Admin2Dashboard = () => {
  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Admin Dashboard
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Admin2 dashboard is available for administrative functions.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Admin2Dashboard;
