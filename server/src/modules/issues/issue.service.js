const { pool } = require("../../db/pool");
const { AppError } = require("../../utils/appError");

const ensureProjectUser = async (projectId, userId) => {
  if (!userId) return null;
  const [rows] = await pool.execute(
    "SELECT 1 FROM project_users WHERE project_id = ? AND user_id = ? LIMIT 1",
    [projectId, userId]
  );
  if (!rows.length) {
    throw new AppError("User is not a member of this project", 400);
  }
  return true;
};

const fetchIssueRecord = async (projectId, issueId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM issues WHERE project_id = ? AND id = ? LIMIT 1",
    [projectId, issueId]
  );
  if (!rows.length) throw new AppError("Issue not found", 404);
  return rows[0];
};

const listIssues = async (projectId, filters) => {
  const whereClauses = ["i.project_id = ?"];
  const params = [projectId];

  if (filters.status) {
    whereClauses.push("i.status = ?");
    params.push(filters.status);
  }
  if (filters.type) {
    whereClauses.push("i.type = ?");
    params.push(filters.type);
  }
  if (filters.priority) {
    whereClauses.push("i.priority = ?");
    params.push(filters.priority);
  }
  if (filters.assignedTo) {
    whereClauses.push("i.assigned_to_user_id = ?");
    params.push(filters.assignedTo);
  }
  if (filters.dueBefore) {
    whereClauses.push("i.due_date IS NOT NULL AND i.due_date <= ?");
    params.push(filters.dueBefore);
  }
  if (filters.search) {
    whereClauses.push(
      "(i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ? OR i.trade LIKE ?)"
    );
    const like = `%${filters.search}%`;
    params.push(like, like, like, like);
  }

  const whereSql = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";
  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;

  const [rows] = await pool.execute(
    `SELECT i.*,
            creator.first_name AS created_by_first_name,
            creator.last_name AS created_by_last_name,
            assigned.first_name AS assigned_to_first_name,
            assigned.last_name AS assigned_to_last_name,
            DATEDIFF(NOW(), i.created_at) AS days_open,
            CASE 
              WHEN i.due_date IS NOT NULL AND i.due_date < CURDATE() AND i.status <> 'closed'
              THEN DATEDIFF(CURDATE(), i.due_date)
              ELSE 0
            END AS days_overdue,
            CASE
              WHEN i.due_date IS NOT NULL AND i.due_date >= CURDATE()
              THEN DATEDIFF(i.due_date, CURDATE())
              ELSE NULL
            END AS days_until_due
     FROM issues i
     LEFT JOIN users creator ON creator.id = i.created_by_user_id
     LEFT JOIN users assigned ON assigned.id = i.assigned_to_user_id
     ${whereSql}
     ORDER BY i.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM issues i ${whereSql}`,
    params
  );

  return {
    data: rows,
    meta: {
      total: countRow.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(countRow.total / filters.pageSize) || 1,
    },
  };
};

