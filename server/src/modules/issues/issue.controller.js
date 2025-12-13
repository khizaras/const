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

module.exports = { list, create, detail, update };
