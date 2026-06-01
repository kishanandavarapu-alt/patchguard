require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const scanRouter = require("./routes/scan");
const vulnerabilitiesRouter = require("./routes/vulnerabilities");
const patchRouter = require("./routes/patch");
const logsRouter = require("./routes/logs");
const alertsRouter = require("./routes/alerts");
const endpointsRouter = require("./routes/endpoints");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);

// Attach a unique request ID to every request for tracing
app.use((req, _res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  console.log(`[server] -> ${req.requestId} | ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/scan", scanRouter);
app.use("/api/vulnerabilities", vulnerabilitiesRouter);
app.use("/api/patch", patchRouter);
app.use("/api/logs", logsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/endpoints", endpointsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  console.warn(`[server] 404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, _next) => {
  const status = err.status || 500;

  console.error(`[server] ${status} - ${err.message}`, {
    requestId: req.requestId,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  res.status(status).json({
    error: err.message || "Internal server error",
    requestId: req.requestId,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// Start
app.listen(PORT, () => {
  console.log(`\n[server] Listening on http://localhost:${PORT}`);
  console.log(`[server] ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `[server] Supabase: ${
      process.env.SUPABASE_URL ? "configured" : "missing"
    }`
  );
  console.log(
    `[server] NVD key: ${
      process.env.NVD_API_KEY ? "configured" : "missing (rate-limited)"
    }`
  );
  console.log(
    `[server] Resend key: ${
      process.env.RESEND_API_KEY
        ? "configured"
        : "missing (email alerts disabled)"
    }\n`
  );
});

module.exports = app; // for testing