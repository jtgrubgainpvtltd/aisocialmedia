/**
 * GrubGain Backend — Centralised Configuration
 * Single source of truth for all environment variables used across the API.
 */

export const config = {
  // ── Server ──────────────────────────────────────────────
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // ── Database ─────────────────────────────────────────────
  databaseUrl: process.env.DATABASE_URL,

  // ── JWT ──────────────────────────────────────────────────
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // ── Encryption ───────────────────────────────────────────
  encryption: {
    key: process.env.ENCRYPTION_KEY,
    iv: process.env.ENCRYPTION_IV,
  },

  // ── OpenAI ───────────────────────────────────────────────
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  // ── Meta (Facebook / Instagram) ──────────────────────────
  meta: {
    appId: process.env.META_APP_ID,
    appSecret: process.env.META_APP_SECRET,
    oauthRedirectUri: process.env.META_OAUTH_REDIRECT_URI,
    userToken: process.env.META_USER_TOKEN,
    appToken: process.env.META_APP_TOKEN,
  },

  // ── Google ───────────────────────────────────────────────
  google: {
    apiKey: process.env.GOOGLE_SERVICES_API_KEY,
  },

  // ── File Storage ─────────────────────────────────────────
  storage: {
    uploadsDir: process.env.UPLOADS_DIR || 'public/uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },

  // ── Rate Limiting ────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // ── Logging ──────────────────────────────────────────────
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
