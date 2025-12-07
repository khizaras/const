const express = require("express");
const {
  requireProjectAccess,
} = require("../../middleware/requireProjectAccess");
const { listUsers } = require("./project.controller");

const projectRouter = express.Router({ mergeParams: true });

projectRouter.use(requireProjectAccess);
projectRouter.get("/:projectId/users", listUsers);

module.exports = { projectRouter };
