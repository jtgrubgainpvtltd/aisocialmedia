import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as postController from '../controllers/postController.js';

const router = express.Router();

// POST /api/v1/posts/schedule - Schedule a post
router.post('/schedule', authenticate, postController.schedulePost);

// GET /api/v1/posts/scheduled - Get scheduled posts
router.get('/scheduled', authenticate, postController.getScheduledPosts);

// GET /api/v1/posts/published - Get published posts (History)
router.get('/published', authenticate, postController.getPublishedPosts);

// DELETE /api/v1/posts/scheduled/:id - Cancel scheduled post
router.delete('/scheduled/:id', authenticate, postController.cancelScheduledPost);

// POST /api/v1/posts/publish - Publish immediately
router.post('/publish', authenticate, postController.publishNow);

export default router;
