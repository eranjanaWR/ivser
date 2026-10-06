/**
 * Geocoding and Routing Utilities
 * Using free APIs: OSRM for routing, Nominatim for geocoding
 */

const axios = require('axios');

// OSRM API base URL (Open Source Routing Machine)
const OSRM_BASE_URL = 'https://router.project-osrm.org';

// Nominatim API base URL
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Calculate route between two points using OSRM
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {Promise<Object>} Route information with ETA and distance
 */
const calculateRoute = async (origin, destination) => {
  try {
    const response = await axios.get(
      `${OSRM_BASE_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`,
      {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true,
        },
        timeout: 10000,
      }
    );

    if (response.data.code !== 'Ok' || !response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = response.data.routes[0];

    return {
      distance: {
        meters: route.distance,
        km: (route.distance / 1000).toFixed(1),
        text: formatDistance(route.distance),
      },
      duration: {
        seconds: route.duration,
        minutes: Math.round(route.duration / 60),
        text: formatDuration(route.duration),
      },
      eta: calculateETA(route.duration),
      geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    };
  } catch (error) {
    console.error('Route calculation error:', error.message);
    return null;
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Address details
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: {
        format: 'json',
        lat,
        lon: lng,
        addressdetails: 1,
      },
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'SmartAutoHub/1.0',
      },
      timeout: 10000,
    });

    const data = response.data;

    return {
      displayName: data.display_name,
      address: {
        road: data.address?.road || '',
        suburb: data.address?.suburb || '',
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        country: data.address?.country || '',
        postcode: data.address?.postcode || '',
      },
      shortAddress: formatShortAddress(data.address),
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
};

/**
 * Calculate Haversine distance between two points
 * @param {Object} point1 - { lat, lng }
 * @param {Object} point2 - { lat, lng }
 * @returns {number} Distance in kilometers
 */
const calculateHaversineDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate ETA from duration in seconds
 * @param {number} durationSeconds - Duration in seconds
 * @returns {string} Formatted ETA (e.g., "2:30 PM")
 */
const calculateETA = (durationSeconds) => {
  const arrivalTime = new Date(Date.now() + durationSeconds * 1000);
  return arrivalTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Helper functions
const toRad = (deg) => deg * (Math.PI / 180);

const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

const formatShortAddress = (address) => {
  if (!address) return '';

  const parts = [];
  if (address.road) parts.push(address.road);
  if (address.suburb) parts.push(address.suburb);
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }

  return parts.slice(0, 2).join(', ') || 'Unknown location';
};

module.exports = {
  calculateRoute,
  reverseGeocode,
  calculateHaversineDistance,
  calculateETA,
  formatDistance,
  formatDuration,
};
