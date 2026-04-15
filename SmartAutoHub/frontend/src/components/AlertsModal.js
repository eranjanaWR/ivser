import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  CardMedia,
  Box,
  Typography,
  Divider,
  IconButton,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import api from '../services/api';

const AlertsModal = ({ open, onClose, alerts = [] }) => {
  const [displayAlerts, setDisplayAlerts] = useState(alerts);

  useEffect(() => {
    setDisplayAlerts(alerts);
    if (alerts && alerts.length > 0) {
      console.log('🔔 AlertsModal received alerts:', alerts.length, alerts);
    }
  }, [alerts]);

  const handleAlertClick = (alertId, vehicleId) => {
    console.log('✓ Alert clicked - marking as seen and navigating:', { alertId, vehicleId });
    // Mark as seen and navigate to vehicle
    markAlertSeen(alertId);
    window.location.href = `/vehicles/${vehicleId}`;
  };

  const markAlertSeen = async (alertId) => {
    try {
      console.log('📝 Marking alert as seen:', alertId);
      await api.put('/notifications/alerts/mark-seen', {
        alertIds: [alertId]
      });
      console.log('✓ Alert marked as seen');
    } catch (err) {
      console.error('Failed to mark alert as seen:', err);
    }
  };

  const handleMarkAllSeen = async () => {
    try {
      console.log('📝 Marking all alerts as seen:', displayAlerts.map(a => a._id));
      await api.put('/notifications/alerts/mark-seen', {
        alertIds: displayAlerts.map(a => a._id)
      });
      console.log('✓ All alerts marked as seen');
      setDisplayAlerts([]);
      onClose();
    } catch (err) {
      console.error('Failed to mark all alerts as seen:', err);
    }
  };

  if (!open) {
    console.log('⏭️ Modal closed - not rendering');
    return null;
  }

  if (!displayAlerts || displayAlerts.length === 0) {
    console.log('❌ No alerts to display');
    return null;
  }

  console.log('✅ Rendering AlertsModal with', displayAlerts.length, 'alerts');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: '#4caf50',
          color: 'white',
          fontWeight: 'bold'
        }}
      >
        <NotificationsActiveIcon />
        New Vehicle Alerts! ({displayAlerts.length})
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, maxHeight: '70vh', overflow: 'auto' }}>
        {displayAlerts.map((alert, index) => (
          <div key={alert._id}>
            <Card
              sx={{
                m: 2,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 20px rgba(76,175,80,0.3)'
                }
              }}
              onClick={() => handleAlertClick(alert._id, alert.vehicleId)}
            >
              {alert.vehicleImage && (
                <CardMedia
                  component="img"
                  height="180"
                  image={`http://localhost:5000/${alert.vehicleImage}`}
                  alt={`${alert.vehicleBrand} ${alert.vehicleModel}`}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', color: '#1a1a1a' }}
                    >
                      {alert.vehicleBrand} {alert.vehicleModel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Seller: {alert.sellerName}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ color: '#4caf50', fontWeight: 'bold' }}
                  >
                    ₹{alert.vehiclePrice?.toLocaleString()}
                  </Typography>
                </Box>

                <Alert severity="success" icon={<NotificationsActiveIcon fontSize="small" />} sx={{ mb: 1 }}>
                  {alert.message}
                </Alert>

                <Typography variant="caption" color="text.secondary">
                  {new Date(alert.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </CardContent>
            </Card>
            {index < displayAlerts.length - 1 && <Divider />}
          </div>
        ))}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Button onClick={onClose} color="inherit">
          Dismiss
        </Button>
        <Button
          onClick={handleMarkAllSeen}
          variant="contained"
          sx={{
            bgcolor: '#4caf50',
            '&:hover': { bgcolor: '#45a049' }
          }}
        >
          Explore Vehicles
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertsModal;
