const { app } = require("./app");
const { env } = require("./config/env");
const { logger } = require("./logger");
require("./db/pool");

const port = Number(env.PORT || 4000);

app.listen(port, () => {
  logger.info({ port, env: env.NODE_ENV }, "Server listening");
});