const createIssue = async (projectId, userId, payload) => {
  if (payload.assignedToUserId) {
    await ensureProjectUser(projectId, payload.assignedToUserId);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [maxRows] = await conn.execute(
      "SELECT COALESCE(MAX(number), 0) AS maxNumber FROM issues WHERE project_id = ? FOR UPDATE",
      [projectId]
    );
    const nextNumber = Number(maxRows[0].maxNumber) + 1;

    const [result] = await conn.execute(
      `INSERT INTO issues (
        project_id, number, title, description, type, status, priority,
        trade, location, due_date, created_by_user_id, assigned_to_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        nextNumber,
        payload.title,
        payload.description,
        payload.type || "issue",
        payload.status || "open",
        payload.priority || "medium",
        payload.trade || null,
        payload.location || null,
        payload.dueDate || null,
        userId,
        payload.assignedToUserId || null,
      ]
    );
    await conn.commit();
    return fetchIssueRecord(projectId, result.insertId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const loadIssueDetail = async (projectId, issueId) => {
  const [[issue]] = await pool.execute(
    `SELECT i.*,
            creator.first_name AS created_by_first_name,
            creator.last_name AS created_by_last_name,
            assigned.first_name AS assigned_to_first_name,
            assigned.last_name AS assigned_to_last_name,
            DATEDIFF(NOW(), i.created_at) AS days_open
     FROM issues i
     LEFT JOIN users creator ON creator.id = i.created_by_user_id
     LEFT JOIN users assigned ON assigned.id = i.assigned_to_user_id
     WHERE i.project_id = ? AND i.id = ?
     LIMIT 1`,
    [projectId, issueId]
  );
  if (!issue) throw new AppError("Issue not found", 404);

  const [attachments] = await pool.execute(
    `SELECT a.id, a.file_id, a.created_at AS attached_at,
            f.original_name, f.mime_type, f.size_bytes
     FROM attachments a
     JOIN files f ON f.id = a.file_id
     WHERE a.entity_type = 'issue' AND a.entity_id = ?
     ORDER BY a.created_at DESC`,
    [issueId]
  );

  return { ...issue, attachments };
};

const updateIssue = async (projectId, issueId, payload, userId) => {
  const existing = await fetchIssueRecord(projectId, issueId);

  if (payload.assignedToUserId !== undefined) {
    await ensureProjectUser(projectId, payload.assignedToUserId);
  }

  const fields = [];
  const params = [];
  const setField = (col, value) => {
    fields.push(`${col} = ?`);
    params.push(value);
  };

  if (payload.title !== undefined) setField("title", payload.title);
  if (payload.description !== undefined)
    setField("description", payload.description);
  if (payload.type !== undefined) setField("type", payload.type);
  if (payload.status !== undefined) {
    setField("status", payload.status);
    if (payload.status === "closed") setField("closed_at", new Date());
    if (payload.status !== "closed") setField("closed_at", null);
  }
  if (payload.priority !== undefined) setField("priority", payload.priority);
  if (payload.trade !== undefined) setField("trade", payload.trade);
  if (payload.location !== undefined) setField("location", payload.location);
  if (payload.dueDate !== undefined) setField("due_date", payload.dueDate);
  if (payload.assignedToUserId !== undefined)
    setField("assigned_to_user_id", payload.assignedToUserId);

  if (!fields.length) return existing;

  await pool.execute(
    `UPDATE issues SET ${fields.join(
      ", "
    )}, updated_at = NOW() WHERE project_id = ? AND id = ?`,
    [...params, projectId, issueId]
  );

  return loadIssueDetail(projectId, issueId);
};

const bulkUpdateIssues = async (projectId, issueIds, payload, userId) => {
  if (!issueIds || issueIds.length === 0) {
    throw new AppError("No issue IDs provided", 400);
  }

  // Verify all issues belong to the project
  const placeholders = issueIds.map(() => "?").join(",");
  const [rows] = await pool.execute(
    `SELECT id FROM issues WHERE project_id = ? AND id IN (${placeholders})`,
    [projectId, ...issueIds]
  );

  if (rows.length !== issueIds.length) {
    throw new AppError("Some issues not found or don't belong to this project", 404);
  }

  const fields = [];
  const params = [];
  const setField = (col, value) => {
    fields.push(`${col} = ?`);
    params.push(value);
  };

  if (payload.status !== undefined) {
    setField("status", payload.status);
    if (payload.status === "closed") setField("closed_at", new Date());
  }
  if (payload.priority !== undefined) setField("priority", payload.priority);
  if (payload.assignedToUserId !== undefined) {
    await ensureProjectUser(projectId, payload.assignedToUserId);
    setField("assigned_to_user_id", payload.assignedToUserId);
  }

  if (!fields.length) {
    return { updated: 0, issueIds };
  }

  await pool.execute(
    `UPDATE issues SET ${fields.join(", ")}, updated_at = NOW() WHERE project_id = ? AND id IN (${placeholders})`,
    [...params, projectId, ...issueIds]
  );

  return { updated: issueIds.length, issueIds };
};

module.exports = {
  listIssues,
  createIssue,
  loadIssueDetail,
  updateIssue,
  bulkUpdateIssues,
};
