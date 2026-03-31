import axios from 'axios';
import axiosRetry from 'axios-retry';
import logger from '../utils/logger.js';
import prisma from '../../prisma/client.js';
import { decrypt } from '../utils/encryption.js';

const META_API_BASE = 'https://graph.facebook.com/v21.0';

// Create a dedicated axios instance for Meta Graph API calls
const metaAxios = axios.create();

// Apply exponential backoff retry: retries on 429, 500, 503 with 1.5s → 3s → 6s delays
axiosRetry(metaAxios, {
  retries: 3,
  retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount, 1500),
  retryCondition: (error) => {
    const status = error?.response?.status;
    return [429, 500, 503].includes(status) || axiosRetry.isNetworkError(error);
  },
  onRetry: (retryCount, error) => {
    logger.warn(`Meta API call failed, retrying... (attempt ${retryCount}/3)`, {
      status: error?.response?.status,
      message: error.message
    });
  }
});


const normalizeMetaError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

/**
 * Test Meta User Token validity
 * @returns {Promise<Object>} Token info and permissions
 */
export const testUserToken = async () => {
  try {
    const userToken = process.env.META_USER_TOKEN;

    if (!userToken) {
      throw new Error('META_USER_TOKEN not found in environment variables');
    }

    logger.info('Testing Meta User Token');

    // Debug the token (inspect endpoint)
    const response = await metaAxios.get(`${META_API_BASE}/debug_token`, {
      params: {
        input_token: userToken,
        access_token: process.env.META_APP_TOKEN
      }
    });

    const tokenData = response.data.data;

    logger.info('Meta User Token validated successfully', {
      appId: tokenData.app_id,
      userId: tokenData.user_id,
      isValid: tokenData.is_valid,
      expiresAt: tokenData.expires_at
    });

    return {
      success: true,
      isValid: tokenData.is_valid,
      appId: tokenData.app_id,
      userId: tokenData.user_id,
      scopes: tokenData.scopes || [],
      expiresAt: tokenData.expires_at,
      issuedAt: tokenData.issued_at
    };

  } catch (error) {
    logger.error('Error testing Meta User Token', {
      error: error.response?.data || error.message
    });

    throw new Error(`Meta User Token Test Failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Test Meta App Token validity
 * @returns {Promise<Object>} App token info
 */
export const testAppToken = async () => {
  try {
    const appToken = process.env.META_APP_TOKEN;

    if (!appToken) {
      throw new Error('META_APP_TOKEN not found in environment variables');
    }

    logger.info('Testing Meta App Token');

    // Debug the app token
    const response = await metaAxios.get(`${META_API_BASE}/debug_token`, {
      params: {
        input_token: appToken,
        access_token: appToken // App token can debug itself
      }
    });

    const tokenData = response.data.data;

    logger.info('Meta App Token validated successfully', {
      appId: tokenData.app_id,
      isValid: tokenData.is_valid,
      type: tokenData.type
    });

    return {
      success: true,
      isValid: tokenData.is_valid,
      appId: tokenData.app_id,
      type: tokenData.type
    };

  } catch (error) {
    logger.error('Error testing Meta App Token', {
      error: error.response?.data || error.message
    });

    throw new Error(`Meta App Token Test Failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Get user's Facebook Pages
 * @returns {Promise<Object>} List of pages the user manages
 */
export const getUserPages = async (userAccessToken = process.env.META_USER_TOKEN) => {
  try {
    if (!userAccessToken) {
      throw new Error('Meta user access token is required');
    }

    logger.info('Fetching user Facebook Pages');

    const response = await metaAxios.get(`${META_API_BASE}/me/accounts`, {
      params: {
        access_token: userAccessToken,
        fields: 'id,name,access_token,category,tasks,instagram_business_account'
      }
    });

    const pages = response.data.data || [];

    logger.info('Facebook Pages fetched successfully', {
      pageCount: pages.length
    });

    return {
      success: true,
      pages: pages.map(page => ({
        id: page.id,
        name: page.name,
        category: page.category,
        hasPageToken: !!page.access_token,
        tasks: page.tasks || [],
        hasInstagram: !!page.instagram_business_account,
        instagramAccountId: page.instagram_business_account?.id,
        pageAccessToken: page.access_token || null
      })),
      pageTokens: pages.map(page => ({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token
      }))
    };

  } catch (error) {
    logger.error('Error fetching Facebook Pages', {
      error: error.response?.data || error.message
    });

    throw new Error(`Failed to fetch Facebook Pages: ${normalizeMetaError(error, 'Unknown Meta error')}`);
  }
};

/**
 * Get Instagram Business Accounts connected to Facebook Pages
 * @returns {Promise<Object>} List of Instagram accounts
 */
export const getInstagramAccounts = async (userAccessToken = process.env.META_USER_TOKEN) => {
  try {
    if (!userAccessToken) {
      throw new Error('Meta user access token is required');
    }

    logger.info('Fetching Instagram Business Accounts');

    // First get pages
    const pagesResponse = await metaAxios.get(`${META_API_BASE}/me/accounts`, {
      params: {
        access_token: userAccessToken,
        fields: 'id,name,instagram_business_account{id,username,profile_picture_url,followers_count,follows_count,media_count}'
      }
    });

    const pages = pagesResponse.data.data || [];
    const instagramAccounts = pages
      .filter(page => page.instagram_business_account)
      .map(page => ({
        pageId: page.id,
        pageName: page.name,
        instagram: page.instagram_business_account
      }));

    logger.info('Instagram Business Accounts fetched successfully', {
      accountCount: instagramAccounts.length
    });

    return {
      success: true,
      accounts: instagramAccounts
    };

  } catch (error) {
    logger.error('Error fetching Instagram accounts', {
      error: error.response?.data || error.message
    });

    throw new Error(`Failed to fetch Instagram accounts: ${normalizeMetaError(error, 'Unknown Meta error')}`);
  }
};

export const getPageInfoFromPageToken = async (pageAccessToken) => {
  try {
    if (!pageAccessToken) {
      throw new Error('Page access token is required');
    }

    const response = await metaAxios.get(`${META_API_BASE}/me`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,name,instagram_business_account{id,username}'
      }
    });

    return {
      success: true,
      pageId: response.data?.id,
      pageName: response.data?.name,
      instagramAccountId: response.data?.instagram_business_account?.id || null,
      instagramUsername: response.data?.instagram_business_account?.username || null
    };
  } catch (error) {
    logger.error('Error getting page info from token', {
      error: error.response?.data || error.message
    });
    throw new Error(`Failed to get page info: ${normalizeMetaError(error, 'Unknown Meta error')}`);
  }
};

/**
 * Test post to Facebook Page
 * @param {string} pageId - Facebook Page ID
 * @param {string} pageAccessToken - Page-specific access token
 * @param {string} message - Post message
 * @returns {Promise<Object>} Posted content info
 */
export const testFacebookPost = async (pageId, pageAccessToken, message) => {
  try {
    logger.info('Testing Facebook Page post', { pageId });

    const response = await metaAxios.post(
      `${META_API_BASE}/${pageId}/feed`,
      {
        message,
        access_token: pageAccessToken
      }
    );

    const postId = response.data.id;

    logger.info('Facebook post created successfully', { postId });

    return {
      success: true,
      postId,
      message: 'Post created successfully'
    };

  } catch (error) {
    logger.error('Error posting to Facebook', {
      error: error.response?.data || error.message
    });

    throw new Error(`Failed to post to Facebook: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Test post to Instagram
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} imageUrl - URL of the image to post
 * @param {string} caption - Post caption
 * @param {string} pageAccessToken - Page access token
 * @returns {Promise<Object>} Posted content info
 */
export const testInstagramPost = async (instagramAccountId, imageUrl, caption, pageAccessToken) => {
  try {
    logger.info('Testing Instagram post', { instagramAccountId });

    // Step 1: Create media container
    const containerResponse = await metaAxios.post(
      `${META_API_BASE}/${instagramAccountId}/media`,
      {
        image_url: imageUrl,
        caption,
        access_token: pageAccessToken
      }
    );

    const containerId = containerResponse.data.id;

    logger.info('Instagram media container created', { containerId });

    // Step 2: Publish the container
    const publishResponse = await metaAxios.post(
      `${META_API_BASE}/${instagramAccountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: pageAccessToken
      }
    );

    const postId = publishResponse.data.id;

    logger.info('Instagram post published successfully', { postId });

    return {
      success: true,
      containerId,
      postId,
      message: 'Instagram post created successfully'
    };

  } catch (error) {
    logger.error('Error posting to Instagram', {
      error: error.response?.data || error.message
    });

    throw new Error(`Failed to post to Instagram: ${normalizeMetaError(error, 'Unknown Meta error')}`);
  }
};

export const publishToPlatform = async ({
  platform,
  caption,
  imageUrl,
  pageAccessToken,
  pageId: explicitPageId,
  instagramAccountId: explicitInstagramId
}) => {
  const normalizedPlatform = (platform || '').toUpperCase();

  if (!['FACEBOOK', 'INSTAGRAM'].includes(normalizedPlatform)) {
    throw new Error(`Unsupported platform for Meta publish: ${platform}`);
  }

  if (!pageAccessToken) {
    throw new Error('Missing Meta page access token for publishing');
  }

  const pageInfo = await getPageInfoFromPageToken(pageAccessToken);
  const pageId = explicitPageId || pageInfo.pageId;

  if (!pageId) {
    throw new Error('Unable to resolve Facebook Page ID from token');
  }

  if (normalizedPlatform === 'FACEBOOK') {
    try {
      const endpoint = imageUrl ? `${META_API_BASE}/${pageId}/photos` : `${META_API_BASE}/${pageId}/feed`;
      const payload = imageUrl
        ? { url: imageUrl, caption: caption || '', access_token: pageAccessToken }
        : { message: caption || '', access_token: pageAccessToken };

      const response = await metaAxios.post(endpoint, payload);
      const platformPostId = response.data?.post_id || response.data?.id || null;

      return {
        success: true,
        platform: normalizedPlatform,
        pageId,
        platformPostId
      };
    } catch (error) {
      logger.error('Error publishing to Facebook', {
        error: error.response?.data || error.message,
        pageId
      });
      throw new Error(`Failed to publish on Facebook: ${normalizeMetaError(error, 'Unknown Meta error')}`);
    }
  }

  const instagramAccountId = explicitInstagramId || pageInfo.instagramAccountId;
  if (!instagramAccountId) {
    throw new Error('Instagram account not linked to selected Facebook Page');
  }
  if (!imageUrl) {
    throw new Error('Instagram publish requires an image URL');
  }

  try {
    const containerResponse = await metaAxios.post(
      `${META_API_BASE}/${instagramAccountId}/media`,
      {
        image_url: imageUrl,
        caption: caption || '',
        access_token: pageAccessToken
      }
    );

    const containerId = containerResponse.data?.id;
    if (!containerId) {
      throw new Error('Failed to create Instagram media container');
    }

    const publishResponse = await metaAxios.post(
      `${META_API_BASE}/${instagramAccountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: pageAccessToken
      }
    );

    return {
      success: true,
      platform: normalizedPlatform,
      pageId,
      instagramAccountId,
      containerId,
      platformPostId: publishResponse.data?.id || null
    };
  } catch (error) {
    logger.error('Error publishing to Instagram', {
      error: error.response?.data || error.message,
      instagramAccountId
    });
    throw new Error(`Failed to publish on Instagram: ${normalizeMetaError(error, 'Unknown Meta error')}`);
  }
};

/**
 * Internal helper to retrieve the correct page access token for a given FB Page ID
 */
export const getPageToken = async (pageId) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: {
        account_handle: { contains: pageId },
        platform: 'FACEBOOK'
      }
    });

    if (!integration || !integration.access_token) {
       // Check Instagram if not found in Facebook
       const igIntegration = await prisma.integration.findFirst({
         where: {
           account_handle: { contains: pageId },
           platform: 'INSTAGRAM'
         }
       });
       if (igIntegration?.access_token) return decrypt(igIntegration.access_token);
       return null;
    }

    return decrypt(integration.access_token);
  } catch (error) {
    logger.error(`Error retrieving token for page ${pageId}`, { error: error.message });
    return null;
  }
};

/**
 * Reply to a comment on a Meta (Facebook/Instagram) post
 * @param {string} pageId - The Page ID (needed to get token)
 * @param {string} commentId - The ID of the comment to reply to
 * @param {string} message - The reply message text
 * @returns {Promise<Object>} The API response
 */
export const replyToComment = async (pageId, commentId, message) => {
  try {
    const pageToken = await getPageToken(pageId);
    
    if (!pageToken) {
      throw new Error(`Could not retrieve access token for page ${pageId}`);
    }

    const response = await metaAxios.post(`${META_API_BASE}/${commentId}/comments`, null, {
      params: {
        message,
        access_token: pageToken
      }
    });

    logger.info(`Successfully replied to comment ${commentId}`);
    return { success: true, id: response.data.id };
  } catch (error) {
    logger.error(`Failed to reply to comment ${commentId}`, {
      error: error.message,
      data: error.response?.data
    });
    return { success: false, error: normalizeMetaError(error, 'Failed to post reply') };
  }
};

export default {
  testUserToken,
  testAppToken,
  getUserPages,
  getInstagramAccounts,
  getPageInfoFromPageToken,
  testFacebookPost,
  testInstagramPost,
  publishToPlatform,
  replyToComment
};
