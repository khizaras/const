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
  metrics,
} = require("./rfi.controller");

const projectRfiRouter = express.Router({ mergeParams: true });

projectRfiRouter.use(requireProjectAccess);
projectRfiRouter.get("/", list);
projectRfiRouter.post("/", create);
projectRfiRouter.get("/metrics", metrics);
projectRfiRouter.get("/:rfiId", detail);
projectRfiRouter.patch("/:rfiId", update);
projectRfiRouter.post("/:rfiId/responses", respond);
projectRfiRouter.post("/:rfiId/watchers", addWatcherHandler);
projectRfiRouter.delete("/:rfiId/watchers/:userId", removeWatcherHandler);

module.exports = { projectRfiRouter };
