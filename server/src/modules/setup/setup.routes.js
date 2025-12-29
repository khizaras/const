const express = require("express");
const { status, install } = require("./setup.controller");

const setupRouter = express.Router();

setupRouter.get("/status", status);
setupRouter.post("/install", install);

module.exports = { setupRouter };
