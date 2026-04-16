/**
 * Boost Ad Page
 * Form to boost vehicle advertisement with various packages
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Bolt,
  Star,
  EmojiEvents,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const boostPackages = [
  {
    id: 'free',
    name: 'Free Boost',
    duration: 1,
    price: 0,
    icon: <Bolt sx={{ fontSize: 32, color: '#9e9e9e' }} />,
    features: ['1 day featured listing', 'Basic listing visibility', 'Email alert to seller'],
    isFree: true,
  },
  {
    id: 'standard',
    name: 'Standard Boost',
    duration: 7,
    price: 3999,
    icon: <Bolt sx={{ fontSize: 32, color: '#ffd700' }} />,
    features: ['7 days featured listing', 'Top search results', 'Email alerts to interests', 'Social media share'],
  },
  {
    id: 'premium',
    name: 'Premium Boost',
    duration: 14,
    price: 7999,
    icon: <Star sx={{ fontSize: 32, color: '#ffd700' }} />,
    features: ['14 days featured listing', 'Homepage spotlight', 'Priority search rankings', 'Unlimited email alerts', 'Direct buyer notifications', 'Weekly activity report'],
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite Boost',
    duration: 30,
    price: 13999,
    icon: <EmojiEvents sx={{ fontSize: 32, color: '#ffd700' }} />,
    features: ['30 days featured listing', 'Homepage top position', 'All premium features', 'Dedicated account manager', '24/7 visibility & support', 'Performance analytics', 'Re-boost discount (20% off)'],
  },
];

const BoostAdPage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('premium');
  const [activeStep, setActiveStep] = useState(0);
  const [bankSlipPreview, setBankSlipPreview] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'credit_card',
    contactPerson: '',
    contactPhone: '',
    additionalNotes: '',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    bankSlip: null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchVehicle();
  }, [vehicleId, isAuthenticated, navigate]);

  const fetchVehicle = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/vehicles/${vehicleId}`);
      setVehicle(data.data);
    } catch (err) {
      console.error('Failed to fetch vehicle:', err);
      setError('Failed to load vehicle details. Please try again.');
    }
    setLoading(false);
  };

  const handlePackageSelect = (packageId) => {
    setSelectedPackage(packageId);
    // Automatically set payment method to 'free' for free packages
    if (packageId === 'free') {
      setFormData({ ...formData, paymentMethod: 'free' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBankSlipUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFormData({ ...formData, bankSlip: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBankSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedPackage) {
        setError('Please select a boost package');
        return;
      }
    }
    
    // Skip payment step for free packages
    if (activeStep === 1 && selectedPackage === 'free') {
      setActiveStep(3);
      setError('');
      return;
    }
    
    if (activeStep < 2 || (activeStep === 2 && selectedPackage !== 'free')) {
      setActiveStep(activeStep + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.contactPerson || !formData.contactPhone || !formData.startDate) {
        setError('Please fill in all required fields');
        return;
      }

      if (!agreedToTerms) {
        setError('Please agree to the Terms & Conditions and Privacy Policy');
        return;
      }

      // Only validate payment details for non-free boosts
      if (selectedPackage !== 'free') {
        // Validate credit card details if payment method is credit card
        if (formData.paymentMethod === 'credit_card') {
          if (!formData.cardHolder || !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
            setError('Please fill in all credit card details');
            return;
          }
          
          // Basic validation
          if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
            setError('Card number must be 16 digits');
            return;
          }
          
          if (formData.expiryDate.length !== 5) {
            setError('Expiry date must be in MM/YY format');
            return;
          }
          
          if (formData.cvv.length < 3) {
            setError('CVV must be at least 3 digits');
            return;
          }
        }

        // Validate bank slip upload if payment method is bank transfer
        if (formData.paymentMethod === 'bank_transfer') {
          if (!formData.bankSlip) {
            setError('Please upload a bank slip image for verification');
            return;
          }
        }
      }

      setSubmitting(true);
      const selectedPkg = boostPackages.find(p => p.id === selectedPackage);

      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append('vehicleId', vehicleId);
      submitData.append('packageType', selectedPackage);
      submitData.append('duration', selectedPkg.duration);
      submitData.append('amount', selectedPkg.price);
      submitData.append('startDate', formData.startDate);
      submitData.append('paymentMethod', selectedPackage === 'free' ? 'free' : formData.paymentMethod);
      submitData.append('contactPerson', formData.contactPerson);
      submitData.append('contactPhone', formData.contactPhone);
      submitData.append('additionalNotes', formData.additionalNotes);
      
      // Add card details only for credit card payments
      if (formData.paymentMethod === 'credit_card' && selectedPackage !== 'free') {
        submitData.append('cardLast4', formData.cardNumber.replace(/\s/g, '').slice(-4));
        submitData.append('cardHolder', formData.cardHolder);
      }

      // Add bank slip for bank transfer
      if (formData.paymentMethod === 'bank_transfer' && formData.bankSlip && selectedPackage !== 'free') {
        submitData.append('bankSlip', formData.bankSlip);
      }

      // Send boost request to backend
      const { data } = await api.post(`/vehicles/${vehicleId}/boost`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Move to success step
      setActiveStep(3);
      setSubmitting(false);

    } catch (err) {
      console.error('Failed to boost ad:', err);
      setError(err.response?.data?.message || 'Failed to process boost request. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Vehicle not found</Alert>
      </Container>
    );
  }

  const selectedPkg = boostPackages.find(p => p.id === selectedPackage);

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '90vh' }}>
      <Container maxWidth="md">
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/vehicles/${vehicleId}`)}
          sx={{ mb: 3 }}
        >
          Back to Vehicle
        </Button>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Boost Your Ad
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Increase visibility and get more interested buyers for {vehicle.brand} {vehicle.model}
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4, bgcolor: 'white', p: 2, borderRadius: 2 }}>
          <Step>
            <StepLabel>Select Package</StepLabel>
          </Step>
          <Step>
            <StepLabel>Contact Details</StepLabel>
          </Step>
          <Step>
            <StepLabel>Payment</StepLabel>
          </Step>
          <Step>
            <StepLabel>Confirmation</StepLabel>
          </Step>
        </Stepper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        {activeStep === 0 && (
          // Package Selection
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Choose Your Boost Package
            </Typography>
            <Grid container spacing={3}>
              {boostPackages.map((pkg) => (
                <Grid item xs={12} sm={6} md={3} lg={3} key={pkg.id}>
                  <Card
                    onClick={() => handlePackageSelect(pkg.id)}
                    sx={{
                      cursor: 'pointer',
                      border: selectedPackage === pkg.id ? '3px solid' : '1px solid',
                      borderColor: selectedPackage === pkg.id ? 'primary.main' : 'grey.300',
                      bgcolor: selectedPackage === pkg.id ? 'primary.50' : 'white',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        borderColor: 'primary.main',
                      },
                      position: 'relative',
                    }}
                  >
                    {pkg.popular && (
                      <Chip
                        label="Most Popular"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          right: 12,
                        }}
                      />
                    )}
                    {pkg.isFree && (
                      <Chip
                        label="FREE"
                        color="success"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          right: 12,
                        }}
                      />
                    )}
                    <CardContent>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        {pkg.icon}
                      </Box>
                      <Typography variant="h6" fontWeight="bold" textAlign="center" gutterBottom>
                        {pkg.name}
                      </Typography>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h5" color="primary" fontWeight="bold">
                          {pkg.isFree ? 'FREE' : `LKR ${pkg.price.toLocaleString()}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          for {pkg.duration} day{pkg.duration > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {pkg.features.map((feature, idx) => (
                          <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            ✓ {feature}
                          </Typography>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeStep === 1 && (
          // Contact Details
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Contact Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contact Person Name"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contact Phone Number"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleFormChange}
                  placeholder="+94 7X XXX XXXX"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes (Optional)"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleFormChange}
                  multiline
                  rows={4}
                  placeholder="Any special requests or details..."
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {activeStep === 2 && (
          // Payment Details
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Payment & Confirmation
            </Typography>
            
            <Box sx={{ mb: 4, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Package</Typography>
                  <Typography variant="h6" fontWeight="bold">{selectedPkg.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="h6" fontWeight="bold">{selectedPkg.duration} days</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Amount to Pay</Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">LKR {selectedPkg.price.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                  <Typography variant="h6">{vehicle.brand} {vehicle.model}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              Payment Method
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Payment Method</InputLabel>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod}
                label="Select Payment Method"
                onChange={handleFormChange}
              >
                <MenuItem value="credit_card">💳 Credit/Debit Card</MenuItem>
                <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                <MenuItem value="paypal">🌐 PayPal</MenuItem>
                <MenuItem value="cash">💵 Cash Payment</MenuItem>
              </Select>
            </FormControl>

            {/* Credit Card Form */}
            {formData.paymentMethod === 'credit_card' && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                  Credit/Debit Card Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Card Holder Name"
                      name="cardHolder"
                      value={formData.cardHolder}
                      onChange={handleFormChange}
                      placeholder="John Doe"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Card Number"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '').slice(0, 16);
                        const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                        setFormData({ ...formData, cardNumber: formatted });
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                  </Grid>
                  <Grid item xs={7}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2);
                        }
                        setFormData({ ...formData, expiryDate: value });
                      }}
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label="CVV"
                      name="cvv"
                      type="password"
                      value={formData.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setFormData({ ...formData, cvv: value });
                      }}
                      placeholder="123"
                      maxLength="4"
                      required
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Bank Transfer Info */}
            {formData.paymentMethod === 'bank_transfer' && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                  Bank Slip/Receipt Upload
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  After transferring funds, upload a clear photo of your bank slip or payment receipt for verification.
                </Typography>
                
                {bankSlipPreview ? (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      component="img"
                      src={bankSlipPreview}
                      alt="Bank Slip Preview"
                      sx={{
                        width: '100%',
                        maxHeight: 300,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'success.main',
                        objectFit: 'contain',
                      }}
                    />
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setBankSlipPreview(null);
                        setFormData({ ...formData, bankSlip: null });
                      }}
                      sx={{ mt: 1 }}
                    >
                      Remove Image
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: 'primary.50',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'primary.100',
                        borderColor: 'primary.dark',
                      },
                    }}
                  >
                    <input
                      accept="image/*"
                      hidden
                      id="bank-slip-input"
                      type="file"
                      onChange={handleBankSlipUpload}
                    />
                    <label htmlFor="bank-slip-input" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        📸 Upload Bank Slip
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click to upload or drag and drop
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        PNG, JPG, GIF up to 5MB
                      </Typography>
                    </label>
                  </Box>
                )}
              </Box>
            )}

            {/* PayPal Info */}
            {formData.paymentMethod === 'paypal' && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  PayPal Payment
                </Typography>
                <Typography variant="body2">
                  You will be redirected to PayPal to complete the payment securely.
                </Typography>
              </Alert>
            )}

            {/* Cash Payment Info */}
            {formData.paymentMethod === 'cash' && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  Cash Payment
                </Typography>
                <Typography variant="body2">
                  Our team will contact you to arrange payment collection at your convenience.
                </Typography>
              </Alert>
            )}

            <Alert severity="info" sx={{ mb: 3 }}>
              Our team will contact you shortly to confirm and process your payment. Your ad boost will go live on the selected date.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Radio
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                  />
                }
                label="I agree to the Terms & Conditions and Privacy Policy"
              />
            </Box>
          </Paper>
        )}

        {activeStep === 3 && (
          // Success Message
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'success.light', bgcolor: 'success.50' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
              {selectedPackage === 'free' ? 'Free Boost Activated! 🎉' : 'Boost Request Submitted Successfully! ✓'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your ad boost request for {vehicle.brand} {vehicle.model} has been {selectedPackage === 'free' ? 'activated' : 'received'}.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {selectedPackage === 'free' 
                ? 'Your vehicle will be featured for 1 day starting today. Thank you for using SmartAuto Hub!'
                : `Our team will contact you at ${formData.contactPhone} within 2 hours to confirm the booking and process your payment.`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate(`/vehicles/${vehicleId}`)}
              >
                Back to Vehicle
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/my-vehicles')}
              >
                View My Vehicles
              </Button>
            </Box>
          </Paper>
        )}

        {/* Action Buttons */}
        {activeStep < 3 && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            {activeStep < 2 ? (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Submit Boost Request'}
              </Button>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BoostAdPage;
