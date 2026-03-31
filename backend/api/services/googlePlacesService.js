import axios from 'axios';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_SERVICES_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Search for places (restaurants) near a location
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (e.g., "restaurants", "italian food")
 * @param {string} params.location - Location as "lat,lng"
 * @param {number} params.radius - Search radius in meters (default: 5000)
 * @returns {Promise<Array>} - Array of place results
 */
export const searchPlaces = async ({ query, location, radius = 5000 }) => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/textsearch/json`, {
      params: {
        query,
        location,
        radius,
        type: 'restaurant',
        key: GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      logger.error('Google Places API error:', response.data.status);
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.results || [];
  } catch (error) {
    logger.error('Error searching places:', error.message);
    throw new Error('Failed to search places');
  }
};

/**
 * Get detailed information about a specific place
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Place details
 */
export const getPlaceDetails = async (placeId) => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,rating,formatted_address,formatted_phone_number,opening_hours,website,reviews,photos,price_level,types,user_ratings_total',
        key: GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      logger.error('Google Places Details API error:', response.data.status);
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.result;
  } catch (error) {
    logger.error('Error getting place details:', error.message);
    throw new Error('Failed to get place details');
  }
};

/**
 * Get reviews for a place
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Array>} - Array of reviews
 */
export const getPlaceReviews = async (placeId) => {
  try {
    const details = await getPlaceDetails(placeId);
    return details.reviews || [];
  } catch (error) {
    logger.error('Error getting place reviews:', error.message);
    throw new Error('Failed to get place reviews');
  }
};

/**
 * Find competitor restaurants in the same area
 * @param {Object} params - Search parameters
 * @param {string} params.city - City name
 * @param {string} params.cuisineType - Cuisine type
 * @param {number} params.limit - Max results (default: 10)
 * @returns {Promise<Array>} - Array of competitor restaurants
 */
export const findCompetitors = async ({ city, cuisineType, limit = 10 }) => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    // First, geocode the city to get coordinates
    const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: city,
        key: GOOGLE_PLACES_API_KEY
      }
    });

    if (geocodeResponse.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${geocodeResponse.data.status}`);
    }

    const location = geocodeResponse.data.results[0].geometry.location;
    const locationStr = `${location.lat},${location.lng}`;

    // Search for restaurants with cuisine type
    const query = cuisineType ? `${cuisineType} restaurants in ${city}` : `restaurants in ${city}`;
    
    const placesResponse = await axios.get(`${GOOGLE_PLACES_BASE_URL}/textsearch/json`, {
      params: {
        query,
        location: locationStr,
        radius: 10000, // 10km radius
        type: 'restaurant',
        key: GOOGLE_PLACES_API_KEY
      }
    });

    if (placesResponse.data.status !== 'OK' && placesResponse.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places search failed: ${placesResponse.data.status}`);
    }

    // Return top results
    const results = placesResponse.data.results || [];
    return results.slice(0, limit).map(place => ({
      place_id: place.place_id,
      name: place.name,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      address: place.formatted_address,
      price_level: place.price_level,
      types: place.types
    }));
  } catch (error) {
    logger.error('Error finding competitors:', error.message);
    throw new Error('Failed to find competitors');
  }
};

/**
 * Get photo URL from Google Places photo reference
 * @param {string} photoReference - Photo reference from Places API
 * @param {number} maxWidth - Maximum width (default: 400)
 * @returns {string} - Photo URL
 */
export const getPhotoUrl = (photoReference, maxWidth = 400) => {
  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }
  
  return `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
};

export default {
  searchPlaces,
  getPlaceDetails,
  getPlaceReviews,
  findCompetitors,
  getPhotoUrl
};
