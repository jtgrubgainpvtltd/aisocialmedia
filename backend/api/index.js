import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

// Import middleware & routes
import errorHandler from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";
import authRoutes from "./routes/auth.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import contentRoutes from "./routes/content.routes.js";
import postRoutes from "./routes/post.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import trendRoutes from "./routes/trend.routes.js";
import integrationRoutes from "./routes/integration.routes.js";
import locationRoutes from "./routes/location.routes.js";
import googleRoutes from "./routes/google.routes.js";
import replyRoutes from "./routes/reply.routes.js";

dotenv.config();

// 1. INITIALIZE APP FIRST
const app = express();

// 2. PROXY SETTINGS
app.set('trust proxy', 1);

// 3. CORS CONFIGURATION
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true); // Allow all origins (Vercel, Ngrok, local)
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning", "Accept"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

// 4. SECURITY & PARSING
app.use(helmet({
  contentSecurityPolicy: false,       // Disabled — CSP is handled by Vercel
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(cookieParser());

// 5. STATIC FILES — /uploads served openly (cross-origin img tags cannot send cookies)
//    Security: filenames are unguessable timestamps; only authenticated API calls reveal URLs.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, "../public/uploads");

app.use("/uploads", express.static(uploadsPath, {
  maxAge: "7d",
  etag: true,
  setHeaders: (res) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  },
}));

// 6. RATE LIMITING
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// 7. HEALTH CHECK
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 8. API ROUTES
const API_VERSION = "/api/v1";
app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/restaurant`, restaurantRoutes);
app.use(`${API_VERSION}/content`, contentRoutes);
app.use(`${API_VERSION}/posts`, postRoutes);
app.use(`${API_VERSION}/analytics`, analyticsRoutes);
app.use(`${API_VERSION}/trends`, trendRoutes);
app.use(`${API_VERSION}/integrations`, integrationRoutes);
app.use(`${API_VERSION}/locations`, locationRoutes);
app.use(`${API_VERSION}/google`, googleRoutes);
app.use(`${API_VERSION}/replies`, replyRoutes);

// 9. ERROR HANDLING
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
app.use(errorHandler);

export default app;
