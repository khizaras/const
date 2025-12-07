const { pool } = require("../../db/pool");
const { AppError } = require("../../utils/appError");
const {
  sendRfiCreatedEmail,
  sendRfiAssignedEmail,
  sendRfiResponseEmail,
  sendRfiStatusChangeEmail,
} = require("../../services/emailService");
const logger = require("../../logger");

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

const fetchRfiRecord = async (projectId, rfiId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM rfis WHERE project_id = ? AND id = ? LIMIT 1",
    [projectId, rfiId]
  );
  if (!rows.length) {
    throw new AppError("RFI not found", 404);
  }
  return rows[0];
};

const listRfis = async (projectId, filters) => {
  const whereClauses = ["r.project_id = ?"];
  const params = [projectId];
  if (filters.status) {
    whereClauses.push("r.status = ?");
    params.push(filters.status);
  }
  if (filters.priority) {
    whereClauses.push("r.priority = ?");
    params.push(filters.priority);
  }
  if (filters.assignedTo) {
    whereClauses.push("r.assigned_to_user_id = ?");
    params.push(filters.assignedTo);
  }
  if (filters.ballInCourt) {
    whereClauses.push("r.ball_in_court_user_id = ?");
    params.push(filters.ballInCourt);
  }
  if (filters.dueBefore) {
    whereClauses.push("r.due_date IS NOT NULL AND r.due_date <= ?");
    params.push(filters.dueBefore);
  }
  if (filters.search) {
    whereClauses.push(
      "(r.title LIKE ? OR r.question LIKE ? OR r.spec_section LIKE ? OR r.location LIKE ? )"
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
    `SELECT r.*, 
            creator.first_name AS created_by_first_name,
            creator.last_name AS created_by_last_name,
            assigned.first_name AS assigned_to_first_name,
            assigned.last_name AS assigned_to_last_name,
            bic.first_name AS ball_in_court_first_name,
            bic.last_name AS ball_in_court_last_name,
            DATEDIFF(NOW(), r.created_at) AS days_open,
            CASE 
              WHEN r.due_date IS NOT NULL AND r.due_date < CURDATE() 
              THEN DATEDIFF(CURDATE(), r.due_date)
              ELSE 0 
            END AS days_overdue,
            CASE 
              WHEN r.due_date IS NOT NULL AND r.due_date >= CURDATE() 
              THEN DATEDIFF(r.due_date, CURDATE())
              ELSE NULL 
            END AS days_until_due
     FROM rfis r
     LEFT JOIN users creator ON creator.id = r.created_by_user_id
     LEFT JOIN users assigned ON assigned.id = r.assigned_to_user_id
     LEFT JOIN users bic ON bic.id = r.ball_in_court_user_id
     ${whereSql}
     ORDER BY r.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM rfis r ${whereSql}`,
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

const loadRfiDetail = async (projectId, rfiId) => {
  const [[rfi]] = await pool.execute(
    `SELECT r.*, 
            creator.first_name AS created_by_first_name,
            creator.last_name AS created_by_last_name,
            assigned.first_name AS assigned_to_first_name,
            assigned.last_name AS assigned_to_last_name,
            bic.first_name AS ball_in_court_first_name,
            bic.last_name AS ball_in_court_last_name,
            DATEDIFF(NOW(), r.created_at) AS days_open,
            CASE 
              WHEN r.due_date IS NOT NULL AND r.due_date < CURDATE() 
              THEN DATEDIFF(CURDATE(), r.due_date)
              ELSE 0 
            END AS days_overdue,
            CASE 
              WHEN r.due_date IS NOT NULL AND r.due_date >= CURDATE() 
              THEN DATEDIFF(r.due_date, CURDATE())
              ELSE NULL 
            END AS days_until_due
     FROM rfis r
     LEFT JOIN users creator ON creator.id = r.created_by_user_id
     LEFT JOIN users assigned ON assigned.id = r.assigned_to_user_id
     LEFT JOIN users bic ON bic.id = r.ball_in_court_user_id
     WHERE r.project_id = ? AND r.id = ?
     LIMIT 1`,
    [projectId, rfiId]
  );
  if (!rfi) {
    throw new AppError("RFI not found", 404);
  }

  const [responses] = await pool.execute(
    `SELECT rr.*, 
            responder.first_name AS responded_by_first_name, 
            responder.last_name AS responded_by_last_name
     FROM rfi_responses rr
     LEFT JOIN users responder ON responder.id = rr.responded_by_user_id
     WHERE rr.rfi_id = ?
     ORDER BY rr.created_at ASC`,
    [rfiId]
  );

  const [watchers] = await pool.execute(
    `SELECT rw.user_id, u.first_name, u.last_name
     FROM rfi_watchers rw
     JOIN users u ON u.id = rw.user_id
     WHERE rw.rfi_id = ?`,
    [rfiId]
  );

  const [attachments] = await pool.execute(
    `SELECT a.id, a.file_id, a.created_at AS attached_at,
            f.original_name, f.mime_type, f.size_bytes
     FROM attachments a
     JOIN files f ON f.id = a.file_id
     WHERE a.entity_type = 'rfi' AND a.entity_id = ?
     ORDER BY a.created_at DESC`,
    [rfiId]
  );

  return { ...rfi, responses, watchers, attachments };
};

const createRfi = async (projectId, userId, payload) => {
  if (payload.assignedToUserId) {
    await ensureProjectUser(projectId, payload.assignedToUserId);
  }
  if (payload.ballInCourtUserId) {
    await ensureProjectUser(projectId, payload.ballInCourtUserId);
  }
  if (payload.watchers?.length) {
    await Promise.all(
      payload.watchers.map((uid) => ensureProjectUser(projectId, uid))
    );
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [maxRows] = await conn.execute(
      "SELECT COALESCE(MAX(number), 0) AS maxNumber FROM rfis WHERE project_id = ? FOR UPDATE",
      [projectId]
    );
    const nextNumber = Number(maxRows[0].maxNumber) + 1;

    const [result] = await conn.execute(
      `INSERT INTO rfis (
          project_id, number, title, question, status, priority, discipline,
          spec_section, location, due_date, needed_by, created_by_user_id,
          assigned_to_user_id, ball_in_court_user_id
        ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        nextNumber,
        payload.title,
        payload.question,
        payload.priority || "medium",
        payload.discipline || null,
        payload.specSection || null,
        payload.location || null,
        payload.dueDate || null,
        payload.neededBy || null,
        userId,
        payload.assignedToUserId || null,
        payload.ballInCourtUserId || payload.assignedToUserId || userId,
      ]
    );
    const rfiId = result.insertId;

    const watcherSet = new Set([userId]);
    payload.watchers?.forEach((id) => watcherSet.add(id));
    if (watcherSet.size) {
      const placeholders = [];
      const watcherParams = [];
      watcherSet.forEach((watcherId) => {
        placeholders.push("(?, ?)");
        watcherParams.push(rfiId, watcherId);
      });
      await conn.query(
        `INSERT INTO rfi_watchers (rfi_id, user_id) VALUES ${placeholders.join(
          ","
        )}
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        watcherParams
      );
    }

    await conn.commit();
    const newRfi = await loadRfiDetail(projectId, rfiId);

    // Send email notifications asynchronously
    setImmediate(async () => {
      try {
        // Get project name and creator details
        const [[project]] = await pool.execute(
          "SELECT name FROM projects WHERE id = ?",
          [projectId]
        );
        const [[creator]] = await pool.execute(
          "SELECT email, first_name, last_name FROM users WHERE id = ?",
          [userId]
        );

        const rfiUrl = `${process.env.APP_URL || 'http://localhost:5173'}/projects/${projectId}/rfis/${rfiId}`;
        const createdBy = `${creator.first_name} ${creator.last_name}`;
        const projectName = project.name;

        // Send email to assigned user if different from creator
        if (payload.assignedToUserId && payload.assignedToUserId !== userId) {
          const [[assignedUser]] = await pool.execute(
            "SELECT email FROM users WHERE id = ?",
            [payload.assignedToUserId]
          );
          await sendRfiAssignedEmail({
            to: assignedUser.email,
            rfiNumber: nextNumber,
            rfiTitle: payload.title,
            assignedBy: createdBy,
            projectName,
            rfiUrl,
          });
        }

        // Send email to watchers (excluding creator)
        if (watcherSet.size > 1) {
          const watcherEmails = await pool.execute(
            `SELECT email FROM users WHERE id IN (${Array.from(watcherSet).filter(id => id !== userId).join(',')}) AND email IS NOT NULL`
          );
          if (watcherEmails[0].length > 0) {
            const emails = watcherEmails[0].map(u => u.email);
            await sendRfiCreatedEmail({
              to: emails,
              rfiNumber: nextNumber,
              rfiTitle: payload.title,
              createdBy,
              projectName,
              rfiUrl,
            });
          }
        }
      } catch (emailError) {
        logger.error("Failed to send RFI creation emails:", emailError);
      }
    });

    return newRfi;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const updateRfi = async (projectId, rfiId, payload, updatingUserId = null) => {
  const oldRfi = await fetchRfiRecord(projectId, rfiId);
  if (payload.assignedToUserId) {
    await ensureProjectUser(projectId, payload.assignedToUserId);
  }
  if (payload.ballInCourtUserId) {
    await ensureProjectUser(projectId, payload.ballInCourtUserId);
  }

  const fields = [];
  const values = [];

  const map = {
    title: "title",
    question: "question",
    status: "status",
    priority: "priority",
    discipline: "discipline",
    specSection: "spec_section",
    location: "location",
    dueDate: "due_date",
    neededBy: "needed_by",
    assignedToUserId: "assigned_to_user_id",
    ballInCourtUserId: "ball_in_court_user_id",
  };

  Object.entries(map).forEach(([key, column]) => {
    if (payload[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(payload[key]);
    }
  });

  if (!fields.length) {
    throw new AppError("No fields to update", 400);
  }

  values.push(rfiId, projectId);

  await pool.execute(
    `UPDATE rfis SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND project_id = ?`,
    values
  );

  const updatedRfi = await loadRfiDetail(projectId, rfiId);

  // Send email notification for status changes
  if (payload.status && payload.status !== oldRfi.status && updatingUserId) {
    setImmediate(async () => {
      try {
        const [[project]] = await pool.execute(
          "SELECT name FROM projects WHERE id = ?",
          [projectId]
        );
        const [[updater]] = await pool.execute(
          "SELECT first_name, last_name FROM users WHERE id = ?",
          [updatingUserId]
        );
        const [watchers] = await pool.execute(
          `SELECT u.email FROM rfi_watchers rw 
           JOIN users u ON u.id = rw.user_id 
           WHERE rw.rfi_id = ? AND u.email IS NOT NULL`,
          [rfiId]
        );

        const rfiUrl = `${process.env.APP_URL || 'http://localhost:5173'}/projects/${projectId}/rfis/${rfiId}`;
        const changedBy = `${updater.first_name} ${updater.last_name}`;

        if (watchers.length > 0) {
          const emails = watchers.map(w => w.email);
          await sendRfiStatusChangeEmail({
            to: emails,
            rfiNumber: oldRfi.number,
            rfiTitle: oldRfi.title,
            newStatus: payload.status,
            changedBy,
            projectName: project.name,
            rfiUrl,
          });
        }
      } catch (emailError) {
        logger.error("Failed to send status change email:", emailError);
      }
    });
  }

  return updatedRfi;
};

const addRfiResponse = async (projectId, rfiId, userId, payload) => {
  await fetchRfiRecord(projectId, rfiId);
  if (payload.returnToUserId) {
    await ensureProjectUser(projectId, payload.returnToUserId);
  }

  const [result] = await pool.execute(
    `INSERT INTO rfi_responses (rfi_id, responded_by_user_id, response_text, is_official)
     VALUES (?, ?, ?, ?)`,
    [rfiId, userId, payload.responseText, payload.isOfficial ? 1 : 0]
  );

  const newBallInCourt = payload.returnToUserId || null;
  const newStatus = payload.isOfficial ? "answered" : null;

  const updates = [];
  const updateValues = [];
  if (newBallInCourt) {
    updates.push("ball_in_court_user_id = ?");
    updateValues.push(newBallInCourt);
  }
  if (newStatus) {
    updates.push("status = ?");
    updateValues.push(newStatus);
  }
  if (updates.length) {
    updateValues.push(rfiId, projectId);
    await pool.execute(
      `UPDATE rfis SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      updateValues
    );
  }

  const responseResult = {
    responseId: result.insertId,
    rfi: await loadRfiDetail(projectId, rfiId),
  };

  // Send email notifications for response
  setImmediate(async () => {
    try {
      const [[rfi]] = await pool.execute(
        "SELECT number, title FROM rfis WHERE id = ?",
        [rfiId]
      );
      const [[project]] = await pool.execute(
        "SELECT name FROM projects WHERE id = ?",
        [projectId]
      );
      const [[responder]] = await pool.execute(
        "SELECT first_name, last_name FROM users WHERE id = ?",
        [userId]
      );
      const [watchers] = await pool.execute(
        `SELECT u.email FROM rfi_watchers rw 
         JOIN users u ON u.id = rw.user_id 
         WHERE rw.rfi_id = ? AND u.id != ? AND u.email IS NOT NULL`,
        [rfiId, userId]
      );

      const rfiUrl = `${process.env.APP_URL || 'http://localhost:5173'}/projects/${projectId}/rfis/${rfiId}`;
      const respondedBy = `${responder.first_name} ${responder.last_name}`;

      if (watchers.length > 0) {
        const emails = watchers.map(w => w.email);
        await sendRfiResponseEmail({
          to: emails,
          rfiNumber: rfi.number,
          rfiTitle: rfi.title,
          respondedBy,
          responseText: payload.responseText,
          projectName: project.name,
          rfiUrl,
        });
      }
    } catch (emailError) {
      logger.error("Failed to send response email:", emailError);
    }
  });

  return responseResult;
};

const addWatcher = async (projectId, rfiId, watcherUserId) => {
  await fetchRfiRecord(projectId, rfiId);
  await ensureProjectUser(projectId, watcherUserId);

  await pool.execute(
    `INSERT INTO rfi_watchers (rfi_id, user_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
    [rfiId, watcherUserId]
  );

  return loadRfiDetail(projectId, rfiId);
};

const removeWatcher = async (projectId, rfiId, watcherUserId) => {
  await fetchRfiRecord(projectId, rfiId);
  await pool.execute(
    "DELETE FROM rfi_watchers WHERE rfi_id = ? AND user_id = ?",
    [rfiId, watcherUserId]
  );
  return loadRfiDetail(projectId, rfiId);
};

module.exports = {
  listRfis,
  loadRfiDetail,
  createRfi,
  updateRfi,
  addRfiResponse,
  addWatcher,
  removeWatcher,
};
