import express from 'express';
import { getReplies, approveReply, rejectReply, handleMetaWebhook } from '../controllers/replyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected dashboard routes
router.get('/', authenticate, getReplies);
router.post('/:id/approve', authenticate, approveReply);
router.post('/:id/reject', authenticate, rejectReply);

// Meta webhook route (must be unprotected, Meta is calling this)
router.get('/webhook', handleMetaWebhook);
router.post('/webhook', handleMetaWebhook);

export default router;
