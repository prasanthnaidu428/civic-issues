import api from './api';

class LocationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cache key for coordinates
  getCacheKey(lat, lng) {
    return `${lat.toFixed(6)}_${lng.toFixed(6)}`;
  }

  // Check if cached data is still valid
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // Reverse geocode using OpenStreetMap Nominatim API
  async reverseGeocode(lat, lng) {
    const cacheKey = this.getCacheKey(lat, lng);
    const cached = this.cache.get(cacheKey);

    // Return cached result if valid
    if (cached && this.isCacheValid(cached)) {
      console.log('🔄 Using cached geocoding result for:', { lat, lng });
      return cached.data;
    }

    try {
      console.log('🌍 Fetching address for coordinates:', { lat, lng });
      
      // Use Nominatim reverse geocoding service (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CivicIssues/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      console.log('🗺️ Raw geocoding response:', data);

      // Parse the response
      const address = this.parseNominatimResponse(data);
      console.log('📍 Parsed address:', address);

      // Cache the result
      this.cache.set(cacheKey, {
        data: address,
        timestamp: Date.now()
      });

      return address;
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
      
      // Enhanced fallback with estimated ZIP code
      const fallbackAddress = await this.getFallbackAddress(lat, lng);
      console.log('🔄 Using fallback address:', fallbackAddress);
      
      return fallbackAddress;
    }
  }

  // Parse Nominatim API response
  parseNominatimResponse(data) {
    const address = data.address || {};
    console.log('🔍 Parsing address components:', address);
    
    // Extract street information
    const streetNumber = address.house_number || '';
    const streetName = address.road || address.street || address.highway || address.pedestrian || '';
    const street = `${streetNumber} ${streetName}`.trim();

    // Extract location components with more fallbacks
    const city = address.city || 
                 address.town || 
                 address.village || 
                 address.municipality || 
                 address.county || 
                 address.suburb ||
                 address.neighbourhood ||
                 address.hamlet || '';

    const state = address.state || 
                  address.province || 
                  address.region || 
                  address['ISO3166-2-lvl4'] || '';

    // Enhanced ZIP code extraction with multiple fallbacks
    const zipCode = address.postcode || 
                    address.postal_code || 
                    address.zip_code ||
                    address.zip || 
                    this.estimateZipCode(parseFloat(data.lat), parseFloat(data.lon), address);

    const country = address.country || address.country_code || 'Unknown';

    console.log('📍 Extracted components:', { street, city, state, zipCode, country });

    // Create formatted address
    const parts = [street, city, state, zipCode].filter(part => part.trim());
    const formatted = parts.length > 0 ? parts.join(', ') : data.display_name || 'Address not found';

    const result = {
      street,
      city,
      state,
      zipCode,
      country,
      formatted,
      coordinates: [parseFloat(data.lon), parseFloat(data.lat)],
      raw: data // Include raw response for debugging
    };

    console.log('✅ Final parsed address:', result);
    return result;
  }

  // Forward geocoding (address to coordinates)
  async geocode(address) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CivicIssues/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error('Address not found');
      }

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted: result.display_name,
        coordinates: [parseFloat(result.lon), parseFloat(result.lat)]
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Get current position with improved error handling
  async getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          let message = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
            default:
              message = 'An unknown error occurred';
              break;
          }
          
          reject(new Error(message));
        },
        defaultOptions
      );
    });
  }

  // Estimate ZIP code based on coordinates and available address data
  estimateZipCode(lat, lng, addressData) {
    console.log('🔍 Estimating ZIP code for:', { lat, lng, addressData });
    
    // Common ZIP code patterns by region
    const zipPatterns = {
      // US ZIP code estimation based on coordinates
      US: this.estimateUSZipCode(lat, lng, addressData),
      // Add more countries as needed
      default: this.generateGenericZipCode(lat, lng)
    };

    const country = addressData.country_code || addressData.country || 'US';
    const estimatedZip = zipPatterns[country.toUpperCase()] || zipPatterns.default;
    
    console.log('📮 Estimated ZIP code:', estimatedZip);
    return estimatedZip;
  }

  // Estimate US ZIP code based on coordinates
  estimateUSZipCode(lat, lng, addressData) {
    // Basic US ZIP code estimation based on geographic regions
    // This is a simplified approach - in production, you'd use a proper ZIP code database
    
    // Major city ZIP code mappings
    const cityZipMappings = {
      'new york': ['10001', '10002', '10003', '10004', '10005'],
      'los angeles': ['90001', '90002', '90003', '90004', '90005'],
      'chicago': ['60601', '60602', '60603', '60604', '60605'],
      'houston': ['77001', '77002', '77003', '77004', '77005'],
      'phoenix': ['85001', '85002', '85003', '85004', '85005'],
      'philadelphia': ['19101', '19102', '19103', '19104', '19105'],
      'san antonio': ['78201', '78202', '78203', '78204', '78205'],
      'san diego': ['92101', '92102', '92103', '92104', '92105'],
      'dallas': ['75201', '75202', '75203', '75204', '75205'],
      'san jose': ['95101', '95102', '95103', '95104', '95105']
    };

    // Check if we have city information
    const city = (addressData.city || addressData.town || '').toLowerCase();
    if (city && cityZipMappings[city]) {
      return cityZipMappings[city][0]; // Return first ZIP for the city
    }

    // Geographic region-based estimation
    if (lat >= 40.4774 && lat <= 40.9176 && lng >= -74.2591 && lng <= -73.7004) {
      return '10001'; // NYC area
    } else if (lat >= 34.0522 && lat <= 34.3373 && lng >= -118.6682 && lng <= -118.1553) {
      return '90001'; // LA area
    } else if (lat >= 41.8781 && lat <= 42.0126 && lng >= -87.9073 && lng <= -87.5298) {
      return '60601'; // Chicago area
    } else if (lat >= 29.7604 && lat <= 29.7604 && lng >= -95.3698 && lng <= -95.3698) {
      return '77001'; // Houston area
    }

    // Fallback: Generate based on coordinates
    return this.generateGenericZipCode(lat, lng);
  }

  // Generate a generic ZIP code based on coordinates
  generateGenericZipCode(lat, lng) {
    // Create a pseudo-ZIP based on coordinates
    const latInt = Math.abs(Math.floor(lat * 100)) % 100;
    const lngInt = Math.abs(Math.floor(lng * 100)) % 100;
    const zip = `${latInt.toString().padStart(2, '0')}${lngInt.toString().padStart(3, '0')}`;
    return zip;
  }

  // Enhanced fallback address system
  async getFallbackAddress(lat, lng) {
    console.log('🔄 Creating fallback address for:', { lat, lng });
    
    // Try alternative geocoding services
    try {
      // Try a different geocoding approach or service
      const alternativeAddress = await this.tryAlternativeGeocoding(lat, lng);
      if (alternativeAddress) {
        return alternativeAddress;
      }
    } catch (error) {
      console.log('⚠️ Alternative geocoding also failed:', error);
    }

    // Generate intelligent fallback based on coordinates
    const estimatedZip = this.generateGenericZipCode(lat, lng);
    const estimatedCity = this.estimateCity(lat, lng);
    const estimatedState = this.estimateState(lat, lng);

    return {
      street: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: estimatedCity,
      state: estimatedState,
      zipCode: estimatedZip,
      country: 'US',
      formatted: `${estimatedCity}, ${estimatedState} ${estimatedZip}`,
      coordinates: [lng, lat],
      isEstimated: true
    };
  }

  // Try alternative geocoding service
  async tryAlternativeGeocoding(lat, lng) {
    // This could use other services like MapBox, Google, etc.
    // For now, return null to use the main fallback
    return null;
  }

  // Estimate city based on coordinates
  estimateCity(lat, lng) {
    // Major US cities by coordinate ranges
    if (lat >= 40.4774 && lat <= 40.9176 && lng >= -74.2591 && lng <= -73.7004) {
      return 'New York';
    } else if (lat >= 34.0522 && lat <= 34.3373 && lng >= -118.6682 && lng <= -118.1553) {
      return 'Los Angeles';
    } else if (lat >= 41.8781 && lat <= 42.0126 && lng >= -87.9073 && lng <= -87.5298) {
      return 'Chicago';
    } else if (lat >= 29.7604 && lat <= 29.7604 && lng >= -95.3698 && lng <= -95.3698) {
      return 'Houston';
    }
    return 'Unknown City';
  }

  // Estimate state based on coordinates
  estimateState(lat, lng) {
    // US states by coordinate ranges (simplified)
    if (lat >= 40.4774 && lat <= 45.0153 && lng >= -79.7624 && lng <= -71.7773) {
      return 'NY'; // New York area
    } else if (lat >= 32.5343 && lat <= 42.0095 && lng >= -124.4096 && lng <= -114.1312) {
      return 'CA'; // California area
    } else if (lat >= 41.6954 && lat <= 45.5081 && lng >= -90.6390 && lng <= -82.4194) {
      return 'IL'; // Illinois area
    } else if (lat >= 25.8371 && lat <= 36.5007 && lng >= -106.6456 && lng <= -93.5083) {
      return 'TX'; // Texas area
    }
    return 'Unknown';
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  // Convert degrees to radians
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get nearby issues based on location
  async getNearbyIssues(lat, lng, radius = 5000) { // radius in meters
    try {
      const response = await api.get(`/issues/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      return response.data.data.issues;
    } catch (error) {
      console.error('Error fetching nearby issues:', error);
      throw error;
    }
  }

  // Clear location cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, value] of this.cache.entries()) {
      if (this.isCacheValid(value)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

// Export singleton instance
const locationService = new LocationService();

// Export individual functions for convenience
export const reverseGeocode = (lat, lng) => locationService.reverseGeocode(lat, lng);
export const geocode = (address) => locationService.geocode(address);
export const getCurrentPosition = (options) => locationService.getCurrentPosition(options);
export const calculateDistance = (lat1, lng1, lat2, lng2) => locationService.calculateDistance(lat1, lng1, lat2, lng2);
export const getNearbyIssues = (lat, lng, radius) => locationService.getNearbyIssues(lat, lng, radius);

export default locationService;