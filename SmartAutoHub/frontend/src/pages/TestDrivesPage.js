/**
 * Test Drives Page
 * Test drive requests management
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Avatar,
} from '@mui/material';
import {
  Check,
  Close,
  Schedule,
  Person,
  DirectionsCar,
  CalendarToday,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TestDrivesPage = () => {
  const { user } = useAuth();
  const [testDrives, setTestDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(0);
  
  // Response dialog
  const [responseOpen, setResponseOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  const isSeller = user?.role === 'seller' || user?.role === 'admin1' || user?.role === 'admin2';

  useEffect(() => {
    fetchTestDrives();
  }, [tab]);

  const fetchTestDrives = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 0 ? '/test-drives/my-requests' : '/test-drives/seller-requests';
      const { data } = await api.get(endpoint);
      setTestDrives(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch test drives');
    }
    setLoading(false);
  };

  const handleResponse = async (status) => {
    setResponding(true);
    try {
      await api.patch(`/test-drives/${selectedDrive._id}`, {
        status,
        sellerResponse: responseMessage,
      });
      setSuccess(`Test drive ${status}`);
      setResponseOpen(false);
      setResponseMessage('');
      fetchTestDrives();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update test drive');
    }
    setResponding(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'completed': return 'info';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Test Drives
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your test drive requests
        </Typography>

        {/* Alerts */}
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

        {/* Tabs */}
        {isSeller && (
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="My Requests" icon={<Schedule />} iconPosition="start" />
            <Tab label="Received Requests" icon={<Person />} iconPosition="start" />
          </Tabs>
        )}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : testDrives.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No test drive requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {tab === 0 
                ? 'Browse vehicles and request a test drive'
                : 'No one has requested a test drive for your vehicles yet'
              }
            </Typography>
            {tab === 0 && (
              <Button component={Link} to="/vehicles" variant="contained">
                Browse Vehicles
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>{tab === 0 ? 'Seller' : 'Buyer'}</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testDrives.map((drive) => (
                  <TableRow key={drive._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          variant="rounded"
                          src={drive.vehicle?.images?.[0]}
                          sx={{ width: 60, height: 45 }}
                        >
                          <DirectionsCar />
                        </Avatar>
                        <Box>
                          <Typography fontWeight="medium">
                            {drive.vehicle?.brand} {drive.vehicle?.model}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {drive.vehicle?.year}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {(tab === 0 ? drive.seller?.name : drive.buyer?.name)?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {tab === 0 ? drive.seller?.name : drive.buyer?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tab === 0 ? drive.seller?.phone : drive.buyer?.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2">
                            {formatDate(drive.preferredDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {drive.preferredTime}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={drive.status}
                        size="small"
                        color={getStatusColor(drive.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {tab === 1 && drive.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedDrive(drive);
                              setResponseOpen(true);
                            }}
                          >
                            <Check />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedDrive(drive);
                              handleResponse('rejected');
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Box>
                      )}
                      {tab === 0 && drive.status === 'pending' && (
                        <Button
                          size="small"
                          color="error"
                          onClick={async () => {
                            try {
                              await api.delete(`/test-drives/${drive._id}`);
                              setSuccess('Request cancelled');
                              fetchTestDrives();
                            } catch (err) {
                              setError('Failed to cancel request');
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      {drive.status === 'approved' && (
                        <Typography variant="caption" color="success.main">
                          Approved
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Response Dialog */}
        <Dialog open={responseOpen} onClose={() => setResponseOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Approve Test Drive</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Approve test drive request from {selectedDrive?.buyer?.name} for{' '}
              {selectedDrive?.vehicle?.brand} {selectedDrive?.vehicle?.model}
            </Typography>
            <TextField
              fullWidth
              label="Message (Optional)"
              multiline
              rows={3}
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Include meeting location or any special instructions..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResponseOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => handleResponse('approved')}
              disabled={responding}
            >
              {responding ? <CircularProgress size={24} /> : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TestDrivesPage;
