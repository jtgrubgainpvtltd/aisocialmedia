import axios from 'axios';
import { logger } from '../utils/logger.js';

const GA4_BASE = 'https://analyticsdata.googleapis.com/v1beta';

export const runGa4Report = async ({ propertyId, accessToken, startDate = '30daysAgo', endDate = 'today' }) => {
  try {
    const body = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }]
    };

    const res = await axios.post(
      `${GA4_BASE}/properties/${propertyId}:runReport`,
      body,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.data;
  } catch (error) {
    logger.error('Failed to fetch GA4 report', { error: error.response?.data || error.message });
    throw new Error('Failed to fetch GA4 report');
  }
};

export default {
  runGa4Report
};
