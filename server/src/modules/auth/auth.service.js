const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../../db/pool");
const { env } = require("../../config/env");
const { AppError } = require("../../utils/appError");

const TOKEN_TTL = "12h";

const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      orgId: user.organization_id,
    },
    env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );

const ensureProjectsBelongToOrg = async (conn, organizationId, projectIds) => {
  if (!projectIds?.length) return;
  const placeholders = projectIds.map(() => "?").join(",");
  const [rows] = await conn.query(
    `SELECT id FROM projects WHERE organization_id = ? AND id IN (${placeholders})`,
    [organizationId, ...projectIds]
  );
  if (rows.length !== projectIds.length) {
    throw new AppError(
      "One or more projects do not belong to the organization",
      400
    );
  }
};

const attachUserToProjects = async (conn, userId, projectIds) => {
  if (!projectIds?.length) return;
  const values = projectIds.flatMap((projectId) => [
    projectId,
    userId,
    "member",
  ]);
  const placeholders = projectIds.map(() => "(?, ?, ?)").join(",");
  await conn.query(
    `INSERT INTO project_users (project_id, user_id, role) VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    values
  );
};

const sanitizeUser = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
});

const registerUser = async (payload) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let organizationId = payload.organizationId || null;
    if (organizationId) {
      const [orgRows] = await conn.execute(
        "SELECT id FROM organizations WHERE id = ? LIMIT 1",
        [organizationId]
      );
      if (!orgRows.length) {
        throw new AppError("Organization not found", 404);
      }
    } else {
      const [orgResult] = await conn.execute(
        "INSERT INTO organizations (name) VALUES (?)",
        [payload.organizationName]
      );
      organizationId = orgResult.insertId;
    }

    await ensureProjectsBelongToOrg(conn, organizationId, payload.projectIds);

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const [userResult] = await conn.execute(
      `INSERT INTO users (
        organization_id, email, password_hash, first_name, last_name
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        organizationId,
        payload.email,
        passwordHash,
        payload.firstName,
        payload.lastName,
      ]
    );
    const userId = userResult.insertId;

    await attachUserToProjects(conn, userId, payload.projectIds);

    await conn.commit();

    const user = {
      id: userId,
      organization_id: organizationId,
      email: payload.email,
      first_name: payload.firstName,
      last_name: payload.lastName,
    };

    return {
      token: signToken(user),
      user: sanitizeUser(user),
    };
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError("Email already in use for this organization", 409);
    }
    throw err;
  } finally {
    conn.release();
  }
};

const loginUser = async ({ organizationId, email, password }) => {
  const [rows] = await pool.execute(
    `SELECT * FROM users WHERE organization_id = ? AND email = ? LIMIT 1`,
    [organizationId, email]
  );
  if (!rows.length) {
    throw new AppError("Invalid credentials", 401);
  }
  const user = rows[0];
  if (!user.is_active) {
    throw new AppError("Account disabled", 403);
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new AppError("Invalid credentials", 401);
  }
  return {
    token: signToken(user),
    user: sanitizeUser(user),
  };
};

const getCurrentUser = async (userId) => {
  const [rows] = await pool.execute(
    "SELECT id, organization_id, email, first_name, last_name FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  if (!rows.length) {
    throw new AppError("User not found", 404);
  }
  return sanitizeUser(rows[0]);
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
