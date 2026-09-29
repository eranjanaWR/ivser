/**
 * Forgot Password Page
 * Allows users to request a password reset by entering their email
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { Lock, Mail, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { forgotPassword, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailSent, setEmailSent] = useState('');

  const handleChange = (e) => {
    clearError();
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setEmailSent(email);
      setSubmitted(true);
      setEmail('');
    }
  };

  if (submitted) {
    return (
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#fafafa',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              border: '1px solid',
              borderColor: 'grey.200',
              textAlign: 'center',
            }}
          >
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
              Password Reset Email Sent
            </Typography>

            <Card
              sx={{
                mb: 3,
                bgcolor: '#e8f5e9',
                border: '1px solid',
                borderColor: 'success.lighter',
              }}
            >
              <CardContent>
                <Typography variant="body2" sx={{ color: '#1b5e20', mb: 1 }}>
                  We've sent a password reset OTP to:
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: '#1b5e20' }}
                >
                  {emailSent}
                </Typography>
              </CardContent>
            </Card>

            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              The OTP code is valid for <strong>1 minute only</strong>. Please
              check your email and use the code to reset your password.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Don't see the email? Check your spam or junk folder.
            </Alert>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ py: 1.5, mb: 2 }}
              onClick={() => {
                setSubmitted(false);
                navigate('/reset-password');
              }}
            >
              Enter Reset Code
            </Button>

            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 2 }}
            >
              Already have the code?{' '}
              <Link
                to="/reset-password"
                style={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Verify it here
              </Link>
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 2 }}
            >
              <Link
                to="/login"
                style={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Back to Login
              </Link>
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#fafafa',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          {/* Header Icon */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Lock
              sx={{
                fontSize: 48,
                color: 'primary.main',
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
              textAlign: 'center',
            }}
          >
            Forgot Password?
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              mb: 3,
            }}
          >
            Enter your email address and we'll send you an OTP to reset your
            password
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <Mail sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading || !email}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Code'
              )}
            </Button>
          </form>

          {/* Info Box */}
          <Card
            sx={{
              mb: 3,
              bgcolor: 'info.lighter',
              border: '1px solid',
              borderColor: 'info.lighter',
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Typography variant="body2" sx={{ color: 'info.dark' }}>
                <strong>How it works:</strong>
                <br />
                1. Enter your email address
                <br />
                2. We'll send you an OTP code
                <br />
                3. Enter the code to verify your identity
                <br />
                4. Create a new password and login
              </Typography>
            </CardContent>
          </Card>

          {/* Back to Login Link */}
          <Typography
            variant="body2"
            sx={{ textAlign: 'center', color: 'text.secondary' }}
          >
            Remember your password?{' '}
            <Link
              to="/login"
              style={{
                color: '#1976d2',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Login here
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
