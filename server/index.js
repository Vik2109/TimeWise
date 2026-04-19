const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const path = require("path");

dotenv.config();

const logger = require("./utils/logger");
const { connectDB, getDBHealth } = require("./config/database");
const { startCronJobs } = require("./utils/cronJobs");
const { verifySMTP } = require("./utils/sendEmail");
require("./config/passport");
const {
  globalErrorHandler,
  notFoundHandler,
} = require("./middleware/errorHandler");

const app = express();

// Trust proxy (Railway / Render / Heroku)
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("CORS: " + origin + " not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
    maxAge: 86400,
  }),
);

const passport = require("passport");
const session = require('express-session')

// ── Body / compression / sanitize ────────────────────────────
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      "sort",
      "fields",
      "page",
      "limit",
      "category",
      "priority",
      "status",
    ],
  }),
);

// ── Rate limiting ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Try again later." },
  skip: (req) => req.path === "/api/health",
});
const authLimiter = rateLimit({
  windowMs: 900000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },
});
app.use("/api/", globalLimiter);

// ── HTTP logging ──────────────────────────────────────────────
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: logger.stream,
    skip: (req, res) => res.statusCode < 400,
  }),
);

// ── API Routes ────────────────────────────────────────────────
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/events", require("./routes/events"));
app.use("/api/habits", require("./routes/habits"));
app.use("/api/pomodoro", require("./routes/pomodoro"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/export", require("./routes/export"));

// ── Health check ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const db = getDBHealth();
  res.status(db.readyState === 1 ? 200 : 503).json({
    success: db.readyState === 1,
    status: db.readyState === 1 ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
    database: db,
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1048576) + "MB",
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1048576) + "MB",
      rss: Math.round(process.memoryUsage().rss / 1048576) + "MB",
    },
  });
});

// ── Serve React build in production ──────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientBuild = path.join(__dirname, "../client/dist");
  app.use(express.static(clientBuild));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api"))
      res.sendFile(path.join(clientBuild, "index.html"));
  });
}

// ── Error handlers ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Bootstrap ─────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

const bootstrap = async () => {
  try {
    await connectDB();
    await verifySMTP();
    startCronJobs();
    const server = app.listen(PORT, () => {
      logger.info(
        "🚀 Server running on port " + PORT + " [" + process.env.NODE_ENV + "]",
      );
      logger.info("📡 API: http://localhost:" + PORT + "/api");
      logger.info("❤️  Health: http://localhost:" + PORT + "/api/health");
    });
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION: " + err.message);
      server.close(() => process.exit(1));
    });
    return server;
  } catch (err) {
    logger.error("Bootstrap failed: " + err.message);
    process.exit(1);
  }
};

bootstrap();
module.exports = app;
