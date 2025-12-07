const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { authRouter } = require("../modules/auth/auth.routes");
const { projectRfiRouter } = require("../modules/rfis/rfi.routes");
const {
  projectFileRouter,
  rfiAttachmentRouter,
  fileRouter,
} = require("../modules/files/file.routes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use(requireAuth);
apiRouter.use("/projects/:projectId/rfis", projectRfiRouter);
apiRouter.use(
  "/projects/:projectId/rfis/:rfiId/attachments",
  rfiAttachmentRouter
);
apiRouter.use("/projects/:projectId/files", projectFileRouter);
apiRouter.use("/files", fileRouter);

module.exports = { apiRouter };
