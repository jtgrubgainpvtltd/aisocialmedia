import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as trendController from '../controllers/trendController.js';

const router = express.Router();

// GET /api/v1/trends/city/:cityName - Get city trends
router.get('/city/:cityName', authenticate, trendController.getCityTrends);

// GET /api/v1/trends/saved - Get saved trends
router.get('/saved', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

export default router;
