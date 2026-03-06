/**
 * Repairman Dashboard Page
 * Allows repairmen to view and manage breakdown jobs with real-time location tracking
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  Build,
  LocationOn,
  Phone,
  CheckCircle,
  AccessTime,
  DirectionsCar,
  Navigation,
  MyLocation,
  Refresh,
  AttachMoney,
  Star,
  Warning,
  PlayArrow,
  Done,
  Close,
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import api from '../services/api';
import { RepairmanMap } from '../components';
import { reverseGeocode, watchPosition, clearPositionWatch } from '../utils/geocoding';

const statusColors = {
  pending: 'warning',
  accepted: 'info',
  on_the_way: 'primary',
  arrived: 'secondary',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
};

const statusLabels = {
  pending: 'Pending',
  accepted: 'Accepted',
  on_the_way: 'On The Way',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const RepairmanDashboard = () => {
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Jobs
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  
  // Current location
  const [myLocation, setMyLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  
  // Selected job for actions
  const [selectedJob, setSelectedJob] = useState(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState('');
  const [eta, setEta] = useState('');
  const [finalCost, setFinalCost] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all jobs
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const [available, active, completed] = await Promise.all([
        api.get('/breakdowns/jobs?status=available'),
        api.get('/breakdowns/jobs?status=accepted&status=on_the_way&status=arrived&status=in_progress'),
        api.get('/breakdowns/jobs?status=completed'),
      ]);
      
      setAvailableJobs(available.data.data || []);
      setActiveJobs(active.data.data || []);
      setCompletedJobs(completed.data.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    fetchJobs();

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMyLocation(loc);
          
          const address = await reverseGeocode(loc.lat, loc.lng);
          if (address) {
            setLocationAddress(address.shortAddress);
          }
        },
        (err) => console.error('Location error:', err),
        { enableHighAccuracy: true }
      );
    }

    // Socket connection for real-time updates
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001');
    socketRef.current = socket;

    socket.on('newBreakdownRequest', (data) => {
      setAvailableJobs((prev) => [data, ...prev]);
      setSuccess('New breakdown request received!');
    });

    return () => {
      socket.disconnect();
      if (watchIdRef.current) {
        clearPositionWatch(watchIdRef.current);
      }
    };
  }, [fetchJobs]);

  // Start/stop location tracking
  const toggleLocationTracking = () => {
    if (isTrackingLocation) {
      if (watchIdRef.current) {
        clearPositionWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTrackingLocation(false);
    } else {
      watchIdRef.current = watchPosition(
        async (position) => {
          setMyLocation({
            lat: position.lat,
            lng: position.lng,
          });
          
          // Update location for active jobs
          for (const job of activeJobs) {
            if (['accepted', 'on_the_way'].includes(job.status)) {
              try {
                await api.put(`/breakdowns/${job._id}/location`, {
                  latitude: position.lat,
                  longitude: position.lng,
                });
              } catch (err) {
                console.error('Error updating location:', err);
              }
            }
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
          setError('Location tracking failed');
          setIsTrackingLocation(false);
        }
      );
      setIsTrackingLocation(true);
    }
  };

  // Accept a job
  const handleAcceptJob = async () => {
    if (!selectedJob) return;
    
    setActionLoading(true);
    try {
      await api.post(`/breakdowns/${selectedJob._id}/accept`, {
        estimatedCost: parseFloat(estimatedCost) || 0,
        eta: parseInt(eta) || 30,
      });
      
      setSuccess('Job accepted successfully!');
      setAcceptDialogOpen(false);
      setSelectedJob(null);
      setEstimatedCost('');
      setEta('');
      fetchJobs();
      
      // Start location tracking automatically
      if (!isTrackingLocation) {
        toggleLocationTracking();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept job');
    } finally {
      setActionLoading(false);
    }
  };

  // Update job status
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedJob) return;
    
    setActionLoading(true);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'completed' && finalCost) {
        payload.finalCost = parseFloat(finalCost);
      }
      
      await api.put(`/breakdowns/${selectedJob._id}/status`, payload);
      
      setSuccess(`Status updated to ${statusLabels[newStatus]}`);
      setStatusDialogOpen(false);
      setSelectedJob(null);
      setFinalCost('');
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Call customer
  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  // Open navigation to breakdown location
  const handleNavigate = (job) => {
    const [lng, lat] = job.location.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const renderJobCard = (job, isAvailable = false) => (
    <Card key={job._id} sx={{ mb: 2, borderLeft: 4, borderColor: `${statusColors[job.status]}.main` }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {job.userId?.firstName?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {job.userId?.firstName} {job.userId?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {job.category || job.issueType || 'Breakdown'}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={statusLabels[job.status]}
            color={statusColors[job.status]}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LocationOn fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {job.location?.address || 'Location not specified'}
          </Typography>
        </Box>

        {job.description && (
          <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            {job.description}
          </Typography>
        )}

        {job.vehicleDetails && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DirectionsCar fontSize="small" color="action" />
            <Typography variant="body2">
              {job.vehicleDetails.brand} {job.vehicleDetails.model} ({job.vehicleDetails.year})
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {isAvailable ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => {
                setSelectedJob(job);
                setAcceptDialogOpen(true);
              }}
            >
              Accept Job
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<Phone />}
                onClick={() => handleCall(job.userId?.phone)}
                disabled={!job.userId?.phone}
              >
                Call
              </Button>
              <Button
                variant="outlined"
                startIcon={<Navigation />}
                onClick={() => handleNavigate(job)}
              >
                Navigate
              </Button>
              {job.status !== 'completed' && (
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => {
                    setSelectedJob(job);
                    setStatusDialogOpen(true);
                  }}
                >
                  Update Status
                </Button>
              )}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const TabPanel = ({ children, value, index }) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Repairman Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage breakdown requests and track your jobs
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isTrackingLocation}
                  onChange={toggleLocationTracking}
                  color="success"
                />
              }
              label={isTrackingLocation ? 'Location ON' : 'Location OFF'}
            />
            <Tooltip title="Refresh jobs">
              <IconButton onClick={fetchJobs} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

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
          {/* Left Column - Jobs */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ borderRadius: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
              >
                <Tab
                  label={
                    <Badge badgeContent={availableJobs.length} color="warning">
                      Available Jobs
                    </Badge>
                  }
                />
                <Tab
                  label={
                    <Badge badgeContent={activeJobs.length} color="primary">
                      Active Jobs
                    </Badge>
                  }
                />
                <Tab label="Completed" />
              </Tabs>

              <Box sx={{ p: 2 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <TabPanel value={activeTab} index={0}>
                      {availableJobs.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={4}>
                          No available jobs at the moment
                        </Typography>
                      ) : (
                        availableJobs.map((job) => renderJobCard(job, true))
                      )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={1}>
                      {activeJobs.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={4}>
                          No active jobs
                        </Typography>
                      ) : (
                        activeJobs.map((job) => renderJobCard(job, false))
                      )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={2}>
                      {completedJobs.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={4}>
                          No completed jobs
                        </Typography>
                      ) : (
                        completedJobs.slice(0, 10).map((job) => renderJobCard(job, false))
                      )}
                    </TabPanel>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Map & Stats */}
          <Grid item xs={12} md={5}>
            {/* Current Location */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Your Current Location
              </Typography>
              {myLocation ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MyLocation color={isTrackingLocation ? 'success' : 'action'} />
                    <Typography variant="body2">
                      {locationAddress || `${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}`}
                    </Typography>
                    {isTrackingLocation && (
                      <Chip label="Live" size="small" color="success" sx={{ ml: 1 }} />
                    )}
                  </Box>
                  <RepairmanMap
                    userLocation={myLocation}
                    nearbyRepairmen={[]}
                    height={200}
                    showRoute={false}
                  />
                </>
              ) : (
                <Typography color="text.secondary">
                  Getting your location...
                </Typography>
              )}
            </Paper>

            {/* Quick Stats */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Today's Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {activeJobs.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Jobs
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {completedJobs.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Accept Job Dialog */}
      <Dialog open={acceptDialogOpen} onClose={() => setAcceptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Accept Job</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Provide an estimated cost and arrival time for the customer.
          </Typography>
          <TextField
            fullWidth
            label="Estimated Cost (Rs.)"
            type="number"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <AttachMoney />,
            }}
          />
          <TextField
            fullWidth
            label="ETA (minutes)"
            type="number"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            InputProps={{
              startAdornment: <AccessTime />,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAcceptJob}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Accept Job'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Job Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Current status: <Chip label={statusLabels[selectedJob?.status]} size="small" />
          </Typography>
          
          <Grid container spacing={2}>
            {selectedJob?.status === 'accepted' && (
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<Navigation />}
                  onClick={() => handleUpdateStatus('on_the_way')}
                  disabled={actionLoading}
                >
                  On My Way
                </Button>
              </Grid>
            )}
            {['accepted', 'on_the_way'].includes(selectedJob?.status) && (
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  startIcon={<LocationOn />}
                  onClick={() => handleUpdateStatus('arrived')}
                  disabled={actionLoading}
                >
                  Arrived
                </Button>
              </Grid>
            )}
            {['arrived'].includes(selectedJob?.status) && (
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="info"
                  startIcon={<Build />}
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={actionLoading}
                >
                  Start Repair
                </Button>
              </Grid>
            )}
            {['in_progress'].includes(selectedJob?.status) && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Final Cost (Rs.)"
                  type="number"
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <AttachMoney />,
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<Done />}
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={actionLoading}
                >
                  Mark Completed
                </Button>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<Close />}
                onClick={() => handleUpdateStatus('cancelled')}
                disabled={actionLoading}
              >
                Cancel Job
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RepairmanDashboard;
