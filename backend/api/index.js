import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { verifyRefreshToken } from "./utils/jwt.js";
import prisma from "../prisma/client.js";

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
const shouldLogRequests = process.env.REQUEST_LOGGING
  ? process.env.REQUEST_LOGGING === "true"
  : process.env.NODE_ENV === "production";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, "../public/uploads");

if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// ==================== Security Headers ====================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "http://localhost:5000",
          "https://res.cloudinary.com",
        ],
        scriptSrc: ["'self'"],
        connectSrc: [
          "'self'",
          process.env.CLIENT_URL || "http://localhost:5173",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// ==================== CORS Configuration ====================
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser tools (curl/postman) and same-origin requests without Origin.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS: Origin not allowed"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(cookieParser());

const protectGeneratedUploads = async (req, res, next) => {
  const fileName = req.path.split("/").pop() || "";
  if (!fileName.startsWith("generated_")) {
    return next();
  }

  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required to access generated images" },
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, user_id: decoded.userId },
      select: { id: true, expires_at: true },
    });

    if (!tokenRecord || tokenRecord.expires_at < new Date()) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid session for generated image access" },
      });
    }

    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid session for generated image access" },
    });
  }
};

app.use(
  "/uploads",
  protectGeneratedUploads,
  cors(corsOptions),
  express.static(uploadsPath, {
    maxAge: "7d",
    etag: true,
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// ==================== Request Logging ====================
app.use((req, res, next) => {
  if (shouldLogRequests) {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  }
  next();
});

// ==================== Health Check ====================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
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
