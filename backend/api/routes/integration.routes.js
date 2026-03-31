import express from "express";
import { authenticate } from "../middleware/auth.js";
import * as integrationController from "../controllers/integrationController.js";

const router = express.Router();

// ========== TEST ENDPOINTS (Auth Required - SECURITY FIX) ==========
// All integration endpoints require authentication to prevent credential exposure

// GET /api/v1/integrations/test-all - Test all Meta integrations
router.get(
  "/test-all",
  authenticate,
  integrationController.testAllIntegrations,
);

// GET /api/v1/integrations/test-user-token - Test user token
router.get(
  "/test-user-token",
  authenticate,
  integrationController.testUserToken,
);

// GET /api/v1/integrations/test-app-token - Test app token
router.get("/test-app-token", authenticate, integrationController.testAppToken);

// GET /api/v1/integrations/test-pages - Get Facebook Pages
router.get("/test-pages", authenticate, integrationController.testGetPages);

// GET /api/v1/integrations/test-instagram - Get Instagram accounts
router.get(
  "/test-instagram",
  authenticate,
  integrationController.testGetInstagram,
);

// ========== PRODUCTION ENDPOINTS (Auth Required) ==========

// GET /api/v1/integrations - Get all integration statuses
router.get("/", authenticate, integrationController.getIntegrations);

// POST /api/v1/integrations/connect - Connect social platform
router.post("/connect", authenticate, integrationController.connectMeta);
router.post("/connect-meta", authenticate, integrationController.connectMeta);

// ========== META OAUTH FLOW ==========

// GET /api/v1/integrations/meta/oauth-url - Generate OAuth URL for user
router.get(
  "/meta/oauth-url",
  authenticate,
  integrationController.getMetaOAuthUrl,
);

// GET /api/v1/integrations/meta/callback - OAuth redirect callback (NO AUTH - Meta redirects here)
router.get("/meta/callback", integrationController.handleMetaOAuthCallback);

// POST /api/v1/integrations/meta/complete-oauth - Complete OAuth after page selection
router.post(
  "/meta/complete-oauth",
  authenticate,
  integrationController.completeMetaOAuth,
);

export default router;
