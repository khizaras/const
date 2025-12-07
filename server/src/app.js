const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { json } = require("express");
const { ZodError } = require("zod");
const { logger } = require("./logger");
const { apiRouter } = require("./routes");
const { AppError } = require("./utils/appError");

const app = express();

app.use(helmet());
app.use(cors());
app.use(json({ limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: "Validation error", details: err.errors });
  }
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ error: err.message, meta: err.meta });
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

module.exports = { app };
