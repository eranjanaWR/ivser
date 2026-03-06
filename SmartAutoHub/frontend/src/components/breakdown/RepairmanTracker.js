import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Divider,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Skeleton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Phone,
  Message,
  MyLocation,
  AccessTime,
  Route,
  CheckCircle,
  RadioButtonUnchecked,
  Build,
  DirectionsCar,
  ExpandMore,
  ExpandLess,
  Star,
  Close,
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import RepairmanMap from './RepairmanMap';
import { calculateRoute, calculateETA, reverseGeocode } from '../../utils/geocoding';

// Custom stepper connector
const CustomConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.grey[300],
    borderLeftWidth: 3,
    minHeight: 30,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.success.main,
  },
}));

// Custom step icon
const CustomStepIcon = ({ active, completed, icon }) => {
  const icons = {
    1: CheckCircle,
    2: DirectionsCar,
    3: Build,
    4: CheckCircle,
  };
  const Icon = icons[icon] || RadioButtonUnchecked;

  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.200',
        color: completed || active ? 'white' : 'grey.500',
      }}
    >
      <Icon sx={{ fontSize: 18 }} />
    </Box>
  );
};

// Status steps
const statusSteps = [
  { status: 'accepted', label: 'Request Accepted' },
  { status: 'on_the_way', label: 'On The Way' },
  { status: 'arrived', label: 'Arrived' },
  { status: 'in_progress', label: 'Repair In Progress' },
  { status: 'completed', label: 'Completed' },
];

/**
 * RepairmanTracker Component
 * Provides real-time tracking of repairman with Uber-like UI
 * 
 * Props:
 * - breakdownId: ID of the breakdown request
 * - breakdown: Breakdown object with details
 * - repairman: Assigned repairman details
 * - userLocation: User's breakdown location { lat, lng }
 * - onStatusChange: Callback when status changes
 * - onComplete: Callback when repair is completed
 */
