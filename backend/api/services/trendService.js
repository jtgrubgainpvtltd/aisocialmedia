import Parser from 'rss-parser';
import googleTrends from 'google-trends-api';
import { logger } from '../utils/logger.js';

const parser = new Parser({
  customFields: {
    item: ['ht:approx_traffic', 'ht:news_item']
  }
});

/**
 * Get daily trending topics from Google Trends RSS
 * @param {string} geo - Geographic location code (default: 'IN' for India)
 * @returns {Promise<Array>} - Array of trending topics
 */
export const getDailyTrends = async (geo = 'IN') => {
  try {
    const feed = await parser.parseURL(`https://trends.google.com/trending/rss?geo=${geo}`);
    return feed.items || [];
  } catch (err) {
    logger.error('Error fetching google trends RSS:', err);
    throw new Error('Failed to fetch google trends RSS');
  }
};

/**
 * Get interest over time for a keyword
 * @param {string} keyword - Search keyword
 * @param {Object} options - Additional options
 * @param {string} options.geo - Geographic location (default: 'IN')
 * @param {string} options.startTime - Start date (default: 30 days ago)
 * @returns {Promise<Array>} - Interest over time data
 */
export const getKeywordTrend = async (keyword, options = {}) => {
  try {
    const {
      geo = 'IN',
      startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    } = options;

    const result = await googleTrends.interestOverTime({
      keyword,
      geo,
      startTime
    });

    const data = JSON.parse(result);
    return data.default?.timelineData || [];
  } catch (error) {
    logger.error('Error fetching keyword trend:', error.message);
    throw new Error('Failed to fetch keyword trend');
  }
};

/**
 * Get related queries for a keyword
 * @param {string} keyword - Search keyword
 * @param {string} geo - Geographic location (default: 'IN')
 * @returns {Promise<Object>} - Related queries (top and rising)
 */
export const getRelatedQueries = async (keyword, geo = 'IN') => {
  try {
    const result = await googleTrends.relatedQueries({
      keyword,
      geo
    });

    const data = JSON.parse(result);
    return {
      top: data.default?.rankedList?.[0]?.rankedKeyword || [],
      rising: data.default?.rankedList?.[1]?.rankedKeyword || []
    };
  } catch (error) {
    logger.error('Error fetching related queries:', error.message);
    throw new Error('Failed to fetch related queries');
  }
};

/**
 * Get related topics for a keyword
 * @param {string} keyword - Search keyword
 * @param {string} geo - Geographic location (default: 'IN')
 * @returns {Promise<Object>} - Related topics (top and rising)
 */
export const getRelatedTopics = async (keyword, geo = 'IN') => {
  try {
    const result = await googleTrends.relatedTopics({
      keyword,
      geo
    });

    const data = JSON.parse(result);
    return {
      top: data.default?.rankedList?.[0]?.rankedKeyword || [],
      rising: data.default?.rankedList?.[1]?.rankedKeyword || []
    };
  } catch (error) {
    logger.error('Error fetching related topics:', error.message);
    throw new Error('Failed to fetch related topics');
  }
};

/**
 * Get interest by region for a keyword
 * @param {string} keyword - Search keyword
 * @param {string} geo - Geographic location (default: 'IN')
 * @returns {Promise<Array>} - Interest by region data
 */
export const getInterestByRegion = async (keyword, geo = 'IN') => {
  try {
    const result = await googleTrends.interestByRegion({
      keyword,
      geo,
      resolution: 'CITY' // or 'REGION', 'COUNTRY'
    });

    const data = JSON.parse(result);
    return data.default?.geoMapData || [];
  } catch (error) {
    logger.error('Error fetching interest by region:', error.message);
    throw new Error('Failed to fetch interest by region');
  }
};

/**
 * Get real-time trending stories
 * @param {string} geo - Geographic location code (default: 'IN')
 * @param {string} category - Category filter (optional)
 * @returns {Promise<Array>} - Trending stories
 */
export const getRealTimeTrends = async (geo = 'IN', category = 'all') => {
  try {
    const result = await googleTrends.realTimeTrends({
      geo,
      category
    });

    const data = JSON.parse(result);
    return data.storySummaries?.trendingStories || [];
  } catch (error) {
    logger.error('Error fetching real-time trends:', error.message);
    throw new Error('Failed to fetch real-time trends');
  }
};

/**
 * Compare multiple keywords
 * @param {Array<string>} keywords - Array of keywords to compare
 * @param {string} geo - Geographic location (default: 'IN')
 * @returns {Promise<Object>} - Comparison data
 */
export const compareKeywords = async (keywords, geo = 'IN') => {
  try {
    if (!keywords || keywords.length === 0) {
      throw new Error('At least one keyword is required');
    }

    const result = await googleTrends.interestOverTime({
      keyword: keywords,
      geo,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days
    });

    const data = JSON.parse(result);
    return data.default?.timelineData || [];
  } catch (error) {
    logger.error('Error comparing keywords:', error.message);
    throw new Error('Failed to compare keywords');
  }
};

export default {
  getDailyTrends,
  getKeywordTrend,
  getRelatedQueries,
  getRelatedTopics,
  getInterestByRegion,
  getRealTimeTrends,
  compareKeywords
};
