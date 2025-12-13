/*
 Seed minimal MySQL data to exercise Issues/Punch module:
 - Ensures org, user, project, project_user (same as seed_test_data.js)
 - Inserts Issue #1 if missing

 Usage:
   node server/scripts/seed_issues_test_data.js
   npm run seed:issues

 Env: uses existing DB pool config from server/src/db/pool.js
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

async function ensureIssue(projectId, creatorUserId, number) {
  const [[row]] = await pool.execute(
    "SELECT id FROM issues WHERE project_id = ? AND number = ? LIMIT 1",
    [projectId, number]
  );
  if (row) return row.id;

  const [res] = await pool.execute(
    `INSERT INTO issues (
      project_id, number, type, title, description, status, priority,
      trade, location, due_date, created_by_user_id, assigned_to_user_id
    ) VALUES (?, ?, 'issue', 'Field coordination needed', 'Resolve clash and confirm install sequence', 'open', 'medium', 'MEP', 'Level 2', NULL, ?, NULL)`,
    [projectId, number, creatorUserId]
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
    const issueId = await ensureIssue(projectId, userId, 1);

    console.log(JSON.stringify({ orgId, userId, projectId, issueId }, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
