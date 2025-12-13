const express = require("express");
const {
  requireProjectAccess,
} = require("../../middleware/requireProjectAccess");
const { list, create, detail, update } = require("./dailyLog.controller");

const projectDailyLogRouter = express.Router({ mergeParams: true });
projectDailyLogRouter.use(requireProjectAccess);

projectDailyLogRouter.get("/", list);
projectDailyLogRouter.post("/", create);
projectDailyLogRouter.get("/:logId", detail);
projectDailyLogRouter.patch("/:logId", update);

module.exports = { projectDailyLogRouter };
