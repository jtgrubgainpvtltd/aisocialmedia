import express from 'express';
import { getReplies, approveReply, rejectReply, handleMetaWebhook } from '../controllers/replyController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const captureRawBody = express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
});

router.get('/', authenticate, getReplies);
router.post('/:id/approve', authenticate, approveReply);
router.post('/:id/reject', authenticate, rejectReply);

router.get('/webhook', handleMetaWebhook);
router.post('/webhook', captureRawBody, handleMetaWebhook);

export default router;
