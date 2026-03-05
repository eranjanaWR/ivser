/**
 * Repairman Map Page
 * Google Maps with repairman locations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Rating,
} from '@mui/material';
import {
  Build,
  Phone,
  LocationOn,
  MyLocation,
  VerifiedUser,
} from '@mui/icons-material';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import api from '../services/api';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 6.9271,
  lng: 79.8612, // Colombo, Sri Lanka
};

const RepairmanMapPage = () => {
  const [repairmen, setRepairmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRepairman, setSelectedRepairman] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    getUserLocation();
    fetchRepairmen();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (err) => {
          console.error('Location error:', err);
        }
      );
    }
  };

  const fetchRepairmen = async () => {
    setLoading(true);
    try {
      const params = userLocation 
        ? `?latitude=${userLocation.lat}&longitude=${userLocation.lng}&maxDistance=50`
        : '';
      const { data } = await api.get(`/users/repairmen${params}`);
      setRepairmen(data.data || []);
    } catch (err) {
      // If API fails, show mock data for demo
      setRepairmen([
        {
          _id: '1',
          name: 'John Mechanic',
          phone: '+94 77 123 4567',
          rating: 4.5,
          isAvailable: true,
          isFaceVerified: true,
          location: { coordinates: [79.8700, 6.9200] },
        },
        {
          _id: '2',
          name: 'Kumar Auto Care',
          phone: '+94 77 234 5678',
          rating: 4.8,
          isAvailable: true,
          isFaceVerified: true,
          location: { coordinates: [79.8500, 6.9350] },
        },
        {
          _id: '3',
          name: 'Quick Fix Motors',
          phone: '+94 77 345 6789',
          rating: 4.2,
          isAvailable: false,
          isFaceVerified: true,
          location: { coordinates: [79.8800, 6.9100] },
        },
      ]);
    }
    setLoading(false);
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(14);
    } else {
      getUserLocation();
    }
  };

  const selectRepairman = (repairman) => {
    setSelectedRepairman(repairman);
    if (mapRef.current && repairman.location?.coordinates) {
      mapRef.current.panTo({
        lat: repairman.location.coordinates[1],
        lng: repairman.location.coordinates[0],
      });
      mapRef.current.setZoom(15);
    }
  };

  if (loadError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Error loading Google Maps. Please check your API key.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ py: 4, bgcolor: '#fafafa', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Find Repairmen
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Locate verified repairmen near you
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Map */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {!isLoaded ? (
                <Box
                  sx={{
                    height: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={12}
                  onLoad={onMapLoad}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                >
                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker
                      position={userLocation}
                      icon={{
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                      }}
                      title="Your Location"
                    />
                  )}

                  {/* Repairman Markers */}
                  {repairmen.map((repairman) => (
                    repairman.location?.coordinates && (
                      <Marker
                        key={repairman._id}
                        position={{
                          lat: repairman.location.coordinates[1],
                          lng: repairman.location.coordinates[0],
                        }}
                        onClick={() => setSelectedRepairman(repairman)}
                        icon={{
                          url: repairman.isAvailable
                            ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                            : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        }}
                      />
                    )
                  ))}

                  {/* Info Window */}
                  {selectedRepairman && selectedRepairman.location?.coordinates && (
                    <InfoWindow
                      position={{
                        lat: selectedRepairman.location.coordinates[1],
                        lng: selectedRepairman.location.coordinates[0],
                      }}
                      onCloseClick={() => setSelectedRepairman(null)}
                    >
                      <Box sx={{ p: 1, minWidth: 200 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography fontWeight="bold">
                            {selectedRepairman.name}
                          </Typography>
                          {selectedRepairman.isFaceVerified && (
                            <VerifiedUser fontSize="small" color="primary" />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Rating value={selectedRepairman.rating || 0} readOnly size="small" />
                          <Typography variant="body2">
                            ({selectedRepairman.rating || 'N/A'})
                          </Typography>
                        </Box>
                        <Chip
                          label={selectedRepairman.isAvailable ? 'Available' : 'Busy'}
                          color={selectedRepairman.isAvailable ? 'success' : 'default'}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <br />
                        <Button
                          size="small"
                          startIcon={<Phone />}
                          href={`tel:${selectedRepairman.phone}`}
                          sx={{ mt: 1 }}
                        >
                          {selectedRepairman.phone}
                        </Button>
                      </Box>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}

              {/* Center on User Button */}
              <Button
                variant="contained"
                startIcon={<MyLocation />}
                onClick={centerOnUser}
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  zIndex: 1,
                }}
              >
                My Location
              </Button>
            </Paper>
          </Grid>

          {/* Repairman List */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 2,
                overflow: 'hidden',
                maxHeight: 500,
                overflowY: 'auto',
              }}
            >
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'grey.200' }}>
                <Typography fontWeight="bold">
                  Nearby Repairmen ({repairmen.length})
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : repairmen.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No repairmen found nearby
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {repairmen.map((repairman, index) => (
                    <ListItem
                      key={repairman._id}
                      button
                      onClick={() => selectRepairman(repairman)}
                      selected={selectedRepairman?._id === repairman._id}
                      divider={index < repairmen.length - 1}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: repairman.isAvailable ? 'success.main' : 'grey.400' }}>
                          <Build />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {repairman.name}
                            {repairman.isFaceVerified && (
                              <VerifiedUser fontSize="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Rating value={repairman.rating || 0} readOnly size="small" />
                            </Box>
                            <Chip
                              label={repairman.isAvailable ? 'Available' : 'Busy'}
                              size="small"
                              color={repairman.isAvailable ? 'success' : 'default'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default RepairmanMapPage;
