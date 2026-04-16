/**
 * Live Auction Dashboard
 * Advanced vehicle auction monitoring with real-time updates via Socket.io
 * Shows live bid tracking, price performance chart, and top bidders
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  Badge,
  Alert,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  LocalOffer as BiddingIcon,
  TrendingUp,
  Group,
  Map,
  Edit,
  DirectionsCar as VehicleIcon,
  Healing as ConditionIcon,
  Palette as ColorIcon,
  Settings as TransmissionIcon,
  LocalGasStation as FuelIcon,
  AttachMoney as PriceIcon,
  LocationOn as LocationIcon,
  Star as FeaturesIcon,
  Stop as EndAuctionIcon,
  Schedule as ExtendTimeIcon,
  CheckCircle as AcceptBidIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PricePerformanceChart from '../components/PricePerformanceChart';
import BidPlacementForm from '../components/BidPlacementForm';
import BiddingConsentModal from '../components/BiddingConsentModal';
import BidderLeaderboard from '../components/BidderLeaderboard';
import LiveBidHistory from '../components/LiveBidHistory';
import AuctionMap from '../components/AuctionMap';
import AuctionGroupChat from '../components/AuctionGroupChat';
import CurrentLeadingBidder from '../components/CurrentLeadingBidder';

const LiveAuctionDashboard = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const theme = useTheme();
  const socketRef = useRef(null);

  // State management
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [totalBids, setTotalBids] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [priceHistory, setPriceHistory] = useState([]);
  const [topBidders, setTopBidders] = useState([]);
  const [bidderLocations, setBidderLocations] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]); // NEW: Store initial chat messages
  const [showConsentModal, setShowConsentModal] = useState(false); // ✅ NEW: Consent modal state
  const [isPartner, setIsPartner] = useState(null); // ✅ NEW: Track if user is already a partner
  const [checkingPartnerStatus, setCheckingPartnerStatus] = useState(false); // ✅ NEW: Loading state

  // ✅ FORCE FIX: Bulletproof ownership check with multiple fallbacks
  const isSeller = 
    user?._id?.toString() === vehicle?.sellerId?.toString() || 
    user?._id?.toString() === vehicle?.sellerId?._id?.toString() ||
    user?.id?.toString() === vehicle?.sellerId?.toString() ||
    user?.id?.toString() === vehicle?.sellerId?._id?.toString();
  
  console.log('🔍 [FORCE FIX - Ownership Check]', {
    userId: user?._id,
    userIdString: user?._id?.toString(),
    sellerId: vehicle?.sellerId,
    sellerIdString: vehicle?.sellerId?.toString(),
    sellerIdObjectId: vehicle?.sellerId?._id?.toString(),
    isSeller,
    vehicle: vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model}` : 'N/A'
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchVehicleDetails();
    
    // STEP 3: Restore chat history from database on component mount
    const fetchChatHistory = async () => {
      try {
        console.log('📥 [PERSISTENCE] Fetching chat history from database for:', vehicleId);
        const response = await api.get(`/api/bidding/${vehicleId}/chat-history`);
        
        if (response.data.success) {
          const restoredMessages = response.data.history || [];
          console.log(`✅ [PERSISTENCE] Restored ${restoredMessages.length} messages from database`);
          setChatMessages(restoredMessages);
        }
      } catch (error) {
        console.warn('⚠️ [PERSISTENCE] Failed to fetch chat history:', error.message);
        // Fallback: start with empty chat
        setChatMessages([]);
      }
    };
    
    fetchChatHistory();
  }, [isAuthenticated, vehicleId, navigate]);

  // Socket.io connection
  useEffect(() => {
    if (!vehicle) return;

    // ✅ NEW: Skip Socket.io for closed auctions
    if (vehicle?.status === 'closed') {
      console.log('🔒 Auction is closed, skipping real-time updates');
      return;
    }

    const SOCKET_SERVER = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_SERVER, {
      query: { vehicleId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    });

    // Wait for socket to connect before joining room
    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id);
      
      // IMPORTANT: Join auction room after connection is established
      socketRef.current.emit('joinAuctionRoom', vehicleId);
      console.log(`📍 Joined auction room for vehicle: ${vehicleId}`);
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setError(`Connection error: ${error.message}`);
    });

    // Listen for live bid updates
    socketRef.current.on('bidPlaced', (data) => {
      console.log('🎯 New bid received:', data);
      
      setCurrentBid(data.bidAmount);
      setHighestBidder(data.bidder);
      setTotalBids((prev) => prev + 1);
      
      // Add to price history with bidder information
      setPriceHistory((prev) => {
        const newBidIndex = prev.length + 1;
        return [
          ...prev,
          {
            bidLabel: `Bid ${newBidIndex}`,
            price: data.bidAmount,
            timestamp: data.timestamp || new Date().toISOString(),
            bidderName: `${data.bidder?.firstName || 'User'} ${data.bidder?.lastName || ''}`.trim(),
            bidIndex: newBidIndex,
          },
        ];
      });
    });

    // Listen for bidder list updates
    socketRef.current.on('biddersUpdate', (data) => {
      console.log('👥 Bidders updated:', data);
      setTopBidders(data.topBidders || []);
      setBidderLocations(data.locations || []);
    });

    // Listen for auction status changes
    socketRef.current.on('auctionUpdate', (data) => {
      console.log('⏱️ Auction status:', data);
      setIsLive(data.isLive);
      if (!data.isLive) {
        setError('Auction has ended');
      }
    });

    // Handle disconnection
    socketRef.current.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, attempt reconnection
        socketRef.current.connect();
      }
    });

    return () => {
      if (socketRef.current) {
        console.log('🚪 Leaving auction room and disconnecting socket');
        // Leave auction room before disconnecting
        socketRef.current.emit('leaveAuctionRoom', vehicleId);
        socketRef.current.disconnect();
      }
    };
  }, [vehicle, vehicleId]);

  // Countdown timer
  useEffect(() => {
    if (!vehicle) return;

    const updateCountdown = () => {
      const endTime = new Date(vehicle.auctionEndDate).getTime();
      const now = new Date().getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining('ENDED');
        setIsLive(false);
        return;
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [vehicle]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // STEP 1: Fetch basic vehicle details
      const response = await api.get(`/auction-vehicles/${vehicleId}`);
      const vehicleData = response.data.data;

      if (!vehicleData) {
        setError('Vehicle not found');
        return;
      }

      setVehicle(vehicleData);
      setCurrentBid(vehicleData.currentBid);
      setHighestBidder(vehicleData.highestBidder);
      setTotalBids(vehicleData.bids?.length || 0);

      // STEP 2: Fetch COMBINED bidding history from database (CRITICAL FOR PERSISTENCE)
      try {
        const biddingDetailsResponse = await api.get(`/api/bidding/${vehicleId}/combined`);
        if (biddingDetailsResponse.data.success) {
          const { bidHistory, chatMessages: persistedMessages } = biddingDetailsResponse.data.data;

          console.log(`✅ [PERSISTENCE] Fetched ${bidHistory.length} bids and ${persistedMessages.length} messages from database`);

          // Restore price history from database bids
          if (bidHistory && bidHistory.length > 0) {
            const priceHistoryFromDB = bidHistory.map((bid) => ({
              bidLabel: `Bid ${bid.bidIndex}`,
              price: bid.amount,
              timestamp: bid.timestamp,
              bidderName: bid.bidderName || 'Anonymous',
              bidIndex: bid.bidIndex,
              bidderId: bid.bidderId,
            }));
            setPriceHistory(priceHistoryFromDB);
            console.log(`📊 Price history restored from ${priceHistoryFromDB.length} database records`);
          } else {
            // Fallback: Start with the starting price
            setPriceHistory([
              {
                bidLabel: 'Starting Price',
                price: vehicleData.startingPrice,
                timestamp: vehicleData.auctionStartDate || new Date().toISOString(),
                bidderName: 'System',
                bidIndex: 0,
              },
            ]);
          }

          // CRITICAL: Restore chat messages for initialization
          if (persistedMessages && persistedMessages.length > 0) {
            setChatMessages(persistedMessages);
            console.log(`💬 [PERSISTENCE] Chat messages restored from database: ${persistedMessages.length} messages`);
          } else {
            setChatMessages([]);
            console.log(`💬 [PERSISTENCE] No previous messages in database, starting fresh`);
          }
        }
      } catch (bidErr) {
        console.warn('⚠️ Could not fetch combined bidding details:', bidErr.message);
        // Fallback to basic vehicle bid history if new endpoint not available
        if (vehicleData.bids && vehicleData.bids.length > 0) {
          const history = vehicleData.bids.map((bid, idx) => ({
            bidLabel: `Bid ${idx + 1}`,
            price: bid.bidAmount,
            timestamp: bid.bidDate || new Date().toISOString(),
            bidderName: bid.bidderId?.firstName || 'Anonymous',
            bidIndex: idx + 1,
          }));
          setPriceHistory(history);
        } else {
          setPriceHistory([
            {
              bidLabel: 'Starting Price',
              price: vehicleData.startingPrice,
              timestamp: vehicleData.auctionStartDate || new Date().toISOString(),
              bidderName: 'System',
              bidIndex: 0,
            },
          ]);
        }
        setChatMessages([]);
      }
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      setError(err.response?.data?.message || 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const handleBidSuccess = (updatedVehicle) => {
    // Update vehicle state with latest bid data
    setVehicle(updatedVehicle);
    setCurrentBid(updatedVehicle.currentBid);
    setHighestBidder(updatedVehicle.highestBidder);
    setTotalBids(updatedVehicle.bids?.length || 0);
  };

  // ✅ NEW: Check if user is already a partner for this auction
  const checkPartnerStatus = async () => {
    if (!vehicleId || !isAuthenticated) return;

    setCheckingPartnerStatus(true);
    try {
      const response = await api.get(`/bidding/partner-status/${vehicleId}`);
      if (response.data.success) {
        setIsPartner(response.data.isPartner);
        console.log(
          `✅ Partner status checked: ${response.data.isPartner ? 'Already a partner' : 'First time bidding'}`
        );
      }
    } catch (err) {
      console.warn('⚠️ Could not check partner status:', err.message);
      // Assume not a partner on error, show consent modal
      setIsPartner(false);
    } finally {
      setCheckingPartnerStatus(false);
    }
  };

  // ✅ NEW: Handle consent modal completion
  const handleConsentComplete = () => {
    console.log('✅ Consent completed, opening bid dialog');
    setIsPartner(true);
    setBidDialogOpen(true);
    setShowConsentModal(false);
  };

  // ✅ NEW: Handle "Place Your Bid" button click
  const handlePlaceBidClick = async () => {
    // ✅ FORCE FIX: Prevent sellers from bidding on their own auctions
    if (isSeller) {
      console.log('🚫 [SELLER] Cannot bid on own auction');
      alert('As the seller, you cannot bid on your own auction. Use the Seller Controls instead.');
      return;
    }

    if (isPartner === null) {
      // Check partner status first if not already determined
      await checkPartnerStatus();
    }

    if (!isPartner) {
      // First time bidding - show consent modal
      setShowConsentModal(true);
    } else {
      // Already a partner - open bid dialog directly
      setBidDialogOpen(true);
    }
  };

  // ✅ NEW: Seller Control Handlers
  const handleEndAuctionNow = async () => {
    if (!window.confirm('Are you sure you want to end this auction immediately?')) return;
    try {
      console.log('🛑 [SELLER] Ending auction now...');
      const response = await api.put(`/api/auction-vehicles/${vehicleId}/end-auction`);
      if (response.data.success) {
        setVehicle({ ...vehicle, status: 'closed' });
        console.log('✅ [SELLER] Auction ended successfully');
      }
    } catch (error) {
      console.error('❌ [SELLER] Failed to end auction:', error.message);
      alert('Failed to end auction: ' + error.response?.data?.message);
    }
  };

  const handleExtendTime = async () => {
    try {
      console.log('⏱️ [SELLER] Extending auction time by 5 minutes...');
      const response = await api.put(`/api/auction-vehicles/${vehicleId}/extend-time`, {
        minutes: 5
      });
      if (response.data.success) {
        setVehicle({ ...vehicle, auctionEndDate: response.data.data.auctionEndDate });
        console.log('✅ [SELLER] Auction extended successfully');
      }
    } catch (error) {
      console.error('❌ [SELLER] Failed to extend time:', error.message);
      alert('Failed to extend time: ' + error.response?.data?.message);
    }
  };

  const handleAcceptHighestBid = async () => {
    if (!highestBidder) {
      alert('No bids yet to accept');
      return;
    }
    if (!window.confirm(`Accept bid of LKR ${currentBid?.toLocaleString()} from ${highestBidder.firstName}?`)) return;
    try {
      console.log('✅ [SELLER] Accepting highest bid...');
      const response = await api.put(`/api/auction-vehicles/${vehicleId}/accept-bid`);
      if (response.data.success) {
        setVehicle({ ...vehicle, status: 'closed' });
        console.log('✅ [SELLER] Bid accepted - auction closed');
      }
    } catch (error) {
      console.error('❌ [SELLER] Failed to accept bid:', error.message);
      alert('Failed to accept bid: ' + error.response?.data?.message);
    }
  };

  const handleCancelAuction = async () => {
    if (!window.confirm('Are you sure you want to cancel this auction? This action cannot be undone.')) return;
    try {
      console.log('🚫 [SELLER] Cancelling auction...');
      const response = await api.put(`/api/auction-vehicles/${vehicleId}/cancel-auction`);
      if (response.data.success) {
        setVehicle({ ...vehicle, status: 'cancelled' });
        console.log('✅ [SELLER] Auction cancelled successfully');
      }
    } catch (error) {
      console.error('❌ [SELLER] Failed to cancel auction:', error.message);
      alert('Failed to cancel auction: ' + error.response?.data?.message);
    }
  };

  // ✅ NEW: Check partner status on mount
  useEffect(() => {
    if (vehicle && isAuthenticated) {
      checkPartnerStatus();
    }
  }, [vehicleId, isAuthenticated]);



  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
        <Typography color="textSecondary">Loading auction dashboard...</Typography>
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box sx={{ bgcolor: (theme) => theme.palette.background.default, minHeight: 'calc(100vh - 80px)', py: 4 }}>
        <Container>
          <Alert severity="error">Vehicle not found.</Alert>
        </Container>
      </Box>
    );
  }

  // ✅ NEW: Check if auction is closed
  const isClosed = vehicle?.status === 'closed';

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: 'calc(100vh - 80px)', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: theme.palette.text.primary }}>
              🚗 Live Auction Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Real-time bid tracking and price monitoring
            </Typography>
          </Box>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/bidding')}
            sx={{ color: theme.palette.primary.main }}
          >
            Back
          </Button>
        </Box>

        {/* ✅ NEW: Read-only Alert Banner for Closed Auctions */}
        {isClosed && (
          <Alert severity="success" sx={{ mb: 3, bgcolor: '#e8f5e9', border: '2px solid #4caf50' }}>
            <Typography sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              🏁 This auction has ended. You are viewing the final results in read-only mode.
            </Typography>
          </Alert>
        )}

        {/* SECTION 1: Redesigned Vehicle Details Header with Full Specs & Key Features */}
        <Paper
          sx={{
            p: 3,
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            mb: 3,
            boxShadow: 2,
            border: `1px solid ${theme.palette.divider}`,
            minHeight: 420,
          }}
        >
          <Grid container spacing={3} alignItems="flex-start">
            {/* LEFT: Vehicle Image - Large & Prominent */}
            <Grid item xs={12} sm={4}>
              <Box
                component="img"
                src={vehicle.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=Vehicle'}
                sx={{
                  width: '100%',
                  height: 320,
                  borderRadius: 2,
                  objectFit: 'cover',
                  border: `2px solid ${theme.palette.primary.light}`,
                  boxShadow: 2,
                }}
              />
            </Grid>

            {/* MIDDLE: Detailed Vehicle Specifications & Features - Two Columns */}
            <Grid item xs={12} sm={5}>
              <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', minHeight: 320 }}>
                {/* LEFT COLUMN: Vehicle Specs */}
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={2}>
                    {/* Vehicle Title */}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        🚗 Vehicle: {vehicle.year} {vehicle.brand} {vehicle.model}
                      </Typography>
                    </Box>

                    {/* Detailed Specs Grid - All with Icons */}
                    <Stack spacing={1.5}>
                      {/* Condition */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <ConditionIcon sx={{ fontSize: 20, color: theme.palette.info.main, mt: 0.3, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                            Condition
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                            {vehicle.condition} ({vehicle.mileage?.toLocaleString()} km)
                          </Typography>
                        </Box>
                      </Box>

                      {/* Color */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <ColorIcon sx={{ fontSize: 20, color: theme.palette.warning.main, mt: 0.3, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                            Color
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                            {vehicle.color || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Transmission */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <TransmissionIcon sx={{ fontSize: 20, color: theme.palette.success.main, mt: 0.3, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                            Transmission
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                            {vehicle.transmission}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Fuel Type */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <FuelIcon sx={{ fontSize: 20, color: theme.palette.error.main, mt: 0.3, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                            Fuel Type
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                            {vehicle.fuelType}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Asking Price */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <PriceIcon sx={{ fontSize: 20, color: theme.palette.secondary.main, mt: 0.3, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                            Asking Price
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                            LKR {vehicle.startingPrice?.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Location */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <LocationIcon sx={{ fontSize: 20, color: theme.palette.primary.main, mt: 0.3, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                            Location
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                            {vehicle.location?.city || 'N/A'}, {vehicle.location?.country || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>

                {/* RIGHT COLUMN: Key Features */}
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FeaturesIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        Key Features
                      </Typography>
                    </Box>
                    <ul style={{ margin: '0', paddingLeft: '1.5rem', color: theme.palette.text.primary }}>
                      {vehicle.features && vehicle.features.length > 0 ? (
                        vehicle.features.map((feature, idx) => (
                          <li key={idx} style={{ marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>
                            {feature}
                          </li>
                        ))
                      ) : (
                        <>
                          <li style={{ marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>Air Conditioning</li>
                          <li style={{ marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>Power Steering</li>
                          <li style={{ marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>Abs</li>
                          <li style={{ marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>Airbags</li>
                          <li style={{ marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>Bluetooth</li>
                          <li style={{ marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>Backup Camera</li>
                        </>
                      )}
                    </ul>
                  </Stack>
                </Box>
              </Box>
            </Grid>

            {/* RIGHT: Auction Status - Redesigned Layout */}
            <Grid item xs={12} sm={3}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                {/* Large Prominent Timer - MAIN FOCUS */}
                <Box
                  sx={{
                    p: 3,
                    background: `linear-gradient(135deg, rgba(102, 187, 106, 0.15), rgba(102, 187, 106, 0.05))`,
                    border: `2px solid ${theme.palette.success.light}`,
                    borderRadius: 2,
                    textAlign: 'center',
                    minHeight: 160,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.success.main, fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1, mb: 1 }}>
                    ⏱️ ENDS IN
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: timeRemaining === 'ENDED' ? theme.palette.error.main : theme.palette.success.main,
                      fontFamily: 'monospace',
                      fontSize: '2.2rem',
                    }}
                  >
                    {timeRemaining}
                  </Typography>
                </Box>

                {/* Compact Current Bid Box */}
                <Box
                  sx={{
                    p: 2,
                    background: `rgba(100, 181, 246, 0.1)`,
                    border: `1px solid ${theme.palette.info.light}`,
                    borderRadius: 1.5,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.info.main, fontSize: '0.7rem', fontWeight: 600, letterSpacing: 0.5 }}>
                    CURRENT BID
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: theme.palette.info.main, mt: 0.5, fontSize: '0.95rem' }}
                  >
                    LKR {currentBid?.toLocaleString()}
                  </Typography>
                </Box>

                {/* Compact Asking Price Box */}
                <Box
                  sx={{
                    p: 2,
                    background: `rgba(102, 187, 106, 0.1)`,
                    border: `1px solid ${theme.palette.success.light}`,
                    borderRadius: 1.5,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.success.main, fontSize: '0.7rem', fontWeight: 600, letterSpacing: 0.5 }}>
                    ASKING PRICE
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: theme.palette.success.main, mt: 0.5, fontSize: '0.95rem' }}
                  >
                    LKR {vehicle.startingPrice?.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* MAIN DASHBOARD: Professional Balanced Layout */}
        
        {/* TOP ROW: 7.5:4.5 Split - Chart vs Map + Leading Bidder (750px Total) */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* LEFT: Live Price Performance Chart (750px fixed - expanded to fill removed inner boxes) */}
          <Grid item xs={12} md={7.5}>
            <Paper elevation={2} sx={{ p: 4, bgcolor: theme.palette.background.paper, borderRadius: 3, height: 750, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexShrink: 0 }}>
                <TrendingUp sx={{ color: theme.palette.primary.main, fontSize: 26 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                  📈 Live Price Performance
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <PricePerformanceChart
                  priceHistory={priceHistory}
                  highestBidder={highestBidder}
                />
              </Box>
            </Paper>
          </Grid>

          {/* RIGHT: Map + Leading Bidder Stack (Total 750px) */}
          <Grid item xs={12} md={4.5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '30px', height: 750 }}>
              {/* Current Leading Bidder (360px) */}
              <Box sx={{ height: 360, overflow: 'auto' }}>
                <CurrentLeadingBidder
                  highestBidder={highestBidder}
                  bidHistory={vehicle.bids ? vehicle.bids.map((bid) => ({
                    bidderId: bid.bidderId?._id,
                    firstName: bid.bidderId?.firstName || 'Anonymous',
                    lastName: bid.bidderId?.lastName || '',
                    amount: bid.bidAmount,
                    timestamp: bid.bidDate || new Date().toISOString(),
                  })) : []}
                />
              </Box>

              {/* Live Auction Map (360px) */}
              <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', height: 360 }}>
                <AuctionMap 
                  vehicle={vehicle} 
                  socketRef={socketRef}
                />
              </Paper>
            </Box>
          </Grid>
        </Grid>

        {/* MIDDLE ROW: Summary Statistics (3 Equal Boxes) */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Starting Price */}
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1, fontWeight: 600 }}>
                STARTING PRICE
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                LKR {vehicle.startingPrice?.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          {/* Current Bid */}
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1, fontWeight: 600 }}>
                CURRENT BID
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                LKR {currentBid?.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          {/* Total Bids */}
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1, fontWeight: 600 }}>
                TOTAL BIDS
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                {totalBids} Bids
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* BOTTOM ROW: 50:50 Split - Bid History vs Chat (750px each) */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* LEFT: Live Bid History (750px) */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ bgcolor: theme.palette.background.paper, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 750 }}>
              {/* Header */}
              <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <BiddingIcon sx={{ color: theme.palette.primary.main, fontSize: 26 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                  💰 Live Bid History
                </Typography>
              </Box>
              
              {/* Scrollable Content */}
              <Box sx={{ p: 3, flex: 1, minHeight: 0 }}>
                <LiveBidHistory
                  vehicleId={vehicleId}
                  highestBidder={highestBidder}
                  socketUrl={process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'}
                  onPlaceBid={() => setBidDialogOpen(true)}
                  isLive={isLive}
                />
              </Box>

              {/* Fixed Footer: Place Your Bid Button or Seller Controls */}
              {!isClosed ? (
                <Box sx={{ p: 3, flexShrink: 0, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)' }}>
                  {isSeller ? (
                    // ✅ SELLER CONTROLS PANEL
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.primary.main }}>
                        👤 SELLER CONTROLS
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        <Button 
                          variant="contained" 
                          size="small"
                          startIcon={<EndAuctionIcon />}
                          sx={{ 
                            flex: 1,
                            minWidth: 120,
                            backgroundColor: '#ff9800',
                            '&:hover': { backgroundColor: '#f57c00' }
                          }}
                          onClick={handleEndAuctionNow}
                        >
                          End Auction Now
                        </Button>
                        <Button 
                          variant="contained" 
                          size="small"
                          startIcon={<ExtendTimeIcon />}
                          sx={{ 
                            flex: 1,
                            minWidth: 120,
                            backgroundColor: '#1e3a8a',
                            '&:hover': { backgroundColor: '#1e40af' }
                          }}
                          onClick={handleExtendTime}
                        >
                          Extend Time (+5m)
                        </Button>
                        <Button 
                          variant="contained" 
                          size="small"
                          startIcon={<AcceptBidIcon />}
                          sx={{ 
                            flex: 1,
                            minWidth: 120,
                            backgroundColor: '#4caf50',
                            '&:hover': { backgroundColor: '#45a049' }
                          }}
                          onClick={handleAcceptHighestBid}
                        >
                          Accept Highest Bid
                        </Button>
                        <Button 
                          variant="contained" 
                          size="small"
                          startIcon={<CancelIcon />}
                          sx={{ 
                            flex: 1,
                            minWidth: 120,
                            backgroundColor: '#f48fb1',
                            '&:hover': { backgroundColor: '#ec407a' }
                          }}
                          onClick={handleCancelAuction}
                        >
                          Cancel Auction
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    // ✅ BUYER BID BUTTON
                    <Button 
                      fullWidth 
                      variant="contained" 
                      disabled={checkingPartnerStatus}
                      sx={{ 
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        fontWeight: 700,
                        py: 1.5,
                        fontSize: '1rem',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                        }
                      }}
                      onClick={handlePlaceBidClick}
                    >
                      💰 Place Your Bid
                    </Button>
                  )}
                </Box>
              ) : (
                // ✅ POST-AUCTION CONTACT BRIDGE UI
                <Box sx={{ p: 3, flexShrink: 0, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)' }}>
                  {isSeller ? (
                    // 🏁 SELLER VIEW: Contact Winner
                    <Card sx={{ p: 2.5, bgcolor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 2 }}>
                      <Stack spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: '#856404' }}>
                          🏁 Auction Ended
                        </Typography>
                        <Divider />
                        {vehicle?.highestBidder ? (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                              Contact Winning Bidder:
                            </Typography>
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                  {vehicle.highestBidder?.firstName?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {vehicle.highestBidder?.firstName} {vehicle.highestBidder?.lastName}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Final Bid: LKR {vehicle.currentBid?.toLocaleString()}
                                  </Typography>
                                </Box>
                              </Box>
                              {vehicle.highestBidder?.email && (
                                <Typography variant="body2">
                                  📧 <strong>Email:</strong> {vehicle.highestBidder.email}
                                </Typography>
                              )}
                              {vehicle.highestBidder?.phone && (
                                <Typography variant="body2">
                                  📱 <strong>Phone:</strong> {vehicle.highestBidder.phone}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                            No bids received for this auction.
                          </Typography>
                        )}
                      </Stack>
                    </Card>
                  ) : user?._id?.toString() === vehicle?.highestBidder?._id?.toString() || user?.id?.toString() === vehicle?.highestBidder?._id?.toString() ? (
                    // 🏆 WINNER VIEW: Contact Seller
                    <Card sx={{ p: 2.5, bgcolor: '#d4edda', border: '1px solid #28a745', borderRadius: 2 }}>
                      <Stack spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: '#155724' }}>
                          🏆 Congratulations! You Won!
                        </Typography>
                        <Divider />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                            Contact Seller:
                          </Typography>
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main' }}>
                                {vehicle?.sellerId?.firstName?.charAt(0) || 'S'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {vehicle?.sellerId?.firstName} {vehicle?.sellerId?.lastName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Winning Amount: LKR {vehicle?.currentBid?.toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                            {vehicle?.sellerId?.email && (
                              <Typography variant="body2">
                                📧 <strong>Email:</strong> {vehicle.sellerId.email}
                              </Typography>
                            )}
                            {vehicle?.sellerId?.phone && (
                              <Typography variant="body2">
                                📱 <strong>Phone:</strong> {vehicle.sellerId.phone}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </Card>
                  ) : (
                    // 👁️ VIEWER VIEW: Read-only results
                    <Card sx={{ p: 2.5, bgcolor: '#e2e3e5', border: '1px solid #6c757d', borderRadius: 2 }}>
                      <Stack spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: '#383d41' }}>
                          👁️ Read-Only View
                        </Typography>
                        <Divider />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Final Results:
                          </Typography>
                          <Stack spacing={1}>
                            <Typography variant="body2">
                              <strong>Starting Price:</strong> LKR {vehicle?.startingPrice?.toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Final Price:</strong> LKR {vehicle?.currentBid?.toLocaleString()}
                            </Typography>
                            {vehicle?.highestBidder && (
                              <Typography variant="body2">
                                <strong>Winner:</strong> {vehicle.highestBidder.firstName} {vehicle.highestBidder.lastName}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </Card>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* RIGHT: Live Discussion Chat (750px) */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ bgcolor: theme.palette.background.paper, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 750 }}>
              {/* Header */}
              <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Group sx={{ color: theme.palette.primary.main, fontSize: 26 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                  💬 Live Discussion
                </Typography>
              </Box>

              {/* Scrollable Chat Content */}
              <Box sx={{ flex: 1, minHeight: 0, p: 2 }}>
                <AuctionGroupChat
                  vehicleId={vehicleId}
                  socketRef={socketRef}
                  currentUserId={user?.id}
                  currentUserName={`${user?.firstName} ${user?.lastName}`}
                  initialMessages={chatMessages}
                  isClosed={isClosed}
                  vehicle={vehicle && {
                    brand: vehicle.brand || 'Unknown',
                    model: vehicle.model || 'Unknown',
                    year: vehicle.yearOfManufacture || vehicle.year,
                    startingPrice: vehicle.startingPrice || vehicle.bidStartPrice,
                    condition: vehicle.condition || 'Not specified',
                    location: typeof vehicle.location === 'object' 
                      ? `${vehicle.location?.city || ''}, ${vehicle.location?.state || ''}, ${vehicle.location?.country || ''}`.trim()
                      : (vehicle.location || vehicle.city || 'Not specified'),
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Bid Placement Dialog */}
        <BidPlacementForm
          open={bidDialogOpen}
          onClose={() => setBidDialogOpen(false)}
          vehicle={vehicle}
          currentBid={currentBid}
          onBidSuccess={handleBidSuccess}
        />

        {/* ✅ NEW: Bidding Consent Modal (first-time bidder) */}
        <BiddingConsentModal
          open={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          auctionId={vehicleId}
          vehicleInfo={
            vehicle && {
              year: vehicle.year,
              brand: vehicle.brand,
              model: vehicle.model,
              startingPrice: `LKR ${vehicle.startingPrice?.toLocaleString() || '0'}`,
              condition: vehicle.condition?.toUpperCase() || 'GOOD',
              location: vehicle.location?.city || 'Location not specified',
            }
          }
          onConsentComplete={handleConsentComplete}
        />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default LiveAuctionDashboard;
