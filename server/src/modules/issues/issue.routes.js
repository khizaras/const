const express = require("express");
const {
  requireProjectAccess,
} = require("../../middleware/requireProjectAccess");
const { list, create, detail, update } = require("./issue.controller");

const projectIssueRouter = express.Router({ mergeParams: true });

projectIssueRouter.use(requireProjectAccess);
projectIssueRouter.get("/", list);
projectIssueRouter.post("/", create);
projectIssueRouter.get("/:issueId", detail);
projectIssueRouter.patch("/:issueId", update);

module.exports = { projectIssueRouter };
