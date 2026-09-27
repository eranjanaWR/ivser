import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';

const PrivacyPolicyPage = () => {
  return (
    <Box sx={{ py: 6, bgcolor: '#f5f5f5', minHeight: '80vh' }}>
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 3, md: 5 } }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Privacy Policy
          </Typography>

          <Typography variant="body1" paragraph>
            At TakGaala.lk, we respect your privacy and are committed to
            protecting your personal information.
          </Typography>

          <Typography variant="h5" gutterBottom>
            Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We may collect information such as your name, email address,
            contact details, account information, and information related to
            vehicles and services you use through our platform.
          </Typography>

          <Typography variant="h5" gutterBottom>
            How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            Your information may be used to provide and improve our services,
            manage your account, process requests, communicate with you, and
            maintain the security of the application.
          </Typography>

          <Typography variant="h5" gutterBottom>
            Data Protection
          </Typography>
          <Typography variant="body1" paragraph>
            We take reasonable measures to protect your personal information
            from unauthorized access, alteration, disclosure, or destruction.
          </Typography>

          <Typography variant="h5" gutterBottom>
            Contact Us
          </Typography>
          <Typography variant="body1">
            If you have questions about this Privacy Policy, please contact
            the application administration team.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default PrivacyPolicyPage;
