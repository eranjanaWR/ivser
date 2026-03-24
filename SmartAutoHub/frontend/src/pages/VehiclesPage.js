/**
 * Vehicles Page
 * Browse all vehicle listings with filters
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Pagination,
  CircularProgress,
  InputAdornment,
  Paper,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  FilterList,
  Speed,
  CalendarToday,
  LocalGasStation,
  ExpandMore,
  ExpandLess,
  Edit,
  Delete,
  DirectionsCar,
  LocalShipping,
  Agriculture,
  TwoWheeler,
  AirportShuttle,
  RvHookup,
} from '@mui/icons-material';
import api from '../services/api';
import VehicleMap from '../components/VehicleMap';
import NotifyModal from '../components/NotifyModal';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import WatermarkedImage from '../components/WatermarkedImage';

const brands = ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'BMW', 'Mercedes', 'Audi', 'Mazda', 'Mitsubishi', 'Hyundai'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const transmissions = ['Manual', 'Automatic'];
const conditions = ['New', 'Used', 'Certified Pre-Owned'];
const vehicleTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van', 'Wagon', 'Convertible', 'Bus', 'Three Wheeler', 'Motorcycle', 'Pickup', 'Jeep'];

// Vehicle type icons mapping
const vehicleTypeIcons = {
  'Sedan': '🚗',
  'SUV': '🚙',
  'Hatchback': '🚗',
  'Coupe': '🚗',
  'Truck': '🚚',
  'Van': '🚐',
  'Wagon': '🚙',
  'Convertible': '🏎️',
  'Bus': '🚌',
  'Three Wheeler': '🛺',
  'Motorcycle': '🏍️',
  'Pickup': '🚚',
  'Jeep': '🚙',
};

const VehiclesPage = () => {
  const { user } = useAuth();
  const isAdmin = user && ['admin1', 'admin2'].includes(user.role);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const vehiclesResultRef = useRef(null);
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [suggestedVehicles, setSuggestedVehicles] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    vehicleType: searchParams.get('vehicleType') || '',
    fuelType: searchParams.get('fuelType') || '',
    transmission: searchParams.get('transmission') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || 0,
    maxPrice: searchParams.get('maxPrice') || 50000000,
    page: parseInt(searchParams.get('page')) || 1,
  });

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const logSearch = async (searchQuery, resultsCount) => {
    try {
      await api.post('/search/log', {
        searchQuery: searchQuery || 'general browse',
        searchType: filters.brand ? 'brand' : filters.search ? 'model' : 'general',
        filters: {
          search: filters.search,
          brand: filters.brand,
          model: filters.model || filters.search, // Also track model explicitly
          fuelType: filters.fuelType,
          transmission: filters.transmission,
          condition: filters.condition,
          priceRange: [filters.minPrice, filters.maxPrice],
        },
        resultsCount: resultsCount,
      });
    } catch (err) {
      console.error('Failed to log search:', err);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          // Map vehicleType to bodyType for backend compatibility
          const paramKey = key === 'vehicleType' ? 'bodyType' : key;
          params.append(paramKey, value);
        }
      });
      
      const { data } = await api.get(`/vehicles?${params.toString()}`);
      const vehiclesData = data.data || [];
      setVehicles(vehiclesData);
      setTotalPages(data.pagination?.pages || 1);
      
      // Log the search
      const searchQuery = filters.search || filters.brand || 'browse vehicles';
      logSearch(searchQuery, vehiclesData.length);
      
      // Fetch featured suggestions if there's a search query
      if (filters.search) {
        fetchSuggestedVehicles(filters.search);
      } else {
        setSuggestedVehicles([]);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
    setLoading(false);
  };

  const fetchSuggestedVehicles = async (searchQuery) => {
    setLoadingSuggestions(true);
    try {
      // Get vehicles from current results to understand search context
      if (vehicles.length === 0) {
        setSuggestedVehicles([]);
        setLoadingSuggestions(false);
        return;
      }

      // Extract brand/model from search query for filtering
      const searchLower = searchQuery.toLowerCase();
      
      // Calculate average price and get vehicle type from current results
      const avgPrice = vehicles.length > 0 
        ? vehicles.reduce((sum, v) => sum + v.price, 0) / vehicles.length 
        : 0;
      const priceRange = 0.3; // 30% variance

      // Get similar vehicles with different brands/models
      // Fetch from a larger pool and filter
      const params = new URLSearchParams();
      // Use price-based filtering to get similar vehicles
      params.append('minPrice', Math.max(0, Math.floor(avgPrice * (1 - priceRange))));
      params.append('maxPrice', Math.ceil(avgPrice * (1 + priceRange)));
      params.append('limit', 20); // Get more to filter later
      
      const { data } = await api.get(`/vehicles?${params.toString()}`);
      let allVehicles = data.data || [];
      
      // Filter to remove:
      // 1. Exact matches from main results
      // 2. Same brand as search query
      // 3. Same model keyword
      const mainVehicleIds = vehicles.map(v => v._id);
      const searchBrand = vehicles[0]?.brand?.toLowerCase() || '';
      
      let suggestions = allVehicles.filter(v => {
        // Don't include main results
        if (mainVehicleIds.includes(v._id)) return false;
        
        // Don't include same brand as the searched vehicle
        if (v.brand?.toLowerCase() === searchBrand) return false;
        
        // Don't include exact model keyword matches
        if (v.model?.toLowerCase().includes(searchBrand)) return false;
        
        return true;
      }).slice(0, 6);

      // If we don't have enough suggestions, get more diverse options
      if (suggestions.length < 6) {
        const diverseParams = new URLSearchParams();
        diverseParams.append('limit', 12);
        
        const { data: diverseData } = await api.get(`/vehicles?${diverseParams.toString()}`);
        const diverseVehicles = diverseData.data || [];
        
        const additionalSuggestions = diverseVehicles.filter(v => {
          if (mainVehicleIds.includes(v._id)) return false;
          if (suggestions.find(s => s._id === v._id)) return false;
          if (v.brand?.toLowerCase() === searchBrand) return false;
          if (v.model?.toLowerCase().includes(searchBrand)) return false;
          return true;
        });
        
        suggestions = [...suggestions, ...additionalSuggestions].slice(0, 6);
      }
      
      setSuggestedVehicles(suggestions);
    } catch (err) {
      console.error('Failed to fetch suggested vehicles:', err);
      setSuggestedVehicles([]);
    }
    setLoadingSuggestions(false);
  };

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value, page: 1 });
    
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(name, value);
    } else {
      newParams.delete(name);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
    
    // Scroll to results after a short delay to ensure filter is applied
    setTimeout(() => {
      if (vehiclesResultRef.current) {
        vehiclesResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handlePageChange = (event, value) => {
    setFilters({ ...filters, page: value });
    searchParams.set('page', value);
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      brand: '',
      vehicleType: '',
      fuelType: '',
      transmission: '',
      condition: '',
      minPrice: 0,
      maxPrice: 50000000,
      page: 1,
    });
    setSearchParams({});
  };

  const handleVehicleClick = async (vehicleId) => {
    try {
      // Log the vehicle view
      await api.post('/search/log-vehicle', { vehicleId });
    } catch (err) {
      console.error('Failed to log vehicle click:', err);
    }
  };

  // Check if there's an active search filter
  const hasActiveFilter = filters.search || filters.brand || filters.fuelType || filters.transmission || filters.condition || (filters.minPrice > 0 || filters.maxPrice < 50000000);

  const handleDeleteVehicle = (vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;
    
    try {
      await api.delete(`/vehicles/${vehicleToDelete._id}`);
      // Remove vehicle from list
      setVehicles(vehicles.filter(v => v._id !== vehicleToDelete._id));
      setDeleteConfirmOpen(false);
      setVehicleToDelete(null);
      alert('Vehicle deleted successfully');
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      alert('Failed to delete vehicle: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Browse Vehicles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find your perfect vehicle from our verified listings
          </Typography>
        </Box>

        {/* Visual Filter - Vehicle Types */}
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, border: '1px solid', borderColor: 'grey.200', bgcolor: 'white' }}>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1.5 }}>
            Discover Vehicles by Type
          </Typography>
          <Grid container spacing={1}>
            {vehicleTypes.map((type) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={type}>
                <Card
                  onClick={() => handleFilterChange('vehicleType', filters.vehicleType === type ? '' : type)}
                  sx={{
                    cursor: 'pointer',
                    border: filters.vehicleType === type ? '2px solid' : '1px solid',
                    borderColor: filters.vehicleType === type ? 'primary.main' : 'grey.300',
                    bgcolor: filters.vehicleType === type ? 'primary.50' : 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: filters.vehicleType === type ? 'primary.50' : 'grey.50',
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                    textAlign: 'center',
                    p: 1,
                  }}
                >
                  <Box sx={{ fontSize: 24, mb: 0.5 }}>
                    {vehicleTypeIcons[type]}
                  </Box>
                  <Typography variant="caption" fontWeight={filters.vehicleType === type ? 'bold' : 'normal'}>
                    {type}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Search Bar */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search by brand, model, or keywords..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={showFilters ? <ExpandLess /> : <FilterList />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </Grid>
            <Grid item xs={6} md={2}>
              <Button fullWidth variant="text" onClick={clearFilters}>
                Clear All
              </Button>
            </Grid>
          </Grid>
          
          {/* Expanded Filters */}
          <Collapse in={showFilters}>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Brand</InputLabel>
                  <Select
                    value={filters.brand}
                    label="Brand"
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                  >
                    <MenuItem value="">All Brands</MenuItem>
                    {brands.map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={filters.vehicleType}
                    label="Vehicle Type"
                    onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {vehicleTypes.map((v) => (
                      <MenuItem key={v} value={v}>{v}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Fuel Type</InputLabel>
                  <Select
                    value={filters.fuelType}
                    label="Fuel Type"
                    onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {fuelTypes.map((f) => (
                      <MenuItem key={f} value={f}>{f}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Transmission</InputLabel>
                  <Select
                    value={filters.transmission}
                    label="Transmission"
                    onChange={(e) => handleFilterChange('transmission', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {transmissions.map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={filters.condition}
                    label="Condition"
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {conditions.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Active Filters */}
        {(filters.brand || filters.vehicleType || filters.fuelType || filters.transmission || filters.condition) && (
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {filters.brand && (
              <Chip label={filters.brand} onDelete={() => handleFilterChange('brand', '')} />
            )}
            {filters.vehicleType && (
              <Chip label={filters.vehicleType} onDelete={() => handleFilterChange('vehicleType', '')} />
            )}
            {filters.fuelType && (
              <Chip label={filters.fuelType} onDelete={() => handleFilterChange('fuelType', '')} />
            )}
            {filters.transmission && (
              <Chip label={filters.transmission} onDelete={() => handleFilterChange('transmission', '')} />
            )}
            {filters.condition && (
              <Chip label={filters.condition} onDelete={() => handleFilterChange('condition', '')} />
            )}
          </Box>
        )}

        {/* Loading */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : vehicles.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No vehicles found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your filters
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setNotifyModalOpen(true)}
              >
                📧 Notify When Available
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {/* Left Column - Vehicle Grid */}
              <Grid item xs={12} md={8} lg={8.5}>
                {/* Vehicle Grid */}
                <Grid container spacing={3} ref={vehiclesResultRef}>
                  {vehicles.map((vehicle) => (
                    <Grid 
                      item 
                      xs={12} 
                      sm={6} 
                      md={6}
                      lg={3}
                      key={vehicle._id}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' },
                      position: 'relative',
                    }}
                  >
                    <WatermarkedImage
                      src={getImageUrl(vehicle.images?.[0])}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      sx={{
                        height: 200,
                        objectFit: 'cover',
                      }}
                      showLoader={false}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={vehicle.condition}
                          size="small"
                          color={vehicle.condition === 'New' ? 'success' : 'default'}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.fuelType}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {vehicle.brand} {vehicle.model}
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {formatPrice(vehicle.price)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.year}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Speed fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.mileage?.toLocaleString()} km
                          </Typography>
                        </Box>
                      </Box>

                      {/* Location */}
                      {vehicle.location && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="caption" color="text.secondary">
                            📍 Location
                          </Typography>
                          <Typography variant="body2" fontWeight="600" color="#1976d2">
                            {typeof vehicle.location === 'string' 
                              ? vehicle.location 
                              : `${vehicle.location.city || 'City'}, ${vehicle.location.country || 'Country'}`}
                          </Typography>
                        </Box>
                      )}


                    </CardContent>
                    <CardActions sx={{ 
                      p: 2, 
                      pt: 1, 
                      display: 'flex', 
                      gap: 1, 
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      backgroundColor: '#fafafa'
                    }}>
                      <Button
                        component={Link}
                        to={`/vehicles/${vehicle._id}`}
                        onClick={() => handleVehicleClick(vehicle._id)}
                        variant="contained"
                        size="small"
                        sx={{ flex: 1, minWidth: '100px' }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
                </Grid>
              </Grid>

              {/* Right Column - Map */}
              {hasActiveFilter && (
                <Grid item xs={12} md={4} lg={3.5}>
                  <Card 
                    sx={{ 
                      position: 'sticky', 
                      top: 20,
                      overflow: 'hidden'
                    }}
                  >
                    <CardContent sx={{ p: 2, pb: 2 }}>
                      <VehicleMap vehicles={vehicles} />
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={filters.page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}

            {/* Featured Suggestions Section */}
            {filters.search && suggestedVehicles.length > 0 && (
              <Box sx={{ mt: 6, mb: 4 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    ✨ Featured Suggestions Related to "{filters.search}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You might also be interested in these featured vehicles
                  </Typography>
                </Box>

                {loadingSuggestions ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {suggestedVehicles.map((vehicle) => (
                      <Grid item xs={12} sm={6} md={4} lg={2} key={vehicle._id}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            border: '2px solid',
                            borderColor: 'primary.light',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)',
                            },
                          }}
                        >
                          <WatermarkedImage
                            src={getImageUrl(vehicle.images?.[0])}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            sx={{
                              height: 140,
                              objectFit: 'cover',
                            }}
                            showLoader={false}
                          />
                          <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, alignItems: 'center' }}>
                              <Chip
                                label={vehicle.condition}
                                size="small"
                                sx={{
                                  bgcolor: vehicle.condition === 'New' ? 'success.main' : 'warning.main',
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                              <Chip
                                label="Featured"
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.3)',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  border: '1px solid white',
                                }}
                                icon={<Typography sx={{ fontSize: '12px' }}>⭐</Typography>}
                              />
                            </Box>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>
                              {vehicle.brand} {vehicle.model}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 0.5 }}>
                              {formatPrice(vehicle.price)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, fontSize: '12px' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                <CalendarToday fontSize="small" />
                                {vehicle.year}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                <Speed fontSize="small" />
                                {vehicle.mileage?.toLocaleString()} km
                              </Box>
                            </Box>
                          </CardContent>
                          <CardActions sx={{ p: 1.5, pt: 1 }}>
                            <Button
                              component={Link}
                              to={`/vehicles/${vehicle._id}`}
                              onClick={() => handleVehicleClick(vehicle._id)}
                              variant="contained"
                              size="small"
                              fullWidth
                              sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: 'grey.100' },
                              }}
                            >
                              View
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </>
        )}

        {/* Notification Modal */}
        <NotifyModal
          open={notifyModalOpen}
          onClose={() => setNotifyModalOpen(false)}
          filters={filters}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Delete Vehicle</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{vehicleToDelete?.brand} {vehicleToDelete?.model}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default VehiclesPage;
