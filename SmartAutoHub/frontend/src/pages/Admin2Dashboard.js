/**
 * Admin2 Dashboard
 * User verification admin
 */

import React, { useState, useEffect } from 'react';
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
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Badge,
  Face,
  Refresh,
  PendingActions,
  HowToReg,
} from '@mui/icons-material';
import api from '../services/api';

const Admin2Dashboard = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingVerifications();
  }, [tab]);

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const verificationType = tab === 0 ? 'id' : 'face';
      const { data } = await api.get(`/admin/pending-verifications?type=${verificationType}`);
      setPendingUsers(data.data || []);
    } catch (err) {
      // Mock data for demo
      setPendingUsers([
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'seller',
          idDocumentImage: '/uploads/sample-id.jpg',
          selfieImage: '/uploads/sample-selfie.jpg',
          submittedAt: new Date(),
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'buyer',
          idDocumentImage: '/uploads/sample-id-2.jpg',
          selfieImage: '/uploads/sample-selfie-2.jpg',
          submittedAt: new Date(),
        },
      ]);
    }
    setLoading(false);
  };

  const handleViewDocument = (user) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const verificationType = tab === 0 ? 'id' : 'face';
      await api.post(`/admin/verify-user/${selectedUser._id}`, {
        type: verificationType,
        status: 'approved',
      });
      setSuccess(`${tab === 0 ? 'ID' : 'Face'} verification approved`);
      setPendingUsers(pendingUsers.filter((u) => u._id !== selectedUser._id));
      setActionDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve verification');
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const verificationType = tab === 0 ? 'id' : 'face';
      await api.post(`/admin/verify-user/${selectedUser._id}`, {
        type: verificationType,
        status: 'rejected',
        reason: rejectionReason,
      });
      setSuccess(`${tab === 0 ? 'ID' : 'Face'} verification rejected`);
      setPendingUsers(pendingUsers.filter((u) => u._id !== selectedUser._id));
      setActionDialogOpen(false);
      setRejectionReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject verification');
    }
    setProcessing(false);
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Verification Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and approve user verifications
            </Typography>
          </Box>
          <Button
            startIcon={<Refresh />}
            onClick={fetchPendingVerifications}
            disabled={loading}
          >
            Refresh
          </Button>
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

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'warning.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <PendingActions />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {pendingUsers.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <HowToReg />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {tab === 0 ? 'ID' : 'Face'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verification Type
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
            <Tab label="ID Verification" icon={<Badge />} iconPosition="start" />
            <Tab label="Face Verification" icon={<Face />} iconPosition="start" />
          </Tabs>

          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : pendingUsers.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No pending verifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All {tab === 0 ? 'ID' : 'face'} verifications have been processed
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Document</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {user.name?.[0]}
                          </Avatar>
                          <Typography>{user.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewDocument(user)}
                        >
                          View
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionDialogOpen(true);
                            }}
                          >
                            <CheckCircle />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionDialogOpen(true);
                            }}
                          >
                            <Cancel />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* View Document Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {tab === 0 ? 'ID Document' : 'Selfie'} - {selectedUser?.name}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 2,
                p: 2,
              }}
            >
              {tab === 0 ? (
                <Box
                  component="img"
                  src={selectedUser?.idDocumentImage || '/placeholder-id.jpg'}
                  alt="ID Document"
                  sx={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
                />
              ) : (
                <Box
                  component="img"
                  src={selectedUser?.selfieImage || '/placeholder-selfie.jpg'}
                  alt="Selfie"
                  sx={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
                />
              )}
            </Box>
            
            {/* If face verification, show both images side by side */}
            {tab === 1 && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>ID Photo</Typography>
                  <Box
                    component="img"
                    src={selectedUser?.idDocumentImage || '/placeholder-id.jpg'}
                    alt="ID Document"
                    sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Submitted Selfie</Typography>
                  <Box
                    component="img"
                    src={selectedUser?.selfieImage || '/placeholder-selfie.jpg'}
                    alt="Selfie"
                    sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1 }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                setViewDialogOpen(false);
                setActionDialogOpen(true);
              }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setViewDialogOpen(false);
                handleApprove();
              }}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Confirmation Dialog */}
        <Dialog
          open={actionDialogOpen}
          onClose={() => setActionDialogOpen(false)}
        >
          <DialogTitle>Verification Decision</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Choose an action for {selectedUser?.name}'s {tab === 0 ? 'ID' : 'face'} verification:
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? <CircularProgress size={24} /> : 'Reject'}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? <CircularProgress size={24} /> : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Admin2Dashboard;
