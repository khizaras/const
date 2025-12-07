const { app } = require("./app");
const { env } = require("./config/env");
const { logger } = require("./logger");
const { initializeTransporter } = require("./services/emailService");
require("./db/pool");

const port = Number(env.PORT || 4000);

// Initialize email service
initializeTransporter();

app.listen(port, () => {
  logger.info({ port, env: env.NODE_ENV }, "Server listening");
});
