import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Indian States and Cities data
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Puducherry', 'Chandigarh', 'Jammu and Kashmir', 'Ladakh'
];

const CITIES_BY_STATE = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Kolhapur', 'Solapur'],
  'Delhi': ['New Delhi', 'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad', 'Greater Noida'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belgaum', 'Dharwad', 'Tumkur'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Noida'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Chandigarh'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kannur', 'Kollam'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Bihar Sharif'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Solan', 'Kullu'],
  'Goa': ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Chandigarh': ['Chandigarh'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
  'Ladakh': ['Leh', 'Kargil'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
  'Manipur': ['Imphal'],
  'Meghalaya': ['Shillong', 'Tura'],
  'Mizoram': ['Aizawl', 'Lunglei'],
  'Nagaland': ['Kohima', 'Dimapur'],
  'Sikkim': ['Gangtok', 'Namchi'],
  'Tripura': ['Agartala', 'Udaipur']
};

/**
 * GET /api/v1/locations/states
 * Get all Indian states
 */
router.get('/states', (req, res) => {
  try {
    res.json({
      success: true,
      data: STATES.sort()
    });
  } catch (error) {
    logger.error('Error fetching states:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch states' }
    });
  }
});

/**
 * GET /api/v1/locations/cities/:state
 * Get cities for a specific state
 */
router.get('/cities/:state', (req, res) => {
  try {
    const { state } = req.params;
    const cities = CITIES_BY_STATE[state] || [];

    if (cities.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `No cities found for state: ${state}` }
      });
    }

    res.json({
      success: true,
      data: {
        state,
        cities: cities.sort()
      }
    });
  } catch (error) {
    logger.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch cities' }
    });
  }
});

/**
 * GET /api/v1/locations/cities
 * Get all cities (flat list)
 */
router.get('/cities', (req, res) => {
  try {
    const allCities = Object.values(CITIES_BY_STATE).flat().sort();

    res.json({
      success: true,
      data: allCities
    });
  } catch (error) {
    logger.error('Error fetching all cities:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch cities' }
    });
  }
});

/**
 * GET /api/v1/locations/search?q=query
 * Search cities by name
 */
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' }
      });
    }

    const allCities = Object.values(CITIES_BY_STATE).flat();
    const results = allCities.filter(city =>
      city.toLowerCase().includes(q.toLowerCase())
    );

    res.json({
      success: true,
      data: results.sort()
    });
  } catch (error) {
    logger.error('Error searching cities:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to search cities' }
    });
  }
});

export default router;
