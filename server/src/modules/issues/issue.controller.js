const { asyncHandler } = require("../../utils/asyncHandler");
const {
  parseCreateIssueBody,
  parseUpdateIssueBody,
  parseListQuery,
} = require("./issue.validators");
const {
  listIssues,
  createIssue,
  loadIssueDetail,
  updateIssue,
} = require("./issue.service");

const list = asyncHandler(async (req, res) => {
  const filters = parseListQuery(req.query);
  const result = await listIssues(req.project.id, filters);
  res.json(result);
});

const create = asyncHandler(async (req, res) => {
  const body = parseCreateIssueBody(req.body);
  const issue = await createIssue(req.project.id, req.user.id, body);
  res.status(201).json(issue);
});

const detail = asyncHandler(async (req, res) => {
  const issueId = Number(req.params.issueId);
  const issue = await loadIssueDetail(req.project.id, issueId);
  res.json(issue);
});

const update = asyncHandler(async (req, res) => {
  const issueId = Number(req.params.issueId);
  const body = parseUpdateIssueBody(req.body);
  const issue = await updateIssue(req.project.id, issueId, body, req.user.id);
  res.json(issue);
});

const bulkClose = asyncHandler(async (req, res) => {
  const { issueIds } = req.body;
  if (!Array.isArray(issueIds) || issueIds.length === 0) {
    return res.status(400).json({ error: "issueIds array is required" });
  }

  const { bulkUpdateIssues } = require("./issue.service");
  const result = await bulkUpdateIssues(
    req.project.id,
    issueIds,
    { status: "closed" },
    req.user.id
  );

  res.json(result);
});

const exportCSV = asyncHandler(async (req, res) => {
  const { arrayToCSV, setCSVHeaders } = require("../../utils/csvExport");
  const filters = parseListQuery(req.query);
  const result = await listIssues(req.project.id, filters);

  const columns = [
    { key: "issueNumber", label: "Issue Number" },
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "location", label: "Location" },
    { key: "trade", label: "Trade" },
    { key: "assignedToName", label: "Assigned To" },
    { key: "createdByName", label: "Created By" },
    { key: "dueDate", label: "Due Date" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
  ];

  const csv = arrayToCSV(result.data || [], columns);
  const filename = `issues_project_${req.project.id}_${new Date().toISOString().split("T")[0]}.csv`;

  setCSVHeaders(res, filename);
  res.send(csv);
});

module.exports = { list, create, detail, update, bulkClose, exportCSV };
