import express from 'express';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import * as restaurantController from '../controllers/restaurantController.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// GET /api/v1/restaurant - Get current user's restaurant
router.get('/', authenticate, restaurantController.getRestaurant);

// PUT /api/v1/restaurant - Update restaurant
router.put('/', authenticate, restaurantController.updateRestaurant);

// POST /api/v1/restaurant/assets - Upload asset
router.post('/assets', authenticate, upload.single('file'), restaurantController.uploadAsset);

// GET /api/v1/restaurant/assets - Get all assets
router.get('/assets', authenticate, restaurantController.getAssets);

// DELETE /api/v1/restaurant/assets/:id - Delete asset
router.delete('/assets/:id', authenticate, restaurantController.deleteAsset);

export default router;
