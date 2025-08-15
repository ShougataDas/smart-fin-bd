import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import { RateLimiterMemory } from "rate-limiter-flexible";

import { connectDatabase } from "./config/database";
import { initializeFirebase } from "./config/firebase";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";

// Route imports
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import investmentRoutes from "./routes/investment";
import recommendationRoutes from "./routes/recommendation";
import chatRoutes from "./routes/chat";
import portfolioRoutes from "./routes/portfolio";
import marketDataRoutes from "./routes/marketData";
import notificationRoutes from "./routes/notification";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
});

const rateLimitMiddleware = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please try again later.",
        });
    }
};

// Middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    })
);

app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? ["https://smartfin-bd.com", "https://app.smartfin-bd.com"]
                : true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(compression());
app.use(
    morgan("combined", {
        stream: { write: (message) => logger.info(message.trim()) },
    })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(rateLimitMiddleware);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0",
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/investments", authMiddleware, investmentRoutes);
app.use("/api/recommendations", authMiddleware, recommendationRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/portfolio", authMiddleware, portfolioRoutes);
app.use("/api/market-data", marketDataRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);

// API Documentation endpoint
app.get("/api", (req, res) => {
    res.json({
        name: "SmartFin BD API",
        version: "1.0.0",
        description: "Financial Mentor API for Bangladeshi Users",
        endpoints: {
            auth: "/api/auth",
            users: "/api/users",
            investments: "/api/investments",
            recommendations: "/api/recommendations",
            chat: "/api/chat",
            portfolio: "/api/portfolio",
            marketData: "/api/market-data",
            notifications: "/api/notifications",
        },
        documentation: "https://docs.smartfin-bd.com",
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `Route ${req.originalUrl} not found`,
    });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
    logger.info("SIGTERM received. Shutting down gracefully...");
    process.exit(0);
});

process.on("SIGINT", () => {
    logger.info("SIGINT received. Shutting down gracefully...");
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        // Initialize database
        await connectDatabase();
        logger.info("Database connected successfully");

        // Initialize Firebase
        await initializeFirebase();
        logger.info("Firebase initialized successfully");

        // Start listening
        app.listen(PORT, "0.0.0.0", () => {
            logger.info(`🚀 SmartFin BD API server running on port ${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
            logger.info(`📚 API docs: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        logger.error("Failed to start server:", error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});

startServer();

export default app;
