/**
 * Login Page
 * Clean, minimal login form
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
} from '@mui/material';
import { Visibility, VisibilityOff, DirectionsCar } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    clearError();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
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
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your SmartAuto Hub account
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 2.5 }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Don't have an account?{' '}
              <Link
                to="/signup"
                style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
