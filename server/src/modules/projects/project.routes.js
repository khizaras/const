const express = require("express");
const {
  requireProjectAccess,
} = require("../../middleware/requireProjectAccess");
const { listUsers } = require("./project.controller");

const projectUserRouter = express.Router({ mergeParams: true });

projectUserRouter.use(requireProjectAccess);
projectUserRouter.get("/", listUsers);

module.exports = { projectUserRouter };
