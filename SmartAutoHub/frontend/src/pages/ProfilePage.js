/**
 * Profile Page
 * User profile management
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  CameraAlt,
  VerifiedUser,
  Email,
  Badge,
  Face,
  Warning,
  NotificationsActive,
  Mail,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    systemAlerts: true,
    emailNotifications: true,
  });

  const [preferencesLoading, setPreferencesLoading] = useState(false);

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const response = await api.get('/notifications/preferences');
      if (response.data.success) {
        setNotificationPreferences(response.data.preferences);
      }
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handlePreferenceChange = async (event) => {
    const { name, checked } = event.target;
    const updatedPreferences = {
      ...notificationPreferences,
      [name]: checked,
    };
    setNotificationPreferences(updatedPreferences);

    try {
      await api.put('/notifications/preferences', {
        [name]: checked,
      });
      setSuccess('Notification preferences updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notification preferences');
      // Revert the change if update fails
      setNotificationPreferences(notificationPreferences);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await api.put('/users/profile', formData);
      await refreshUser();
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      setSuccess('Avatar updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update avatar');
    }
    setLoading(false);
  };

  const getVerificationStatus = () => {
    const steps = [
      { key: 'isEmailVerified', label: 'Email', icon: <Email /> },
      { key: 'isIDVerified', label: 'ID', icon: <Badge /> },
      { key: 'isFaceVerified', label: 'Face', icon: <Face /> },
    ];
    
    return steps.map((step) => ({
      ...step,
      verified: user?.[step.key] || false,
    }));
  };

  const isFullyVerified = user?.isEmailVerified && user?.isIDVerified && user?.isFaceVerified;

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your account settings
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

        <Grid container spacing={3}>
          {/* Profile Info */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Personal Information
                </Typography>
                {!editing ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Cancel />}
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user?.name || '',
                          phone: user?.phone || '',
                          address: user?.address || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                      onClick={handleSave}
                      disabled={loading}
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Avatar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={user?.avatar}
                    sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 40 }}
                  >
                    {user?.name?.[0]}
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'white',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                  >
                    <CameraAlt fontSize="small" />
                  </IconButton>
                </Box>
                <Box>
                  <Typography variant="h6">{user?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Chip
                    label={user?.role}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 1, textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Form Fields */}
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user?.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!editing}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Verification Status */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Verification Status
              </Typography>

              {isFullyVerified ? (
                <Card sx={{ bgcolor: 'success.light', mb: 2 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                    <VerifiedUser sx={{ fontSize: 40, color: 'success.main' }} />
                    <Box>
                      <Typography fontWeight="bold" color="success.dark">
                        Fully Verified
                      </Typography>
                      <Typography variant="body2" color="success.dark">
                        All verification steps complete
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Card sx={{ bgcolor: 'warning.light', mb: 2 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                    <Warning sx={{ fontSize: 40, color: 'warning.dark' }} />
                    <Box>
                      <Typography fontWeight="bold" color="warning.dark">
                        Incomplete
                      </Typography>
                      <Typography variant="body2" color="warning.dark">
                        Complete verification to unlock all features
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ mt: 2 }}>
                {getVerificationStatus().map((step, index) => (
                  <Box
                    key={step.key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      borderBottom: index < 2 ? '1px solid' : 'none',
                      borderColor: 'grey.200',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {step.icon}
                      <Typography>{step.label}</Typography>
                    </Box>
                    {step.verified ? (
                      <Chip
                        label="Verified"
                        size="small"
                        color="success"
                        icon={<VerifiedUser />}
                      />
                    ) : (
                      <Chip
                        label="Pending"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                ))}
              </Box>

              {!isFullyVerified && (
                <Button
                  component={Link}
                  to="/verification"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3 }}
                >
                  Complete Verification
                </Button>
              )}
            </Paper>

            {/* Account Stats */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', mt: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Account
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Member since
                </Typography>
                <Typography variant="body2">
                  {new Date(user?.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {user?.role}
                </Typography>
              </Box>
            </Paper>

            {/* Notification Preferences */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NotificationsActive sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Notification Preferences
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {preferencesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        name="systemAlerts"
                        checked={notificationPreferences.systemAlerts}
                        onChange={handlePreferenceChange}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          System Alerts
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Show pop-up notifications when vehicles become available
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 2, alignItems: 'flex-start' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        name="emailNotifications"
                        checked={notificationPreferences.emailNotifications}
                        onChange={handlePreferenceChange}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          Email Notifications
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Receive email alerts about available vehicles
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </FormGroup>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage;
