/**
 * Verification Page
 * Multi-step verification: Email OTP, ID Upload, Face Verification
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Email,
  Badge,
  Face,
  CheckCircle,
  CloudUpload,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const steps = ['Email Verification', 'ID Verification', 'Face Verification'];

const VerificationPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Email verification
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // ID verification
  const [idFile, setIdFile] = useState(null);
  
  // Face verification
  const [selfieFile, setSelfieFile] = useState(null);

  // Determine initial step based on user verification status
  React.useEffect(() => {
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

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp');
      setOtpSent(true);
      setSuccess('OTP sent to your email address');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { otp });
      await refreshUser();
      setSuccess('Email verified successfully!');
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
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
      await api.post('/auth/verify-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      setSuccess('ID verified successfully!');
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'ID verification failed');
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
                We'll send a 6-digit code to {user?.email}
              </Typography>
              
              {!otpSent ? (
                <Button
                  variant="contained"
                  onClick={handleSendOTP}
                  disabled={loading}
                  sx={{ px: 4 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send OTP'}
                </Button>
              ) : (
                <Box>
                  <TextField
                    label="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    sx={{ mb: 2, width: 200 }}
                    inputProps={{ maxLength: 6 }}
                  />
                  <Box>
                    <Button
                      variant="contained"
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.length !== 6}
                      sx={{ mr: 1 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Verify'}
                    </Button>
                    <Button onClick={handleSendOTP} disabled={loading}>
                      Resend
                    </Button>
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
              <Badge sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Upload Your ID
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload a clear photo of your government-issued ID (NIC, Passport, or Driver's License)
              </Typography>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setIdFile(e.target.files[0])}
              />
              
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: idFile ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  mb: 3,
                  cursor: 'pointer',
                  bgcolor: idFile ? 'primary.light' : 'transparent',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography>
                  {idFile ? idFile.name : 'Click to upload or drag and drop'}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                onClick={handleUploadID}
                disabled={loading || !idFile}
                sx={{ px: 4 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify ID'}
              </Button>
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
