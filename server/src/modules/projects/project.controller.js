const { asyncHandler } = require("../../utils/asyncHandler");
const { getProjectUsers } = require("./project.service");

/**
 * Get users in a project
 * GET /api/projects/:projectId/users
 */
const listUsers = asyncHandler(async (req, res) => {
  const users = await getProjectUsers(req.project.id);
  res.json({ data: users });
});

module.exports = {
  listUsers,
};
