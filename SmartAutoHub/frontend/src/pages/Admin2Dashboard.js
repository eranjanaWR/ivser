/**
 * Admin2 Dashboard
 * User verification admin — includes Manual ID Verification tab
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
  TextField,
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
  AssignmentLate,
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

  // Manual ID verification state
  const [manualIDUsers, setManualIDUsers] = useState([]);
  const [manualIDLoading, setManualIDLoading] = useState(false);
  const [manualViewUser, setManualViewUser] = useState(null);
  const [manualViewOpen, setManualViewOpen] = useState(false);
  const [manualRejectReason, setManualRejectReason] = useState('');
  const [manualRejectDialogOpen, setManualRejectDialogOpen] = useState(false);

  useEffect(() => {
    if (tab === 2) {
      fetchManualIDVerifications();
    } else {
      fetchPendingVerifications();
    }
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

  // ── Fetch users who requested manual ID verification ──
  const fetchManualIDVerifications = async () => {
    setManualIDLoading(true);
    try {
      const { data } = await api.get('/admin/manual-id-verifications');
      setManualIDUsers(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch manual ID verifications');
    }
    setManualIDLoading(false);
  };

  // ── Approve manual ID ──
  const handleApproveManualID = async (userId) => {
    setProcessing(true);
    try {
      await api.put(`/admin/users/${userId}/approve-manual-id`);
      setSuccess('Manual ID verification approved successfully');
      setManualIDUsers(manualIDUsers.filter((u) => u._id !== userId));
      setManualViewOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    }
    setProcessing(false);
  };

  // ── Reject manual ID ──
  const handleRejectManualID = async (userId) => {
    setProcessing(true);
    try {
      await api.put(`/admin/users/${userId}/reject-manual-id`, { reason: manualRejectReason });
      setSuccess('Manual ID verification rejected');
      setManualIDUsers(manualIDUsers.filter((u) => u._id !== userId));
      setManualRejectDialogOpen(false);
      setManualRejectReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    }
    setProcessing(false);
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

  // ── Render Manual ID Verification Tab Content ──
  const renderManualIDTab = () => {
    if (manualIDLoading) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (manualIDUsers.length === 0) {
      return (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No pending manual ID verifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All manual ID verification requests have been processed
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>ID Number</TableCell>
              <TableCell>OCR Confidence</TableCell>
              <TableCell>ID Document</TableCell>
              <TableCell>Registered</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {manualIDUsers.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={user.profileImage ? `http://localhost:5001/${user.profileImage}` : undefined}
                      sx={{ bgcolor: 'primary.main' }}
                    >
                      {user.firstName?.[0]}
                    </Avatar>
                    <Typography>{user.firstName} {user.lastName}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" sx={{ textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {user.idVerification?.idNumber || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${user.idVerification?.ocrConfidence || 0}%`}
                    size="small"
                    color={
                      (user.idVerification?.ocrConfidence || 0) >= 50
                        ? 'warning'
                        : 'error'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => {
                      setManualViewUser(user);
                      setManualViewOpen(true);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleApproveManualID(user._id)}
                      disabled={processing}
                    >
                      <CheckCircle />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setManualViewUser(user);
                        setManualRejectDialogOpen(true);
                      }}
                      disabled={processing}
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
    );
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
            onClick={tab === 2 ? fetchManualIDVerifications : fetchPendingVerifications}
            disabled={loading || manualIDLoading}
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
                      {tab === 2 ? manualIDUsers.length : pendingUsers.length}
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
                      bgcolor: tab === 2 ? 'error.main' : 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {tab === 2 ? <AssignmentLate /> : <HowToReg />}
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {tab === 0 ? 'ID' : tab === 1 ? 'Face' : 'Manual'}
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

        {/* Tabs — now includes Manual ID Verification */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
            <Tab label="ID Verification" icon={<Badge />} iconPosition="start" />
            <Tab label="Face Verification" icon={<Face />} iconPosition="start" />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Manual ID Review
                  {manualIDUsers.length > 0 && (
                    <Chip label={manualIDUsers.length} size="small" color="error" sx={{ height: 20, fontSize: 11 }} />
                  )}
                </Box>
              }
              icon={<AssignmentLate />}
              iconPosition="start"
            />
          </Tabs>

          {/* Tab 0 & 1 — existing ID/Face verification list */}
          {tab < 2 && (
            <>
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
            </>
          )}

          {/* Tab 2 — Manual ID Verification */}
          {tab === 2 && renderManualIDTab()}
        </Paper>

        {/* View Document Dialog (ID / Face) */}
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

        {/* Action Confirmation Dialog (ID / Face) */}
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

        {/* ── Manual ID View Dialog ── */}
        <Dialog
          open={manualViewOpen}
          onClose={() => setManualViewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Manual ID Verification — {manualViewUser?.firstName} {manualViewUser?.lastName}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {/* User Info */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  User Details
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    src={manualViewUser?.profileImage ? `http://localhost:5001/${manualViewUser.profileImage}` : undefined}
                    sx={{ width: 56, height: 56 }}
                  >
                    {manualViewUser?.firstName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography fontWeight="bold">
                      {manualViewUser?.firstName} {manualViewUser?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {manualViewUser?.email}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Role:</strong> {manualViewUser?.role}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>ID Number:</strong>{' '}
                  <span style={{ fontFamily: 'monospace' }}>{manualViewUser?.idVerification?.idNumber || '—'}</span>
                </Typography>
                <Typography variant="body2">
                  <strong>OCR Confidence:</strong>{' '}
                  <Chip
                    label={`${manualViewUser?.idVerification?.ocrConfidence || 0}%`}
                    size="small"
                    color={(manualViewUser?.idVerification?.ocrConfidence || 0) >= 50 ? 'warning' : 'error'}
                  />
                </Typography>
              </Grid>

              {/* ID Image */}
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Uploaded ID Document
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    minHeight: 200,
                  }}
                >
                  {manualViewUser?.idVerification?.idFrontImage ? (
                    <Box
                      component="img"
                      src={`http://localhost:5001/${manualViewUser.idVerification.idFrontImage}`}
                      alt="ID Document"
                      sx={{ maxWidth: '100%', maxHeight: 350, objectFit: 'contain', borderRadius: 1 }}
                    />
                  ) : (
                    <Typography color="text.secondary">No ID image uploaded</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManualViewOpen(false)}>Close</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                setManualViewOpen(false);
                setManualRejectDialogOpen(true);
              }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleApproveManualID(manualViewUser._id)}
              disabled={processing}
            >
              {processing ? <CircularProgress size={24} /> : 'Approve ID'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Manual ID Reject Dialog ── */}
        <Dialog
          open={manualRejectDialogOpen}
          onClose={() => setManualRejectDialogOpen(false)}
        >
          <DialogTitle>Reject Manual ID Verification</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Provide a reason for rejecting {manualViewUser?.firstName}'s ID:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={manualRejectReason}
              onChange={(e) => setManualRejectReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManualRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleRejectManualID(manualViewUser._id)}
              disabled={processing || !manualRejectReason.trim()}
            >
              {processing ? <CircularProgress size={24} /> : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Admin2Dashboard;
