/**
 * Geocoding and Routing utilities using free APIs
 * - Nominatim for geocoding (OpenStreetMap)
 * - OSRM for routing and ETA calculation
 */

// Nominatim API base URL
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// OSRM API base URL (Open Source Routing Machine)
const OSRM_BASE_URL = 'https://router.project-osrm.org';

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Address details
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'SmartAutoHub/1.0',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
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
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Forward geocode address to get coordinates
 * @param {string} query - Address or place name
 * @returns {Promise<Array>} List of matching locations
 */
export const forwardGeocode = async (query) => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'SmartAutoHub/1.0',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type,
    }));
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return [];
  }
};

/**
 * Calculate route between two points using OSRM
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {Promise<Object>} Route information with distance, duration, and geometry
 */
export const calculateRoute = async (origin, destination) => {
  try {
    const response = await fetch(
      `${OSRM_BASE_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`
    );
    
    if (!response.ok) {
      throw new Error('Routing failed');
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    
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
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      steps: route.legs[0]?.steps.map((step) => ({
        instruction: step.maneuver.instruction,
        distance: formatDistance(step.distance),
        duration: formatDuration(step.duration),
        name: step.name || 'Unknown road',
      })) || [],
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
};

/**
 * Calculate ETA from current time
 * @param {number} durationSeconds - Duration in seconds
 * @returns {string} Formatted ETA (e.g., "2:30 PM")
 */
export const calculateETA = (durationSeconds) => {
  const arrivalTime = new Date(Date.now() + durationSeconds * 1000);
  return arrivalTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} point1 - { lat, lng }
 * @param {Object} point2 - { lat, lng }
 * @returns {number} Distance in kilometers
 */
export const calculateHaversineDistance = (point1, point2) => {
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

/**
 * Watch user's position and call callback on updates
 * @param {Function} onUpdate - Callback with { lat, lng, accuracy }
 * @param {Function} onError - Error callback
 * @returns {number} Watch ID for clearing
 */
export const watchPosition = (onUpdate, onError) => {
  if (!navigator.geolocation) {
    onError && onError('Geolocation is not supported');
    return null;
  }
  
  return navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      onError && onError(error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 5000,
    }
  );
};

/**
 * Clear position watch
 * @param {number} watchId - Watch ID from watchPosition
 */
export const clearPositionWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

export default {
  reverseGeocode,
  forwardGeocode,
  calculateRoute,
  calculateETA,
  calculateHaversineDistance,
  watchPosition,
  clearPositionWatch,
};
