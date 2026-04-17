/**
 * BookTestDrivePage
 * Unified 3-step booking page when seller has availability slots.
 * Falls back to a free-form request when no slots are configured.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Button,
  CircularProgress, Alert, TextField, Grid, Divider,
} from '@mui/material';
import {
  ArrowBack,
  AccessTime as ClockIcon,
  CalendarToday as CalendarIcon,
  PersonOutline as PersonIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── Constants ───────────────────────────────── */
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── Helpers ─────────────────────────────────── */
const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

const getAvailableDayNames = (days) =>
  DAY_NAMES.filter((_, i) => days[i]).join(', ');

const generateAvailableDates = (daysArray) => {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    const idx = dow === 0 ? 6 : dow - 1; // convert to Mon=0 index
    if (daysArray[idx]) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      result.push({
        value: `${year}-${month}-${day}`,
        label: d.toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
        }),
      });
    }
  }
  return result;
};

const timeInRange = (time, slot) => {
  if (!time || !slot) return false;
  const [h, m]   = time.split(':').map(Number);
  const [sh, sm] = slot.startTime.split(':').map(Number);
  const [eh, em] = slot.endTime.split(':').map(Number);
  const t = h * 60 + m, s = sh * 60 + sm, e = eh * 60 + em;
  return t >= s && t < e;
};

/* ── DayBadge ────────────────────────────────── */
const DayBadge = ({ label, active }) => (
  <Box sx={{
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.68rem', fontWeight: 700,
    bgcolor: active ? '#1976d2' : 'transparent',
    color: active ? '#fff' : '#bdbdbd',
    border: active ? 'none' : '1px solid #e0e0e0',
  }}>
    {label}
  </Box>
);

/* ── Section Header ──────────────────────────── */
const StepHeader = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
    {icon}
    <Typography variant="h6" fontWeight={600}>{title}</Typography>
  </Box>
);

