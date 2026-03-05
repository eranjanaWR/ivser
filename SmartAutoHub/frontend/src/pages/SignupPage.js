/**
 * Signup Page
 * Registration form with role selection
 */

import React, { useState } from 'react';
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
} from '@mui/material';
import { Visibility, VisibilityOff, DirectionsCar } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const roles = [
  { value: 'buyer', label: 'Buyer', description: 'Browse and purchase vehicles' },
  { value: 'seller', label: 'Seller', description: 'List and sell your vehicles' },
  { value: 'repairman', label: 'Repairman', description: 'Offer repair services' },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    clearError();
    setValidationError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
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
    const result = await signup({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
    });
    if (result.success) {
      navigate('/verification');
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

          {/* Signup Form */}
          <Box component="form" onSubmit={handleSubmit}>
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
