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

const exportCSV = asyncHandler(async (req, res) => {
  const { arrayToCSV, setCSVHeaders } = require("../../utils/csvExport");
  const filters = parseDailyLogListQuery(req.query);
  const result = await listDailyLogs(req.project.id, filters);

  const columns = [
    { key: "logDate", label: "Date" },
    { key: "shift", label: "Shift" },
    { key: "weather", label: "Weather" },
    { key: "temperature", label: "Temperature" },
    { key: "workPerformed", label: "Work Performed" },
    { key: "safetyNotes", label: "Safety Notes" },
    { key: "delays", label: "Delays" },
    { key: "status", label: "Status" },
    { key: "createdByName", label: "Created By" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
  ];

  const csv = arrayToCSV(result.data || [], columns);
  const filename = `daily_logs_project_${req.project.id}_${new Date().toISOString().split("T")[0]}.csv`;

  setCSVHeaders(res, filename);
  res.send(csv);
});

module.exports = { list, create, detail, update, exportCSV };
