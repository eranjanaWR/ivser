/**
 * Verification Page
 * Email OTP verification
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Email,
  CheckCircle,
  Timer,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const steps = ['Email Verification'];
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const VerificationPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const otpInputRefs = useRef([]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Email verification
  const [otpDigits, setOtpDigits] = useState(new Array(OTP_LENGTH).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  

  // Resend cooldown timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);


  // Determine initial step based on email verification status
  useEffect(() => {
    if (user?.isEmailVerified) {
      navigate('/');
    }
  }, [user, navigate]);

  // Handle individual OTP digit input
  const handleOtpChange = (index, value) => {
    // Allow only digits
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Move to previous input on Backspace if current is empty
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (paste.length > 0) {
      const newDigits = [...otpDigits];
      paste.split('').forEach((char, i) => {
        newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      // Focus last filled input or the next empty one
      const focusIndex = Math.min(paste.length, OTP_LENGTH - 1);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  const getFullOtp = useCallback(() => otpDigits.join(''), [otpDigits]);

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp');
      setOtpSent(true);
      setOtpDigits(new Array(OTP_LENGTH).fill(''));
      setResendTimer(RESEND_COOLDOWN);
      setSuccess('OTP sent to your email address! Check your inbox (and spam folder).');
      // Focus the first OTP input after a short delay
      setTimeout(() => otpInputRefs.current[0]?.focus(), 300);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    const otp = getFullOtp();
    if (otp.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { otp });
      await refreshUser();
      setSuccess('Email verified successfully!');
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      // Clear OTP fields on failure
      setOtpDigits(new Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
    setLoading(false);
  };


  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Email sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Verify Your Email
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                We'll send a 6-digit code to <strong>{user?.email}</strong>
              </Typography>
              
              {!otpSent ? (
                <Button
                  variant="contained"
                  onClick={handleSendOTP}
                  disabled={loading}
                  size="large"
                  sx={{ px: 5, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send OTP'}
                </Button>
              ) : (
                <Box>
                  {/* Individual OTP digit inputs */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 3 }}>
                    {otpDigits.map((digit, index) => (
                      <TextField
                        key={index}
                        inputRef={(el) => (otpInputRefs.current[index] = el)}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
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

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleVerifyOTP}
                      disabled={loading || getFullOtp().length !== OTP_LENGTH}
                      size="large"
                      sx={{ px: 5 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
                    </Button>
                  </Box>

                  {/* Resend with cooldown timer */}
                  <Box sx={{ mt: 2 }}>
                    {resendTimer > 0 ? (
                      <Chip
                        icon={<Timer />}
                        label={`Resend available in ${resendTimer}s`}
                        variant="outlined"
                        color="default"
                        size="small"
                      />
                    ) : (
                      <Button
                        onClick={handleSendOTP}
                        disabled={loading}
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        Didn't receive the code? Resend OTP
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box sx={{ py: 6, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ mb: 1 }}>
          Account Verification
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Complete these steps to unlock all features
        </Typography>
        

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {renderStepContent()}
      </Container>
    </Box>
  );
};

export default VerificationPage;



