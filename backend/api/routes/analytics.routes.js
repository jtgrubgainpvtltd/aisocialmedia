import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../../prisma/client.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/v1/analytics/overview - Get dashboard metrics
router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's restaurant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.json({
        success: true,
        data: {
          totalPosts: 0,
          totalReach: 0,
          totalEngagement: 0,
          avgEngagementRate: 0,
          topPlatform: null
        }
      });
    }

    const restaurantId = user.restaurant.id;

    // Get published posts count
    const totalPosts = await prisma.publishedPost.count({
      where: {
        restaurant_id: restaurantId,
        iud_flag: { not: 'D' }
      }
    });

    // Get total reach and engagement from published posts
    const stats = await prisma.publishedPost.aggregate({
      where: {
        restaurant_id: restaurantId,
        iud_flag: { not: 'D' }
      },
      _sum: {
        views: true,
        engagement: true,
        link_clicks: true,
        saves_shares: true
      }
    });

    const totalReach = stats._sum.views || 0;
    const totalEngagement = stats._sum.engagement || 0;
    const totalClicks = stats._sum.link_clicks || 0;
    const totalSaves = stats._sum.saves_shares || 0;

    // Calculate average engagement rate
    const avgEngagementRate = totalReach > 0
      ? ((totalEngagement / totalReach) * 100).toFixed(2)
      : 0;

    // Get top performing platform
    const platformStats = await prisma.publishedPost.groupBy({
      by: ['platform'],
      where: {
        restaurant_id: restaurantId,
        iud_flag: { not: 'D' }
      },
      _sum: {
        engagement: true
      },
      orderBy: {
        _sum: {
          engagement: 'desc'
        }
      },
      take: 1
    });

    const topPlatform = platformStats.length > 0 ? platformStats[0].platform : null;

    res.json({
      success: true,
      data: {
        totalPosts,
        totalReach,
        totalEngagement,
        totalClicks,
        totalSaves,
        avgEngagementRate: parseFloat(avgEngagementRate),
        topPlatform
      }
    });

  } catch (error) {
    logger.error('Error in analytics overview', { error: error.message });
    next(error);
  }
});

// GET /api/v1/analytics/top-posts - Get top performing posts
router.get('/top-posts', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's restaurant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.json({
        success: true,
        data: []
      });
    }

    const restaurantId = user.restaurant.id;

    // Get top posts by engagement
    const topPosts = await prisma.publishedPost.findMany({
      where: {
        restaurant_id: restaurantId,
        iud_flag: { not: 'D' }
      },
      orderBy: {
        engagement: 'desc'
      },
      take: limit,
      select: {
        id: true,
        title: true,
        caption: true,
        image_url: true,
        platform: true,
        published_date: true,
        views: true,
        engagement: true,
        link_clicks: true,
        saves_shares: true,
        comments: true
      }
    });

    // Calculate engagement rate for each post
    const postsWithRate = topPosts.map(post => ({
      ...post,
      engagementRate: post.views > 0
        ? ((post.engagement / post.views) * 100).toFixed(2)
        : 0
    }));

    res.json({
      success: true,
      data: postsWithRate
    });

  } catch (error) {
    logger.error('Error in top posts analytics', { error: error.message });
    next(error);
  }
});

// GET /api/v1/analytics/insights - Get dynamic AI-style insights from real metrics
router.get('/insights', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.json({ success: true, data: [] });
    }

    const restaurantId = user.restaurant.id;
    const publishedCount = await prisma.publishedPost.count({
      where: { restaurant_id: restaurantId, iud_flag: { not: 'D' } }
    });

    const totals = await prisma.publishedPost.aggregate({
      where: { restaurant_id: restaurantId, iud_flag: { not: 'D' } },
      _sum: { views: true, engagement: true, link_clicks: true, saves_shares: true }
    });

    const views = totals._sum.views || 0;
    const engagement = totals._sum.engagement || 0;
    const clicks = totals._sum.link_clicks || 0;
    const saves = totals._sum.saves_shares || 0;
    const er = views > 0 ? ((engagement / views) * 100).toFixed(2) : '0.00';

    const insights = [
      `You have published ${publishedCount} posts so far with ${views} total reach.`,
      `Overall engagement rate is ${er}%. ${parseFloat(er) >= 5 ? 'Great performance—keep your content cadence steady.' : 'Try stronger CTAs and localized hooks to improve engagement.'}`,
      `Users clicked links ${clicks} times and saved/shared ${saves} times. Prioritize formats that drove these actions.`
    ];

    res.json({ success: true, data: insights });
  } catch (error) {
    logger.error('Error generating analytics insights', { error: error.message });
    next(error);
  }
});

// GET /api/v1/analytics/best-times - Recommend 3 best times to post based on past engagement
router.get('/best-times', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.json({ success: true, data: ['12:00', '18:00', '20:00'] });
    }

    const restaurantId = user.restaurant.id;

    // Group published posts by published_time and sum/avg engagement
    const posts = await prisma.publishedPost.findMany({
      where: { restaurant_id: restaurantId, iud_flag: { not: 'D' } },
      select: { published_time: true, engagement: true, views: true }
    });

    if (posts.length < 5) {
      // Not enough data, return industry defaults
      return res.json({ success: true, data: ['12:00', '18:00', '20:00'] });
    }

    // Aggregate engagement by time
    const timeStats = {};
    for (const p of posts) {
      if (!p.published_time) continue;
      // Extract hour (e.g. "18:30" -> "18:00")
      let hourPrefix = p.published_time.split(':')[0];
      if (hourPrefix.length === 1) hourPrefix = `0${hourPrefix}`;
      const slot = `${hourPrefix}:00`;

      if (!timeStats[slot]) {
        timeStats[slot] = { totalEngagement: 0, count: 0 };
      }
      timeStats[slot].totalEngagement += (p.engagement || 0);
      timeStats[slot].count += 1;
    }

    // Calculate average engagement per slot
    const slotAverages = Object.keys(timeStats).map(slot => ({
      slot,
      avg: timeStats[slot].totalEngagement / timeStats[slot].count
    }));

    // Sort by descending average engagement
    slotAverages.sort((a, b) => b.avg - a.avg);

    // Pick top 3 slots, pad with defaults if necessary
    const topSlots = slotAverages.slice(0, 3).map(s => s.slot);
    const defaults = ['12:00', '18:00', '20:00'];
    
    while (topSlots.length < 3) {
      const def = defaults.find(d => !topSlots.includes(d));
      if (def) topSlots.push(def);
      else break;
    }

    res.json({ success: true, data: topSlots });
  } catch (error) {
    logger.error('Error generating best times', { error: error.message });
    res.json({ success: true, data: ['12:00', '18:00', '20:00'] }); // fallback
  }
});

export default router;
