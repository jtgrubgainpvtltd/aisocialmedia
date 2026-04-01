import dotenv from "dotenv";
import fs from "fs";
import app from "./api/index.js";
import { logger } from "./api/utils/logger.js";
import { PrismaClient } from "@prisma/client";
import { startJobScheduler } from "./api/jobs/jobScheduler.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    logger.info("✅ Database connected successfully");
  } catch (error) {
    logger.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    // Test database connection
    await testDatabaseConnection();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info("=".repeat(50));
      logger.info(`🚀 GrubGain API Server Started`);
      logger.info(`📍 Environment: ${NODE_ENV}`);
      logger.info(`🌐 Server running on: http://localhost:${PORT}`);
      logger.info(`💡 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API Base: http://localhost:${PORT}/api/v1`);
      logger.info("=".repeat(50));

      // Start background job scheduler (processes due scheduled posts every minute)
      startJobScheduler();
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        // Disconnect Prisma
        await prisma.$disconnect();
        logger.info("Database disconnected");

        logger.info("Process terminated successfully");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      fs.writeFileSync("crash.txt", error.stack || error.toString()); // sync, no dynamic import
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
