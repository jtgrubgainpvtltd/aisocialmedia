import prisma from '../../prisma/client.js';
import logger from '../utils/logger.js';
import { decrypt } from '../utils/encryption.js';
import * as metaService from '../services/metaService.js';

/**
 * Schedule a post
 * POST /api/v1/posts/schedule
 */
export const schedulePost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      content_id,
      platform,
      scheduled_date,
      scheduled_time,
      caption,
      image_url
    } = req.body;

    // Validate schedule date input before persistence
    const parsedDate = new Date(scheduled_date);
    if (!scheduled_date || Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { message: 'scheduled_date must be a valid date' }
      });
    }
    if (parsedDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: { message: 'scheduled_date must be in the future' }
      });
    }

    // Get user's restaurant
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

    // Create scheduled post
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        restaurant_id: user.restaurant.id,
        content_id: content_id ? parseInt(content_id) : null,
        platform: (platform || 'INSTAGRAM').toUpperCase(),
        scheduled_date: parsedDate,
        scheduled_time: scheduled_time || '18:00',
        caption: caption || '',
        image_url: image_url || null,
        status: 'PENDING',
        iud_flag: 'I',
        created_by: userId.toString(),
        updated_by: userId.toString()
      }
    });

    logger.info('Post scheduled', { postId: scheduledPost.id });

    res.json({
      success: true,
      message: 'Post scheduled successfully',
      data: scheduledPost
    });

  } catch (error) {
    logger.error('Error in schedulePost controller', { error: error.message });
    next(error);
  }
};

/**
 * Get scheduled posts
 * GET /api/v1/posts/scheduled
 */
export const getScheduledPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

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

    const where = {
      restaurant_id: user.restaurant.id,
      iud_flag: { not: 'D' }
    };

    if (status) where.status = status.toUpperCase();

    const posts = await prisma.scheduledPost.findMany({
      where,
      include: { content: true },
      orderBy: { scheduled_date: 'asc' }
    });

    res.json({
      success: true,
      data: posts
    });

  } catch (error) {
    logger.error('Error in getScheduledPosts controller', { error: error.message });
    next(error);
  }
};

/**
 * Get published posts
 * GET /api/v1/posts/published
 */
export const getPublishedPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100); // Min 1, Max 100
    const safeOffset = Math.max(parseInt(offset) || 0, 0); // Min 0

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

    const posts = await prisma.publishedPost.findMany({
      where: {
        restaurant_id: user.restaurant.id,
        iud_flag: { not: 'D' }
      },
      orderBy: { published_date: 'desc' },
      take: safeLimit,
      skip: safeOffset
    });

    const total = await prisma.publishedPost.count({
      where: {
        restaurant_id: user.restaurant.id,
        iud_flag: { not: 'D' }
      }
    });

    res.json({
      success: true,
      data: {
        posts,
        pagination: { total, limit: parseInt(limit), offset: parseInt(offset) }
      }
    });

  } catch (error) {
    logger.error('Error in getPublishedPosts controller', { error: error.message });
    next(error);
  }
};

/**
 * Cancel scheduled post
 * DELETE /api/v1/posts/scheduled/:id
 */
export const cancelScheduledPost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const restaurantId = req.user.restaurant?.id;
    const { id } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: { message: 'User does not belong to a restaurant' }
      });
    }

    const post = await prisma.scheduledPost.findFirst({
      where: { 
        id: parseInt(id),
        restaurant_id: restaurantId
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: { message: 'Scheduled post not found' }
      });
    }

    await prisma.scheduledPost.update({
      where: { id: parseInt(id) },
      data: {
        iud_flag: 'D',
        updated_by: userId.toString()
      }
    });

    logger.info('Scheduled post cancelled', { postId: id });

    res.json({ success: true, message: 'Scheduled post cancelled' });

  } catch (error) {
    logger.error('Error in cancelScheduledPost controller', { error: error.message });
    next(error);
  }
};

/**
 * Publish post immediately
 * POST /api/v1/posts/publish
 */
export const publishNow = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { content_id, platform, caption, image_url } = req.body;
    const normalizedPlatform = (platform || 'INSTAGRAM').toUpperCase();

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

    const integration = await prisma.integration.findUnique({
      where: {
        restaurant_id_platform: {
          restaurant_id: user.restaurant.id,
          platform: normalizedPlatform
        }
      }
    });

    if (!integration || !integration.connected || !integration.access_token) {
      return res.status(400).json({
        success: false,
        error: { message: `${normalizedPlatform} integration is not connected. Connect it from Integrations first.` }
      });
    }

    const accountInfo = integration.account_handle ? JSON.parse(integration.account_handle) : {};
    const pageAccessToken = decrypt(integration.access_token);
    if (!pageAccessToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Saved integration token is invalid. Reconnect your Meta account.' }
      });
    }

    const publishResult = await metaService.publishToPlatform({
      platform: normalizedPlatform,
      caption: caption || '',
      imageUrl: image_url || null,
      pageAccessToken,
      pageId: accountInfo.pageId,
      instagramAccountId: accountInfo.instagramAccountId
    });

    const publishedPost = await prisma.publishedPost.create({
      data: {
        restaurant_id: user.restaurant.id,
        scheduled_post_id: null,
        platform: normalizedPlatform,
        platform_post_id: publishResult.platformPostId || null,
        title: 'AI Generated Post',
        caption: caption || '',
        image_url: image_url || null,
        published_date: new Date(),
        published_time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        iud_flag: 'I',
        created_by: userId.toString(),
        updated_by: userId.toString()
      }
    });

    await prisma.integration.update({
      where: {
        restaurant_id_platform: {
          restaurant_id: user.restaurant.id,
          platform: normalizedPlatform
        }
      },
      data: {
        last_synced_at: new Date(),
        updated_by: userId.toString(),
        iud_flag: 'U'
      }
    });

    logger.info('Post published on Meta', {
      id: publishedPost.id,
      platform: normalizedPlatform,
      platformPostId: publishResult.platformPostId
    });

    res.json({
      success: true,
      message: 'Post published successfully',
      data: {
        ...publishedPost,
        meta: {
          pageId: publishResult.pageId,
          instagramAccountId: publishResult.instagramAccountId || null,
          platformPostId: publishResult.platformPostId
        }
      }
    });

  } catch (error) {
    logger.error('Error in publishNow controller', { error: error.message });
    next(error);
  }
};

export default {
  schedulePost,
  getScheduledPosts,
  getPublishedPosts,
  cancelScheduledPost,
  publishNow
};