const RepairmanTracker = ({
  breakdownId,
  breakdown,
  repairman,
  userLocation,
  onStatusChange,
  onComplete,
}) => {
  const [repairmanLocation, setRepairmanLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(breakdown?.status || 'accepted');
  const [eta, setEta] = useState(breakdown?.eta || null);
  const [expanded, setExpanded] = useState(true);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [addressName, setAddressName] = useState('');
  const socketRef = useRef(null);

  // Get current step index
  const currentStepIndex = statusSteps.findIndex((s) => s.status === currentStatus);

  // Connect to socket for real-time updates
  useEffect(() => {
    if (!breakdownId) return;

    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to tracking socket');
      socket.emit('joinBreakdownRoom', breakdownId);
    });

    // Listen for repairman location updates
    socket.on('repairmanLocationUpdate', (data) => {
      if (data.breakdownId === breakdownId) {
        setRepairmanLocation({
          lat: data.latitude,
          lng: data.longitude,
        });
      }
    });

    // Listen for status updates
    socket.on('breakdownStatusUpdate', (data) => {
      if (data.breakdownId === breakdownId) {
        setCurrentStatus(data.status);
        onStatusChange && onStatusChange(data.status);

        if (data.status === 'completed') {
          setRatingDialogOpen(true);
        }
      }
    });

    // Listen for ETA updates
    socket.on('breakdownEtaUpdate', (data) => {
      if (data.breakdownId === breakdownId) {
        setEta(data.eta);
      }
    });

    return () => {
      socket.emit('leaveBreakdownRoom', breakdownId);
      socket.disconnect();
    };
  }, [breakdownId, onStatusChange]);

  // Calculate route when locations change
  useEffect(() => {
    if (userLocation && repairmanLocation && ['accepted', 'on_the_way'].includes(currentStatus)) {
      const getRoute = async () => {
        const route = await calculateRoute(repairmanLocation, userLocation);
        if (route) {
          setRouteInfo(route);
          setEta(calculateETA(route.duration.seconds));
        }
      };
      getRoute();
    }
  }, [userLocation, repairmanLocation, currentStatus]);

  // Reverse geocode user location
  useEffect(() => {
    if (userLocation) {
      const getAddress = async () => {
        const result = await reverseGeocode(userLocation.lat, userLocation.lng);
        if (result) {
          setAddressName(result.shortAddress);
        }
      };
      getAddress();
    }
  }, [userLocation]);

  const handleCall = () => {
    if (repairman?.phone) {
      window.location.href = `tel:${repairman.phone}`;
    }
  };

  const handleMessage = () => {
    if (repairman?.phone) {
      window.location.href = `sms:${repairman.phone}`;
    }
  };

  const handleSubmitRating = async () => {
    try {
      // Submit rating API call would go here
      setRatingDialogOpen(false);
      onComplete && onComplete({ rating, comment: ratingComment });
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  if (!repairman) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Skeleton variant="circular" width={60} height={60} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Box>
        </Box>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ overflow: 'hidden', borderRadius: 3 }}>
      {/* Header with ETA */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
              {currentStatus === 'on_the_way' ? 'Arriving in' : 
               currentStatus === 'arrived' ? 'Repairman arrived' :
               currentStatus === 'in_progress' ? 'Repair in progress' :
               currentStatus === 'completed' ? 'Repair completed' : 'ETA'}
            </Typography>
            {['accepted', 'on_the_way'].includes(currentStatus) && eta ? (
              <Typography variant="h3" fontWeight="bold">
                {routeInfo ? routeInfo.duration.text : eta}
              </Typography>
            ) : (
              <Typography variant="h4" fontWeight="bold">
                {currentStatus === 'arrived' ? 'Here!' : 
                 currentStatus === 'in_progress' ? 'Working' :
                 currentStatus === 'completed' ? 'Done!' : '--'}
              </Typography>
            )}
          </Box>
          {routeInfo && ['accepted', 'on_the_way'].includes(currentStatus) && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Distance
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {routeInfo.distance.text}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Progress bar */}
        {['accepted', 'on_the_way'].includes(currentStatus) && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={currentStatus === 'accepted' ? 10 : 50}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white',
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Repairman Info */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={repairman.profileImage}
            sx={{ width: 60, height: 60, border: '3px solid', borderColor: 'primary.main' }}
          >
            {repairman.firstName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {repairman.firstName} {repairman.lastName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {repairman.repairmanDetails?.rating && (
                <Chip
                  icon={<Star sx={{ fontSize: 16 }} />}
                  label={repairman.repairmanDetails.rating.toFixed(1)}
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              {repairman.repairmanDetails?.completedJobs && (
                <Typography variant="caption" color="text.secondary">
                  {repairman.repairmanDetails.completedJobs} jobs completed
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleCall}
              sx={{ bgcolor: 'success.lighter', color: 'success.main' }}
            >
              <Phone />
            </IconButton>
            <IconButton
              onClick={handleMessage}
              sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}
            >
              <Message />
            </IconButton>
          </Box>
        </Box>

        {/* Specializations */}
        {repairman.repairmanDetails?.specializations && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {repairman.repairmanDetails.specializations.slice(0, 4).map((spec) => (
              <Chip key={spec} label={spec} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </Box>

      <Divider />

      {/* Map Section */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
            cursor: 'pointer',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Live Tracking
          </Typography>
          <IconButton size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        <Collapse in={expanded}>
          <RepairmanMap
            userLocation={userLocation}
            repairmanLocation={repairmanLocation}
            repairman={repairman}
            height={300}
            showRoute={['accepted', 'on_the_way'].includes(currentStatus)}
            isTracking={['on_the_way'].includes(currentStatus)}
          />
        </Collapse>
      </Box>

      <Divider />

      {/* Status Steps */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Status Updates
        </Typography>
        <Stepper
          activeStep={currentStepIndex}
          orientation="vertical"
          connector={<CustomConnector />}
        >
          {statusSteps.map((step, index) => (
            <Step key={step.status} completed={index < currentStepIndex}>
              <StepLabel
                StepIconComponent={(props) => (
                  <CustomStepIcon
                    {...props}
                    active={index === currentStepIndex}
                    completed={index < currentStepIndex}
                    icon={index + 1}
                  />
                )}
              >
                <Typography
                  variant="body2"
                  fontWeight={index === currentStepIndex ? 'bold' : 'regular'}
                  color={index <= currentStepIndex ? 'text.primary' : 'text.secondary'}
                >
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Location Info */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <MyLocation sx={{ color: 'primary.main', mt: 0.5 }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Your breakdown location
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {addressName || 'Getting address...'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Estimated Cost */}
      {breakdown?.estimatedCost && currentStatus !== 'completed' && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Cost
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              Rs. {breakdown.estimatedCost.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Final Cost (when completed) */}
      {breakdown?.finalCost && currentStatus === 'completed' && (
        <Box sx={{ p: 2, bgcolor: 'success.lighter', borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="success.dark">
              Final Cost
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.dark">
              Rs. {breakdown.finalCost.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Rate Your Experience</Typography>
            <IconButton onClick={() => setRatingDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Avatar
              src={repairman.profileImage}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
            >
              {repairman.firstName?.[0]}
            </Avatar>
            <Typography variant="h6" gutterBottom>
              How was your experience with {repairman.firstName}?
            </Typography>
            <Rating
              value={rating}
              onChange={(e, value) => setRating(value)}
              size="large"
              sx={{ fontSize: 48, my: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Leave a comment (optional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRatingDialogOpen(false)}>Skip</Button>
          <Button
            variant="contained"
            onClick={handleSubmitRating}
            disabled={!rating}
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RepairmanTracker;
