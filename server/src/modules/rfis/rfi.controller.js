const {
  parseCreateRfiBody,
  parseUpdateRfiBody,
  parseResponseBody,
  parseWatcherBody,
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
  getRfiMetrics,
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

const metrics = asyncHandler(async (req, res) => {
  const data = await getRfiMetrics(req.project.id);
  res.json(data);
});

module.exports = {
  list,
  create,
  detail,
  update,
  respond,
  addWatcherHandler,
  removeWatcherHandler,
  metrics,
};
