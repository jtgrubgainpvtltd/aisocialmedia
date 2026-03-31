import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import metaService from '../services/metaService.js';
import openaiService from '../services/openaiService.js';

export const getReplies = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
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
    const restaurantId = req.user.restaurantId;

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
    
    // In a real scenario, platform_post_id would actually be the comment_id we reply to.
    // Ensure we have a comment_id to reply to.
    if (!reply.platform_post_id) {
        return res.status(400).json({ success: false, error: 'Missing comment ID to reply to' });
    }
    
    // Find FB/IG integration. Assuming Meta integration exists.
    const metaIntegration = reply.restaurant.integrations.find(
      i => i.platform === 'FACEBOOK' || i.platform === 'INSTAGRAM'
    );
    if (!metaIntegration) {
      return res.status(400).json({ success: false, error: 'No Meta integration connected' });
    }

    // Call Graph API
    // We need Page ID to get page access token
    // For simplicity we try to use the account_handle or you'd look it up here.
    // Let's assume the replyToComment service is robust to handle it if we pass the pageId
    const pageId = metaIntegration.account_handle;
    
    const metaResponse = await metaService.replyToComment(pageId, reply.platform_post_id, textToPost);

    if (!metaResponse.success) {
      return res.status(500).json({ success: false, error: metaResponse.error });
    }

    // Mark as approved in DB
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
    const restaurantId = req.user.restaurantId;

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

export const handleMetaWebhook = async (req, res) => {
  // If it's a GET request, it's Meta verifying the webhook signature
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // In production, keep this token secret in .env
    if (mode === 'subscribe' && token === (process.env.META_WEBHOOK_VERIFY_TOKEN || 'grubgain-secret')) {
      logger.info('Meta Webhook Verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
    return;
  }

  // It's a POST request containing an event (e.g. new comment)
  try {
    const body = req.body;

    if (body.object === 'page' || body.object === 'instagram') {
      
      // Iterate over each entry
      for (const entry of body.entry) {
        // Iterate over changes
        for (const change of entry.changes) {
          // If this is a comment event, we grab it.
          if (change.field === 'feed' || change.field === 'comments') {
            const item = change.value;
            if (item.item === 'comment' && item.verb === 'add') {
              // We got a comment!

              // Look up which restaurant is tied to this page ID/post ID
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

              // Use OpenAI to classify and draft the reply
              const aiResult = await openaiService.draftCommentReply(commentText, { restaurantName: restaurant.name });

              // Save to DB as a PENDING Reply Queue item
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

      // Return a '200 OK' to Facebook so they know we got it
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Return a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  } catch (error) {
    logger.error('Error handling Meta Webhook', { error: error.message });
    res.status(500).send('ERROR');
  }
};
