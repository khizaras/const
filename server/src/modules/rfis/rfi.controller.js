const {
  parseCreateRfiBody,
  parseUpdateRfiBody,
  parseResponseBody,
  parseWatcherBody,
  parseCommentBody,
  parseListQuery,
} = require("./rfi.validators");
const {
  listRfis,
  loadRfiDetail,
  createRfi,
  updateRfi,
  addRfiResponse,
  addWatcher,
  removeWatcher,
  listRfiComments,
  addRfiComment,
  deleteRfiComment,
  getRfiMetrics,
  listRfiAuditLogs,
} = require("./rfi.service");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const filters = parseListQuery(req.query);
  const result = await listRfis(req.project.id, filters);
  res.json(result);
});

const create = asyncHandler(async (req, res) => {
  const body = parseCreateRfiBody(req.body);
  const rfi = await createRfi(req.project.id, req.user.id, body);
  res.status(201).json(rfi);
});

const detail = asyncHandler(async (req, res) => {
  const rfiId = Number(req.params.rfiId);
  const rfi = await loadRfiDetail(req.project.id, rfiId);
  res.json(rfi);
});

const update = asyncHandler(async (req, res) => {
  const rfiId = Number(req.params.rfiId);
  const body = parseUpdateRfiBody(req.body);
  const rfi = await updateRfi(req.project.id, rfiId, body, req.user.id);
  res.json(rfi);
});

const respond = asyncHandler(async (req, res) => {
  const rfiId = Number(req.params.rfiId);
  const body = parseResponseBody(req.body);
  const result = await addRfiResponse(req.project.id, rfiId, req.user.id, body);
  res.status(201).json(result);
});

const addWatcherHandler = asyncHandler(async (req, res) => {
  const rfiId = Number(req.params.rfiId);
  const { userId } = parseWatcherBody(req.body);
  const rfi = await addWatcher(req.project.id, rfiId, userId);
  res.json(rfi);
});

const removeWatcherHandler = asyncHandler(async (req, res) => {
  const rfiId = Number(req.params.rfiId);
  const watcherUserId = Number(req.params.userId);
  const rfi = await removeWatcher(req.project.id, rfiId, watcherUserId);
  res.json(rfi);
});

const listComments = asyncHandler(async (req, res) => {
  const rfiId = Number(req.params.rfiId);
  const comments = await listRfiComments(req.project.id, rfiId);
  res.json({ data: comments });
});

const addComment = asyncHandler(async (req, res) => {
  const rfiId = Number(req.params.rfiId);
  const body = parseCommentBody(req.body);
  const comment = await addRfiComment(
    req.project.id,
    rfiId,
    req.user.id,
    body.body
  );
  res.status(201).json({ data: comment });
});

const deleteComment = asyncHandler(async (req, res) => {
  const rfiId = Number(req.params.rfiId);
  const commentId = Number(req.params.commentId);
  await deleteRfiComment({
    projectId: req.project.id,
    rfiId,
    commentId,
    userId: req.user.id,
    role: req.project.role,
  });
  res.json({ success: true });
});

const metrics = asyncHandler(async (req, res) => {
  const data = await getRfiMetrics(req.project.id);
  res.json(data);
});

const auditLogs = asyncHandler(async (req, res) => {
  const rfiId = Number(req.params.rfiId);
  const logs = await listRfiAuditLogs(req.project.id, rfiId);
  res.json({ data: logs });
});

const getWorkflow = asyncHandler(async (req, res) => {
  const {
    getWorkflowDefinition,
    DEFAULT_RFI_WORKFLOW,
  } = require("./rfi.workflow");
  const workflow = await getWorkflowDefinition(req.project.id);
  res.json({ workflow: workflow || DEFAULT_RFI_WORKFLOW });
});

const getSlaStatus = asyncHandler(async (req, res) => {
  const { getSlaStatusSummary } = require("./sla.service");
  const summary = await getSlaStatusSummary(req.project.id);
  res.json(summary);
});

module.exports = {
  list,
  create,
  detail,
  update,
  respond,
  addWatcherHandler,
  removeWatcherHandler,
  listComments,
  addComment,
  deleteComment,
  metrics,
  auditLogs,
  getWorkflow,
  getSlaStatus,
};
