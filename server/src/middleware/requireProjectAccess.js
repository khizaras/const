const { pool } = require("../db/pool");
const { AppError } = require("../utils/appError");
const { asyncHandler } = require("../utils/asyncHandler");

const requireProjectAccess = asyncHandler(async (req, res, next) => {
  const projectId = Number(req.params.projectId);
  if (!projectId) {
    throw new AppError("Invalid project id", 400);
  }
  const userId = req.user.id;
  const [rows] = await pool.execute(
    `SELECT pu.role, p.organization_id AS organizationId
     FROM project_users pu
     JOIN projects p ON p.id = pu.project_id
     WHERE pu.project_id = ? AND pu.user_id = ?
     LIMIT 1`,
    [projectId, userId]
  );
  if (!rows.length) {
    throw new AppError("You do not have access to this project", 403);
  }
  req.project = {
    id: projectId,
    organizationId: rows[0].organizationId,
    role: rows[0].role,
  };
  next();
});

module.exports = { requireProjectAccess };
