const { asyncHandler } = require("../../utils/asyncHandler");
const {
  parseCreateDailyLogBody,
  parseUpdateDailyLogBody,
  parseDailyLogListQuery,
} = require("./dailyLog.validators");
const {
  listDailyLogs,
  createDailyLog,
  loadDailyLogDetail,
  updateDailyLog,
} = require("./dailyLog.service");

const list = asyncHandler(async (req, res) => {
  const filters = parseDailyLogListQuery(req.query);
  const result = await listDailyLogs(req.project.id, filters);
  res.json(result);
});

const create = asyncHandler(async (req, res) => {
  const body = parseCreateDailyLogBody(req.body);
  const log = await createDailyLog(req.project.id, req.user.id, body);
  res.status(201).json(log);
});

const detail = asyncHandler(async (req, res) => {
  const logId = Number(req.params.logId);
  const log = await loadDailyLogDetail(req.project.id, logId);
  res.json(log);
});

const update = asyncHandler(async (req, res) => {
  const logId = Number(req.params.logId);
  const body = parseUpdateDailyLogBody(req.body);
  const log = await updateDailyLog(req.project.id, logId, body, req.user.id);
  res.json(log);
});

module.exports = { list, create, detail, update };
