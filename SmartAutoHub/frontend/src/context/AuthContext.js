/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
        } catch (err) {
          console.error('Auth initialization error:', err);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  // Signup function — accepts FormData (multipart) for file uploads
  const signup = async (userData) => {
    try {
      setError(null);

      // Determine config: if FormData, let axios/browser handle Content-Type
      // (should NOT be set explicitly, browser will add boundary)
      const isFormData = userData instanceof FormData;
      const config = isFormData
        ? { headers: {} }
        : {};

      const response = await api.post('/auth/register', userData, config);

      // Check if response is successful
      if (!response.data || !response.data.data) {
        // If registration succeeds but data is malformed, throw error
        throw new Error('Invalid response from server');
      }
      const { user, token, emailSent } = response.data.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return {
        success: true,
        user,
        emailSent,
      };
    } catch (err) {
      // Handle validation errors with specific field messages
      let message = 'Signup failed';
      
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Extract specific validation errors
        const fieldErrors = err.response.data.errors
          .map(err => `${err.field}: ${err.message}`)
          .join(', ');
        message = fieldErrors || err.response.data.message || message;
      } else {
        message = err.response?.data?.message || message;
      }
      
      setError(message);
      return { success: false, message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Verify email with OTP
  const verifyEmail = async (otp) => {
    try {
      setError(null);
      const response = await api.post('/auth/verify-email', { otp });
      setUser(response.data.data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed';
      setError(message);
      return { success: false, message };
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    try {
      setError(null);
      await api.post('/auth/resend-otp');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend OTP';
      setError(message);
      return { success: false, message };
    }
  };

  // Verify ID
  const verifyID = async (formData) => {
    try {
      setError(null);
      const response = await api.post('/auth/verify-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(response.data.data.user);
      return { success: true, verification: response.data.data.verification };
    } catch (err) {
      const message = err.response?.data?.message || 'ID verification failed';
      setError(message);
      return { success: false, message };
    }
  };

  // Verify Face
  const verifyFace = async (formData) => {
    try {
      setError(null);
      const response = await api.post('/auth/verify-face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(response.data.data.user);
      return { success: true, verification: response.data.data.verification };
    } catch (err) {
      const message = err.response?.data?.message || 'Face verification failed';
      setError(message);
      return { success: false, message };
    }
  };

  // Update profile
  const updateProfile = async (formData) => {
    try {
      setError(null);
      const response = await api.put('/auth/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(response.data.data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Profile update failed';
      setError(message);
      return { success: false, message };
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    verifyEmail,
    resendOTP,
    verifyID,
    verifyFace,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
    isFullyVerified: user?.isFullyVerified || false,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
