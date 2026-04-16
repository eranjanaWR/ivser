/**
 * Auction Map Component with react-leaflet
 * Displays vehicle location and live bidder markers
 * Features: Real-time bidder location markers, vehicle marker, Socket.io integration
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography, useTheme } from '@mui/material';

/**
 * Custom hook to fix map sizing after mount
 */
const MapResizer = () => {
  const map = useMap();

  useEffect(() => {
    // Delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.warn('Error invalidating map size:', error);
      }
    }, 100);

    // Also handle window resize
    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.warn('Error invalidating map size on resize:', error);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
};

/**
 * Custom hook to update map when markers change
 */
const MapUpdater = ({ bidderMarkers }) => {
  const map = useMap();
  useEffect(() => {
    // Filter valid markers and auto-fit bounds
    const validMarkers = bidderMarkers.filter(
      (marker) =>
        marker &&
        typeof marker.lat === 'number' &&
        typeof marker.lng === 'number' &&
        !isNaN(marker.lat) &&
        !isNaN(marker.lng)
    );

    if (validMarkers.length > 0 && map) {
      try {
        const group = new L.featureGroup(
          validMarkers.map(
            (marker) =>
              new L.Marker([marker.lat, marker.lng])
          )
        );
        if (group.getBounds().isValid()) {
          map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
      } catch (error) {
        console.warn('Error fitting map bounds:', error);
      }
    }
  }, [bidderMarkers, map]);
  return null;
};

/**
 * Create custom vehicle marker icon
 */
const createVehicleIcon = () => {
  return L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyMiIgZmlsbD0iIzQyYTVmNSIgc3Ryb2tlPSIjMTk3NWQyIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjQgOEMxOS41OCA4IDE2IDExLjU4IDE2IDE2VjMyQzE2IDM2LjQyIDE5LjU4IDQwIDI0IDQwQzI4LjQyIDQwIDMyIDM2LjQyIDMyIDMyVjE2QzMyIDExLjU4IDI4LjQyIDggMjQgOFpNMjAgMjBDMTkuNDQ3IDIwIDE5IDIwLjQ0NyAxOSAyMUMyMSAyMS41NTMgMjEuNDQ3IDIyIDIyIDIySDE5QzE4LjQ0NyAyMiAxOCAyMS41NTMgMTggMjFDMTggMjAuNDQ3IDE4LjQ0NyAyMCAxOSAyMEgyMFpNMjMgMzBDMjMgMzEuMTA1IDIzLjg5NSAzMiAyNSAzMkMyNi4xMDUgMzIgMjcgMzEuMTA1IDI3IDMwQzI3IDI4Ljg5NSAyNi4xMDUgMjggMjUgMjhDMjMuODk1IDI4IDIzIDI4Ljg5NSAyMyAzMFpNMjkgMjBDMjkuNTUzIDIwIDMwIDIwLjQ0NyAzMCAyMUMzMCAyMS41NTMgMjkuNTUzIDIyIDI5IDIySzMyIDIyQzMyLjU1MyAyMiAzMyAyMS41NTMgMzMgMjFDMzMgMjAuNDQ3IDMyLjU1MyAyMCAzMiAyMEMyOSAyMCAyOSAyMCAyOSAyMFoiIGZpbGw9IndoaXRlIi8+PC9zdmc+',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
  });
};

/**
 * Create custom bidder marker icon
 */
