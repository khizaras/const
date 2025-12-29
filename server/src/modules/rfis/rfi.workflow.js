const { pool } = require("../../db/pool");
const { AppError } = require("../../utils/appError");

const DEFAULT_RFI_WORKFLOW = [
  { key: "open", label: "Open", color: "#1890ff" },
  { key: "in_review", label: "In Review", color: "#faad14" },
  { key: "answered", label: "Answered", color: "#52c41a" },
  { key: "closed", label: "Closed", color: "#bfbfbf" },
  { key: "void", label: "Void", color: "#ff4d4f" },
];

const TRANSITIONS = {
  open: ["in_review", "answered", "void"],
  in_review: ["answered", "open", "void"],
  answered: ["closed", "open", "void"],
  closed: ["open"],
  void: ["open"],
};

const getAllowedTransitions = (currentStatus) => {
  return TRANSITIONS[currentStatus] || [];
};

const isTransitionAllowed = (from, to) => {
  if (!from || !to) return false;
  return getAllowedTransitions(from).includes(to);
};

const getWorkflowDefinition = async (projectId) => {
  try {
    const [[row]] = await pool.execute(
      `SELECT workflow_definition FROM projects WHERE id = ?`,
      [projectId]
    );
    if (row?.workflow_definition) {
      return JSON.parse(row.workflow_definition);
    }
  } catch (_) {
    // fallback to default
  }
  return DEFAULT_RFI_WORKFLOW;
};

const setWorkflowDefinition = async (projectId, definition) => {
  const json = JSON.stringify(definition);
  await pool.execute(
    `UPDATE projects SET workflow_definition = ? WHERE id = ?`,
    [json, projectId]
  );
};

module.exports = {
  DEFAULT_RFI_WORKFLOW,
  TRANSITIONS,
  getAllowedTransitions,
  isTransitionAllowed,
  getWorkflowDefinition,
  setWorkflowDefinition,
};
