const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("../../db/pool");
const { env } = require("../../config/env");

function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return !(trimmed.startsWith("--") || trimmed.startsWith("#"));
    })
    .join("\n");
}

function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const prev = sql[i - 1];

    if (ch === "'" && prev !== "\\" && !inDouble) inSingle = !inSingle;
    if (ch === '"' && prev !== "\\" && !inSingle) inDouble = !inDouble;

    if (ch === ";" && !inSingle && !inDouble) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = "";
      continue;
    }
    current += ch;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function applySqlFile(sqlFilePath) {
  const raw = fs.readFileSync(sqlFilePath, "utf8");
  const cleaned = stripComments(raw);
  const statements = splitStatements(cleaned);

  for (const stmt of statements) {
    await pool.execute(stmt);
  }

  return { statementsApplied: statements.length };
}

async function tableExists(tableName) {
  const [rows] = await pool.execute("SHOW TABLES LIKE ?", [tableName]);
  return Array.isArray(rows) && rows.length > 0;
}

async function safeCount(tableName) {
  if (!(await tableExists(tableName))) return null;
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS c FROM \`${tableName}\``
  );
  return row?.c ?? 0;
}

function setupEnabled() {
  const enabled =
    String(process.env.ENABLE_SETUP_UI || "false").toLowerCase() === "true";
  const token = process.env.SETUP_TOKEN;
  if (!enabled)
    return { enabled: false, reason: "ENABLE_SETUP_UI is not true" };
  if (!token || token.length < 16) {
    return {
      enabled: false,
      reason: "SETUP_TOKEN missing or too short (min 16 chars)",
    };
  }
  return { enabled: true };
}

async function getSetupStatus() {
  const enabled = setupEnabled();

  let dbOk = false;
  try {
    const conn = await pool.getConnection();
    conn.release();
    dbOk = true;
  } catch (_) {
    dbOk = false;
  }

  const installed = {
    organizations: await tableExists("organizations"),
    users: await tableExists("users"),
    projects: await tableExists("projects"),
    rfis: await tableExists("rfis"),
    issues: await tableExists("issues"),
    daily_logs: await tableExists("daily_logs"),
    files: await tableExists("files"),
    attachments: await tableExists("attachments"),
  };

  const counts = {
    organizations: await safeCount("organizations"),
    users: await safeCount("users"),
    projects: await safeCount("projects"),
  };

  return {
    enabled,
    db: {
      ok: dbOk,
      host: env.MYSQL_HOST,
      port: Number(env.MYSQL_PORT),
      database: env.MYSQL_DB,
      user: env.MYSQL_USER,
    },
    installed,
    counts,
  };
}

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

async function ensureUser({ orgId, email, password, firstName, lastName }) {
  const [[row]] = await pool.execute(
    "SELECT id FROM users WHERE organization_id = ? AND email = ? LIMIT 1",
    [orgId, email]
  );
  if (row) return row.id;

  const passwordHash = await bcrypt.hash(password, 10);
  const [res] = await pool.execute(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name)
     VALUES (?, ?, ?, ?, ?)`,
    [orgId, email, passwordHash, firstName, lastName]
  );
  return res.insertId;
}

async function ensureProject({ orgId, name, code }) {
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

async function ensureProjectUser({ projectId, userId, role }) {
  const [[row]] = await pool.execute(
    "SELECT id FROM project_users WHERE project_id = ? AND user_id = ? LIMIT 1",
    [projectId, userId]
  );
  if (row) return row.id;
  const [res] = await pool.execute(
    "INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?)",
    [projectId, userId, role]
  );
  return res.insertId;
}

async function runInstaller({ seed }) {
  const baseDir = path.resolve(__dirname, "../../../db");
  const files = [
    path.join(baseDir, "schema.sql"),
    path.join(baseDir, "daily_logs.sql"),
    path.join(baseDir, "issues.sql"),
  ];

  const applied = [];
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      applied.push({
        file: path.basename(filePath),
        skipped: true,
        reason: "missing",
      });
      continue;
    }
    const r = await applySqlFile(filePath);
    applied.push({ file: path.basename(filePath), ...r });
  }

  let seeded = null;
  if (seed) {
    const [[userCountRow]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM users"
    );
    const usersExist = Number(userCountRow?.c || 0) > 0;

    if (!usersExist) {
      const orgName = seed.organizationName || "Procore";
      const adminEmail = seed.adminEmail || "admin@example.com";
      const adminPassword = seed.adminPassword;
      if (!adminPassword || adminPassword.length < 10) {
        throw new Error(
          "adminPassword is required for initial seed (min 10 chars)"
        );
      }

      const orgId = await ensureOrganization(orgName);
      const userId = await ensureUser({
        orgId,
        email: adminEmail,
        password: adminPassword,
        firstName: seed.adminFirstName || "Admin",
        lastName: seed.adminLastName || "User",
      });
      const projectId = await ensureProject({
        orgId,
        name: seed.projectName || "Demo Project",
        code: seed.projectCode || "DEMO-001",
      });
      await ensureProjectUser({ projectId, userId, role: "admin" });

      seeded = { orgId, userId, projectId, adminEmail };
    } else {
      seeded = { skipped: true, reason: "users already exist" };
    }
  }

  return { applied, seeded };
}

module.exports = {
  getSetupStatus,
  runInstaller,
  setupEnabled,
};
