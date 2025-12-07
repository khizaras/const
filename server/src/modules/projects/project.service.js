const { pool } = require("../../db/pool");

/**
 * Get all users in a project
 */
async function getProjectUsers(projectId) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
            pu.role AS project_role
     FROM project_users pu
     JOIN users u ON u.id = pu.user_id
     WHERE pu.project_id = ?
     ORDER BY u.first_name, u.last_name`,
    [projectId]
  );

  return rows;
}

module.exports = {
  getProjectUsers,
};
