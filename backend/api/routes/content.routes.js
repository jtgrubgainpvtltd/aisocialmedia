import { Router } from "express";
import {
  generateContent,
  generateContentValidation,
  getContentHistory,
  getContentStats,
  getContentById,
  deleteContent,
  testCaption,
  testImage,
  testFullContent,
} from "../controllers/contentController.js";
import { authenticate } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = Router();

const testLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Test endpoint rate limit exceeded. Max 10 requests per hour.",
});

if (process.env.ENABLE_TEST_ENDPOINTS === 'true') {
  router.post("/test-caption", authenticate, testLimiter, testCaption);
  router.post("/test-image", authenticate, testLimiter, testImage);
  router.post("/test-full", authenticate, testLimiter, testFullContent);
}

router.post(
  "/generate",
  authenticate,
  generateContentValidation,
  generateContent,
);
router.get("/history", authenticate, getContentHistory);
router.get("/stats", authenticate, getContentStats);
router.delete("/:id", authenticate, deleteContent);
router.get("/:id", authenticate, getContentById);

export default router;
