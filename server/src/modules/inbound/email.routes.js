const express = require("express");
const router = express.Router();
const { handleInbound, getRfiByNumberPublic } = require("./email.controller");

// Public webhook endpoint for inbound emails from provider
router.post("/email", handleInbound);
// Test-only helper to fetch RFI by number without auth
router.get("/test/rfi/:projectId/:number", getRfiByNumberPublic);

module.exports = { inboundRouter: router };
