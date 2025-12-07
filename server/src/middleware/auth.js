const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");
const { env } = require("../config/env");
const { AppError } = require("../utils/appError");
const { asyncHandler } = require("../utils/asyncHandler");

const extractToken = (req) => {
  const header = req.header("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  return token;
};

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }

  const [rows] = await pool.execute(
    `SELECT id, organization_id, email, first_name, last_name, is_active
     FROM users WHERE id = ? LIMIT 1`,
    [payload.sub]
  );

  if (!rows.length) {
    throw new AppError("Account not found", 401);
  }

  const user = rows[0];
  if (!user.is_active) {
    throw new AppError("Account disabled", 403);
  }
  if (payload.orgId && user.organization_id !== payload.orgId) {
    throw new AppError("Organization mismatch", 403);
  }

  req.user = {
    id: user.id,
    organizationId: user.organization_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
  };
  next();
});

module.exports = { requireAuth };
