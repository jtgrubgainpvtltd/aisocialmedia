import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth.js";
import * as integrationController from "../controllers/integrationController.js";

const router = express.Router();

const oauthCallbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many OAuth callback requests. Please try again later.",
});

router.get(
  "/test-all",
  authenticate,
  integrationController.testAllIntegrations,
);

router.get(
  "/test-user-token",
  authenticate,
  integrationController.testUserToken,
);

router.get("/test-app-token", authenticate, integrationController.testAppToken);

router.get("/test-pages", authenticate, integrationController.testGetPages);

router.get(
  "/test-instagram",
  authenticate,
  integrationController.testGetInstagram,
);

router.get("/", authenticate, integrationController.getIntegrations);

router.post("/connect", authenticate, integrationController.connectMeta);
router.post("/connect-meta", authenticate, integrationController.connectMeta);

router.get(
  "/meta/oauth-url",
  authenticate,
  integrationController.getMetaOAuthUrl,
);

router.get("/meta/callback", oauthCallbackLimiter, integrationController.handleMetaOAuthCallback);

router.get(
  "/meta/oauth-pages",
  authenticate,
  integrationController.getOAuthPages,
);

router.post(
  "/meta/complete-oauth",
  authenticate,
  integrationController.completeMetaOAuth,
);

export default router;
