import axios from 'axios';
import { logger } from '../utils/logger.js';

const GOOGLE_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GOOGLE_POSTS_BASE = 'https://mybusiness.googleapis.com/v4';

export const getOAuthUrl = () => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const scope = encodeURIComponent([
    'https://www.googleapis.com/auth/business.manage',
    'openid',
    'email',
    'profile'
  ].join(' '));

  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
};

export const exchangeCodeForTokens = async (code) => {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: 'authorization_code'
  });
  return response.data;
};

export const getBusinessLocations = async (accessToken) => {
  try {
    const res = await axios.get(`${GOOGLE_API_BASE}/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return res.data.accounts || [];
  } catch (error) {
    logger.error('Failed to fetch business accounts', { error: error.message });
    throw new Error('Failed to fetch Google Business accounts');
  }
};

export const createLocalPost = async (accountId, locationId, accessToken, { summary, callToAction }) => {
  try {
    const payload = {
      languageCode: 'en',
      summary,
      topicType: 'STANDARD',
      callToAction: callToAction || undefined
    };

    const res = await axios.post(
      `${GOOGLE_POSTS_BASE}/accounts/${accountId}/locations/${locationId}/localPosts`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.data;
  } catch (error) {
    logger.error('Failed to create Google local post', { error: error.response?.data || error.message });
    throw new Error('Failed to create Google local post');
  }
};

export default {
  getOAuthUrl,
  exchangeCodeForTokens,
  getBusinessLocations,
  createLocalPost
};
