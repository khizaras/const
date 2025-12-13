const { asyncHandler } = require("../../utils/asyncHandler");
const { AppError } = require("../../utils/appError");
const {
  parseCreateProjectBody,
  parseAddProjectUserBody,
} = require("./project.validators");
const {
  getProjectUsers,
  listProjectsForUser,
  createProject,
  addUserToProject,
} = require("./project.service");

/**
 * List projects for current user
 * GET /api/projects
 */
const listProjects = asyncHandler(async (req, res) => {
  const projects = await listProjectsForUser(req.user.id);
  res.json({ data: projects });
});

/**
 * Create a project for current org
 * POST /api/projects
 */
const createProjectHandler = asyncHandler(async (req, res) => {
  const body = parseCreateProjectBody(req.body || {});
  const created = await createProject({
    organizationId: req.user.organizationId,
    createdByUserId: req.user.id,
    name: body.name,
    code: body.code,
    startDate: body.startDate,
    endDate: body.endDate,
  });

  if (!created) {
    throw new AppError("Failed to create project", 500);
  }

  res.status(201).json({ data: created });
});

/**
 * Get users in a project
 * GET /api/projects/:projectId/users
 */
const listUsers = asyncHandler(async (req, res) => {
  const users = await getProjectUsers(req.project.id);
  res.json({ data: users });
});

/**
 * Add an existing user to a project (admin only)
 * POST /api/projects/:projectId/users
 */
const addUser = asyncHandler(async (req, res) => {
  if (req.project?.role !== "admin") {
    throw new AppError("Only project admins can add members", 403);
  }

  const body = parseAddProjectUserBody(req.body || {});
  const added = await addUserToProject({
    projectId: req.project.id,
    organizationId: req.user.organizationId,
    email: body.email,
    role: body.role,
  });

  res.status(201).json({ data: added });
});

module.exports = {
  listProjects,
  createProjectHandler,
  listUsers,
  addUser,
};
