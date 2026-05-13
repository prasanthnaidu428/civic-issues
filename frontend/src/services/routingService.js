/**
 * Routing Service for handling directions and navigation
 */

/**
 * Get user's current location
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

/**
 * Open Google Maps with directions from current location to destination
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @param {string} destAddress - Destination address (optional)
 */
export const openGoogleMapsDirections = (destLat, destLng, destAddress = '') => {
  const destination = destAddress || `${destLat},${destLng}`;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  window.open(url, '_blank');
};

/**
 * Open Google Maps with directions from specific origin to destination
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @param {string} destAddress - Destination address (optional)
 */
export const openGoogleMapsDirectionsFromTo = (originLat, originLng, destLat, destLng, destAddress = '') => {
  const origin = `${originLat},${originLng}`;
  const destination = destAddress || `${destLat},${destLng}`;
  const url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
  window.open(url, '_blank');
};

/**
 * Open OpenStreetMap with directions (using OpenRouteService)
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 */
export const openOSMDirections = (destLat, destLng) => {
  const url = `https://www.openstreetmap.org/directions?to=${destLat}%2C${destLng}`;
  window.open(url, '_blank');
};

/**
 * Get directions to an issue location with fallback options
 * @param {Object} issue - Issue object with location data
 * @param {boolean} useCurrentLocation - Whether to get current location first
 */
export const getDirectionsToIssue = async (issue, useCurrentLocation = true) => {
  if (!issue.location || !issue.location.coordinates) {
    throw new Error('Issue location not available');
  }

  const [destLng, destLat] = issue.location.coordinates;
  const destAddress = issue.address?.formatted || '';

  if (useCurrentLocation) {
    try {
      const currentLocation = await getCurrentLocation();
      openGoogleMapsDirectionsFromTo(
        currentLocation.lat, 
        currentLocation.lng, 
        destLat, 
        destLng, 
        destAddress
      );
    } catch (error) {
      console.warn('Could not get current location, opening directions without origin:', error);
      openGoogleMapsDirections(destLat, destLng, destAddress);
    }
  } else {
    openGoogleMapsDirections(destLat, destLng, destAddress);
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
};

/**
 * Get multiple routing options for an issue
 * @param {Object} issue - Issue object with location data
 * @returns {Array} Array of routing options
 */
export const getRoutingOptions = (issue) => {
  if (!issue.location || !issue.location.coordinates) {
    return [];
  }

  const [destLng, destLat] = issue.location.coordinates;

  return [
    {
      name: 'Google Maps',
      icon: '🗺️',
      action: () => getDirectionsToIssue(issue, true),
      description: 'Get directions using Google Maps'
    },
    {
      name: 'OpenStreetMap',
      icon: '🌍',
      action: () => openOSMDirections(destLat, destLng),
      description: 'Get directions using OpenStreetMap'
    },
    {
      name: 'Copy Coordinates',
      icon: '📋',
      action: () => {
        navigator.clipboard.writeText(`${destLat}, ${destLng}`);
        return Promise.resolve('Coordinates copied to clipboard');
      },
      description: 'Copy coordinates to clipboard'
    }
  ];
};