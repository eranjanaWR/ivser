/**
 * Verification Page
 * Multi-step verification: Email OTP, ID Upload, Face Verification
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
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Email,
  Badge,
  Face,
  CheckCircle,
  CloudUpload,
  Timer,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const steps = ['Email Verification', 'ID Verification', 'Face Verification'];
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const VerificationPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  const otpInputRefs = useRef([]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Email verification
  const [otpDigits, setOtpDigits] = useState(new Array(OTP_LENGTH).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // ID verification
  const [idFile, setIdFile] = useState(null);
  
  // Face verification
  const [selfieFile, setSelfieFile] = useState(null);

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

  // Auto-verify ID when file is selected using Tesseract.js
  useEffect(() => {
    if (idFile && activeStep === 1) {
      handleUploadID();
    }
  }, [idFile, activeStep]);

  // Determine initial step based on user verification status
  useEffect(() => {
    if (user) {
      if (user.isEmailVerified && user.isIDVerified && user.isFaceVerified) {
        navigate('/');
      } else if (user.isEmailVerified && user.isIDVerified) {
        setActiveStep(2);
      } else if (user.isEmailVerified) {
        setActiveStep(1);
      }
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

  const handleUploadID = async () => {
    if (!idFile) {
      setError('Please select an ID document');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('idDocument', idFile);
    
    try {
      const response = await api.post('/auth/verify-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Only advance if verification was successful
      if (response.data.success) {
        await refreshUser();
        setSuccess('ID verified successfully! A confirmation email has been sent to you.');
        // Auto-move to next step after successful verification
        setTimeout(() => setActiveStep(2), 1500);
      } else {
        // If API returns false for success, treat as error
        setError(response.data.message || 'ID verification failed');
        setIdFile(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'ID verification failed. Please try again with a clear photo.');
      // Reset file selection on error
      setIdFile(null);
    }
    setLoading(false);
  };

  const handleUploadSelfie = async () => {
    if (!selfieFile) {
      setError('Please take or upload a selfie');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('selfie', selfieFile);
    
    try {
      await api.post('/auth/verify-face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      setSuccess('Face verification complete! Your account is now fully verified.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Face verification failed');
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
        
      case 1:
        return (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Badge sx={{ fontSize: 64, color: loading ? 'warning.main' : 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Upload Your ID
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1, textAlign: 'left' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                  📱 Photo Requirements:
                </Typography>
                <Typography variant="caption" component="div" sx={{ ml: 1, mb: 0.5, color: 'error.main', fontWeight: 'bold' }}>
                  ✓ Upload only horizontal pics
                </Typography>
                <Typography variant="caption" component="div" color="text.secondary" sx={{ ml: 1, mb: 0.5 }}>
                  ✓ <strong>Sharp & in focus</strong> - Not blurry
                </Typography>
                <Typography variant="caption" component="div" color="text.secondary" sx={{ ml: 1, mb: 0.5 }}>
                  ✓ <strong>Good lighting</strong> - No shadows or glare
                </Typography>
                <Typography variant="caption" component="div" color="text.secondary" sx={{ ml: 1, mb: 0.5 }}>
                  ✓ <strong>Straight-on angle</strong> - Not tilted
                </Typography>
                <Typography variant="caption" component="div" color="text.secondary" sx={{ ml: 1 }}>
                  ✓ <strong>Full ID visible</strong> - All edges in frame
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1.5, fontStyle: 'italic' }}>
                  Accepted documents: <strong>National ID Card (NIC), Passport, or Driver's License</strong>
                </Typography>
              </Box>
              
              {loading && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                  <CircularProgress size={32} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
                    Processing your ID with AI verification...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This may take a few seconds (Tesseract.js OCR processing)
                  </Typography>
                </Box>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setIdFile(e.target.files[0])}
                disabled={loading}
              />
              
              <Box
                onClick={() => !loading && fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: idFile ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  mb: 3,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  bgcolor: idFile ? 'primary.light' : 'transparent',
                  opacity: loading ? 0.6 : 1,
                  '&:hover': { borderColor: loading ? 'grey.300' : 'primary.main' },
                  transition: 'all 0.3s ease'
                }}
              >
                <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography>
                  {loading ? 'Verifying ID with Tesseract.js...' : idFile ? idFile.name : 'Click to upload or drag and drop'}
                </Typography>
              </Box>
              
              {!loading && idFile && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                  ✓ File selected. Verification starts automatically...
                </Typography>
              )}
            </CardContent>
          </Card>
        );
        
      case 2:
        return (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Face sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Face Verification
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Take a selfie or upload a clear photo of your face
              </Typography>
              
              <input
                type="file"
                ref={selfieInputRef}
                accept="image/*"
                capture="user"
                style={{ display: 'none' }}
                onChange={(e) => setSelfieFile(e.target.files[0])}
              />
              
              <Box
                onClick={() => selfieInputRef.current?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: selfieFile ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  mb: 3,
                  cursor: 'pointer',
                  bgcolor: selfieFile ? 'primary.light' : 'transparent',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Face sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography>
                  {selfieFile ? selfieFile.name : 'Click to take a selfie'}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                onClick={handleUploadSelfie}
                disabled={loading || !selfieFile}
                sx={{ px: 4 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Complete Verification'}
              </Button>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  // Show completion if all verified
  if (user?.isEmailVerified && user?.isIDVerified && user?.isFaceVerified) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" fontWeight="bold">
          Fully Verified!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Your account is now fully verified.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 6, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ mb: 1 }}>
          Account Verification
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Complete these steps to unlock all features
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={
              index === 0 ? user?.isEmailVerified :
              index === 1 ? user?.isIDVerified :
              user?.isFaceVerified
            }>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

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
