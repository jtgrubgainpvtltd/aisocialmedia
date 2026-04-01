import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
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

// Import middleware
import errorHandler from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, "../public/uploads");

app.set("trust proxy", 1);

// ==================== Security Headers ====================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'"],
        connectSrc: [
          "'self'",
          process.env.CLIENT_URL || "http://localhost:5173",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// ==================== CORS Configuration ====================
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ==================== Body Parsers ====================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Serve static uploads with CORS headers
app.use(
  "/uploads",
  cors(corsOptions), // Add CORS to static files
  express.static(uploadsPath, {
    maxAge: "7d",
    etag: true,
  }),
);

// ==================== Rate Limiting ====================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// ==================== Request Logging ====================
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// ==================== Health Check ====================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ==================== API Routes ====================
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

// ==================== 404 Handler ====================
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ==================== Error Handler ====================
app.use(errorHandler);

export default app;
