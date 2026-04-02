import * as trendService from '../services/trendService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller: Handles GET requests for City Trends
 * Route Example: GET /api/trends/:cityName
 */
export const getCityTrends = async (req, res, next) => {
  try {
    // 1. Get city from URL (Fallback to 'Mumbai')
    const cityName = req.params.cityName || 'Mumbai';
    
    // 2. Fetch the aggregated LIVE data from the Service layer
    const feedData = await trendService.getAggregatedCityFeed(cityName);

    // 3. Send successful JSON response to Frontend
    return res.status(200).json({
      success: true,
      message: `Successfully fetched ${feedData.length} smart insights for ${cityName}`,
      data: feedData
    });
    
  } catch (error) {
    // 4. Log and handle errors gracefully so the server doesn't crash
    logger.error('Error in trendController:', { 
      error: error.message, 
      stack: error.stack 
    });
    
    return res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to fetch city trends. Our AI engine is currently experiencing delays.' 
      }
    });
  }
};