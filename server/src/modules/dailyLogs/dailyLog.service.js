const { pool } = require("../../db/pool");
const { AppError } = require("../../utils/appError");

const fetchDailyLog = async (projectId, logId) => {
  const [[row]] = await pool.execute(
    "SELECT * FROM daily_logs WHERE project_id = ? AND id = ? LIMIT 1",
    [projectId, logId]
  );
  if (!row) throw new AppError("Daily log not found", 404);
  return row;
};

const loadLabor = async (projectId, logId) => {
  const [rows] = await pool.execute(
    "SELECT id, trade, headcount FROM daily_log_labor WHERE project_id = ? AND daily_log_id = ? ORDER BY id ASC",
    [projectId, logId]
  );
  return rows;
};

const loadEquipment = async (projectId, logId) => {
  const [rows] = await pool.execute(
    "SELECT id, equipment_name, hours FROM daily_log_equipment WHERE project_id = ? AND daily_log_id = ? ORDER BY id ASC",
    [projectId, logId]
  );
  return rows;
};

const listDailyLogs = async (projectId, filters) => {
  const where = ["project_id = ?"];
  const params = [projectId];

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }
  if (filters.shift) {
    where.push("shift = ?");
    params.push(filters.shift);
  }
  if (filters.from) {
    where.push("log_date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    where.push("log_date <= ?");
    params.push(filters.to);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;

  const [rows] = await pool.execute(
    `SELECT * FROM daily_logs ${whereSql}
     ORDER BY log_date DESC, shift ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM daily_logs ${whereSql}`,
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

const createDailyLog = async (projectId, userId, payload) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO daily_logs (
        project_id, log_date, shift, weather_conditions, work_summary,
        safety_notes, delays_issues, status, version, client_updated_at,
        created_by_user_id, updated_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        projectId,
        payload.logDate,
        payload.shift || "day",
        payload.weatherConditions || null,
        payload.workSummary || null,
        payload.safetyNotes || null,
        payload.delaysIssues || null,
        payload.status || "draft",
        payload.clientUpdatedAt || null,
        userId,
        userId,
      ]
    );

    const logId = result.insertId;

    if (payload.labor?.length) {
      const values = payload.labor.flatMap((r) => [
        projectId,
        logId,
        r.trade,
        r.headcount ?? 0,
      ]);
      const placeholders = payload.labor.map(() => "(?, ?, ?, ?)").join(",");
      await conn.query(
        `INSERT INTO daily_log_labor (project_id, daily_log_id, trade, headcount)
         VALUES ${placeholders}`,
        values
      );
    }

    if (payload.equipment?.length) {
      const values = payload.equipment.flatMap((r) => [
        projectId,
        logId,
        r.equipmentName,
        r.hours ?? 0,
      ]);
      const placeholders = payload.equipment
        .map(() => "(?, ?, ?, ?)")
        .join(",");
      await conn.query(
        `INSERT INTO daily_log_equipment (project_id, daily_log_id, equipment_name, hours)
         VALUES ${placeholders}`,
        values
      );
    }

    await conn.commit();

    const log = await fetchDailyLog(projectId, logId);
    const labor = await loadLabor(projectId, logId);
    const equipment = await loadEquipment(projectId, logId);

    return { ...log, labor, equipment };
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError("Daily log already exists for this date/shift", 409);
    }
    throw err;
  } finally {
    conn.release();
  }
};

const loadDailyLogDetail = async (projectId, logId) => {
  const log = await fetchDailyLog(projectId, logId);
  const labor = await loadLabor(projectId, logId);
  const equipment = await loadEquipment(projectId, logId);
  return { ...log, labor, equipment };
};

const updateDailyLog = async (projectId, logId, payload, userId) => {
  await fetchDailyLog(projectId, logId);

  const fields = [];
  const params = [];
  const setField = (col, value) => {
    fields.push(`${col} = ?`);
    params.push(value);
  };

  if (payload.logDate !== undefined) setField("log_date", payload.logDate);
  if (payload.shift !== undefined) setField("shift", payload.shift);
  if (payload.weatherConditions !== undefined)
    setField("weather_conditions", payload.weatherConditions);
  if (payload.workSummary !== undefined)
    setField("work_summary", payload.workSummary);
  if (payload.safetyNotes !== undefined)
    setField("safety_notes", payload.safetyNotes);
  if (payload.delaysIssues !== undefined)
    setField("delays_issues", payload.delaysIssues);
  if (payload.status !== undefined) setField("status", payload.status);
  if (payload.clientUpdatedAt !== undefined)
    setField("client_updated_at", payload.clientUpdatedAt);

  setField("updated_by_user_id", userId);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (fields.length) {
      // bump version
      await conn.execute(
        `UPDATE daily_logs SET ${fields.join(
          ", "
        )}, version = version + 1, updated_at = NOW() WHERE project_id = ? AND id = ?`,
        [...params, projectId, logId]
      );
    }

    if (payload.labor !== undefined) {
      await conn.execute(
        "DELETE FROM daily_log_labor WHERE project_id = ? AND daily_log_id = ?",
        [projectId, logId]
      );
      if (payload.labor?.length) {
        const values = payload.labor.flatMap((r) => [
          projectId,
          logId,
          r.trade,
          r.headcount ?? 0,
        ]);
        const placeholders = payload.labor.map(() => "(?, ?, ?, ?)").join(",");
        await conn.query(
          `INSERT INTO daily_log_labor (project_id, daily_log_id, trade, headcount)
           VALUES ${placeholders}`,
          values
        );
      }
    }

    if (payload.equipment !== undefined) {
      await conn.execute(
        "DELETE FROM daily_log_equipment WHERE project_id = ? AND daily_log_id = ?",
        [projectId, logId]
      );
      if (payload.equipment?.length) {
        const values = payload.equipment.flatMap((r) => [
          projectId,
          logId,
          r.equipmentName,
          r.hours ?? 0,
        ]);
        const placeholders = payload.equipment
          .map(() => "(?, ?, ?, ?)")
          .join(",");
        await conn.query(
          `INSERT INTO daily_log_equipment (project_id, daily_log_id, equipment_name, hours)
           VALUES ${placeholders}`,
          values
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError("Daily log already exists for this date/shift", 409);
    }
    throw err;
  } finally {
    conn.release();
  }

  return loadDailyLogDetail(projectId, logId);
};

module.exports = {
  listDailyLogs,
  createDailyLog,
  loadDailyLogDetail,
  updateDailyLog,
};
