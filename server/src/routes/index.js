const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { authRouter } = require("../modules/auth/auth.routes");
const {
  listProjects,
  createProjectHandler,
} = require("../modules/projects/project.controller");
const { projectUserRouter } = require("../modules/projects/project.routes");
const { projectRfiRouter } = require("../modules/rfis/rfi.routes");
const { projectIssueRouter } = require("../modules/issues/issue.routes");
const {
  projectDailyLogRouter,
} = require("../modules/dailyLogs/dailyLog.routes");
const {
  projectFileRouter,
  rfiAttachmentRouter,
  issueAttachmentRouter,
  dailyLogAttachmentRouter,
  fileRouter,
} = require("../modules/files/file.routes");
const { setupRouter } = require("../modules/setup/setup.routes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);

// Setup/installer endpoints are gated by env + token (no auth required)
apiRouter.use("/setup", setupRouter);

apiRouter.use(requireAuth);
apiRouter.get("/projects", listProjects);
apiRouter.post("/projects", createProjectHandler);
apiRouter.use("/projects/:projectId/users", projectUserRouter);
apiRouter.use("/projects/:projectId/rfis", projectRfiRouter);
apiRouter.use("/projects/:projectId/issues", projectIssueRouter);
apiRouter.use("/projects/:projectId/daily-logs", projectDailyLogRouter);
apiRouter.use(
  "/projects/:projectId/rfis/:rfiId/attachments",
  rfiAttachmentRouter
);
apiRouter.use(
  "/projects/:projectId/issues/:issueId/attachments",
  issueAttachmentRouter
);
apiRouter.use(
  "/projects/:projectId/daily-logs/:logId/attachments",
  dailyLogAttachmentRouter
);
apiRouter.use("/projects/:projectId/files", projectFileRouter);
apiRouter.use("/files", fileRouter);

module.exports = { apiRouter };
