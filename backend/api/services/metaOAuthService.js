import axios from "axios";
import logger from "../utils/logger.js";

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_OAUTH_REDIRECT_URI =
  process.env.META_OAUTH_REDIRECT_URI ||
  "http://localhost:5000/api/v1/integrations/meta/callback";
const META_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * Generate Meta OAuth URL for user to authorize app
 * @param {string} state - CSRF state token
 * @returns {string} OAuth URL
 */
export const generateOAuthUrl = (state) => {
  if (!META_APP_ID) {
    throw new Error("META_APP_ID not configured in environment");
  }

  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_manage_engagement",
    "instagram_basic",
    "instagram_content_publish",
    "business_management",
  ].join(",");

  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_OAUTH_REDIRECT_URI,
    state: state,
    scope: scopes,
    response_type: "code",
  });

  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from Meta
 * @returns {Promise<Object>} Access token data
 */
export const exchangeCodeForToken = async (code) => {
  try {
    if (!META_APP_ID || !META_APP_SECRET) {
      throw new Error("META_APP_ID and META_APP_SECRET must be configured");
    }

    const params = new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      redirect_uri: META_OAUTH_REDIRECT_URI,
      code: code,
    });

    const response = await axios.get(
      `${META_API_BASE}/oauth/access_token?${params.toString()}`,
    );

    const { access_token, token_type, expires_in } = response.data;

    if (!access_token) {
      throw new Error("No access token received from Meta");
    }

    logger.info("Successfully exchanged code for Meta access token", {
      tokenType: token_type,
      expiresIn: expires_in,
    });

    return {
      accessToken: access_token,
      tokenType: token_type,
      expiresIn: expires_in,
      expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
    };
  } catch (error) {
    logger.error("Error exchanging code for token", {
      error: error.response?.data || error.message,
    });
    throw new Error(
      `Failed to exchange code for token: ${error.response?.data?.error?.message || error.message}`,
    );
  }
};

/**
 * Get long-lived token from short-lived token
 * @param {string} shortLivedToken - Short-lived access token
 * @returns {Promise<Object>} Long-lived token data
 */
export const getLongLivedToken = async (shortLivedToken) => {
  try {
    if (!META_APP_ID || !META_APP_SECRET) {
      throw new Error("META_APP_ID and META_APP_SECRET must be configured");
    }

    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    });

    const response = await axios.get(
      `${META_API_BASE}/oauth/access_token?${params.toString()}`,
    );

    const { access_token, token_type, expires_in } = response.data;

    logger.info("Successfully obtained long-lived token", {
      expiresIn: expires_in,
    });

    return {
      accessToken: access_token,
      tokenType: token_type,
      expiresIn: expires_in,
      expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
    };
  } catch (error) {
    logger.error("Error getting long-lived token", {
      error: error.response?.data || error.message,
    });
    throw new Error(
      `Failed to get long-lived token: ${error.response?.data?.error?.message || error.message}`,
    );
  }
};

/**
 * Get user's Facebook pages with their page tokens
 * @param {string} userAccessToken - User access token
 * @returns {Promise<Array>} List of pages
 */
export const getUserPagesWithTokens = async (userAccessToken) => {
  try {
    const response = await axios.get(`${META_API_BASE}/me/accounts`, {
      params: {
        access_token: userAccessToken,
        fields:
          "id,name,access_token,category,instagram_business_account{id,username}",
      },
    });

    const pages = response.data.data || [];

    logger.info("Retrieved user pages", { pageCount: pages.length });

    return pages.map((page) => ({
      pageId: page.id,
      pageName: page.name,
      category: page.category,
      pageAccessToken: page.access_token,
      instagramAccountId: page.instagram_business_account?.id || null,
      instagramUsername: page.instagram_business_account?.username || null,
    }));
  } catch (error) {
    logger.error("Error getting user pages", {
      error: error.response?.data || error.message,
    });
    throw new Error(
      `Failed to get user pages: ${error.response?.data?.error?.message || error.message}`,
    );
  }
};

export default {
  generateOAuthUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPagesWithTokens,
};
