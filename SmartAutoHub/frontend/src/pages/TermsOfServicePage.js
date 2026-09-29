import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';

const TermsOfServicePage = () => {
  return (
    <Box sx={{ py: 6, bgcolor: '#f5f5f5', minHeight: '80vh' }}>
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 3, md: 5 } }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Terms of Service
          </Typography>

          <Typography variant="body1" paragraph>
            By using TakGaala.lk, you agree to comply with these Terms of
            Service and use the platform responsibly.
          </Typography>

          <Typography variant="h5" gutterBottom>
            Use of the Service
          </Typography>
          <Typography variant="body1" paragraph>
            You are responsible for providing accurate information when
            creating an account and for using the application in accordance
            with applicable laws and regulations.
          </Typography>

          <Typography variant="h5" gutterBottom>
            User Accounts
          </Typography>
          <Typography variant="body1" paragraph>
            Users are responsible for maintaining the confidentiality of their
            account information and for activities performed through their
            accounts.
          </Typography>

          <Typography variant="h5" gutterBottom>
            Vehicle Listings
          </Typography>
          <Typography variant="body1" paragraph>
            Users who create vehicle listings are responsible for ensuring that
            the information they provide is accurate and does not violate the
            rights of others.
          </Typography>

          <Typography variant="h5" gutterBottom>
            Prohibited Activities
          </Typography>
          <Typography variant="body1" paragraph>
            Users must not misuse the platform, provide fraudulent information,
            interfere with the operation of the service, or use the platform
            for unlawful purposes.
          </Typography>

          <Typography variant="h5" gutterBottom>
            Changes to These Terms
          </Typography>
          <Typography variant="body1">
            These Terms of Service may be updated when necessary. Continued use
            of the application after changes are made indicates acceptance of
            the updated terms.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default TermsOfServicePage;
