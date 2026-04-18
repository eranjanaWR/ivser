import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Box,
  Typography,
  CardMedia,
  Paper,
  IconButton,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Chip,
  useTheme,
  Autocomplete
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CloudUpload as CloudUploadIcon, 
  Delete as DeleteIcon, 
  Star as StarIcon,
  LocationOn as LocationIcon 
} from '@mui/icons-material';
import api from '../services/api';
import LocationPickerModal from './LocationPickerModal';

// ✅ Sri Lankan Provinces Array
const SRI_LANKAN_PROVINCES = [
  'Western', 'Central', 'Southern', 'North Western', 'Sabaragamuwa',
  'North Central', 'Uva', 'Eastern', 'Northern'
];

// ✅ Sri Lankan Districts Array
const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle'
];

const AddVehicleBiddingDialog = ({ open, onClose, onSuccess, prefilledVehicle }) => {
  const theme = useTheme();
  
  // ✅ NEW: Dynamic Feature options based on bodyType
  const getFeaturesByBodyType = (bodyType) => {
    if (bodyType === 'motorcycle') {
      return ['Electric Start', 'Disk Brake', 'LED Headlight', 'Anti-Theft Alarm', 'Digital Meter', 'Modified Exhaust', 'Helmet Box', 'ABS'];
    }
    // Default features for all other vehicle types
    return ['Air Conditioning', 'ABS', 'Airbags', 'Sunroof', 'Backup Camera', 'Navigation System', 'Bluetooth', 'Leather Seats'];
  };

  const [formData, setFormData] = useState({
    // Basic Vehicle Information
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    condition: 'good',
    mileage: '',
    fuelType: 'petrol',
    transmission: 'automatic',
    engineCapacity: '',
    color: '',
    doors: 4,
    seats: 5,
    bodyType: 'sedan',
    vin: '',
    
    // Key Features (Checkboxes)
    features: {},
    
    // Auction & Pricing Logic
    startingPrice: '',
    askingPrice: '',
    auctionStartDate: '',
    auctionEndDate: '',
    
    // Location with Coordinates
    location: {
      province: '',
      district: '',
      town: '',
      city: '', // for fallback
      state: '', // for fallback
      country: 'Sri Lanka',
      latitude: '',
      longitude: ''
    },
    
    // Media & Description
    description: '',
    mainCoverImageIndex: null,
    originalVehicleId: ''
  });

  // ✅ NEW: Prefill logic when existing vehicle data is passed
  React.useEffect(() => {
    if (prefilledVehicle && open) {
      console.log('🚗 [PREFILL] Initializing form with vehicle:', prefilledVehicle.brand, prefilledVehicle.model);
      
      // Convert features array to object for checkbox handling
      const featuresObj = {};
      if (prefilledVehicle.features && Array.isArray(prefilledVehicle.features)) {
        prefilledVehicle.features.forEach(f => {
          featuresObj[f] = true;
        });
      }

      setFormData(prev => ({
        ...prev,
        brand: prefilledVehicle.brand || '',
        model: prefilledVehicle.model || '',
        year: prefilledVehicle.year || prev.year,
        mileage: (prefilledVehicle.mileage !== undefined && prefilledVehicle.mileage !== null) ? prefilledVehicle.mileage : '',
        condition: prefilledVehicle.condition?.toLowerCase() || 'good',
        fuelType: prefilledVehicle.fuelType?.toLowerCase() || 'petrol',
        transmission: prefilledVehicle.transmission?.toLowerCase() || 'automatic',
        engineCapacity: prefilledVehicle.engineCapacity || '',
        color: prefilledVehicle.color || '',
        bodyType: prefilledVehicle.bodyType?.toLowerCase() || 'sedan',
        doors: prefilledVehicle.doors !== undefined ? prefilledVehicle.doors : prev.doors,
        seats: prefilledVehicle.seats !== undefined ? prefilledVehicle.seats : prev.seats,
        vin: prefilledVehicle.vin || '',
        description: prefilledVehicle.description || '',
        features: featuresObj,
        location: {
          ...prev.location,
          province: prefilledVehicle.location?.state || prefilledVehicle.location?.province || '',
          district: prefilledVehicle.location?.city || prefilledVehicle.location?.district || '',
          city: prefilledVehicle.location?.city || '',
          town: prefilledVehicle.location?.city || '',
          state: prefilledVehicle.location?.state || '',
          latitude: prefilledVehicle.location?.coordinates?.coords?.[1] || prefilledVehicle.location?.coordinates?.lat || '',
          longitude: prefilledVehicle.location?.coordinates?.coords?.[0] || prefilledVehicle.location?.coordinates?.lng || '',
        },
        originalVehicleId: prefilledVehicle._id || ''
      }));

      // Pre-populate image previews (existing URLs)
      if (prefilledVehicle.images && prefilledVehicle.images.length > 0) {
        const imageUrls = prefilledVehicle.images.map(img => 
          typeof img === 'string' ? img : `/api/images/${img._id || img}`
        );
        setImagePreviews(imageUrls);
        setFormData(prev => ({ ...prev, mainCoverImageIndex: 0 }));
        
        // ✅ NEW: Clear error message when images are successfully pre-filled
        setError('');
        
        // Note: Actual 'images' state (Files) stays empty as they aren't re-uploaded yet
      }

      // Mark location as verified if coordinates exist
      if (prefilledVehicle.location?.coordinates?.coords) {
        console.log('🗺️ [PREFILL] Auto-verifying location');
        setLocationVerified(true);
      }
    } else if (open) {
      console.log('ℹ️ [PREFILL] Dialog opened without prefilled data');
    }
  }, [prefilledVehicle, open]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Location verification state
  const [locationVerifying, setLocationVerifying] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  // ✅ NEW: Map Picker State
  const [pickerOpen, setPickerOpen] = useState(false);
  
  // ✅ Real-time price validation state
  const [priceValidationError, setPriceValidationError] = useState('');
  
  // ✅ Real-time auction date-time validation state
  const [auctionStartError, setAuctionStartError] = useState('');
  const [auctionEndError, setAuctionEndError] = useState('');
  
  // ✅ MOVED HERE: Calculate availableFeatures after formData is initialized
  const availableFeatures = getFeaturesByBodyType(formData.bodyType);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    // ✅ NEW: Handle bodyType change with conditional logic
    if (name === 'bodyType') {
      const oldBodyType = formData.bodyType;
      const newBodyType = value;
      
      // Clear features when switching body types to avoid data conflicts
      if (oldBodyType !== newBodyType) {
        console.log(`🔄 [BODY TYPE] Switched from '${oldBodyType}' to '${newBodyType}', clearing features...`);
        setFormData(prev => {
          const updatedData = {
            ...prev,
            [name]: newBodyType,
            features: {} // Clear all features
          };
          
          // Auto-set doors=0 and seats=1 for motorcycles, restore for others
          if (newBodyType === 'motorcycle') {
            updatedData.doors = 0;
            updatedData.seats = 1;
            console.log('🏍️ [MOTORCYCLE MODE] Auto-set doors=0, seats=1');
          } else {
            // Reset to defaults for non-motorcycles
            updatedData.doors = 4;
            updatedData.seats = 5;
            console.log('🚗 [CAR MODE] Reset to doors=4, seats=5');
          }
          
          return updatedData;
        });
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      // Handle nested location fields
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
    
    // ✅ Real-time price validation
    if (name === 'startingPrice' || name === 'askingPrice') {
      validatePrices(name === 'startingPrice' ? value : formData.startingPrice, 
                     name === 'askingPrice' ? value : formData.askingPrice);
    }
    
    // ✅ Real-time auction date-time validation
    if (name === 'auctionStartDate' || name === 'auctionEndDate') {
      const startDate = name === 'auctionStartDate' ? value : formData.auctionStartDate;
      const endDate = name === 'auctionEndDate' ? value : formData.auctionEndDate;
      validateAuctionDates(startDate, endDate);
    }
  };
  
  // ✅ Price validation function (Asking Price must be > Starting Price)
  const validatePrices = (start, ask) => {
    if (ask && start) {
      const startPrice = parseFloat(start);
      const askPrice = parseFloat(ask);
      
      if (askPrice <= startPrice) {
        setPriceValidationError('Asking price must be higher than the starting price.');
      } else {
        setPriceValidationError('');
      }
    } else {
      setPriceValidationError('');
    }
  };
  
  // ✅ Auction date-time validation function
  const validateAuctionDates = (startDate, endDate) => {
    let startError = '';
    let endError = '';
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      
      // Check if Start Time is at least 5 minutes in the future
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
      if (start < fiveMinutesFromNow) {
        startError = 'Start time must be at least 5 minutes in the future.';
      }
      
      // Check if End Time is at least 15 minutes after Start Time
      const fifteenMinutesAfterStart = new Date(start.getTime() + 15 * 60000);
      if (end < fifteenMinutesAfterStart) {
        endError = 'Auction must last at least 15 minutes.';
      }
    }
    
    setAuctionStartError(startError);
    setAuctionEndError(endError);
  };

  // Handle feature checkboxes
  const handleFeatureChange = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  // Get selected features
  const selectedFeatures = Object.keys(formData.features).filter(f => formData.features[f]);

  const handleImageChange = (e) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, file]);
          setImagePreviews(prev => [...prev, reader.result]);
          
          // Set first image as main cover by default
          if (formData.mainCoverImageIndex === null) {
            setFormData(prev => ({ ...prev, mainCoverImageIndex: 0 }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    
    // Reset main cover image if it was removed
    if (formData.mainCoverImageIndex === index) {
      setFormData(prev => ({
        ...prev,
        mainCoverImageIndex: imagePreviews.length > 1 ? 0 : null
      }));
    } else if (formData.mainCoverImageIndex > index) {
      setFormData(prev => ({
        ...prev,
        mainCoverImageIndex: prev.mainCoverImageIndex - 1
      }));
    }
  };

  const setMainCoverImage = (index) => {
    setFormData(prev => ({
      ...prev,
      mainCoverImageIndex: index
    }));
  };

  // ============ GEOCODING LOGIC ============
  const fetchCoordinates = async () => {
    const { town, district, province } = formData.location;
    
    // Validate all 3 fields for town-level precision
    if (!town.trim() || !district.trim() || !province.trim()) {
      setLocationError('Please provide Town, District, and Province for mapping.');
      return;
    }

    // ✅ STEP 1: OPEN MODAL IMMEDIATELY
    setPickerOpen(true);
    setLocationVerifying(true);
    setLocationError('');
    setLocationVerified(false);

    try {
      // ✅ TOWN LEVEL: Construct Nominatim API query with 3 levels
      const searchAddress = `${town.trim()}, ${district.trim()}, ${province.trim()}, Sri Lanka`;
      const encodedQuery = encodeURIComponent(searchAddress);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}`;

      console.log('🔍 [GEOCODING] Fetching coordinates for:', searchAddress);
      console.log('   URL:', nominatimUrl);

      // Fetch coordinates from Nominatim API
      const response = await fetch(nominatimUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartAutoHub-VehicleForm/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const results = await response.json();

      console.log('✅ [GEOCODING] API Response:', results);

      // Check if results found
      if (!results || results.length === 0) {
        console.warn('⚠️  [GEOCODING] No results found for:', searchAddress);
        // We stay open so user can pick manually
        setLocationVerifying(false);
        return;
      }

      // Extract first result
      const firstResult = results[0];
      const latitude = parseFloat(firstResult.lat);
      const longitude = parseFloat(firstResult.lon);

      // Update form with coordinates
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }
      }));

      // Show success message
      setLocationVerified(true);
      setLocationError('');
      console.log('✅ [GEOCODING] Location pre-verified at town level');

    } catch (err) {
      console.error('❌ [GEOCODING] Error:', err);
      setLocationError(`Error verifying location: ${err.message}. Opening Map Picker...`);
      setPickerOpen(true);
    } finally {
      setLocationVerifying(false);
    }
  };

  // ✅ NEW: Handle location confirmation from Map Picker
  const handleLocationConfirm = (coords) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        latitude: coords[0].toString(),
        longitude: coords[1].toString()
      }
    }));
    setLocationVerified(true);
    setLocationError('');
    console.log('📍 [PICKER] Manual location set:', coords);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ============ VALIDATION LOGIC ============
    
    // ✅ Check for real-time price validation error
    if (priceValidationError) {
      setError(priceValidationError);
      return;
    }
    
    // ✅ Check for real-time auction date validation errors
    if (auctionStartError || auctionEndError) {
      setError(auctionStartError || auctionEndError);
      return;
    }

    // Required Basic Vehicle Information
    if (!formData.brand.trim()) {
      setError('Brand is required');
      return;
    }
    if (!formData.model.trim()) {
      setError('Model is required');
      return;
    }
    if (!formData.year) {
      setError('Year is required');
      return;
    }
    if (formData.mileage === '' || formData.mileage === null || formData.mileage === undefined) {
      setError('Mileage is required');
      return;
    }

    // Mileage validation (non-negative)
    if (parseFloat(formData.mileage) < 0) {
      setError('Mileage cannot be negative');
      return;
    }

    // Engine Capacity validation (if provided)
    if (formData.engineCapacity && parseFloat(formData.engineCapacity) <= 0) {
      setError('Engine Capacity must be a positive number');
      return;
    }

    // ✅ NEW: Doors validation - allow 0 for motorcycles, 2-6 for other vehicles
    const doorsValue = parseInt(formData.doors);
    if (formData.bodyType !== 'motorcycle') {
      // For non-motorcycles, doors must be 2-6
      if (doorsValue < 2 || doorsValue > 6) {
        setError('Doors must be between 2 and 6');
        return;
      }
    } else {
      // For motorcycles, doors should be 0 (auto-set, but validate it)
      if (doorsValue !== 0) {
        console.warn('⚠️ [VALIDATION] Motorcycle doors should be 0, found:', doorsValue);
        // Auto-correct to 0 for motorcycles
        setFormData(prev => ({ ...prev, doors: 0 }));
      }
    }

    // ✅ NEW: Seats validation - allow 1 for motorcycles, 1+ for others
    const seatsValue = parseInt(formData.seats);
    if (seatsValue < 1) {
      setError('Number of seats must be at least 1');
      return;
    }
    
    // For motorcycles, ensure seats = 1
    if (formData.bodyType === 'motorcycle' && seatsValue !== 1) {
      console.warn('⚠️ [VALIDATION] Motorcycle seats should be 1, found:', seatsValue);
      setFormData(prev => ({ ...prev, seats: 1 }));
    }

    // Pricing Validation
    if (!formData.startingPrice) {
      setError('Starting Price is required');
      return;
    }
    const startingPrice = parseFloat(formData.startingPrice);
    if (startingPrice <= 0) {
      setError('Starting Price must be greater than 0');
      return;
    }

    if (!formData.askingPrice) {
      setError('Asking Price is required');
      return;
    }
    const askingPrice = parseFloat(formData.askingPrice);
    if (askingPrice <= 0) {
      setError('Asking Price must be greater than 0');
      return;
    }

    if (askingPrice <= startingPrice) {
      setError('Asking price must be higher than the starting price.');
      return;
    }

    // Auction Timeline Validation (backup check in case real-time validation misses)
    if (!formData.auctionStartDate) {
      setError('Auction Start Date & Time is required');
      return;
    }
    if (!formData.auctionEndDate) {
      setError('Auction End Date & Time is required');
      return;
    }

    const startDate = new Date(formData.auctionStartDate);
    const endDate = new Date(formData.auctionEndDate);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
    const fifteenMinutesAfterStart = new Date(startDate.getTime() + 15 * 60000);

    if (startDate < fiveMinutesFromNow) {
      setError('Auction start time must be at least 5 minutes in the future.');
      return;
    }

    if (endDate < fifteenMinutesAfterStart) {
      setError('Auction end time must be at least 15 minutes after start time.');
      return;
    }

    // Location Validation
    if (!formData.location.province.trim() || !formData.location.district.trim() || !formData.location.town.trim()) {
      setError('Precise location (Province, District, Town) is required');
      return;
    }

    // Coordinates Validation (if provided)
    if (formData.location.latitude) {
      const lat = parseFloat(formData.location.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError('Latitude must be between -90 and 90');
        return;
      }
    }
    if (formData.location.longitude) {
      const lng = parseFloat(formData.location.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError('Longitude must be between -180 and 180');
        return;
      }
    }

    // Images Validation
    // Check if we have either new files or existing image previews
    const hasAnyImages = images.length > 0 || imagePreviews.length > 0;
    
    if (!hasAnyImages) {
      setError('Please upload at least one vehicle image');
      return;
    }

    if (formData.mainCoverImageIndex === null) {
      setError('Please select a main cover image');
      return;
    }

    // Description Validation
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    // ============ SUBMISSION ============
    setLoading(true);
    try {
      const submissionData = new FormData();
      
      // Basic Vehicle Information
      submissionData.append('brand', formData.brand.trim());
      submissionData.append('model', formData.model.trim());
      submissionData.append('year', parseInt(formData.year));
      submissionData.append('condition', formData.condition);
      submissionData.append('mileage', parseInt(formData.mileage));
      submissionData.append('fuelType', formData.fuelType);
      submissionData.append('transmission', formData.transmission);
      submissionData.append('engineCapacity', formData.engineCapacity.trim());
      submissionData.append('color', formData.color.trim());
      submissionData.append('vin', formData.vin?.trim() || '');
      
      // ✅ ENSURE: Motorcycles always send doors=0, seats=1
      const finalDoors = formData.bodyType === 'motorcycle' ? 0 : parseInt(formData.doors);
      const finalSeats = formData.bodyType === 'motorcycle' ? 1 : parseInt(formData.seats);
      submissionData.append('doors', finalDoors);
      submissionData.append('seats', finalSeats);
      if (formData.originalVehicleId) {
        submissionData.append('originalVehicleId', formData.originalVehicleId);
      }
      console.log(`📤 [SUBMIT] Vehicle: ${formData.brand} ${formData.model}, BodyType: ${formData.bodyType}, Doors: ${finalDoors}, Seats: ${finalSeats}`);
      
      submissionData.append('bodyType', formData.bodyType);
      
      // Key Features (send as JSON array)
      submissionData.append('features', JSON.stringify(selectedFeatures));
      
      // Auction & Pricing
      submissionData.append('startingPrice', parseFloat(formData.startingPrice));
      submissionData.append('askingPrice', parseFloat(formData.askingPrice));
      submissionData.append('auctionStartDate', formData.auctionStartDate);
      submissionData.append('auctionEndDate', formData.auctionEndDate);
      
      // ✅ NEW: Handle Existing Images (URLs)
      const existingUrls = imagePreviews.filter(preview => typeof preview === 'string' && (preview.startsWith('http') || preview.startsWith('/') || preview.startsWith('api/images')));
      if (existingUrls.length > 0) {
        submissionData.append('existingImages', JSON.stringify(existingUrls));
        console.log('🖼️ [SUBMIT] Including existing images:', existingUrls.length);
      }
      
      // Location with Coordinates
      submissionData.append('location', JSON.stringify({
        province: formData.location.province.trim(),
        district: formData.location.district.trim(),
        town: formData.location.town.trim(),
        city: formData.location.town.trim(), // fallback
        country: formData.location.country,
        latitude: formData.location.latitude ? parseFloat(formData.location.latitude) : null,
        longitude: formData.location.longitude ? parseFloat(formData.location.longitude) : null,
        coordinates: {
          lat: formData.location.latitude ? parseFloat(formData.location.latitude) : null,
          lng: formData.location.longitude ? parseFloat(formData.location.longitude) : null
        }
      }));
      
      // Media & Description
      submissionData.append('description', formData.description.trim());
      submissionData.append('mainCoverImageIndex', formData.mainCoverImageIndex);
      
      // Append all images
      images.forEach((image) => {
        submissionData.append('images', image);
      });

      const response = await api.post('/auction-vehicles', submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Reset form
        setFormData({
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          condition: 'good',
          mileage: '',
          fuelType: 'petrol',
          transmission: 'automatic',
          engineCapacity: '',
          color: '',
          doors: 4,
          seats: 5,
          bodyType: 'sedan',
          features: {},
          startingPrice: '',
          askingPrice: '',
          auctionStartDate: '',
          auctionEndDate: '',
          location: {
            province: '',
            district: '',
            town: '',
            city: '',
            state: '',
            country: 'Sri Lanka',
            latitude: '',
            longitude: ''
          },
          description: '',
          mainCoverImageIndex: null
        });
        setImages([]);
        setImagePreviews([]);
        onSuccess();
      }
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setError(err.response?.data?.message || 'Failed to add vehicle for bidding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth={true}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        Add Vehicle for Bidding
        <CloseIcon onClick={onClose} sx={{ cursor: 'pointer', '&:hover': { color: theme.palette.error.main } }} />
      </DialogTitle>

      <DialogContent sx={{ pt: 2, maxHeight: '80vh', overflowY: 'auto' }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          
          {/* ========== SECTION 1: MEDIA & IMAGES ========== */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.primary.main }}>
              📸 Vehicle Images
            </Typography>
            
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                border: `2px dashed ${theme.palette.primary.main}`,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: imagePreviews.length > 0 ? theme.palette.action.hover : 'inherit',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: theme.palette.primary.dark
                }
              }}
            >
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="vehicle-images"
                type="file"
                multiple
                onChange={handleImageChange}
              />
              <label htmlFor="vehicle-images" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                {imagePreviews.length === 0 ? (
                  <Box>
                    <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Click to upload vehicle images
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      (PNG, JPG, or GIF - multiple files accepted)
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                      ✓ {imagePreviews.length} image(s) uploaded - Click to add more
                    </Typography>
                  </Box>
                )}
              </label>
            </Paper>

            {/* Image Previews Grid with Main Cover Selection */}
            {imagePreviews.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.secondary }}>
                  Select Main Cover Image:
                </Typography>
                <Grid container spacing={2}>
                  {imagePreviews.map((preview, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Paper
                        sx={{
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 2,
                          aspectRatio: '1',
                          backgroundColor: theme.palette.background.paper,
                          border: formData.mainCoverImageIndex === index ? `3px solid ${theme.palette.success.main}` : '2px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 2
                          }
                        }}
                        onClick={() => setMainCoverImage(index)}
                      >
                        <CardMedia
                          component="img"
                          image={preview}
                          alt={`Preview ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {formData.mainCoverImageIndex === index && (
                          <Box sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: theme.palette.success.main,
                            borderRadius: '50%',
                            p: 0.5,
                            color: 'white'
                          }}>
                            <StarIcon sx={{ fontSize: 20 }} />
                          </Box>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            backgroundColor: 'rgba(255, 0, 0, 0.8)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 0, 0, 0.95)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                          }}
                        >
                          #{index + 1}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ========== SECTION 2: BASIC VEHICLE INFORMATION ========== */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.primary.main }}>
              🚗 Basic Vehicle Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Toyota"
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., Camry"
                  required
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1900, max: new Date().getFullYear() }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="excellent">Excellent</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mileage (km)"
                  name="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Body Type"
                  name="bodyType"
                  value={formData.bodyType}
                  onChange={handleChange}
                >
                  <MenuItem value="sedan">Sedan</MenuItem>
                  <MenuItem value="suv">SUV</MenuItem>
                  <MenuItem value="hatchback">Hatchback</MenuItem>
                  <MenuItem value="coupe">Coupe</MenuItem>
                  <MenuItem value="truck">Truck</MenuItem>
                  <MenuItem value="van">Van</MenuItem>
                  <MenuItem value="wagon">Wagon</MenuItem>
                  <MenuItem value="convertible">Convertible</MenuItem>
                  <MenuItem value="bus">Bus</MenuItem>
                  <MenuItem value="motorcycle">Motorcycle</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 3, mb: 2, color: theme.palette.text.secondary }}>
              Engine Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Fuel Type"
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="petrol">Petrol</MenuItem>
                  <MenuItem value="diesel">Diesel</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                  <MenuItem value="electric">Electric</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Transmission"
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                >
                  <MenuItem value="automatic">Automatic</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Engine Capacity"
                  name="engineCapacity"
                  placeholder="e.g., 2.0L or 2000cc"
                  value={formData.engineCapacity}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 3, mb: 2, color: theme.palette.text.secondary }}>
              Exterior
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g., Silver"
                />
              </Grid>
              {/* ✅ NEW: Conditionally show doors field (hidden for motorcycles) */}
              {formData.bodyType !== 'motorcycle' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Number of Doors"
                    name="doors"
                    type="number"
                    value={formData.doors}
                    onChange={handleChange}
                    helperText="Must be between 2 and 6"
                    inputProps={{ min: 2, max: 6 }}
                  />
                </Grid>
              )}
              {/* ✅ NEW: Conditionally show seats field (hidden for motorcycles) */}
              {formData.bodyType !== 'motorcycle' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Number of Seats"
                    name="seats"
                    type="number"
                    value={formData.seats}
                    onChange={handleChange}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              )}
              {/* ✅ NEW: Show info message for motorcycles */}
              {formData.bodyType === 'motorcycle' && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    🏍️ Motorcycle settings: Doors=0, Seats=1 (auto-applied)
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ========== SECTION 3: KEY FEATURES (CHECKBOXES) ========== */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.primary.main }}>
              ⭐ Key Features
            </Typography>

            <FormGroup row sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
              {availableFeatures.map((feature) => (
                <FormControlLabel
                  key={feature}
                  control={
                    <Checkbox
                      checked={formData.features[feature] || false}
                      onChange={() => handleFeatureChange(feature)}
                    />
                  }
                  label={feature}
                />
              ))}
            </FormGroup>

            {selectedFeatures.length > 0 && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Selected Features:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedFeatures.map((feature) => (
                    <Chip key={feature} label={feature} color="primary" size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ========== SECTION 4: AUCTION & PRICING LOGIC ========== */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.primary.main }}>
              💰 Auction & Pricing Logic
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Starting Price (LKR)"
                  name="startingPrice"
                  type="number"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  inputProps={{ step: '100', min: 0 }}
                  helperText="Minimum price to start bidding"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Asking Price (LKR)"
                  name="askingPrice"
                  type="number"
                  value={formData.askingPrice}
                  onChange={handleChange}
                  inputProps={{ step: '100', min: 0 }}
                  helperText={priceValidationError || "Seller's expected/target price"}
                  error={Boolean(priceValidationError)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Auction Start Date & Time"
                  name="auctionStartDate"
                  type="datetime-local"
                  value={formData.auctionStartDate}
                  onChange={handleChange}
                  helperText={auctionStartError || ''}
                  error={Boolean(auctionStartError)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Auction End Date & Time"
                  name="auctionEndDate"
                  type="datetime-local"
                  value={formData.auctionEndDate}
                  onChange={handleChange}
                  helperText={auctionEndError || ''}
                  error={Boolean(auctionEndError)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ========== SECTION 5: PRECISE LOCATION ========== */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.primary.main }}>
              📍 Precise Location
            </Typography>

            {/* Location Error Alert */}
            {locationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {locationError}
              </Alert>
            )}

            {/* Location Verified Success Alert */}
            {locationVerified && (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Town location verified: <strong>{formData.location.town}</strong> 
                <br />
                Coordinates: {formData.location.latitude}, {formData.location.longitude}
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* Province Dropdown */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={SRI_LANKAN_PROVINCES}
                  value={formData.location.province}
                  onChange={(event, value) => {
                    setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, province: value || '' }
                    }));
                    setLocationVerified(false);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Province" required disabled={locationVerifying} />
                  )}
                />
              </Grid>

              {/* District Dropdown */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={SRI_LANKAN_DISTRICTS}
                  value={formData.location.district}
                  onChange={(event, value) => {
                    setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, district: value || '' }
                    }));
                    setLocationVerified(false);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="District" required disabled={locationVerifying} />
                  )}
                />
              </Grid>

              {/* Town Input */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Town / City"
                  name="location.town"
                  value={formData.location.town}
                  onChange={(e) => {
                    handleChange(e);
                    setLocationVerified(false);
                  }}
                  placeholder="e.g., Kaduwela"
                  required
                  disabled={locationVerifying}
                />
              </Grid>
            </Grid>

            {/* Verify Location Button */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color={locationVerified ? "success" : "primary"}
                  onClick={fetchCoordinates}
                  disabled={!formData.location.province || !formData.location.district || !formData.location.town}
                  startIcon={locationVerifying ? <CircularProgress size={20} /> : <LocationIcon />}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  {locationVerifying ? 'Searching...' : locationVerified ? '✅ Location Picked' : '🗺️ Verify Location on Map'}
                </Button>
              </Grid>

            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ========== SECTION 6: DESCRIPTION ========== */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.primary.main }}>
              📝 Description
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Vehicle Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the vehicle condition, features, maintenance history, any damages or special notes..."
              required
              helperText="Provide detailed information about the vehicle"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !locationVerified}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Adding...' : 'Add for Bidding'}
        </Button>
      </DialogActions>

      {/* ✅ NEW: Location Picker Modal */}
      <LocationPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={[formData.location.latitude, formData.location.longitude]}
        district={formData.location.district}
      />
    </Dialog>
  );
};

export default AddVehicleBiddingDialog;
