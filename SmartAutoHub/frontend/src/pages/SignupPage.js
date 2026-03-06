/**
 * Signup Page
 * Registration form with basic info and optional profile image.
 * ID verification is done separately on the Verification page.
 */

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  DirectionsCar,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const roles = [
  { value: 'buyer', label: 'Buyer', description: 'Browse and purchase vehicles' },
  { value: 'seller', label: 'Seller', description: 'List and sell your vehicles' },
  { value: 'repairman', label: 'Repairman', description: 'Offer repair services' },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useAuth();
  const profileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idCardNumber: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile image state
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const handleChange = (e) => {
    clearError();
    setValidationError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle profile image selection
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setValidationError('Profile image must be under 10 MB');
        return;
      }
      setProfileImage(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMsg('');

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      setValidationError('Please enter both first and last name');
      return;
    }
    if (!formData.idCardNumber || formData.idCardNumber.trim().length < 5) {
      setValidationError('Please enter a valid ID card number');
      return;
    }

    // Build FormData for multipart upload (profile image only)
    const fd = new FormData();
    fd.append('firstName', formData.firstName);
    fd.append('lastName', formData.lastName);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    fd.append('idCardNumber', formData.idCardNumber);
    fd.append('password', formData.password);
    fd.append('role', formData.role);

    if (profileImage) {
      fd.append('profileImage', profileImage);
    }

    const result = await signup(fd);

    if (result.success) {
      setSuccessMsg('Account created! Redirecting to email verification...');
      setTimeout(() => navigate('/verification'), 2000);
    }
  };

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
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <DirectionsCar sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join SmartAuto Hub today
            </Typography>
          </Box>

          {/* Error Alert */}
          {(error || validationError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || validationError}
            </Alert>
          )}

          {/* Success Alert */}
          {successMsg && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMsg}
            </Alert>
          )}

          {/* Signup Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* ── Profile Image Upload ── */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <input
                type="file"
                ref={profileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfileImageChange}
              />
              <Avatar
                src={profilePreview || undefined}
                sx={{
                  width: 90,
                  height: 90,
                  mx: 'auto',
                  mb: 1,
                  cursor: 'pointer',
                  bgcolor: profilePreview ? 'transparent' : 'grey.300',
                  border: '2px dashed',
                  borderColor: profilePreview ? 'primary.main' : 'grey.400',
                  '&:hover': { borderColor: 'primary.main', opacity: 0.85 },
                }}
                onClick={() => profileInputRef.current?.click()}
              >
                {!profilePreview && <Person sx={{ fontSize: 40, color: 'grey.500' }} />}
              </Avatar>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: 'pointer' }}
                onClick={() => profileInputRef.current?.click()}
              >
                {profileImage ? profileImage.name : 'Upload Profile Photo (optional)'}
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <InputLabel>I want to</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="I want to"
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="ID Card Number (NIC / Passport / License)"
              name="idCardNumber"
              value={formData.idCardNumber}
              onChange={handleChange}
              required
              sx={{ mb: 2.5 }}
              helperText="Enter your government-issued ID number"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 2.5 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignupPage;
