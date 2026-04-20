import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  TextField,
  Tabs,
  Typography
} from '@mui/material';
import {
  CalendarToday,
  Check,
  Close,
  DirectionsCar,
  Person,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

const TestDrivesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [testDrives, setTestDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [tab, setTab] = useState(0);
  const [responseOpen, setResponseOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  const isSeller = ['seller', 'buyer/seller', 'admin1', 'admin2'].includes(user?.role);

  const getEndpointByTab = (tabIndex) => {
    if (tabIndex === 0) {
      return '/test-drives/my-requests';
    }

    if (tabIndex === 1) {
      return '/test-drives/my-vehicles?status=active';
    }

    return '/test-drives/my-vehicles?status=history';
  };

  const fetchTestDrives = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = getEndpointByTab(tab);
      const response = await api.get(endpoint);
      setTestDrives(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch test drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestDrives();
  }, [tab]);

  const normalizeStatus = (status) => String(status || '').toLowerCase();

  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'N/A';
    }

    return new Date(dateValue).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openApproveDialog = (drive) => {
    setSelectedDrive(drive);
    setResponseMessage('');
    setResponseOpen(true);
  };

  const handleResponse = async (status) => {
    if (!selectedDrive) {
      return;
    }

    setResponding(true);
    setError('');

    try {
      await api.put(`/test-drives/${selectedDrive._id}/status`, {
        status,
        sellerNotes: responseMessage
      });

      setSuccess(`Test drive ${status}`);
      setResponseOpen(false);
      setSelectedDrive(null);
      setResponseMessage('');
      fetchTestDrives();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update test drive');
    } finally {
      setResponding(false);
    }
  };

  const handleReject = async (drive) => {
    setError('');
    try {
      await api.put(`/test-drives/${drive._id}/status`, {
        status: 'rejected'
      });

      setSuccess('Test drive rejected');
      fetchTestDrives();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject test drive');
    }
  };

  const handleBuyerCancel = async (driveId) => {
    setError('');
    try {
      await api.delete(`/test-drives/${driveId}`);
      setSuccess('Request cancelled successfully');
      fetchTestDrives();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const renderRow = (drive) => {
    const vehicle = drive.vehicleId || {};
    const buyer = drive.buyerId || {};
    const seller = drive.sellerId || {};
    const status = drive.status || '';
    const pending = normalizeStatus(status) === 'pending';

    const counterpart = tab === 0 ? seller : buyer;
    const counterpartName = `${counterpart.firstName || ''} ${counterpart.lastName || ''}`.trim() || 'N/A';
    const slotText = drive.selectedSlot
      ? `${drive.selectedSlot.startTime} - ${drive.selectedSlot.endTime}`
      : '';

    return (
      <Paper key={drive._id} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Stack direction="row" spacing={2} sx={{ flex: 1, width: '100%' }}>
            <Avatar
              variant="rounded"
              src={getImageUrl(vehicle.images?.[0] || vehicle.image)}
              sx={{ width: 72, height: 54 }}
            >
              <DirectionsCar />
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={700}>
                {vehicle.year} {vehicle.brand} {vehicle.model}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tab === 0 ? 'Seller' : 'Buyer'}: {counterpartName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {counterpart.phone || counterpart.email || 'No contact info'}
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={0.5} sx={{ minWidth: 220 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="body2">
                {formatDate(drive.scheduledDate || drive.date || drive.preferredDate)}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {drive.scheduledTime || drive.time || 'N/A'}
            </Typography>
            {slotText && (
              <Typography variant="caption" color="text.secondary">
                Slot: {slotText}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 170 }}>
            <Chip label={status} size="small" color={getStatusColor(status)} />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {tab === 1 && pending && (
              <>
                <IconButton size="small" color="success" onClick={() => openApproveDialog(drive)}>
                  <Check fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleReject(drive)}>
                  <Close fontSize="small" />
                </IconButton>
              </>
            )}

            {tab === 0 && pending && (
              <Button size="small" color="error" onClick={() => handleBuyerCancel(drive._id)}>
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>

        {(drive.sellerNotes || drive.buyerNotes) && (
          <>
            <Divider sx={{ my: 1.5 }} />
            {drive.sellerNotes && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Seller Note: {drive.sellerNotes}
              </Typography>
            )}
            {drive.buyerNotes && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Buyer Note: {drive.buyerNotes}
              </Typography>
            )}
          </>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Test Drives
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your test drive requests
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {isSeller && (
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            <Tab icon={<Schedule />} iconPosition="start" label="My Requests" />
            <Tab icon={<Person />} iconPosition="start" label="Received Requests" />
            <Tab icon={<Schedule />} iconPosition="start" label="Booking History" />
          </Tabs>
        )}

        {loading ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : testDrives.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'grey.200', textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No test drive requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {tab === 0
                ? 'Browse vehicles and request a test drive'
                : 'No requests found for this section'}
            </Typography>
            {tab === 0 && (
              <Button variant="contained" onClick={() => navigate('/vehicles')}>
                Browse Vehicles
              </Button>
            )}
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {testDrives.map(renderRow)}
          </Stack>
        )}

        <Dialog open={responseOpen} onClose={() => setResponseOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Approve Test Drive</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Approve this test drive request and optionally include a note for the buyer.
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Message (Optional)"
              value={responseMessage}
              onChange={(event) => setResponseMessage(event.target.value)}
              placeholder="Meeting location, notes, or instructions"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResponseOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => handleResponse('approved')}
              disabled={responding}
              startIcon={responding ? <CircularProgress size={16} color="inherit" /> : <Check />}
            >
              {responding ? 'Approving...' : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TestDrivesPage;
