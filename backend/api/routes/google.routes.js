import express from 'express';
import * as googlePlacesService from '../services/googlePlacesService.js';
import * as googleBusinessService from '../services/googleBusinessService.js';
import * as googleAnalyticsService from '../services/googleAnalyticsService.js';
import { logger } from '../utils/logger.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/business/oauth-url', authenticate, async (req, res) => {
  try {
    const url = googleBusinessService.getOAuthUrl();
    res.json({ success: true, data: { url } });
  } catch (error) {
    logger.error('Failed to generate Google OAuth URL', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

router.post('/business/exchange-code', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: { message: 'code is required' } });
    }
    const tokens = await googleBusinessService.exchangeCodeForTokens(code);
    res.json({ success: true, data: tokens });
  } catch (error) {
    logger.error('Failed to exchange Google OAuth code', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

router.get('/business/accounts', authenticate, async (req, res) => {
  try {
    const accessToken = req.headers['x-google-access-token'];
    if (!accessToken) {
      return res.status(400).json({ success: false, error: { message: 'x-google-access-token header is required' } });
    }
    const accounts = await googleBusinessService.getBusinessLocations(accessToken);
    res.json({ success: true, data: accounts });
  } catch (error) {
    logger.error('Failed to fetch Google Business accounts', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

router.post('/business/local-post', authenticate, async (req, res) => {
  try {
    const accessToken = req.headers['x-google-access-token'];
    const { accountId, locationId, summary, callToAction } = req.body;
    if (!accessToken || !accountId || !locationId || !summary) {
      return res.status(400).json({ success: false, error: { message: 'access token, accountId, locationId, and summary are required' } });
    }
    const post = await googleBusinessService.createLocalPost(accountId, locationId, accessToken, { summary, callToAction });
    res.json({ success: true, data: post });
  } catch (error) {
    logger.error('Failed to create Google local post', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

router.post('/analytics/ga4-report', authenticate, async (req, res) => {
  try {
    const accessToken = req.headers['x-google-access-token'];
    const { propertyId, startDate, endDate } = req.body;
    if (!accessToken || !propertyId) {
      return res.status(400).json({ success: false, error: { message: 'x-google-access-token and propertyId are required' } });
    }

    const report = await googleAnalyticsService.runGa4Report({
      propertyId,
      accessToken,
      startDate,
      endDate
    });
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Failed to fetch GA4 report', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * GET /api/v1/google/places/search
 * Search for places (restaurants) near a location
 * Query params: query, location (lat,lng), radius
 */
router.get('/places/search', authenticate, async (req, res) => {
  try {
    const { query, location, radius } = req.query;

    if (!query || !location) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query and location are required' }
      });
    }

    const results = await googlePlacesService.searchPlaces({
      query,
      location,
      radius: radius ? parseInt(radius) : 5000
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Places search error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * GET /api/v1/google/places/:placeId
 * Get detailed information about a specific place
 */
router.get('/places/:placeId', authenticate, async (req, res) => {
  try {
    const { placeId } = req.params;

    const details = await googlePlacesService.getPlaceDetails(placeId);

    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    logger.error('Place details error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * GET /api/v1/google/places/:placeId/reviews
 * Get reviews for a specific place
 */
router.get('/places/:placeId/reviews', authenticate, async (req, res) => {
  try {
    const { placeId } = req.params;

    const reviews = await googlePlacesService.getPlaceReviews(placeId);

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    logger.error('Place reviews error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * GET /api/v1/google/competitors
 * Find competitor restaurants
 * Query params: city, cuisineType, limit
 */
router.get('/competitors', authenticate, async (req, res) => {
  try {
    const { city, cuisineType, limit } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        error: { message: 'City is required' }
      });
    }

    const competitors = await googlePlacesService.findCompetitors({
      city,
      cuisineType,
      limit: limit ? parseInt(limit) : 10
    });

    res.json({
      success: true,
      data: competitors
    });
  } catch (error) {
    logger.error('Competitors search error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * GET /api/v1/google/trends/keyword
 * Get trend data for a keyword
 * Query params: keyword, geo, startTime
 */
router.get('/trends/keyword', authenticate, async (req, res) => {
  try {
    const { keyword, geo = 'IN' } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Keyword is required' }
      });
    }

    const { getKeywordTrend } = await import('../services/trendService.js');
    const trendData = await getKeywordTrend(keyword, { geo });

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    logger.error('Keyword trend error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * GET /api/v1/google/trends/related
 * Get related queries for a keyword
 * Query params: keyword, geo
 */
router.get('/trends/related', authenticate, async (req, res) => {
  try {
    const { keyword, geo = 'IN' } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Keyword is required' }
      });
    }

    const { getRelatedQueries } = await import('../services/trendService.js');
    const relatedData = await getRelatedQueries(keyword, geo);

    res.json({
      success: true,
      data: relatedData
    });
  } catch (error) {
    logger.error('Related queries error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * GET /api/v1/google/trends/realtime
 * Get real-time trending stories
 * Query params: geo, category
 */
router.get('/trends/realtime', authenticate, async (req, res) => {
  try {
    const { geo = 'IN', category = 'all' } = req.query;

    const { getRealTimeTrends } = await import('../services/trendService.js');
    const trends = await getRealTimeTrends(geo, category);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Real-time trends error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * POST /api/v1/google/trends/compare
 * Compare multiple keywords
 * Body: { keywords: ['keyword1', 'keyword2'], geo: 'IN' }
 */
router.post('/trends/compare', authenticate, async (req, res) => {
  try {
    const { keywords, geo = 'IN' } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Keywords array is required' }
      });
    }

    const { compareKeywords } = await import('../services/trendService.js');
    const comparison = await compareKeywords(keywords, geo);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    logger.error('Keywords comparison error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

export default router;
