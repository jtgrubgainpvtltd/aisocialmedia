import * as metaService from '../services/metaService.js';
import * as metaOAuthService from '../services/metaOAuthService.js';
import logger from '../utils/logger.js';
import prisma from '../../prisma/client.js';
import { encrypt } from '../utils/encryption.js';
import { Platform } from '@prisma/client';
import crypto from 'crypto';

const parseAccountHandle = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/**
 * Test Meta User Token
 * GET /api/v1/integration/test-user-token
 */
export const testUserToken = async (req, res, next) => {
  try {
    const result = await metaService.testUserToken();

    res.json({
      success: true,
      message: 'Meta User Token is valid',
      data: result
    });

  } catch (error) {
    logger.error('Error in testUserToken controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

/**
 * Test Meta App Token
 * GET /api/v1/integration/test-app-token
 */
export const testAppToken = async (req, res, next) => {
  try {
    const result = await metaService.testAppToken();

    res.json({
      success: true,
      message: 'Meta App Token is valid',
      data: result
    });

  } catch (error) {
    logger.error('Error in testAppToken controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

/**
 * Get User's Facebook Pages
 * GET /api/v1/integration/test-pages
 */
export const testGetPages = async (req, res, next) => {
  try {
    const tokenFromHeader = req.headers['x-meta-user-token'];
    const result = await metaService.getUserPages(tokenFromHeader);

    res.json({
      success: true,
      message: `Found ${result.pages.length} Facebook Page(s)`,
      data: result
    });

  } catch (error) {
    logger.error('Error in testGetPages controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

/**
 * Get Instagram Business Accounts
 * GET /api/v1/integration/test-instagram
 */
export const testGetInstagram = async (req, res, next) => {
  try {
    const tokenFromHeader = req.headers['x-meta-user-token'];
    const result = await metaService.getInstagramAccounts(tokenFromHeader);

    res.json({
      success: true,
      message: `Found ${result.accounts.length} Instagram Business Account(s)`,
      data: result
    });

  } catch (error) {
    logger.error('Error in testGetInstagram controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

/**
 * Test Full Meta Integration (All Tests)
 * GET /api/v1/integration/test-all
 */
export const testAllIntegrations = async (req, res, next) => {
  try {
    const results = {
      userToken: null,
      appToken: null,
      pages: null,
      instagram: null
    };

    // Test 1: User Token
    try {
      results.userToken = await metaService.testUserToken();
    } catch (error) {
      results.userToken = { success: false, error: error.message };
    }

    // Test 2: App Token
    try {
      results.appToken = await metaService.testAppToken();
    } catch (error) {
      results.appToken = { success: false, error: error.message };
    }

    // Test 3: Facebook Pages
    try {
      results.pages = await metaService.getUserPages();
    } catch (error) {
      results.pages = { success: false, error: error.message };
    }

    // Test 4: Instagram Accounts
    try {
      results.instagram = await metaService.getInstagramAccounts();
    } catch (error) {
      results.instagram = { success: false, error: error.message };
    }

    const allPassed = results.userToken.success &&
                      results.appToken.success &&
                      results.pages.success &&
                      results.instagram.success;

    res.json({
      success: allPassed,
      message: allPassed ? 'All Meta integrations tested successfully!' : 'Some tests failed',
      data: results
    });

  } catch (error) {
    logger.error('Error in testAllIntegrations controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
};

/**
 * Get restaurant integration statuses
 * GET /api/v1/integrations
 */
export const getIntegrations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Restaurant not found' }
      });
    }

    const records = await prisma.integration.findMany({
      where: {
        restaurant_id: user.restaurant.id,
        iud_flag: { not: 'D' }
      },
      orderBy: { platform: 'asc' }
    });

    const data = records.map((r) => {
      const handle = parseAccountHandle(r.account_handle);
      return {
        platform: r.platform,
        connected: r.connected,
        accountHandle: handle,
        lastSyncedAt: r.last_synced_at
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error in getIntegrations controller', { error: error.message });
    next(error);
  }
};

/**
 * Connect Meta platform with selected page token
 * POST /api/v1/integrations/connect-meta
 */
export const connectMeta = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      platform,
      pageId,
      pageName,
      pageAccessToken,
      instagramAccountId
    } = req.body;

    const normalizedPlatform = String(platform || '').toUpperCase();
    if (!['FACEBOOK', 'INSTAGRAM'].includes(normalizedPlatform)) {
      return res.status(400).json({
        success: false,
        error: { message: 'platform must be FACEBOOK or INSTAGRAM' }
      });
    }

    if (!pageAccessToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'pageAccessToken is required' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Restaurant not found' }
      });
    }

    const tokenPageInfo = await metaService.getPageInfoFromPageToken(pageAccessToken);
    if (pageId && tokenPageInfo.pageId && String(pageId) !== String(tokenPageInfo.pageId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Provided pageId does not match the token page' }
      });
    }

    if (normalizedPlatform === 'INSTAGRAM' && !(instagramAccountId || tokenPageInfo.instagramAccountId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Selected page does not have an Instagram business account' }
      });
    }

    const handlePayload = {
      pageId: tokenPageInfo.pageId || pageId || null,
      pageName: pageName || tokenPageInfo.pageName || null,
      instagramAccountId: instagramAccountId || tokenPageInfo.instagramAccountId || null
    };

    await prisma.integration.upsert({
      where: {
        restaurant_id_platform: {
          restaurant_id: user.restaurant.id,
          platform: Platform[normalizedPlatform]
        }
      },
      update: {
        connected: true,
        account_handle: JSON.stringify(handlePayload),
        access_token: encrypt(pageAccessToken),
        last_synced_at: new Date(),
        updated_by: userId.toString(),
        iud_flag: 'U'
      },
      create: {
        restaurant_id: user.restaurant.id,
        platform: Platform[normalizedPlatform],
        connected: true,
        account_handle: JSON.stringify(handlePayload),
        access_token: encrypt(pageAccessToken),
        last_synced_at: new Date(),
        iud_flag: 'I',
        created_by: userId.toString(),
        updated_by: userId.toString()
      }
    });

    res.json({
      success: true,
      message: `${normalizedPlatform} connected successfully`,
      data: {
        platform: normalizedPlatform,
        ...handlePayload
      }
    });
  } catch (error) {
    logger.error('Error in connectMeta controller', { error: error.message });
    next(error);
  }
};

/**
 * Generate Meta OAuth URL
 * GET /api/v1/integrations/meta/oauth-url
 */
export const getMetaOAuthUrl = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in an HTTP-only temporary cookie for 15 minutes
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    const oauthUrl = metaOAuthService.generateOAuthUrl(state);

    res.json({
      success: true,
      data: {
        url: oauthUrl,
        state: state
      }
    });
  } catch (error) {
    logger.error('Error generating Meta OAuth URL', { error: error.message });
    next(error);
  }
};

/**
 * Handle Meta OAuth callback
 * GET /api/v1/integrations/meta/callback
 */
export const handleMetaOAuthCallback = async (req, res, next) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const { code, state, error, error_description } = req.query;

    // Validate CSRF state
    const savedState = req.cookies.oauth_state;
    res.clearCookie('oauth_state');
    
    if (!state || state !== savedState) {
      logger.error('Meta OAuth CSRF Token mismatch', { query_state: state, cookie_state: savedState });
      return res.redirect(`${clientUrl}/dashboard/integrations?error=${encodeURIComponent('Security error: Invalid CSRF state token')}`);
    }

    // Handle OAuth errors
    if (error) {
      logger.error('Meta OAuth error', { error, error_description });
      return res.redirect(`${clientUrl}/dashboard/integrations?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
      return res.redirect(`${clientUrl}/dashboard/integrations?error=No authorization code received`);
    }

    // Exchange code for access token
    const tokenData = await metaOAuthService.exchangeCodeForToken(code);
    
    // Get long-lived token
    const longLivedToken = await metaOAuthService.getLongLivedToken(tokenData.accessToken);

    // Get user's pages
    const pages = await metaOAuthService.getUserPagesWithTokens(longLivedToken.accessToken);

    if (pages.length === 0) {
      return res.redirect(`${clientUrl}/dashboard/integrations?error=No Facebook pages found. Please create a Facebook page first.`);
    }

    // For now, redirect to integration page with success and let user select page
    // Store token temporarily in session or pass via secure parameter
    const successUrl = `${clientUrl}/dashboard/integrations?oauth_success=true&temp_token=${encodeURIComponent(longLivedToken.accessToken)}`;
    
    res.redirect(successUrl);

  } catch (error) {
    logger.error('Error in Meta OAuth callback', { error: error.message });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/dashboard/integrations?error=${encodeURIComponent(error.message)}`);
  }
};

/**
 * Complete Meta OAuth connection with selected page
 * POST /api/v1/integrations/meta/complete-oauth
 */
export const completeMetaOAuth = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { userAccessToken, selectedPageId, platform } = req.body;

    if (!userAccessToken || !selectedPageId || !platform) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required parameters: userAccessToken, selectedPageId, platform' }
      });
    }

    const normalizedPlatform = String(platform).toUpperCase();
    if (!['FACEBOOK', 'INSTAGRAM'].includes(normalizedPlatform)) {
      return res.status(400).json({
        success: false,
        error: { message: 'platform must be FACEBOOK or INSTAGRAM' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Restaurant not found' }
      });
    }

    // Get pages with the user token
    const pages = await metaOAuthService.getUserPagesWithTokens(userAccessToken);
    const selectedPage = pages.find(p => p.pageId === selectedPageId);

    if (!selectedPage) {
      return res.status(400).json({
        success: false,
        error: { message: 'Selected page not found or access denied' }
      });
    }

    if (normalizedPlatform === 'INSTAGRAM' && !selectedPage.instagramAccountId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Selected page does not have an Instagram business account linked' }
      });
    }

    const handlePayload = {
      pageId: selectedPage.pageId,
      pageName: selectedPage.pageName,
      instagramAccountId: selectedPage.instagramAccountId,
      instagramUsername: selectedPage.instagramUsername
    };

    // Store the page access token (which is long-lived)
    await prisma.integration.upsert({
      where: {
        restaurant_id_platform: {
          restaurant_id: user.restaurant.id,
          platform: Platform[normalizedPlatform]
        }
      },
      update: {
        connected: true,
        account_handle: JSON.stringify(handlePayload),
        access_token: encrypt(selectedPage.pageAccessToken),
        last_synced_at: new Date(),
        updated_by: userId.toString(),
        iud_flag: 'U'
      },
      create: {
        restaurant_id: user.restaurant.id,
        platform: Platform[normalizedPlatform],
        connected: true,
        account_handle: JSON.stringify(handlePayload),
        access_token: encrypt(selectedPage.pageAccessToken),
        last_synced_at: new Date(),
        iud_flag: 'I',
        created_by: userId.toString(),
        updated_by: userId.toString()
      }
    });

    res.json({
      success: true,
      message: `${normalizedPlatform} connected successfully via OAuth`,
      data: {
        platform: normalizedPlatform,
        ...handlePayload
      }
    });

  } catch (error) {
    logger.error('Error completing Meta OAuth', { error: error.message });
    next(error);
  }
};

export default {
  getIntegrations,
  testUserToken,
  testAppToken,
  testGetPages,
  testGetInstagram,
  testAllIntegrations,
  connectMeta,
  getMetaOAuthUrl,
  handleMetaOAuthCallback,
  completeMetaOAuth
};
