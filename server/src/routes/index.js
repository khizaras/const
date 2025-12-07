const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { authRouter } = require("../modules/auth/auth.routes");
const { projectRfiRouter } = require("../modules/rfis/rfi.routes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use(requireAuth);
apiRouter.use("/projects/:projectId/rfis", projectRfiRouter);

module.exports = { apiRouter };
