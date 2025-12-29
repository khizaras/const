const { pool } = require("../../db/pool");

const serializePayload = (payload) => {
  if (payload === undefined) return null;
  try {
    return JSON.stringify(payload);
  } catch (err) {
    return null;
  }
};

const createNotification = async ({
  userId,
  type,
  entityType,
  entityId,
  payload,
}) => {
  await pool.execute(
    `INSERT INTO notifications (user_id, type, entity_type, entity_id, payload)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, entityType, entityId, serializePayload(payload)]
  );
};

const listNotifications = async (userId, { isRead, limit = 20 } = {}) => {
  const where = ["user_id = ?"];
  const params = [userId];
  if (isRead === 0 || isRead === 1 || isRead === "0" || isRead === "1") {
    where.push("is_read = ?");
    params.push(Number(isRead));
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const [rows] = await pool.execute(
    `SELECT id, type, entity_type, entity_id, payload, is_read, created_at
       FROM notifications
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ?`,
    [...params, Number(limit) || 20]
  );
  return rows.map((row) => ({
    ...row,
    payload: row.payload ? JSON.parse(row.payload) : null,
  }));
};

const markAsRead = async (userId, notificationId) => {
  await pool.execute(
    `UPDATE notifications
        SET is_read = 1
      WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
};

const markAllAsRead = async (userId) => {
  await pool.execute(
    `UPDATE notifications
        SET is_read = 1
      WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
};

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
};
