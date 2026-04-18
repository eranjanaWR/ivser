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
 * Create custom vehicle marker icon (Car Icon)
 */
const createVehicleIcon = () => {
  return L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyMiIgZmlsbD0iIzQyYTVmNSIgc3Ryb2tlPSIjMTk3NWQyIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMzQgMjhDMzQuNTUzIDI4IDM1IDI3LjU1MyAzNSAyN1YyM0MzNSAyMi40NDcgMzQuNTUzIDIyIDM0IDIySDE0QzEzLjQ0NyAyMiAxMyAyMi40NDcgMTMgMjNWMjdDMTMgMjcuNTUzIDEzLjQ0NyAyOCAxNCAyOEgzNFoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTE2IDE4QzE2IDE2Ljg5NSAxNi44OTUgMTYgMTggMTZIMzBDMzEuMTA1IDE2IDMyIDE2Ljg5NSAzMiAxOFYyMkgxNlYxOFoiIGZpbGw9IndoaXRlIi8+PGNpcmNsZSBjeD0iMTgiIGN5PSIzMCIgcj0iMyIgZmlsbD0iIzMzMyIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjMiIGZpbGw9IiMzMzMiLz48L3N2Zz4=',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
  });
};

/**
 * Create custom bidder marker icon (User Icon)
 */
const createBidderIcon = (color = '#ff9800') => {
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(
      `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="17" fill="white" stroke="${color}" stroke-width="2"/>
        <path d="M18 17C20.2091 17 22 15.2091 22 13C22 10.7909 20.2091 9 18 9C15.7909 9 14 10.7909 14 13C14 15.2091 15.7909 17 18 17Z" fill="${color}"/>
        <path d="M18 19C14.134 19 11 22.134 11 26V27H25V26C25 22.134 21.866 19 18 19Z" fill="${color}"/>
      </svg>`
    )}`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const AuctionMap = ({ vehicle = null, socketRef = null, initialPartners = [] }) => {
  const theme = useTheme();
  const [bidderMarkers, setBidderMarkers] = useState([]);
  const socketListenerRef = useRef(false);
  const mapRef = useRef(null);

  // Sri Lanka center coordinates
  const sriLankaCenter = [7.8731, 80.7718];
  const defaultZoom = 14; // ✅ VILLAGE LEVEL: Increased zoom for precise neighborhood view

  // ✅ FIXED: Correctly extract vehicle coordinates from vehicle.location.coordinates
  let vehicleCoords = null;
  const rawCoords = vehicle?.location?.coordinates || vehicle?.coordinates || vehicle?.location;
  
  if (
    rawCoords &&
    (typeof rawCoords.lat === 'number' || typeof rawCoords.latitude === 'number' || rawCoords.lat || rawCoords.latitude) &&
    (typeof rawCoords.lng === 'number' || typeof rawCoords.longitude === 'number' || rawCoords.lng || rawCoords.longitude)
  ) {
    vehicleCoords = {
      lat: parseFloat(rawCoords.lat || rawCoords.latitude),
      lng: parseFloat(rawCoords.lng || rawCoords.longitude),
    };
    console.log(`📍 [MAP] Vehicle coordinates detected: ${vehicleCoords.lat}, ${vehicleCoords.lng}`);
  } else {
    // Default fallback to center of map if no coordinates found
    vehicleCoords = { lat: 6.9271, lng: 79.8612 }; 
  }

  // ✅ NEW: Initialize map with existing partners from database
  useEffect(() => {
    if (initialPartners && initialPartners.length > 0) {
      console.log(`🗺️ [MAP] Initializing with ${initialPartners.length} partners from database`);
      const markers = initialPartners
        .filter(p => p.location && p.location.latitude && p.location.longitude)
        .map(p => ({
          id: `partner_${p.id}`,
          lat: parseFloat(p.location.latitude),
          lng: parseFloat(p.location.longitude),
          name: p.name,
          city: p.location.city,
          district: p.location.district,
          type: 'partner'
        }));
      setBidderMarkers(markers);
    }
  }, [initialPartners]);

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
          city: bidData.location.city,
          district: bidData.location.district,
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

    const handleNewPartner = (data) => {
      console.log('🌍 New partner joined:', data);
      if (!data.location?.lat || !data.location?.lng) return;

      const markerId = `partner_${data.id}`;
      setBidderMarkers((prev) => {
        const exists = prev.some(m => m.id === markerId);
        if (exists) return prev;
        
        return [...prev, {
          id: markerId,
          lat: parseFloat(data.location.lat),
          lng: parseFloat(data.location.lng),
          name: data.name,
          city: data.location.city,
          district: data.location.district,
          type: 'partner'
        }];
      });
    };

    socketRef.current.on('bidPlaced', handleBidPlaced);
    socketRef.current.on('newPartnerJoined', handleNewPartner);

    return () => {
      if (socketRef?.current) {
        socketRef.current.off('bidPlaced', handleBidPlaced);
        socketRef.current.off('newPartnerJoined', handleNewPartner);
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
        center={[vehicleCoords.lat, vehicleCoords.lng]} // ✅ AUTO-CENTER: Initial center set to vehicle
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

        {/* ✅ FIXED: Vehicle Location Marker with Popup */}
        {vehicleCoords && (
          <Marker
            position={[vehicleCoords.lat, vehicleCoords.lng]}
            icon={createVehicleIcon()}
            zIndexOffset={1000}
          >
            <Popup>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Vehicle Location: {vehicle?.brand} {vehicle?.model}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                  📍 {vehicle?.location?.city}, {vehicle?.location?.district}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Year: {vehicle?.year} | Starting Price: {vehicle?.startingPrice}
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
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
                    📍 {bidder.city}, {bidder.district}
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
