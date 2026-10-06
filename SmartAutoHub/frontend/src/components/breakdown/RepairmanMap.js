import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Paper, Chip, Avatar, Skeleton } from '@mui/material';
import { DirectionsCar, Build, MyLocation, AccessTime, Route } from '@mui/icons-material';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (iconUrl, size = [32, 32]) => {
  return L.icon({
    iconUrl,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
  });
};

// SVG icons as data URIs
const userCarIcon = L.divIcon({
  html: `<div style="background: #1976d2; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>
  </div>`,
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const repairmanIcon = L.divIcon({
  html: `<div style="background: #2e7d32; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
    </svg>
  </div>`,
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const repairmanMovingIcon = L.divIcon({
  html: `<div style="background: #ff9800; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 12px rgba(255,152,0,0.5); animation: pulse 1.5s infinite;">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
    </svg>
  </div>
  <style>
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,152,0,0.7); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(255,152,0,0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,152,0,0); }
    }
  </style>`,
  className: 'custom-div-icon',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

// Component to recenter map when positions change
const MapUpdater = ({ center, repairmanLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (repairmanLocation && center) {
      const bounds = L.latLngBounds([
        [center.lat, center.lng],
        [repairmanLocation.lat, repairmanLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView([center.lat, center.lng], 15);
    }
  }, [center, repairmanLocation, map]);
  
  return null;
};

// Fetch route from OpenRouteService
const fetchRoute = async (start, end) => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    if (data.routes && data.routes[0]) {
      return {
        coordinates: data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        duration: Math.round(data.routes[0].duration / 60), // minutes
        distance: (data.routes[0].distance / 1000).toFixed(1) // km
      };
    }
  } catch (error) {
    console.error('Error fetching route:', error);
  }
  return null;
};

/**
 * RepairmanMap Component
 * Displays user location, repairman location, and route between them
 * 
 * Props:
 * - userLocation: { lat, lng } - User's breakdown location
 * - repairmanLocation: { lat, lng } - Repairman's current location (optional)
 * - repairman: Object with repairman details (optional)
 * - nearbyRepairmen: Array of nearby repairmen (optional)
 * - onSelectRepairman: Callback when repairman is selected (optional)
 * - height: Map container height (default: 400)
 * - showRoute: Whether to show route line (default: true)
 * - isTracking: Whether repairman is being tracked (default: false)
 */
const RepairmanMap = ({
  userLocation,
  repairmanLocation,
  repairman,
  nearbyRepairmen = [],
  onSelectRepairman,
  height = 400,
  showRoute = true,
  isTracking = false,
}) => {
  const [route, setRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Fetch route when repairman location changes
  useEffect(() => {
    if (showRoute && userLocation && repairmanLocation) {
      const getRoute = async () => {
        const routeData = await fetchRoute(repairmanLocation, userLocation);
        if (routeData) {
          setRoute(routeData.coordinates);
          setRouteInfo({ duration: routeData.duration, distance: routeData.distance });
        }
      };
      getRoute();
    }
  }, [userLocation, repairmanLocation, showRoute]);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!userLocation) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
        <MyLocation sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
        <Typography color="text.secondary">
          Enable location to see the map
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />;
  }

  return (
    <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
      {/* Route Info Overlay */}
      {routeInfo && isTracking && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="h6" fontWeight="bold" color="primary">
                {routeInfo.duration} min
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Route sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                {routeInfo.distance} km
              </Typography>
            </Box>
          </Box>
          {repairman && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Avatar
                src={repairman.profileImage}
                sx={{ width: 28, height: 28 }}
              >
                {repairman.firstName?.[0]}
              </Avatar>
              <Typography variant="body2">
                {repairman.firstName} is on the way
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Legend */}
      <Paper
        elevation={2}
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'rgba(255,255,255,0.95)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#1976d2' }} />
            <Typography variant="caption">Your Location</Typography>
          </Box>
          {(repairmanLocation || nearbyRepairmen.length > 0) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2e7d32' }} />
              <Typography variant="caption">Repairman</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={15}
        style={{ height, width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={userLocation} repairmanLocation={repairmanLocation} />
        
        {/* User Location Marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userCarIcon}>
          <Popup>
            <Box sx={{ textAlign: 'center', minWidth: 120 }}>
              <DirectionsCar sx={{ color: '#1976d2', mb: 0.5 }} />
              <Typography variant="body2" fontWeight="bold">
                Your Location
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Breakdown point
              </Typography>
            </Box>
          </Popup>
        </Marker>

        {/* Accuracy Circle for user location */}
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={30}
          pathOptions={{
            color: '#1976d2',
            fillColor: '#1976d2',
            fillOpacity: 0.1,
          }}
        />

        {/* Assigned Repairman Marker */}
        {repairmanLocation && (
          <Marker
            position={[repairmanLocation.lat, repairmanLocation.lng]}
            icon={isTracking ? repairmanMovingIcon : repairmanIcon}
          >
            <Popup>
              <Box sx={{ textAlign: 'center', minWidth: 150 }}>
                {repairman && (
                  <>
                    <Avatar
                      src={repairman.profileImage}
                      sx={{ width: 48, height: 48, mx: 'auto', mb: 1 }}
                    >
                      {repairman.firstName?.[0]}
                    </Avatar>
                    <Typography variant="body2" fontWeight="bold">
                      {repairman.firstName} {repairman.lastName}
                    </Typography>
                    {repairman.repairmanDetails?.rating && (
                      <Chip
                        size="small"
                        label={`★ ${repairman.repairmanDetails.rating.toFixed(1)}`}
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </>
                )}
                {isTracking && (
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                    ● Live tracking
                  </Typography>
                )}
              </Box>
            </Popup>
          </Marker>
        )}

        {/* Nearby Repairmen Markers */}
        {nearbyRepairmen.map((rm) => (
          <Marker
            key={rm._id}
            position={[rm.location.coordinates[1], rm.location.coordinates[0]]}
            icon={repairmanIcon}
            eventHandlers={{
              click: () => onSelectRepairman && onSelectRepairman(rm),
            }}
          >
            <Popup>
              <Box sx={{ textAlign: 'center', minWidth: 150 }}>
                <Avatar
                  src={rm.profileImage}
                  sx={{ width: 40, height: 40, mx: 'auto', mb: 1 }}
                >
                  {rm.firstName?.[0]}
                </Avatar>
                <Typography variant="body2" fontWeight="bold">
                  {rm.firstName} {rm.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {rm.distance?.toFixed(1)} km away
                </Typography>
                {rm.repairmanDetails?.specializations && (
                  <Box sx={{ mt: 0.5 }}>
                    {rm.repairmanDetails.specializations.slice(0, 2).map((spec) => (
                      <Chip key={spec} label={spec} size="small" sx={{ m: 0.25, fontSize: 10 }} />
                    ))}
                  </Box>
                )}
              </Box>
            </Popup>
          </Marker>
        ))}

        {/* Route Line */}
        {route && route.length > 0 && (
          <Polyline
            positions={route}
            pathOptions={{
              color: '#1976d2',
              weight: 5,
              opacity: 0.8,
              dashArray: isTracking ? null : '10, 10',
            }}
          />
        )}
      </MapContainer>
    </Box>
  );
};

export default RepairmanMap;
