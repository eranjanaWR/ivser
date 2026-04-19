/**
 * Advertise Packages Page
 * Display advertising packages and pricing options
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Star,
  Visibility,
  TrendingUp,
  Speed,
  Support,
  CloudUpload,
} from '@mui/icons-material';

const AdvertisePackagesPage = () => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openPlacementDialog, setOpenPlacementDialog] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState('home');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [paymentSlipPreview, setPaymentSlipPreview] = useState(null);
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [starterUsed, setStarterUsed] = useState(false);
  const [freeTrialUsed, setFreeTrialUsed] = useState(false);
  
  // Function to fetch/refresh user data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/auth/me');
        if (response.data.data.user) {
          const user = response.data.data.user;
          setCurrentUser(user);
          // Check if user has already used Free Trial package
          if (user.usedPackages && user.usedPackages.freeTrialUsed) {
            setFreeTrialUsed(true);
          } else {
            setFreeTrialUsed(false);
          }
          // Check if user has already used Starter package
          if (user.usedPackages && user.usedPackages.starterUsed) {
            setStarterUsed(true);
          } else {
            setStarterUsed(false);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  // Fetch current user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    adPhoto: null,
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    paymentSlip: null,
  });

  const packages = [
    {
      id: 0,
      name: 'Free Trial',
      price: 'Free',
      period: 'One time redeemable',
      description: 'Try all premium features',
      color: '#000000',
      features: [
        { icon: <Speed />, text: 'Priority listing' },
        { icon: <Support />, text: 'Priority support' },
        { icon: <CheckCircle />, text: 'Custom campaigns' },
      ],
      popular: false,
    },
    {
      id: 1,
      name: 'Starter',
      price: '₨5,000',
      period: '/month',
      description: 'Perfect for getting started',
      color: '#000000',
      features: [
        { icon: <Visibility />, text: 'Ad is live on the website for a month' },
        { icon: <Speed />, text: 'Standard placement' },
        { icon: <Support />, text: 'Email support' },
      ],
      popular: false,
    },
    {
      id: 2,
      name: 'Professional',
      price: '₨10,000',
      period: '/month',
      description: 'Most popular choice',
      color: '#000000',
      features: [
        { icon: <Visibility />, text: 'Ad is live on the website for 6 months' },
        { icon: <Star />, text: 'Featured placement' },
        { icon: <Support />, text: 'Priority support' },
      ],
      popular: true,
    },
    {
      id: 3,
      name: 'Premium',
      price: '₨15,000',
      period: '/month',
      description: 'Maximum visibility',
      color: '#000000',
      features: [
        { icon: <Visibility />, text: 'Ad is live on the website for 1 year' },
        { icon: <Support />, text: '24/7 dedicated support' },
        { icon: <CheckCircle />, text: 'Custom campaigns' },
      ],
      popular: false,
    },
  ];

  const handleSelectPackage = (pkg) => {
    // Check if user is trying to use Free Trial but has already used it
    if (pkg.name === 'Free Trial' && freeTrialUsed) {
      alert('You have already redeemed the Free Trial package (one time redeemable). Please choose a different package.');
      return;
    }
    
    setSelectedPackage(pkg);
    // Only show placement dialog for Free Trial and Starter packages
    if (pkg.name === 'Free Trial' || pkg.name === 'Starter') {
      setOpenPlacementDialog(true);
    } else {
      // For Professional and Premium, go directly to contact form
      setOpenDialog(true);
    }
  };

  const handlePlacementSelect = () => {
    setOpenPlacementDialog(false);
    setOpenDialog(true);
  };

  const handleCloseContactDialog = () => {
    setOpenDialog(false);
    setSelectedPackage(null);
    setSelectedPlacement('home');
    setPreviewImage(null);
    setPaymentSlipPreview(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
      adPhoto: null,
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      paymentSlip: null,
    });
  };

  const handleClosePlacementDialog = () => {
    setOpenPlacementDialog(false);
    setSelectedPackage(null);
    setSelectedPlacement('home');
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
  };

  const handleBackToContact = () => {
    setOpenPaymentDialog(false);
    setOpenDialog(true);
  };

  const generatePaymentRefNumber = () => {
    // Format: SAH-YYYYMMDD-XXXXXX (SAH = SmartAutoHub, date, and 6 random alphanumeric)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const refNum = `SAH-${year}${month}${day}-${random}`;
    console.log('🎫 Generated Payment Reference Number:', refNum);
    return refNum;
  };

  const handleNextToPayment = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required contact details');
      return;
    }

    if (!formData.adPhoto) {
      alert('Please upload an ad photo to proceed');
      return;
    }

    setOpenDialog(false);
    const newRefNumber = generatePaymentRefNumber();
    console.log('Setting paymentRefNumber to:', newRefNumber);
    setPaymentRefNumber(newRefNumber);
    setOpenPaymentDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      setFormData({
        ...formData,
        adPhoto: file,
      });
    }
  };

  const handlePaymentSlipChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setFormData({
        ...formData,
        paymentSlip: file,
      });
    }
  };

  // Compress image before upload to reduce file size
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Max dimensions: 600x800 (typical ad dimensions)
          const maxWidth = 600;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with 90% quality (better quality with ~50% size reduction)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.9);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    // Validate payment details for paid plans
    if (selectedPackage?.name !== 'Free Trial') {
      if (!formData.cardholderName || !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
        alert('Please fill in all payment details');
        return;
      }

      // Basic card validation
      if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
        alert('Please enter a valid card number (16 digits)');
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        alert('Please enter expiry date in MM/YY format');
        return;
      }

      if (!/^\d{3,4}$/.test(formData.cvv)) {
        alert('Please enter a valid CVV (3-4 digits)');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Compress and convert photo to base64
      let adPhotoBase64 = null;
      if (formData.adPhoto) {
        adPhotoBase64 = await compressImage(formData.adPhoto);
      }

      // Compress payment slip if provided
      let paymentSlipBase64 = null;
      if (formData.paymentSlip) {
        paymentSlipBase64 = await compressImage(formData.paymentSlip);
      }

      // Get userId from localStorage
      const userId = localStorage.getItem('userId');

      // Prepare form data
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        message: formData.message,
        packageName: selectedPackage.name,
        placement: selectedPlacement || 'Not specified',
        adPhoto: true,
        adPhotoBase64: adPhotoBase64,
        userId: userId || null,
        paymentRefNumber: (selectedPackage?.name !== 'Free Trial' && selectedPackage?.name !== 'Starter') ? paymentRefNumber : null,
        paymentSlipBase64: paymentSlipBase64,
        ...((selectedPackage?.name !== 'Free Trial' && selectedPackage?.name !== 'Starter') && {
          cardholderName: formData.cardholderName,
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
        }),
      };
      console.log('📤 Submitting advertising request with data:', submitData);
      console.log('Payment Ref Number:', paymentRefNumber);
      console.log('Package Name:', selectedPackage.name);
      console.log('✅ FINAL SUBMIT DATA:', {
        paymentRefNumber: submitData.paymentRefNumber,
        packageName: submitData.packageName,
        cardholderName: submitData.cardholderName,
        cardNumber: submitData.cardNumber,
        email: submitData.email
      });

      // Make API call to submit advertising request
      const response = await api.post(
        '/advertising/submit-package',
        submitData
      );

      if (response.data.success) {
        alert(`Thank you! We've sent a confirmation email to ${formData.email}. Our team will contact you soon!`);
        // Refresh user data to update Starter status
        await fetchUserData();
        handleClosePaymentDialog();
        handleCloseContactDialog();
      } else {
        alert(response.data.error || 'Error submitting request');
      }
    } catch (error) {
      console.error('Error submitting advertising request:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred while submitting your request';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: '#000000',
          }}
        >
          Advertising Packages
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: '#000000',
            fontWeight: 400,
            mb: 1,
          }}
        >
          Choose the perfect plan to reach thousands of car buyers
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#000000',
          }}
        >
          Reach millions of potential customers with our targeted advertising solutions
        </Typography>
      </Box>

      {/* Packages Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {packages.map((pkg) => (
          <Grid item xs={12} sm={6} md={3} lg={3} key={pkg.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: pkg.popular ? `3px solid ${pkg.color}` : `1px solid #000000`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  transform: 'translateY(-8px)',
                },
                position: 'relative',
              }}
            >
              <CardContent sx={{ flex: 1, pt: 2 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    color: '#000000',
                  }}
                >
                  {pkg.name}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#000000',
                      fontSize: '0.95rem',
                      mb: 2,
                    }}
                  >
                    {pkg.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: pkg.color,
                        display: 'inline',
                      }}
                    >
                      {pkg.price}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#000000',
                        display: 'inline',
                        ml: 0.5,
                      }}
                    >
                      {pkg.period}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: '#000000',
                    mb: 1.5,
                    fontSize: '0.9rem',
                  }}
                >
                  Features included:
                </Typography>

                <List sx={{ p: 0 }}>
                  {pkg.features.map((feature, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        py: 0.75,
                        px: 0,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: pkg.color,
                        }}
                      >
                        {feature.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.text}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: '#000000',
                          sx: { fontSize: '0.9rem' },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={(pkg.name === 'Free Trial' && freeTrialUsed)}
                  sx={{
                    bgcolor: ((pkg.name === 'Free Trial' && freeTrialUsed)) ? '#cccccc' : pkg.color,
                    color: 'white',
                    fontWeight: 600,
                    cursor: ((pkg.name === 'Free Trial' && freeTrialUsed)) ? 'not-allowed' : 'pointer',
                    '&:hover': {
                      bgcolor: ((pkg.name === 'Free Trial' && freeTrialUsed)) ? '#cccccc' : pkg.color,
                      opacity: ((pkg.name === 'Free Trial' && freeTrialUsed)) ? 1 : 0.9,
                    },
                  }}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  {((pkg.name === 'Free Trial' && freeTrialUsed)) ? 'Already Redeemed' : 'Choose Plan'}
                </Button>
              </CardActions>
              {((pkg.name === 'Free Trial' && freeTrialUsed)) && (
                <Box sx={{ bgcolor: '#fff3cd', p: 2, borderTop: '1px solid #ffc107' }}>
                  <Typography variant="body2" sx={{ color: '#856404', textAlign: 'center', m: 0 }}>
                    ✓ You have already redeemed this one-time offer. Choose a different package.
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Features Overview */}
      {/* Placement Selection Dialog */}
      <Dialog
        open={openPlacementDialog}
        onClose={handleClosePlacementDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            bgcolor: '#f5f5f5',
            borderBottom: '1px solid #000000',
            color: '#000000',
          }}
        >
          Select Ad Placement Location
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 3, color: '#000000' }}>
            Choose where you'd like your ad to be displayed:
          </Typography>

          <RadioGroup
            value={selectedPlacement}
            onChange={(e) => setSelectedPlacement(e.target.value)}
          >
            <FormControlLabel
              value="home"
              control={<Radio sx={{ color: '#000000' }} />}
              label={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                    Home Page
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Display your ad on the home page for maximum visibility
                  </Typography>
                </Box>
              }
              sx={{ mb: 2, alignItems: 'flex-start', pt: 1 }}
            />

            <FormControlLabel
              value="browse"
              control={<Radio sx={{ color: '#000000' }} />}
              label={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                    Browse Vehicles Page
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Display your ad in the sidebar while users browse vehicles
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', pt: 1 }}
            />
          </RadioGroup>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleClosePlacementDialog}
            sx={{ color: '#000000' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePlacementSelect}
            variant="contained"
            sx={{
              bgcolor: '#000000',
              color: 'white',
              fontWeight: 600,
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseContactDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            bgcolor: '#f5f5f5',
            borderBottom: '1px solid #000000',
            color: '#000000',
          }}
        >
          Get Started with {selectedPackage?.name} Plan
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Fill in your details and we'll contact you within 24 hours
          </Alert>

          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Company/Business Name"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Additional Message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            margin="normal"
            multiline
            rows={4}
          />

          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: '#000000',
              mt: 3,
              mb: 1,
            }}
          >
            Upload Ad Photo *
          </Typography>

          <Box
            sx={{
              border: '2px dashed #000000',
              borderRadius: 1,
              p: 2,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              bgcolor: '#f9f9f9',
              '&:hover': {
                bgcolor: '#f0f0f0',
                borderColor: '#333',
              },
            }}
            component="label"
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
            <CloudUpload
              sx={{
                fontSize: 40,
                color: '#000000',
                mb: 1,
              }}
            />
            <Typography variant="body2" sx={{ color: '#000000', fontWeight: 500 }}>
              Click to upload or drag and drop
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              PNG, JPG, GIF up to 5MB
            </Typography>
            {formData.adPhoto && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1,
                  bgcolor: '#f0f0f0',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#000000',
                    fontWeight: 500,
                  }}
                >
                  ✓ {formData.adPhoto.name}
                </Typography>
                <Button
                  size="small"
                  sx={{ 
                    color: '#d32f2f',
                    minWidth: 'auto',
                    ml: 1,
                  }}
                  onClick={() => {
                    setFormData({ ...formData, adPhoto: null });
                    setPreviewImage(null);
                  }}
                >
                  Remove
                </Button>
              </Box>
            )}
          </Box>

          {/* Preview Section - Show how ad will look in carousel */}
          {previewImage && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: '#000000',
                  mb: 1.5,
                }}
              >
                Preview: How Your Ad Will Appear
              </Typography>
              <Box
                sx={{
                  border: '2px solid #000000',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  maxWidth: '100%',
                }}
              >
                <Box
                  component="img"
                  src={previewImage}
                  alt="Ad Preview"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 280,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#666',
                  mt: 1,
                  display: 'block',
                }}
              >
                Image will be optimized to 90% quality for best balance of file size and visual quality
              </Typography>
              <Button
                size="small"
                sx={{ mt: 2, color: '#d32f2f' }}
                onClick={() => {
                  setFormData({ ...formData, adPhoto: null });
                  setPreviewImage(null);
                }}
              >
                Remove Photo
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseContactDialog}
            sx={{ color: '#000000' }}
          >
            Cancel
          </Button>
          {selectedPackage?.name === 'Free Trial' ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isSubmitting}
              sx={{
                bgcolor: selectedPackage?.color,
                color: 'white',
                fontWeight: 600,
                minWidth: 120,
              }}
            >
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Submitting...
                </Box>
              ) : (
                'Submit Request'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNextToPayment}
              variant="contained"
              sx={{
                bgcolor: selectedPackage?.color,
                color: 'white',
                fontWeight: 600,
                minWidth: 120,
              }}
            >
              Next: Payment Details
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog
        open={openPaymentDialog}
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            bgcolor: '#f5f5f5',
            borderBottom: '1px solid #000000',
            color: '#000000',
          }}
        >
          Payment Details - {selectedPackage?.name} Plan
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Your payment information is secure and encrypted. We accept all major credit cards.
          </Alert>

          {/* Payment Reference Number */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#e3f2fd',
              border: '2px solid #2196f3',
              borderRadius: 1,
              mb: 3,
            }}
          >
            <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>
              Payment Reference Number
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: '#1565c0',
                fontWeight: 700,
                fontFamily: 'monospace',
                mt: 1,
                letterSpacing: '1px',
                wordBreak: 'break-all'
              }}
            >
              {paymentRefNumber}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
              Please save this reference number for your records
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              mb: 3,
            }}
          >
            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
              Package: <strong>{selectedPackage?.name}</strong>
            </Typography>
            <Typography variant="h6" sx={{ color: '#000000', fontWeight: 600 }}>
              {selectedPackage?.price}
              <Typography variant="body2" component="span" sx={{ color: '#666', ml: 1 }}>
                {selectedPackage?.period}
              </Typography>
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Cardholder Name"
            name="cardholderName"
            value={formData.cardholderName}
            onChange={handleInputChange}
            margin="normal"
            required
            placeholder="John Doe"
          />

          <TextField
            fullWidth
            label="Card Number"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={(e) => {
              // Format as card number with spaces
              const value = e.target.value.replace(/\s/g, '').slice(0, 16);
              const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
              setFormData({
                ...formData,
                cardNumber: formatted,
              });
            }}
            margin="normal"
            placeholder="1234 5678 9012 3456"
            required
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Expiry Date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (value.length >= 2) {
                  value = value.slice(0, 2) + '/' + value.slice(2);
                }
                setFormData({
                  ...formData,
                  expiryDate: value,
                });
              }}
              placeholder="MM/YY"
              required
            />

            <TextField
              label="CVV"
              name="cvv"
              value={formData.cvv}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setFormData({
                  ...formData,
                  cvv: value,
                });
              }}
              placeholder="123"
              type="password"
              required
            />
          </Box>

          {/* Payment Slip Upload */}
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#000' }}>
              📎 Payment Proof (Optional)
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
              Upload bank transfer receipt, cheque image, or payment screenshot
            </Typography>

            {paymentSlipPreview && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                  Preview:
                </Typography>
                <Box
                  component="img"
                  src={paymentSlipPreview}
                  alt="Payment Slip"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: 1,
                    border: '1px solid #ddd',
                  }}
                />
                <Button
                  size="small"
                  sx={{ mt: 1, color: '#d32f2f' }}
                  onClick={() => {
                    setFormData({ ...formData, paymentSlip: null });
                    setPaymentSlipPreview(null);
                  }}
                >
                  Remove
                </Button>
              </Box>
            )}

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ textTransform: 'none', py: 1.5, mb: 2 }}
              startIcon={<CloudUpload />}
            >
              {paymentSlipPreview ? 'Change Payment Proof' : 'Upload Payment Proof'}
              <input
                hidden
                accept="image/*,.pdf"
                type="file"
                onChange={handlePaymentSlipChange}
              />
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleBackToContact}
            sx={{ color: '#000000' }}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              bgcolor: selectedPackage?.color,
              color: 'white',
              fontWeight: 600,
              minWidth: 120,
            }}
          >
            {isSubmitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Processing...
              </Box>
            ) : (
              'Complete Payment'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdvertisePackagesPage;
