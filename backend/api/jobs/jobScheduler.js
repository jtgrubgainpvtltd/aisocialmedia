import cron from 'node-cron';
import prisma from '../../prisma/client.js';
import { decrypt } from '../utils/encryption.js';
import * as metaService from '../services/metaService.js';
import logger from '../utils/logger.js';

const schedulerVerboseLogs = process.env.SCHEDULER_VERBOSE_LOGS === 'true';

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

async function processDuePosts() {
  if (schedulerVerboseLogs) {
    logger.info('[Scheduler] Running scheduled post processor...');
  }

  try {
    const BATCH_SIZE = 50;

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
      take: BATCH_SIZE,
      orderBy: { scheduled_date: 'asc' },
    });

    if (pendingPosts.length === 0) {
      if (schedulerVerboseLogs) {
        logger.info('[Scheduler] No pending posts found.');
      }
      return;
    }

    if (schedulerVerboseLogs) {
      logger.info(`[Scheduler] Found ${pendingPosts.length} pending post(s). Checking due dates...`);
    }

    for (const post of pendingPosts) {
      if (!isPostDue(post.scheduled_date, post.scheduled_time)) {
        continue;
      }

      if (schedulerVerboseLogs) {
        logger.info(`[Scheduler] Processing post ID ${post.id} for platform ${post.platform}`);
      }

      const updateResult = await prisma.scheduledPost.updateMany({
        where: {
          id: post.id,
          status: 'PENDING',
        },
        data: {
          status: 'PROCESSING',
          iud_flag: 'U',
          updated_by: 'system',
        },
      });

      if (updateResult.count === 0) {
        if (schedulerVerboseLogs) {
          logger.info(`[Scheduler] Post ID ${post.id} already being processed by another instance.`);
        }
        continue;
      }

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

      let accountInfo = {};
      try {
        accountInfo = integration.account_handle
          ? JSON.parse(integration.account_handle)
          : {};
      } catch (parseError) {
        logger.error(`[Scheduler] Failed to parse account_handle for post ID ${post.id}`, { 
          error: parseError.message 
        });
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            error_message: 'Invalid account configuration. Please reconnect your Meta account.',
            iud_flag: 'U',
            updated_by: 'system',
          },
        });
        continue;
      }

      try {
        const publishResult = await metaService.publishToPlatform({
          platform: post.platform,
          caption: post.caption,
          imageUrl: post.image_url || null,
          pageAccessToken,
          pageId: accountInfo.pageId,
          instagramAccountId: accountInfo.instagramAccountId,
        });

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

        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            published_at: new Date(),
            iud_flag: 'U',
            updated_by: 'system',
          },
        });

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

    if (schedulerVerboseLogs) {
      logger.info('[Scheduler] Processor run complete.');
    }

  } catch (error) {
    logger.error('[Scheduler] Fatal error during scheduled post processing', { error: error.message });
  }
}

export function startJobScheduler() {
  if (schedulerVerboseLogs) {
    logger.info('[Scheduler] Initialising background job scheduler (runs every minute)...');
  }

  processDuePosts();

  cron.schedule('* * * * *', () => {
    processDuePosts();
  });

  if (schedulerVerboseLogs) {
    logger.info('[Scheduler] ✅ Background job scheduler is active.');
  }
}
