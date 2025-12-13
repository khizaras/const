/*
 Seed minimal MySQL data to exercise Daily Logs module:
 - Ensures org, user, project, project_user
 - Inserts a Daily Log (today, day shift) if missing

 Usage:
   node server/scripts/seed_daily_logs_test_data.js
   npm run seed:dailylogs
*/

const { pool } = require("../src/db/pool");
const bcrypt = require("bcryptjs");

const DEFAULT_PASSWORD = "Password123!";

async function ensureOrganization(name) {
  const [[row]] = await pool.execute(
    "SELECT id FROM organizations WHERE name = ? LIMIT 1",
    [name]
  );
  if (row) return row.id;
  const [res] = await pool.execute(
    "INSERT INTO organizations (name) VALUES (?)",
    [name]
  );
  return res.insertId;
}

async function ensureUser(orgId, email, firstName, lastName) {
  const [[row]] = await pool.execute(
    "SELECT id, password_hash FROM users WHERE organization_id = ? AND email = ? LIMIT 1",
    [orgId, email]
  );
  if (row) {
    const isBcrypt =
      typeof row.password_hash === "string" &&
      row.password_hash.startsWith("$2");
    if (!isBcrypt) {
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
        passwordHash,
        row.id,
      ]);
    }
    return row.id;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const [res] = await pool.execute(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name)
     VALUES (?, ?, ?, ?, ?)`,
    [orgId, email, passwordHash, firstName, lastName]
  );
  return res.insertId;
}

async function ensureProject(orgId, name, code) {
  const [[row]] = await pool.execute(
    "SELECT id FROM projects WHERE organization_id = ? AND code = ? LIMIT 1",
    [orgId, code]
  );
  if (row) return row.id;
  const [res] = await pool.execute(
    "INSERT INTO projects (organization_id, name, code) VALUES (?, ?, ?)",
    [orgId, name, code]
  );
  return res.insertId;
}

async function ensureProjectUser(projectId, userId) {
  const [[row]] = await pool.execute(
    "SELECT id FROM project_users WHERE project_id = ? AND user_id = ? LIMIT 1",
    [projectId, userId]
  );
  if (row) return row.id;
  const [res] = await pool.execute(
    "INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, 'pm')",
    [projectId, userId]
  );
  return res.insertId;
}

async function ensureDailyLog(projectId, userId, logDate, shift) {
  const [[row]] = await pool.execute(
    "SELECT id FROM daily_logs WHERE project_id = ? AND log_date = ? AND shift = ? LIMIT 1",
    [projectId, logDate, shift]
  );
  if (row) return row.id;

  const [res] = await pool.execute(
    `INSERT INTO daily_logs (
      project_id, log_date, shift, weather_conditions, work_summary,
      safety_notes, delays_issues, status, created_by_user_id, updated_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
    [
      projectId,
      logDate,
      shift,
      "Sunny",
      "General site work completed",
      null,
      null,
      userId,
      userId,
    ]
  );
  return res.insertId;
}

(async () => {
  try {
    const orgId = await ensureOrganization("Test Org");
    const userId = await ensureUser(
      orgId,
      "responder@example.com",
      "Responder",
      "User"
    );
    const projectId = await ensureProject(
      orgId,
      "North River Terminal",
      "NRT-001"
    );
    await ensureProjectUser(projectId, userId);

    const today = new Date();
    const logDate = today.toISOString().slice(0, 10);
    const logId = await ensureDailyLog(projectId, userId, logDate, "day");

    console.log(
      JSON.stringify({ orgId, userId, projectId, logId, logDate }, null, 2)
    );
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
