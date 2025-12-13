const { pool } = require("../../db/pool");
const { AppError } = require("../../utils/appError");

/**
 * List projects a user can access
 */
async function listProjectsForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.name, p.code, p.status, p.start_date, p.end_date,
            pu.role AS project_role
     FROM project_users pu
     JOIN projects p ON p.id = pu.project_id
     WHERE pu.user_id = ?
     ORDER BY (p.status = 'active') DESC, p.name ASC`,
    [userId]
  );
  return rows;
}

/**
 * Create a project and grant creator access
 */
async function createProject({
  organizationId,
  createdByUserId,
  name,
  code,
  startDate,
  endDate,
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO projects (organization_id, name, code, status, start_date, end_date)
       VALUES (?, ?, ?, 'active', ?, ?)`,
      [organizationId, name, code || null, startDate || null, endDate || null]
    );

    const projectId = result.insertId;

    await conn.execute(
      `INSERT INTO project_users (project_id, user_id, role)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [projectId, createdByUserId, "admin"]
    );

    await conn.commit();

    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.code, p.status, p.start_date, p.end_date,
              pu.role AS project_role
       FROM projects p
       JOIN project_users pu ON pu.project_id = p.id
       WHERE p.id = ? AND pu.user_id = ?
       LIMIT 1`,
      [projectId, createdByUserId]
    );

    return rows[0];
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {
      // ignore
    }
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get all users in a project
 */
async function getProjectUsers(projectId) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.first_name, u.last_name, u.email,
            pu.role AS project_role
     FROM project_users pu
     JOIN users u ON u.id = pu.user_id
     WHERE pu.project_id = ?
     ORDER BY u.first_name, u.last_name`,
    [projectId]
  );

  return rows;
}

/**
 * Add an existing organization user to a project (or update role)
 */
async function addUserToProject({ projectId, organizationId, email, role }) {
  const [userRows] = await pool.execute(
    `SELECT id, first_name, last_name, email
     FROM users
     WHERE organization_id = ? AND LOWER(email) = LOWER(?)
     LIMIT 1`,
    [organizationId, email]
  );

  if (!userRows.length) {
    throw new AppError("User not found in organization", 404);
  }

  const user = userRows[0];

  await pool.execute(
    `INSERT INTO project_users (project_id, user_id, role)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [projectId, user.id, role]
  );

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    project_role: role,
  };
}

module.exports = {
  listProjectsForUser,
  createProject,
  getProjectUsers,
  addUserToProject,
};