const createBidderIcon = (color = '#ff9800') => {
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(
      `<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C10.4772 0 6 4.47715 6 10C6 19 16 40 16 40S26 19 26 10C26 4.47715 21.5228 0 16 0Z" fill="${color}"/>
        <circle cx="16" cy="10" r="4" fill="white"/>
      </svg>`
    )}`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

const AuctionMap = ({ vehicle = null, socketRef = null }) => {
  const theme = useTheme();
  const [bidderMarkers, setBidderMarkers] = useState([]);
  const socketListenerRef = useRef(false);
  const mapRef = useRef(null);

  // Sri Lanka center coordinates
  const sriLankaCenter = [7.8731, 80.7718];
  const defaultZoom = 8;

  // Vehicle location from database - with validation
  let vehicleCoords = null;
  if (
    vehicle?.coordinates &&
    typeof vehicle.coordinates.lat === 'number' &&
    typeof vehicle.coordinates.lng === 'number' &&
    !isNaN(vehicle.coordinates.lat) &&
    !isNaN(vehicle.coordinates.lng)
  ) {
    vehicleCoords = vehicle.coordinates;
  } else if (
    vehicle?.location &&
    typeof vehicle.location.lat === 'number' &&
    typeof vehicle.location.lng === 'number' &&
    !isNaN(vehicle.location.lat) &&
    !isNaN(vehicle.location.lng)
  ) {
    vehicleCoords = vehicle.location;
  } else {
    // Default to Colombo, Sri Lanka
    vehicleCoords = {
      lat: 6.9271,
      lng: 80.7744,
    };
  }

  /**
   * Set up Socket.io listener for bidder location updates
   */
  useEffect(() => {
    if (!socketRef?.current || socketListenerRef.current) return;

    socketListenerRef.current = true;

    const handleBidPlaced = (bidData) => {
      // Validate location data structure
      if (
        !bidData ||
        !bidData.location ||
        typeof bidData.location.lat !== 'number' ||
        typeof bidData.location.lng !== 'number' ||
        isNaN(bidData.location.lat) ||
        isNaN(bidData.location.lng)
      ) {
        console.warn('Invalid location data in bid:', bidData);
        return; // Skip markers with invalid coordinates
      }

      const markerId = `bidder_${bidData.bidderId || bidData.id}`;

      setBidderMarkers((prev) => {
        // Check if this bidder already exists
        const existingIndex = prev.findIndex(
          (m) => m.id === markerId
        );

        const newMarkerData = {
          id: markerId,
          lat: parseFloat(bidData.location.lat),
          lng: parseFloat(bidData.location.lng),
          name: bidData.bidderName || 'Anonymous',
          amount: bidData.amount || 0,
        };

        if (existingIndex !== -1) {
          // Update existing marker
          return [
            ...prev.slice(0, existingIndex),
            newMarkerData,
            ...prev.slice(existingIndex + 1),
          ];
        } else {
          // Add new marker
          return [...prev, newMarkerData];
        }
      });
    };

    socketRef.current.on('bidPlaced', handleBidPlaced);

    return () => {
      if (socketRef?.current) {
        socketRef.current.off('bidPlaced', handleBidPlaced);
      }
    };
  }, [socketRef]);

  return (
    <Box
      sx={{
        width: '100%',
        height: 450,
        maxHeight: 450,
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 2,
      }}
      style={{
        width: '100%',
        height: '450px',
      }}
    >
      <MapContainer
        ref={mapRef}
        center={sriLankaCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '450px' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fix map sizing after mount */}
        <MapResizer />

        {/* Vehicle Location Marker - Only render if valid coordinates */}
        {vehicleCoords &&
          typeof vehicleCoords.lat === 'number' &&
          typeof vehicleCoords.lng === 'number' &&
          !isNaN(vehicleCoords.lat) &&
          !isNaN(vehicleCoords.lng) && (
            <Marker
              position={[vehicleCoords.lat, vehicleCoords.lng]}
              icon={createVehicleIcon()}
              zIndexOffset={1000}
            >
              <Popup>
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    🚗 {vehicle?.year} {vehicle?.brand} {vehicle?.model}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Vehicle Location
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          )}

        {/* Bidder Location Markers - Only render if coordinates are valid */}
        {bidderMarkers
          .filter(
            (bidder) =>
              bidder &&
              typeof bidder.lat === 'number' &&
              typeof bidder.lng === 'number' &&
              !isNaN(bidder.lat) &&
              !isNaN(bidder.lng) &&
              bidder.lat !== undefined &&
              bidder.lng !== undefined &&
              bidder.lat !== null &&
              bidder.lng !== null
          )
          .map((bidder) => (
            <Marker
              key={bidder.id}
              position={[bidder.lat, bidder.lng]}
              icon={createBidderIcon('#ff9800')}
            >
              <Popup>
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {bidder.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    LKR {bidder.amount?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Bid Placed
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          ))}

        {/* Map auto-fit to bounds - only if valid markers exist */}
        {bidderMarkers.some(
          (b) =>
            b && typeof b.lat === 'number' && typeof b.lng === 'number'
        ) && <MapUpdater bidderMarkers={bidderMarkers} />}
      </MapContainer>
    </Box>
  );
};

export default AuctionMap;
