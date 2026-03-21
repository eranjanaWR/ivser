/**
 * Vehicles Page
 * Browse all vehicle listings with filters
 */

import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import api from '../services/api';
import VehicleMap from '../components/VehicleMap';
import NotifyModal from '../components/NotifyModal';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';

const brands = ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'BMW', 'Mercedes', 'Audi', 'Mazda', 'Mitsubishi', 'Hyundai'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const transmissions = ['Manual', 'Automatic'];
const conditions = ['New', 'Used', 'Certified Pre-Owned'];

const VehiclesPage = () => {
  const { user } = useAuth();
  const isAdmin = user && ['admin1', 'admin2'].includes(user.role);
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
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
        if (value) params.append(key, value);
      });
      
      const { data } = await api.get(`/vehicles?${params.toString()}`);
      const vehiclesData = data.data || [];
      setVehicles(vehiclesData);
      setTotalPages(data.pagination?.pages || 1);
      
      // Log the search
      const searchQuery = filters.search || filters.brand || 'browse vehicles';
      logSearch(searchQuery, vehiclesData.length);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
    setLoading(false);
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
        {(filters.brand || filters.fuelType || filters.transmission || filters.condition) && (
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {filters.brand && (
              <Chip label={filters.brand} onDelete={() => handleFilterChange('brand', '')} />
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
                <Grid container spacing={3}>
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
                    <CardMedia
                      component="img"
                      height="200"
                      image={getImageUrl(vehicle.images?.[0])}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      sx={{ objectFit: 'cover' }}
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
