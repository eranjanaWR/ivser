/**
 * Live Auction Dashboard
 * Advanced vehicle auction monitoring with real-time updates via Socket.io
 * Shows live bid tracking, price performance chart, and top bidders
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';
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
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PricePerformanceChart from '../components/PricePerformanceChart';
import BidPlacementForm from '../components/BidPlacementForm';
import BiddingPartnerRegistrationModal from '../components/BiddingPartnerRegistrationModal';
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
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(null); // ✅ PERSISTENT: Track if user is registered for this specific vehicle
  const [checkingPartnerStatus, setCheckingPartnerStatus] = useState(false); // ✅ Loading state
  const [partners, setPartners] = useState([]); // ✅ NEW: Store all registered bidding partners for the map
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // ✅ NEW: Image Carousel State

  // ✅ NEW: Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    type: 'primary',
    onConfirm: () => {},
  });

  // ✅ Image Carousel Handlers
  const handlePrevImage = () => {
    if (!vehicle?.images?.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? vehicle.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!vehicle?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
  };

  // ✅ Auto-rotate images every 4 seconds
  useEffect(() => {
    if (!vehicle?.images?.length || vehicle.images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [vehicle]);

  // ✅ AUTHORIZATION CHECK: Bulletproof ownership verification
  const isOwner = useMemo(() => {
    // 1. Both user and vehicle data must be present
    if (!user || !vehicle || !vehicle.sellerId) return false;

    // 2. Extract IDs from potential object or string formats
    const loggedInId = (user._id || user.id)?.toString();
    const sellerId = (vehicle.sellerId._id || vehicle.sellerId)?.toString();

    // 3. Ensure both IDs are valid strings before comparing
    if (!loggedInId || !sellerId) return false;

    // 4. Return comparison result
    return loggedInId === sellerId;
  }, [user, vehicle]);

  // ✅ WINNER CHECK: Checks ALL possible winner fields in the vehicle model
  const isWinner = useMemo(() => {
    if (!user || !vehicle) return false;
    const loggedInId = (user._id || user.id)?.toString();
    if (!loggedInId) return false;

    // Field 1: vehicle.highestBidder (populated User object — the main field in AuctionVehicle model)
    const highestBidderObjId = (vehicle.highestBidder?._id || vehicle.highestBidder)?.toString();
    // Field 2: vehicle.highestBidderId (alternative flat ID field)
    const highestBidderFlatId = (vehicle.highestBidderId?._id || vehicle.highestBidderId)?.toString();
    // Field 3: vehicle.winnerId (explicit winner set after 'Accept Bid')
    const winnerIdStr = (vehicle.winnerId?._id || vehicle.winnerId)?.toString();

    const matched = (
      (highestBidderObjId && loggedInId === highestBidderObjId) ||
      (highestBidderFlatId && loggedInId === highestBidderFlatId) ||
      (winnerIdStr && loggedInId === winnerIdStr)
    );

    console.log('🏆 [WINNER CHECK]', { loggedInId, highestBidderObjId, highestBidderFlatId, winnerIdStr, matched });
    return matched;
  }, [user, vehicle]);

  // Debug logging for development (optional)
  useEffect(() => {
    console.log('🔒 [AUTH CHECK] isOwner:', isOwner, {
      userId: user?._id || user?.id,
      sellerId: vehicle?.sellerId?._id || vehicle?.sellerId
    });
  }, [isOwner, user, vehicle]);

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
        const response = await api.get(`/bidding/${vehicleId}/chat-history`);
        
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
    checkPartnerStatus(); // ✅ PERSISTENCE: Check registration status on page load
  }, [isAuthenticated, vehicleId, navigate]);

  // Socket.io connection
  useEffect(() => {
    if (!vehicle) return;

    // ✅ Skip Socket.io for auctions that are already in a terminal state
    const statusLower = vehicle?.status?.toLowerCase() || '';
    if (['closed', 'completed', 'cancelled'].includes(statusLower)) {
      console.log('🔒 Auction is in terminal state, skipping real-time socket connection');
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

    // ✅ NEW: Listen for time extensions
    socketRef.current.on('auctionUpdated', (data) => {
      console.log('⏱️ Auction extended:', data);
      if (data.auctionEndDate) {
        setVehicle(prev => ({ ...prev, auctionEndDate: data.auctionEndDate }));
        console.log(`✅ [SOCKET] UI updated with new end date: ${data.auctionEndDate}`);
      }
    });

    // ✅ Listen for auction ending/cancellation
    socketRef.current.on('auctionEnded', async (data) => {
      console.log('🏁 Auction ended event received:', data);
      setIsLive(false);

      // CRITICAL FIX: Re-fetch the full vehicle object from the server.
      // The socket event only carries the new status, NOT the winner data.
      // We need the populated highestBidder / winnerId to show the correct button.
      try {
        const refreshed = await api.get(`/auction-vehicles/${vehicleId}`);
        if (refreshed.data?.data) {
          const updatedVehicle = refreshed.data.data;
          setVehicle(updatedVehicle);
          setHighestBidder(updatedVehicle.highestBidder);
          console.log('✅ [SOCKET] Vehicle refreshed after auction end:', {
            status: updatedVehicle.status,
            highestBidder: updatedVehicle.highestBidder?._id,
            winnerId: updatedVehicle.winnerId,
          });
        }
      } catch (err) {
        // Fallback: at minimum patch the status so isClosed becomes true
        console.warn('⚠️ Could not refresh vehicle, patching status only:', err.message);
        if (data.status) {
          setVehicle(prev => ({ ...prev, status: data.status }));
        }
      }
    });
    
    // ✅ NEW: Listen for new partner registrations to update map in real-time
    socketRef.current.on('newPartnerLocation', (data) => {
      console.log('📍 [REAL-TIME] New partner location received:', data);
      if (data.vehicleId === vehicleId && data.partner) {
        setPartners(prev => {
          // Unify structure: Ensure ID is always at top level as 'userId' for comparison
          const newPartnerId = (data.partner.userId?._id || data.partner.userId || data.partner.id)?.toString();
          
          // Prevent duplicates
          const exists = prev.some(p => (p.id || p.userId?._id || p.userId)?.toString() === newPartnerId);
          if (exists) return prev;
          
          return [...prev, { ...data.partner, id: newPartnerId }];
        });
        toast.info(`📍 New bidder joined from ${data.partner.town || 'unknown location'}!`);
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
        const biddingDetailsResponse = await api.get(`/bidding/${vehicleId}/combined`);
        if (biddingDetailsResponse.data.success) {
          const { bidHistory, chatMessages: persistedMessages, partners: dbPartners } = biddingDetailsResponse.data.data;

          console.log(`✅ [PERSISTENCE] Fetched ${bidHistory.length} bids, ${persistedMessages.length} messages, and ${dbPartners?.length || 0} partners`);
          
          if (dbPartners) setPartners(dbPartners);

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
            setPriceHistory([
              {
                bidLabel: 'Starting Price',
                price: vehicleData.startingPrice,
                timestamp: vehicleData.auctionStartDate || vehicleData.createdAt || new Date().toISOString(),
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

          // ✅ NEW: Check registration status on mount
          if (isAuthenticated) {
            checkPartnerStatus();
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

  // ✅ PERSISTENCE: Check if user is already a registered partner for this specific vehicle
  const checkPartnerStatus = async () => {
    if (!vehicleId || !isAuthenticated) return;

    setCheckingPartnerStatus(true);
    try {
      const response = await api.get(`/bidding/check-registration/${vehicleId}`);
      if (response.data.success) {
        setIsAlreadyRegistered(response.data.isPartner);
        console.log(
          `✅ Registration status checked: ${response.data.isPartner ? 'Already registered' : 'Not registered yet'}`
        );
      }
    } catch (err) {
      console.warn('⚠️ Could not check registration status:', err.message);
      // Assume not registered on error to show the form
      setIsAlreadyRegistered(false);
    } finally {
      setCheckingPartnerStatus(false);
    }
  };

  // ✅ POST-REGISTRATION: Update state immediately after successful form submission
  const handleConsentComplete = () => {
    console.log('✅ Registration completed, opening bid dialog');
    setIsAlreadyRegistered(true); // Update state so modal doesn't show again
    setBidDialogOpen(true);
    setShowConsentModal(false);
  };

  // ✅ BID HANDLER: Enforce Bidding Partner Registration
  const handlePlaceBidClick = async () => {
    console.log('--- DEBUG BID ATTEMPT ---');
    console.log('Vehicle ID:', vehicleId);
    console.log('Authenticated:', isAuthenticated);
    console.log('User Object:', user);
    
    const loggedInUserId = (user?._id || user?.id)?.toString();
    console.log('Logged-in User ID (parsed):', loggedInUserId);

    // 1. SECURITY: Prevent sellers from bidding on their own auctions
    if (isOwner) {
      console.warn('🚫 [BID-BLOCK] User is owner');
      toast.warning('🚫 As the owner, you cannot bid on your own auction.');
      return;
    }

    if (!isAuthenticated) {
      console.warn('🚫 [BID-BLOCK] Not authenticated');
      navigate('/login');
      return;
    }

    // 2. REGISTRATION CHECK: Verify if already a partner for THIS vehicle
    setCheckingPartnerStatus(true);
    try {
      console.log('🔍 [BID-LOGIC] Current Partners List:', partners);
      
      // Strict ID comparison using the local partners list
      // Note: Backend maps userId to 'id' in the combined details response
      const localCheck = partners.some(p => {
        const pId = (p.id || p.userId?._id || p.userId)?.toString();
        const match = pId === loggedInUserId;
        if (match) console.log(`✅ [LOCAL-MATCH] Found user in partners: ${pId}`);
        return match;
      });
      
      if (localCheck) {
        console.log('✅ [BID-LOGIC] Local check passed. Opening dialog.');
        setIsAlreadyRegistered(true);
        setBidDialogOpen(true);
      } else {
        console.log('🔄 [BID-LOGIC] Local check failed. Querying server...');
        // Fallback to API check for final confirmation
        const response = await api.get(`/bidding/check-registration/${vehicleId}`);
        const isPartner = response.data.isPartner;
        
        console.log('📡 [SERVER-RESPONSE] isPartner:', isPartner);
        setIsAlreadyRegistered(isPartner);
        
        if (isPartner) {
          setBidDialogOpen(true);
        } else {
          console.log('⚠️ [BID-LOGIC] Not registered. Redirecting to modal...');
          setShowConsentModal(true);
        }
      }
    } catch (err) {
      console.error('❌ [BID-LOGIC] Critical status check failure:', err);
      // On error, show registration modal to be safe (enforce location capture)
      setShowConsentModal(true);
    } finally {
      setCheckingPartnerStatus(false);
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
      console.log('⏱️ [SELLER] Extending auction time by 5 minutes for:', vehicleId);
      const response = await api.put(`/bidding/${vehicleId}/extend-time`, {
        minutes: 5
      });
      if (response.data.success) {
        const rawEndTime = response.data.endTime || response.data.data?.auctionEndDate;
        console.log('✅ [SELLER] Time extension successful:', rawEndTime);
        
        // Format the new end time safely to avoid "Invalid Date"
        const formattedTime = rawEndTime 
          ? new Date(rawEndTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }) 
          : 'N/A';

        toast.success(
          <div>
            <strong>Auction extended by 5 minutes!</strong>
            <br />
            New End Time: {formattedTime}
          </div>
        );
      }
    } catch (error) {
      console.error('❌ [SELLER] Failed to extend time:', error.response?.data || error.message);
      alert('Failed to extend time: ' + (error.response?.data?.message || error.message));
    }
  };

  // ✅ SELLER ACTION EXECUTION: Accept Bid
  const executeAcceptBid = async () => {
    try {
      console.log('✅ [SELLER] Executing accept bid for:', vehicleId);
      const response = await api.put(`/bidding/${vehicleId}/accept-bid`);
      if (response.data.success) {
        console.log('✅ [SELLER] Bid accepted successfully');
        toast.success('Auction closed! Highest bid accepted.');
      }
    } catch (error) {
      console.error('❌ [SELLER] Failed to accept bid:', error.response?.data || error.message);
      alert('Failed to accept bid: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAcceptHighestBid = () => {
    if (!highestBidder) {
      alert('No bids yet to accept');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Accept Highest Bid',
      message: `Accept bid of LKR ${currentBid?.toLocaleString()} from ${highestBidder.firstName}?`,
      type: 'success',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: () => {
        executeAcceptBid();
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleCancelAuction = () => {
    setConfirmDialog({
      open: true,
      title: 'Cancel Auction',
      message: '⚠️ Warning: Are you sure you want to cancel this auction? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Yes, Cancel Auction',
      cancelText: 'No, Keep It',
      onConfirm: () => {
        executeCancelAuction();
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  // ✅ SELLER ACTION EXECUTION: Cancel Auction
  const executeCancelAuction = async () => {
    try {
      console.log('🚫 [SELLER] Executing cancel auction for:', vehicleId);
      const response = await api.put(`/bidding/${vehicleId}/cancel-auction`);
      if (response.data.success) {
        console.log('✅ [SELLER] Auction cancelled successfully');
        toast.info('Auction has been cancelled.');
      }
    } catch (error) {
      console.error('❌ [SELLER] Failed to cancel auction:', error.response?.data || error.message);
      alert('Failed to cancel auction: ' + (error.response?.data?.message || error.message));
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

  // ✅ isClosed: catches ALL terminal statuses (case-insensitive) + time expiry
  const statusLower = vehicle?.status?.toLowerCase() || '';
  const isClosed = ['closed', 'completed', 'cancelled'].includes(statusLower) || new Date(vehicle?.auctionEndDate) <= new Date();
  // isOwner and isWinner are memoized at the top of the component
  console.log('🔍 [DASHBOARD STATE]', { status: vehicle?.status, isClosed, isOwner, isWinner, winnerId: vehicle?.winnerId, highestBidder: vehicle?.highestBidder });

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: 'calc(100vh - 80px)', py: 4 }}>
      {/* ✅ NEW: Reusable Confirmation Modal */}
      <ConfirmationModal
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />

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
            {/* LEFT: Vehicle Image Carousel - Large & Prominent */}
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 320,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `2px solid ${theme.palette.primary.light}`,
                  boxShadow: 2,
                  '&:hover .nav-arrow': {
                    opacity: 1, // Show arrows on hover
                  }
                }}
              >
                {/* Main Image */}
                <Box
                  component="img"
                  src={(() => {
                    const img = vehicle.images && vehicle.images[currentImageIndex];
                    if (!img) return 'https://via.placeholder.com/300x300?text=No+Image';
                    if (typeof img === 'string') {
                      return img.startsWith('http') ? img : `http://localhost:5000${img.startsWith('/') ? '' : '/'}${img}`;
                    }
                    if (img.url) return img.url;
                    if (img._id) return `http://localhost:5000/api/images/${img._id}`;
                    return 'https://via.placeholder.com/300x300?text=Image+Format+Unknown';
                  })()}
                  alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'opacity 0.3s ease-in-out',
                  }}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                  }}
                />

                {/* Left Arrow */}
                {vehicle.images && vehicle.images.length > 1 && (
                  <Box
                    className="nav-arrow"
                    onClick={handlePrevImage}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: 10,
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.4)',
                      color: 'white',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: 0,
                      transition: 'opacity 0.3s ease, background-color 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                  >
                    &#10094;
                  </Box>
                )}

                {/* Right Arrow */}
                {vehicle.images && vehicle.images.length > 1 && (
                  <Box
                    className="nav-arrow"
                    onClick={handleNextImage}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      right: 10,
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.4)',
                      color: 'white',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: 0,
                      transition: 'opacity 0.3s ease, background-color 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                  >
                    &#10095;
                  </Box>
                )}
                
                {/* Image Dots Indicator */}
                {vehicle.images && vehicle.images.length > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 15,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 1,
                    }}
                  >
                    {vehicle.images.map((_, idx) => (
                      <Box
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: idx === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                          transition: 'background-color 0.2s',
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
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
                  startingPrice={vehicle?.startingPrice}
                  startTime={vehicle?.createdAt}
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
                  initialPartners={partners}
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
                  onPlaceBid={handlePlaceBidClick}
                  isLive={isLive}
                />
              </Box>

              {/* Fixed Footer: Place Your Bid Button or Seller Controls */}
              {isClosed ? (
                <Box sx={{ p: 3, flexShrink: 0, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: '#f0f9ff' }}>
                  {(isOwner || isWinner) ? (
                    // ✅ WINNER or SELLER: Show Contact Button
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<TrophyIcon />}
                      sx={{ 
                        py: 2.5, 
                        fontWeight: 800, 
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        bgcolor: isWinner ? '#22c55e' : '#1976d2',
                        color: 'white',
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          bgcolor: isWinner ? '#16a34a' : '#1565c0',
                          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                          transform: 'translateY(-2px)'
                        },
                        '&:active': {
                          transform: 'translateY(0px)'
                        }
                      }}
                      onClick={() => navigate(`/auction-result/${vehicleId}`)}
                    >
                      {isWinner ? '🏆 You Won! Contact Seller' : '🤝 Auction Won! Contact Winner'}
                    </Button>
                  ) : (
                    // ✅ OTHER BIDDERS: Show Auction Ended Message
                    <Alert severity="info" sx={{ borderRadius: 3, fontSize: '1rem', fontWeight: 600 }}>
                      This auction has ended.
                    </Alert>
                  )}
                </Box>
              ) : (
                <Box sx={{ p: 3, flexShrink: 0, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)' }}>
                  {isOwner ? (
                    // ✅ SELLER CONTROLS PANEL
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.primary.main }}>
                        👤 SELLER CONTROLS
                      </Typography>
                      <Stack direction="row" spacing={2}>
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
                    // ✅ BIDDER: Place Bid Button
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<BiddingIcon />}
                      disabled={!isLive}
                      sx={{ 
                        py: 2, 
                        fontWeight: 800, 
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                        '&:hover': { boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)' }
                      }}
                      onClick={handlePlaceBidClick}
                    >
                      {isLive ? 'PLACE YOUR BID NOW' : 'AUCTION ENDED'}
                    </Button>
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
                  isOwner={isOwner}
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

        {/* ✅ NEW: Bidding Partner Registration Modal (first-time bidder) */}
        <BiddingPartnerRegistrationModal
          open={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          auctionId={vehicleId}
          socket={socketRef.current} // Pass socket for real-time broadcast
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
          onRegistrationComplete={handleConsentComplete}
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
