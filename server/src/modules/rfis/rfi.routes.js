const express = require("express");
const {
  requireProjectAccess,
} = require("../../middleware/requireProjectAccess");
const {
  list,
  create,
  detail,
  update,
  respond,
  addWatcherHandler,
  removeWatcherHandler,
  listComments,
  addComment,
  deleteComment,
  metrics,
  auditLogs,
  getWorkflow,
  getSlaStatus,
  exportCSV,
} = require("./rfi.controller");

const projectRfiRouter = express.Router({ mergeParams: true });

projectRfiRouter.use(requireProjectAccess);
projectRfiRouter.get("/", list);
projectRfiRouter.post("/", create);
projectRfiRouter.get("/metrics", metrics);
projectRfiRouter.get("/workflow", getWorkflow);
projectRfiRouter.get("/sla-status", getSlaStatus);
projectRfiRouter.get("/export/csv", exportCSV);
projectRfiRouter.get("/:rfiId", detail);
projectRfiRouter.get("/:rfiId/audit", auditLogs);
projectRfiRouter.patch("/:rfiId", update);
projectRfiRouter.post("/:rfiId/responses", respond);
projectRfiRouter.post("/:rfiId/watchers", addWatcherHandler);
projectRfiRouter.delete("/:rfiId/watchers/:userId", removeWatcherHandler);
projectRfiRouter.get("/:rfiId/comments", listComments);
projectRfiRouter.post("/:rfiId/comments", addComment);
projectRfiRouter.delete("/:rfiId/comments/:commentId", deleteComment);

module.exports = { projectRfiRouter };
