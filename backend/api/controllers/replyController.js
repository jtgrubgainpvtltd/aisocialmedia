import crypto from 'crypto';
import prisma from '../../prisma/client.js';
import logger from '../utils/logger.js';
import metaService from '../services/metaService.js';
import openaiService from '../services/openaiService.js';

export const getReplies = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'User does not belong to a restaurant' });
    }

    const { status = 'PENDING' } = req.query;

    const replies = await prisma.commentReply.findMany({
      where: {
        restaurant_id: restaurantId,
        status: status.toUpperCase()
      },
      orderBy: { created_on: 'desc' }
    });

    res.json({ success: true, data: replies });
  } catch (error) {
    logger.error('Failed to get comment replies', { error: error.message, userId: req.user.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const approveReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { editedReplyText } = req.body;
    const restaurantId = req.user.restaurant?.id;

    const reply = await prisma.commentReply.findUnique({
      where: { id: parseInt(id) },
      include: { restaurant: { include: { integrations: true } } }
    });

    if (!reply || reply.restaurant_id !== restaurantId) {
      return res.status(404).json({ success: false, error: 'Reply not found' });
    }
    if (reply.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Reply is not pending' });
    }

    const textToPost = editedReplyText || reply.ai_draft_reply;
    
    if (!reply.platform_post_id) {
        return res.status(400).json({ success: false, error: 'Missing comment ID to reply to' });
    }
    
    const metaIntegration = reply.restaurant.integrations.find(
      i => i.platform === 'FACEBOOK' || i.platform === 'INSTAGRAM'
    );
    if (!metaIntegration) {
      return res.status(400).json({ success: false, error: 'No Meta integration connected' });
    }

    let pageId;
    try {
      const handleData = JSON.parse(metaIntegration.account_handle || '{}');
      pageId = handleData.pageId;
      
      if (!pageId) {
        logger.error('No pageId found in account_handle', { account_handle: metaIntegration.account_handle });
        return res.status(500).json({ success: false, error: 'Invalid integration configuration - missing pageId' });
      }
    } catch (error) {
      logger.error('Failed to parse account_handle JSON', { 
        error: error.message, 
        account_handle: metaIntegration.account_handle 
      });
      return res.status(500).json({ success: false, error: 'Invalid integration configuration' });
    }
    
    const metaResponse = await metaService.replyToComment(pageId, reply.platform_post_id, textToPost);

    if (!metaResponse.success) {
      return res.status(500).json({ success: false, error: metaResponse.error });
    }

    const updated = await prisma.commentReply.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        ai_draft_reply: textToPost, 
        updated_by: req.user.email
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Failed to approve reply', { error: error.message, replyId: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const rejectReply = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurant?.id;

    const reply = await prisma.commentReply.findUnique({
      where: { id: parseInt(id) }
    });

    if (!reply || reply.restaurant_id !== restaurantId) {
      return res.status(404).json({ success: false, error: 'Reply not found' });
    }

    const updated = await prisma.commentReply.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        updated_by: req.user.email
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Failed to reject reply', { error: error.message, replyId: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Verify Meta webhook signature using HMAC SHA-256
 * SECURITY: Prevents forged webhook requests from unauthorized sources
 */
function verifyMetaWebhookSignature(rawBody, signature) {
  if (!signature) {
    return false;
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    logger.error('META_APP_SECRET not configured - cannot verify webhook signature');
    return false;
  }

  try {
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', { error: error.message });
    return false;
  }
}

export const handleMetaWebhook = async (req, res) => {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
    if (!verifyToken) {
      logger.error('META_WEBHOOK_VERIFY_TOKEN not configured');
      return res.sendStatus(500);
    }

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Meta Webhook Verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
    return;
  }

  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!verifyMetaWebhookSignature(rawBody, signature)) {
    logger.warn('Meta webhook signature verification failed', {
      hasSignature: !!signature,
      remoteAddr: req.ip
    });
    return res.sendStatus(403);
  }

  try {
    const body = req.body;

    if (body.object === 'page' || body.object === 'instagram') {
      res.status(200).send('EVENT_RECEIVED');

      setImmediate(async () => {
        try {
          for (const entry of body.entry) {
            for (const change of entry.changes) {
              if (change.field === 'feed' || change.field === 'comments') {
                const item = change.value;
                if (item.item === 'comment' && item.verb === 'add') {
                  const integration = await prisma.integration.findFirst({
                    where: {
                      account_handle: { contains: entry.id }
                    },
                    include: { restaurant: true }
                  });

                  const restaurant = integration?.restaurant;

                  if (!restaurant) {
                    logger.warn(`No restaurant found for Meta Entry ID: ${entry.id}`);
                    continue;
                  }

                  const commentId = item.comment_id;
                  const commenterName = item.from?.name || 'Anonymous User';
                  const commentText = item.message;

                  const aiResult = await openaiService.draftCommentReply(commentText, { restaurantName: restaurant.name });

                  await prisma.commentReply.create({
                    data: {
                      restaurant_id: restaurant.id,
                      platform_post_id: commentId.toString(),
                      commenter_name: commenterName,
                      comment_text: commentText,
                      comment_type: aiResult.type || 'OTHER',
                      ai_draft_reply: aiResult.reply,
                      status: 'PENDING',
                      created_by: 'system' // Webhook event
                    }
                  });

                  logger.info(`Comment queued for AI reply: ${commentId}`, { type: aiResult.type });
                }
              }
            }
          }
        } catch (asyncError) {
          logger.error('Error processing webhook events asynchronously', { error: asyncError.message });
        }
      });
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    logger.error('Error handling Meta Webhook', { error: error.message });
    res.status(500).send('ERROR');
  }
};
