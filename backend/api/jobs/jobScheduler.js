import cron from 'node-cron';
import prisma from '../../prisma/client.js';
import { decrypt } from '../utils/encryption.js';
import * as metaService from '../services/metaService.js';
import logger from '../utils/logger.js';

/**
 * Checks if a scheduled post is due based on its scheduled_date and scheduled_time.
 * scheduled_date is a DateTime in the DB; scheduled_time is a "HH:MM" string.
 */
function isPostDue(scheduledDate, scheduledTime) {
  const now = new Date();

  // Build a combined Date from the stored date + stored time string
  const [hours, minutes] = (scheduledTime || '00:00').split(':').map(Number);
  const target = new Date(scheduledDate);
  target.setHours(hours, minutes, 0, 0);

  return now >= target;
}

/**
 * Core job: find all PENDING scheduled posts whose time has arrived and publish them.
 */
async function processDuePosts() {
  logger.info('[Scheduler] Running scheduled post processor...');

  try {
    // Fetch all PENDING posts that have not been deleted
    const pendingPosts = await prisma.scheduledPost.findMany({
      where: {
        status: 'PENDING',
        iud_flag: { not: 'D' },
      },
      include: {
        restaurant: {
          include: {
            integrations: true,
          },
        },
      },
    });

    if (pendingPosts.length === 0) {
      logger.info('[Scheduler] No pending posts found.');
      return;
    }

    logger.info(`[Scheduler] Found ${pendingPosts.length} pending post(s). Checking due dates...`);

    for (const post of pendingPosts) {
      if (!isPostDue(post.scheduled_date, post.scheduled_time)) {
        continue; // Not yet time
      }

      logger.info(`[Scheduler] Processing post ID ${post.id} for platform ${post.platform}`);

      // Find matching integration for this platform
      const integration = post.restaurant.integrations.find(
        (i) => i.platform === post.platform && i.connected && i.access_token
      );

      if (!integration) {
        logger.warn(`[Scheduler] No active integration found for post ID ${post.id} (${post.platform}). Marking FAILED.`);

        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            error_message: `No connected ${post.platform} integration found.`,
            iud_flag: 'U',
            updated_by: 'system',
          },
        });
        continue;
      }

      // Decrypt saved page access token
      let pageAccessToken;
      try {
        pageAccessToken = decrypt(integration.access_token);
      } catch (decryptErr) {
        logger.error(`[Scheduler] Token decryption failed for post ID ${post.id}`, { error: decryptErr.message });
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            error_message: 'Token decryption failed. Please reconnect your Meta account.',
            iud_flag: 'U',
            updated_by: 'system',
          },
        });
        continue;
      }

      const accountInfo = integration.account_handle
        ? JSON.parse(integration.account_handle)
        : {};

      try {
        // Publish via Meta Graph API
        const publishResult = await metaService.publishToPlatform({
          platform: post.platform,
          caption: post.caption,
          imageUrl: post.image_url || null,
          pageAccessToken,
          pageId: accountInfo.pageId,
          instagramAccountId: accountInfo.instagramAccountId,
        });

        // Record in published_posts
        const publishedPost = await prisma.publishedPost.create({
          data: {
            restaurant_id: post.restaurant_id,
            scheduled_post_id: post.id,
            platform: post.platform,
            platform_post_id: publishResult.platformPostId || null,
            title: 'Scheduled AI Post',
            caption: post.caption,
            image_url: post.image_url || null,
            published_date: new Date(),
            published_time: new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            iud_flag: 'I',
            created_by: 'system',
            updated_by: 'system',
          },
        });

        // Mark scheduled post as PUBLISHED
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            published_at: new Date(),
            iud_flag: 'U',
            updated_by: 'system',
          },
        });

        // Update integration's last_synced_at
        await prisma.integration.update({
          where: { id: integration.id },
          data: {
            last_synced_at: new Date(),
            iud_flag: 'U',
            updated_by: 'system',
          },
        });

        logger.info(`[Scheduler] ✅ Post ID ${post.id} published successfully. Meta Post ID: ${publishResult.platformPostId || 'N/A'}. DB Record: ${publishedPost.id}`);

      } catch (publishErr) {
        logger.error(`[Scheduler] ❌ Failed to publish post ID ${post.id}`, { error: publishErr.message });

        // Mark as FAILED with the error message for visibility
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            error_message: publishErr.message || 'Unknown publish error.',
            iud_flag: 'U',
            updated_by: 'system',
          },
        });
      }
    }

    logger.info('[Scheduler] Processor run complete.');

  } catch (error) {
    logger.error('[Scheduler] Fatal error during scheduled post processing', { error: error.message });
  }
}

// Initialise the cron job.
// Runs every minute: '* * * * *'
// For production with lower frequency, change to: '0 */5 * * * *' (every 5 min)
export function startJobScheduler() {
  logger.info('[Scheduler] Initialising background job scheduler (runs every minute)...');

  // Run once immediately on boot so posts scheduled "right now" don't wait a full minute
  processDuePosts();

  // Then run every minute
  cron.schedule('* * * * *', () => {
    processDuePosts();
  });

  logger.info('[Scheduler] ✅ Background job scheduler is active.');
}
