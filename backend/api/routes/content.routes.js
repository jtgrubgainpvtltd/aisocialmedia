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

// Strict rate limit for test endpoints (unauthenticated, cost money)
const testLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Test endpoint rate limit exceeded. Max 10 requests per hour.",
});

// -- Test routes (rate-limited, no auth) -----------
router.post("/test-caption", testLimiter, testCaption);
router.post("/test-image", testLimiter, testImage);
router.post("/test-full", testLimiter, testFullContent);

// -- Authenticated routes --------------------------
router.post(
  "/generate",
  authenticate,
  generateContentValidation,
  generateContent,
);
router.get("/history", authenticate, getContentHistory);
router.get("/stats", authenticate, getContentStats);
router.delete("/:id", authenticate, deleteContent);
router.get("/:id", authenticate, getContentById); // parameterised LAST

export default router;
