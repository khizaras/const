const express = require("express");
const { list, readOne, readAll } = require("./notification.controller");

const router = express.Router();

router.get("/", list);
router.post("/:id/read", readOne);
router.post("/read-all", readAll);

module.exports = { notificationRouter: router };
