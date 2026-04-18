import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Avatar,
  Divider,
  Stack,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PrivateDealChat from '../components/PrivateDealChat';

/**
 * Auction Result Page
 * Final connection hub for Winner and Seller.
 * Checks BOTH winnerId and highestBidder for authorization.
 */
const AuctionResultPage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (!vehicleId) return;

    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/bidding/result/${vehicleId}`);

        // ── Debug log so the user can verify IDs in the browser console ──
        const v = response.data?.vehicle;
        console.log('[AuctionResultPage] Auth check IDs:', {
          myId:          user?._id || user?.id,
          sellerId:      v?.sellerId?._id || v?.sellerId,
          winnerId:      v?.winnerId?._id || v?.winnerId,
          highestBidder: v?.highestBidder?._id || v?.highestBidder,
          isSeller:      response.data?.isSeller,
          isWinner:      response.data?.isWinner,
        });

        if (response.data.success) {
          setResultData(response.data);
        } else {
          setError(response.data.message || 'Failed to load auction results');
        }
      } catch (err) {
        console.error('[AuctionResultPage] Error:', err);
        // Show the actual backend message so it's easier to debug
        const msg =
          err.response?.data?.message ||
          err.message ||
          'Failed to load auction results';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading auction results…</Typography>
        </Stack>
      </Box>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !resultData) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <TrophyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
          {error || 'Could not load auction results.'}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          If you believe you should have access, please check the browser console for debug info (F12 → Console).
        </Typography>
        <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  const { vehicle, isSeller, isWinner, otherParty } = resultData;

  // ── Resolved display values ───────────────────────────────────────────────
  // otherParty is already resolved by the backend, but guard just in case
  const contact = otherParty || {};
  const contactName  = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown';
  const contactEmail = contact.email || contact.emailAddress || null;
  const contactPhone = contact.phoneNumber || contact.phone || null;

  const finalBid = vehicle.currentBid?.toLocaleString() || '—';
  const vehicleTitle = `${vehicle.year || ''} ${vehicle.brand || ''} ${vehicle.model || ''}`.trim();

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 80px)', py: 4 }}>
      <Container maxWidth="lg">

        {/* ── Header ── */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate(`/bidding/${vehicleId}`)}
              sx={{ bgcolor: '#fff', boxShadow: 1 }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                {vehicleTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Auction ID: {vehicleId?.slice(-8).toUpperCase()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
              FINAL BID PRICE
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: theme.palette.success.main }}>
              LKR {finalBid}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>

          {/* ── Left: Contact Info ── */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>

              {/* Role Announcement */}
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: isWinner ? '#dcfce7' : '#dbeafe',
                  border: '1px solid',
                  borderColor: isWinner ? '#22c55e' : '#3b82f6',
                  textAlign: 'center',
                }}
              >
                <TrophyIcon sx={{ fontSize: 48, color: isWinner ? '#16a34a' : '#2563eb', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
                  {isWinner ? '🏆 You are the Winner!' : '🤝 Auction Successful!'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                  {isWinner
                    ? 'Congratulations! Connect with the seller below to arrange payment and collection.'
                    : 'A buyer has been confirmed. Connect with the winner to finalise the transaction.'}
                </Typography>
              </Paper>

              {/* Contact Card */}
              <Paper sx={{ p: 4, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                {/* Colour stripe */}
                <Box
                  sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 6,
                    bgcolor: isWinner ? '#22c55e' : '#3b82f6',
                  }}
                />

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PersonIcon color="primary" />
                  {isWinner ? "Seller's Contact" : "Winner's Contact"}
                </Typography>

                {/* Avatar + Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                  <Avatar
                    sx={{
                      width: 72, height: 72,
                      bgcolor: isWinner ? '#16a34a' : '#2563eb',
                      fontSize: 28, fontWeight: 800,
                    }}
                  >
                    {contactName[0] || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {contactName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {isWinner ? 'Verified Seller' : 'Auction Winner'}
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={3}>
                  {/* Phone */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                      component="a"
                      href={contactPhone ? `tel:${contactPhone}` : undefined}
                      sx={{ bgcolor: '#f1f5f9', p: 1.5 }}
                    >
                      <PhoneIcon color="primary" />
                    </IconButton>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
                        PHONE NUMBER
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {contactPhone || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Email */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                      component="a"
                      href={contactEmail ? `mailto:${contactEmail}` : undefined}
                      sx={{ bgcolor: '#f1f5f9', p: 1.5 }}
                    >
                      <EmailIcon color="primary" />
                    </IconButton>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
                        EMAIL ADDRESS
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {contactEmail || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />
                <Alert severity="warning" sx={{ borderRadius: 2, fontWeight: 500 }}>
                  <strong>Safety Tip:</strong> Always meet in a public place and verify vehicle documents before any payment.
                </Alert>
              </Paper>
            </Stack>
          </Grid>

          {/* ── Right: Private Chat ── */}
          <Grid item xs={12} md={7}>
            <Paper
              sx={{
                height: 'calc(100vh - 260px)',
                minHeight: 500,
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: 3,
              }}
            >
              {/* Chat header */}
              <Box
                sx={{
                  p: 2.5,
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ChatIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Private Deal Discussion
                  </Typography>
                </Box>
                <Chip label="🔒 Secure Room" size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }} />
              </Box>

              {/* Chat body */}
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <PrivateDealChat vehicleId={vehicleId} />
              </Box>
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default AuctionResultPage;
