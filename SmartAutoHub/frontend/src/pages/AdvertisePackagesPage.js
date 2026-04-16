/**
 * Advertise Packages Page
 * Display advertising packages and pricing options
 */

import React, { useState } from 'react';
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
  const [openPlacementDialog, setOpenPlacementDialog] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState('home');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    adPhoto: null,
  });

  const packages = [
    {
      id: 0,
      name: 'Free Trial',
      price: 'Free',
      period: '/4 weeks',
      description: 'Try all premium features',
      color: '#000000',
      features: [
        { icon: <Star />, text: 'Premium featured placement' },
        { icon: <Visibility />, text: '50,000 impressions' },
        { icon: <TrendingUp />, text: 'Advanced analytics' },
        { icon: <Speed />, text: 'Priority listing' },
        { icon: <Support />, text: 'Priority support' },
      ],
      popular: false,
    },
    {
      id: 1,
      name: 'Starter',
      price: '$99',
      period: '/month',
      description: 'Perfect for getting started',
      color: '#000000',
      features: [
        { icon: <Visibility />, text: '5,000 impressions/month' },
        { icon: <TrendingUp />, text: 'Basic analytics' },
        { icon: <Speed />, text: 'Standard placement' },
        { icon: <Support />, text: 'Email support' },
      ],
      popular: false,
    },
    {
      id: 2,
      name: 'Professional',
      price: '$299',
      period: '/month',
      description: 'Most popular choice',
      color: '#000000',
      features: [
        { icon: <Visibility />, text: '25,000 impressions/month' },
        { icon: <Star />, text: 'Featured placement' },
        { icon: <TrendingUp />, text: 'Advanced analytics' },
        { icon: <Speed />, text: 'Priority listing' },
        { icon: <Support />, text: 'Priority support' },
      ],
      popular: true,
    },
    {
      id: 3,
      name: 'Premium',
      price: '$599',
      period: '/month',
      description: 'Maximum visibility',
      color: '#000000',
      features: [
        { icon: <Visibility />, text: '100,000+ impressions/month' },
        { icon: <Star />, text: 'Premium featured placement' },
        { icon: <TrendingUp />, text: 'Custom analytics reports' },
        { icon: <Speed />, text: 'Top priority listing' },
        { icon: <Support />, text: '24/7 dedicated support' },
        { icon: <CheckCircle />, text: 'Custom campaigns' },
      ],
      popular: false,
    },
  ];

  const handleSelectPackage = (pkg) => {
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

  const handleClosePlacementDialog = () => {
    setOpenPlacementDialog(false);
    setSelectedPackage(null);
    setSelectedPlacement('home');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPackage(null);
    setSelectedPlacement('home');
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
      adPhoto: null,
    });
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
      setFormData({
        ...formData,
        adPhoto: file,
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
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.adPhoto) {
      alert('Please upload an ad photo to proceed');
      return;
    }

    setIsSubmitting(true);

    try {
      // Compress and convert photo to base64
      let adPhotoBase64 = null;
      if (formData.adPhoto) {
        adPhotoBase64 = await compressImage(formData.adPhoto);
      }

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
        adPhotoBase64: adPhotoBase64
      };

      // Make API call to submit advertising request
      const response = await api.post(
        '/advertising/submit-package',
        submitData
      );

      if (response.data.success) {
        alert(`Thank you! We've sent a confirmation email to ${formData.email}. Our team will contact you soon!`);
        handleCloseDialog();
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
                  sx={{
                    bgcolor: pkg.color,
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: pkg.color,
                      opacity: 0.9,
                    },
                  }}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  Choose Plan
                </Button>
              </CardActions>
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
        onClose={handleCloseDialog}
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
              <Typography
                variant="body2"
                sx={{
                  mt: 1.5,
                  p: 1,
                  bgcolor: '#f0f0f0',
                  borderRadius: 1,
                  color: '#000000',
                  fontWeight: 500,
                }}
              >
                ✓ {formData.adPhoto.name}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ color: '#000000' }}
            disabled={isSubmitting}
          >
            Cancel
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
                Submitting...
              </Box>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdvertisePackagesPage;
