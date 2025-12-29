const express = require("express");
const router = express.Router();
const { handleInbound, getRfiByNumberPublic } = require("./email.controller");

const getClientIp = (req) => {
  const xfwd = req.headers["x-forwarded-for"];
  if (xfwd) return xfwd.split(",")[0].trim();
  return req.ip || "";
};

const validateInbound = (req, res, next) => {
  const token = process.env.INBOUND_EMAIL_TOKEN;
  const allowlistRaw = process.env.INBOUND_EMAIL_ALLOWLIST;

  if (token) {
    const headerToken = req.headers["x-inbound-token"];
    if (!headerToken || headerToken !== token) {
      return res.status(401).json({ error: "Unauthorized inbound webhook" });
    }
  }

  if (allowlistRaw) {
    const allowlist = allowlistRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const clientIp = getClientIp(req);
    if (allowlist.length && !allowlist.includes(clientIp)) {
      return res
        .status(403)
        .json({ error: "IP not allowed for inbound webhook" });
    }
  }

  next();
};

// Public webhook endpoint for inbound emails from provider (secured via token/allow-list)
router.post("/email", validateInbound, handleInbound);
// Test-only helper to fetch RFI by number without auth
router.get("/test/rfi/:projectId/:number", getRfiByNumberPublic);

// Export router directly and also under a named key for backward compatibility
module.exports = router;
module.exports.inboundRouter = router;
