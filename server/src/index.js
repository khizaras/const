const { app } = require("./app");
const { env } = require("./config/env");
const { logger } = require("./logger");
const { initializeTransporter } = require("./services/emailService");
const { initializeScheduler } = require("./scheduler");
require("./db/pool");

const port = Number(env.PORT || 4000);

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception - process exiting");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection - process exiting");
  process.exit(1);
});

logger.info(
  {
    env: env.NODE_ENV,
    port,
    mysql: {
      host: env.MYSQL_HOST,
      port: Number(env.MYSQL_PORT),
      db: env.MYSQL_DB,
      user: env.MYSQL_USER,
    },
  },
  "Starting server"
);

// Initialize email service
try {
  initializeTransporter();
} catch (err) {
  logger.error({ err }, "Email transporter init failed");
}

const server = app.listen(port, () => {
  logger.info({ port, env: env.NODE_ENV }, "Server listening");

  // Initialize scheduled jobs after server starts
  try {
    initializeScheduler();
  } catch (err) {
    logger.error({ err }, "Scheduler init failed");
  }
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    logger.fatal(
      {
        port,
        err,
        hint: "Port is in use. On the server run: `npx kill-port 3500` (or change PORT env var).",
      },
      "Failed to start server (EADDRINUSE)"
    );
    process.exit(1);
  }
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
