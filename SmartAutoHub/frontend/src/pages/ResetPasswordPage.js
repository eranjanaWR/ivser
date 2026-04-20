/**
 * Reset Password Page
 * Allows users to enter OTP, verify identity, and create a new password
 */

import React, { useState, useRef } from 'react';
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
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { resetPassword, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // Step 1: Email & OTP, Step 2: Password
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const otpInputRefs = useRef([]);

  // Handle OTP digit input
  const handleOtpChange = (index, value) => {
    clearError();

    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6);

    const newDigits = [...otpDigits];
    digits.forEach((digit, index) => {
      newDigits[index] = digit;
    });
    setOtpDigits(newDigits);

    // Focus last input
    if (digits.length > 0) {
      otpInputRefs.current[Math.min(digits.length - 1, 5)]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const newDigits = [...otpDigits];
      if (newDigits[index]) {
        newDigits[index] = '';
        setOtpDigits(newDigits);
      } else if (index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Verify OTP and proceed to password step
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');

    if (otp.length !== 6) {
      return;
    }

    if (!email) {
      return;
    }

    setLoading(true);
    // Move to password step - actual verification happens on submit
    setStep(2);
    setLoading(false);
  };

  // Handle password reset submission
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    if (newPassword.length < 6) {
      return;
    }

    const otp = otpDigits.join('');

    setLoading(true);
    const result = await resetPassword(email, otp, newPassword);
    setLoading(false);

    if (result.success) {
      setPasswordReset(true);
    }
  };

  if (passwordReset) {
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
              Password Reset Successful!
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Your password has been successfully reset. You can now login with
              your new password.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ py: 1.5 }}
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
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
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
              textAlign: 'center',
            }}
          >
            Reset Your Password
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              mb: 3,
            }}
          >
            {step === 1
              ? 'Enter your email and verify with the OTP code we sent'
              : 'Create a new password for your account'}
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Step 1: Email & OTP Verification */}
          {step === 1 && (
            <>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  clearError();
                  setEmail(e.target.value);
                }}
                placeholder="your@email.com"
                required
                disabled={loading}
                sx={{ mb: 3 }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: 'text.primary',
                }}
              >
                Enter the 6-digit code sent to your email:
              </Typography>

              {/* OTP Input Fields */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mb: 3,
                  justifyContent: 'center',
                }}
              >
                {otpDigits.map((digit, index) => (
                  <TextField
                    key={index}
                    inputRef={(el) => (otpInputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        padding: '12px 0',
                      },
                      inputMode: 'numeric',
                    }}
                    disabled={loading}
                    sx={{
                      width: 52,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                ))}
              </Box>

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  color: 'warning.main',
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                ⏱️ Code expires in 1 minute
              </Typography>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading || otpDigits.join('').length !== 6 || !email}
                sx={{ py: 1.5, mb: 2 }}
                onClick={handleVerifyOtp}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Verify Code'
                )}
              </Button>

              <Typography
                variant="body2"
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              >
                <Link
                  to="/forgot-password"
                  style={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Didn't receive the code? Request a new one
                </Link>
              </Typography>
            </>
          )}

          {/* Step 2: Password Reset */}
          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  clearError();
                  setNewPassword(e.target.value);
                }}
                required
                disabled={loading}
                placeholder="At least 6 characters"
                InputProps={{
                  endAdornment: (
                    <Button
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{
                        minWidth: 'auto',
                        p: 0.5,
                        color: 'inherit',
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </Button>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  clearError();
                  setConfirmPassword(e.target.value);
                }}
                required
                disabled={loading}
                placeholder="Re-enter your password"
                InputProps={{
                  endAdornment: (
                    <Button
                      size="small"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      sx={{
                        minWidth: 'auto',
                        p: 0.5,
                        color: 'inherit',
                      }}
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </Button>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    Passwords do not match
                  </Alert>
                )}

              {newPassword && newPassword.length < 6 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  Password must be at least 6 characters
                </Alert>
              )}

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
                    <strong>Password Requirements:</strong>
                    <br />• At least 6 characters
                    <br />• Mix of letters, numbers, and symbols recommended
                    <br />• Don't reuse old passwords
                  </Typography>
                </CardContent>
              </Card>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={
                  loading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 6
                }
                sx={{ py: 1.5, mb: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Reset Password'
                )}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="primary"
                disabled={loading}
                onClick={() => {
                  setStep(1);
                  clearError();
                }}
                sx={{ py: 1.5 }}
              >
                Back
              </Button>
            </form>
          )}

          {/* Back to Login Link */}
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              mt: 2,
            }}
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
};

export default ResetPasswordPage;