/* ══════════════════════════════════════════════ */
/*  Main Component                                */
/* ══════════════════════════════════════════════ */
const BookTestDrivePage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  /* data */
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [vehicle, setVehicle]   = useState(null);
  const [slots, setSlots]       = useState([]);
  const [hasSlots, setHasSlots] = useState(false);

  /* slot flow */
  const [selectedSlot, setSelectedSlot]     = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate]     = useState('');
  const [selectedTime, setSelectedTime]     = useState('');

  /* contact info */
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });

  /* no-slots request form */
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  /* submission */
  const [formError, setFormError]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [bookingId, setBookingId]   = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  /* ── Auth guard ─────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, isAuthenticated]);

  /* ── Pre-fill contact from user profile ──────── */
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  /* ── Load vehicle + seller availability ─────── */
  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch vehicle
      console.log('📍 Fetching vehicle:', vehicleId);
      const vehicleRes = await api.get(`/vehicles/${vehicleId}`);
      console.log('✅ Vehicle response:', vehicleRes.data);
      const v = vehicleRes.data.data;
      
      if (!v) {
        throw new Error('Vehicle data not found in response');
      }
      
      setVehicle(v);

      const sellerId = typeof v.sellerId === 'object'
        ? (v.sellerId._id || v.sellerId.id)
        : v.sellerId;
      
      console.log('📍 Seller ID:', sellerId);

      // Fetch seller availability
      console.log('📍 Fetching availability for seller:', sellerId);
      const availRes = await api.get(`/availability/seller/${sellerId}`);
      console.log('✅ Availability response:', availRes.data);
      const availData = availRes.data.data;
      const enabled = (availData.availabilitySlots || []).filter(s => s.enabled);
      setSlots(enabled);
      setHasSlots(enabled.length > 0);
      console.log('✅ Loaded slots:', enabled.length);
    } catch (err) {
      console.error('❌ Load data error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load booking details.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Slot selection ─────────────────────────── */
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableDates(generateAvailableDates(slot.days));
    setFormError('');
  };

  /* ── Contact form change ────────────────────── */
  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  /* ── Submit slot-based booking ──────────────── */
  const validateSelection = () => {
    // Prevent timezone shifts by parsing the string as local year, month, day
    const [year, month, day] = selectedDate.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const dayOfWeek = localDate.getDay(); // 0 = Sunday, 1 = Monday
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Map to 0 = Monday

    console.log('--- DATE VALIDATION DEBUG ---');
    console.log('Selected Date String:', selectedDate);
    console.log('Local Date Object:', localDate);
    console.log('getDay() Index (0=Sun):', dayOfWeek);
    console.log('Slot Days Array (0=Mon):', selectedSlot.days);
    console.log('Is Selected Day Available?:', selectedSlot.days[adjustedDay]);

    return selectedSlot.days[adjustedDay];
  };

  const handleSlotBookingSubmit = async () => {
    setFormError('');
    if (!selectedSlot)  { setFormError('Please select an available time slot.'); return; }
    if (!selectedDate)  { setFormError('Please select a date.'); return; }
    
    if (!validateSelection()) {
      setFormError('Selected date does not fall within the available days for this slot');
      return;
    }

    if (!selectedTime)  { setFormError('Please enter a preferred time.'); return; }
    if (!timeInRange(selectedTime, selectedSlot)) {
      setFormError(`Time must be within the allowed range: ${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}.`);
      return;
    }
    if (!formData.fullName.trim()) { setFormError('Please enter your full name.'); return; }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address.'); return;
    }
    if (!formData.phone.trim()) { setFormError('Please enter your phone number.'); return; }

    setSubmitting(true);
    try {
      const res = await api.post('/buyer/book-testdrive', {
        vehicleId,
        selectedSlot,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        buyerInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
      });
      setBookingId(res.data.data?.bookingId || '');
      setSuccess(true);
      setTimeout(() => navigate('/test-drives'), 3500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Submit no-slot request ─────────────────── */
  const handleRequestSubmit = async () => {
    setFormError('');
    if (!preferredDate) { setFormError('Please select a preferred date.'); return; }
    if (!preferredTime) { setFormError('Please select a preferred time.'); return; }

    setSubmitting(true);
    try {
      await api.post('/test-drives', {
        vehicleId,
        date: preferredDate,
        time: preferredTime,
        preferredDate,
        buyerNotes: requestMessage,
      });
      setSuccess(true);
      setTimeout(() => navigate('/test-drives'), 3500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Request failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ────────────────────────────────────────────── */
  /*  Loading / Error / Success screens             */
  /* ────────────────────────────────────────────── */
  if (loading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">Loading booking details…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Go Back</Button>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Paper elevation={0} sx={{ p: 5, border: '1px solid #e0e0e0', borderRadius: 3 }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {hasSlots ? 'Booking Request Submitted!' : 'Test Drive Request Sent!'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {hasSlots
              ? 'Your booking is pending seller confirmation. You\'ll be notified by email.'
              : 'The seller will review your request and get back to you soon.'}
          </Typography>
          {bookingId && (
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main', mb: 2 }}>
              Booking ID: {bookingId}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Redirecting to your test drives…
          </Typography>
        </Paper>
      </Container>
    );
  }

  /* ────────────────────────────────────────────── */
  /*  Shared: Vehicle + Seller Info Card            */
  /* ────────────────────────────────────────────── */
  const sellerName = vehicle?.sellerId && typeof vehicle.sellerId === 'object'
    ? `${vehicle.sellerId.firstName || ''} ${vehicle.sellerId.lastName || ''}`.trim()
    : '';

  const vehicleName = vehicle
    ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})`
    : '';

  /* ════════════════════════════════════════════ */
  /*  RENDER                                      */
  /* ════════════════════════════════════════════ */
  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '80vh', py: 4 }}>
      <Container maxWidth="md">

        {/* Back Button + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ color: '#1976d2', fontWeight: 500, minWidth: 'auto' }}
          >
            Back
          </Button>
          <Typography variant="h5" fontWeight={700}>Book Test Drive</Typography>
        </Box>

        {/* Vehicle + Seller Info Card */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">Vehicle</Typography>
              <Typography fontWeight={500}>{vehicleName.toLowerCase()}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">Seller</Typography>
              <Typography fontWeight={500}>{sellerName || 'Unknown Seller'}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* ══════════════════════════════════════ */}
        {/*  SLOT-BASED 3-STEP FLOW               */}
        {/* ══════════════════════════════════════ */}
        {hasSlots ? (
          <>
            {/* ── Step 1: Select Slot ── */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <StepHeader
                icon={<ClockIcon sx={{ color: '#555', fontSize: 22 }} />}
                title="Step 1: Select Available Time Slot"
              />

              {slots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <Box
                    key={slot.id}
                    onClick={() => handleSlotSelect(slot)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      p: 2,
                      mb: 1.5,
                      border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      borderRadius: 2,
                      bgcolor: isSelected ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: '#1976d2', bgcolor: '#f0f7ff' },
                    }}
                  >
                    {/* Radio dot */}
                    <Box sx={{
                      mt: 0.3,
                      width: 20, height: 20, borderRadius: '50%',
                      border: isSelected ? '6px solid #1976d2' : '2px solid #bdbdbd',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }} />

                    <Box sx={{ flex: 1 }}>
                      {/* Time range */}
                      <Typography fontWeight={600} sx={{ mb: 0.8 }}>
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </Typography>

                      {/* Day badges */}
                      <Box sx={{ display: 'flex', gap: 0.6, mb: 0.8 }}>
                        {DAY_LABELS.map((lbl, i) => (
                          <DayBadge key={i} label={lbl} active={slot.days[i]} />
                        ))}
                      </Box>

                      {/* Available days text */}
                      <Typography variant="caption" color="text.secondary">
                        Available: {getAvailableDayNames(slot.days)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Paper>

            {/* ── Step 2: Select Date & Time (visible after slot selected) ── */}
            {selectedSlot && (
              <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <StepHeader
                  icon={<CalendarIcon sx={{ color: '#555', fontSize: 22 }} />}
                  title="Step 2: Select Date & Time"
                />

                <Grid container spacing={2.5}>
                  {/* Date dropdown */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Choose a date..."
                      value={selectedDate}
                      onChange={(e) => { setSelectedDate(e.target.value); setFormError(''); }}
                      SelectProps={{ native: true }}
                      InputLabelProps={{ shrink: true }}
                    >
                      <option value="">Choose a date...</option>
                      {availableDates.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </TextField>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Select from available dates (starting from today)
                    </Typography>
                  </Grid>

                  {/* Time input */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Time"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => { setSelectedTime(e.target.value); setFormError(''); }}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: selectedSlot.startTime,
                        max: selectedSlot.endTime,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ mt: 0.5, display: 'block', color: '#2e7d32', fontWeight: 500 }}
                    >
                      ✓ Allowed range: {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* ── Step 3: Contact Info ── */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <StepHeader
                icon={<PersonIcon sx={{ color: '#555', fontSize: 22 }} />}
                title="Step 3: Your Contact Information"
              />

              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleFormChange}
                InputProps={{
                  startAdornment: (
                    <PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFormChange}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* ── Error + Action Buttons ── */}
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => { setSelectedSlot(null); setSelectedDate(''); setSelectedTime(''); }}
                disabled={submitting}
              >
                Back to Slots
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleSlotBookingSubmit}
                disabled={submitting || !selectedSlot || !selectedDate || !selectedTime}
                startIcon={submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <CheckIcon />}
              >
                {submitting ? 'Submitting…' : 'Confirm & Book'}
              </Button>
            </Box>
          </>
        ) : (
          /* ══════════════════════════════════════ */
          /*  NO-SLOTS: Free-form Request Form      */
          /* ══════════════════════════════════════ */
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Request a Test Drive
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The seller hasn't set fixed slots. Send a request with your preferred date and time.
            </Typography>

            {/* Preferred Date */}
            <TextField
              fullWidth
              label="Preferred Date"
              type="date"
              value={preferredDate}
              onChange={(e) => { setPreferredDate(e.target.value); setFormError(''); }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: todayStr }}
              sx={{ mb: 2 }}
            />

            {/* Preferred Time */}
            <TextField
              fullWidth
              label="Preferred Time"
              type="time"
              value={preferredTime}
              onChange={(e) => { setPreferredTime(e.target.value); setFormError(''); }}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            {/* Message */}
            <TextField
              fullWidth
              label="Message to Seller (Optional)"
              multiline
              rows={3}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Add any additional details or preferences…"
              sx={{ mb: 3 }}
            />

            <Divider sx={{ mb: 2 }} />

            {formError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleRequestSubmit}
                disabled={submitting || !preferredDate || !preferredTime}
                startIcon={submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <CheckIcon />}
              >
                {submitting ? 'Sending…' : 'Send Request'}
              </Button>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default BookTestDrivePage;
