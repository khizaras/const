const express = require("express");
const {
  requireProjectAccess,
} = require("../../middleware/requireProjectAccess");
const { listUsers, addUser } = require("./project.controller");

const projectUserRouter = express.Router({ mergeParams: true });

projectUserRouter.use(requireProjectAccess);
projectUserRouter.get("/", listUsers);
projectUserRouter.post("/", addUser);

module.exports = { projectUserRouter };
