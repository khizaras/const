/*
 End-to-end Daily Logs API test (requires server running).

 Usage:
   BASE_URL=http://localhost:5000 node server/scripts/test_daily_logs_api.js
   npm run test:dailylogs
*/

const axios = require("axios");
const { pool } = require("../src/db/pool");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

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

async function main() {
  const orgId = await ensureOrganization("Test Org");
  const projectId = await ensureProject(
    orgId,
    "North River Terminal",
    "NRT-001"
  );

  const email = `dailylogs.tester+${Date.now()}@example.com`;
  const password = "Password123!";

  const reg = await axios.post(`${BASE_URL}/api/auth/register`, {
    organizationId: orgId,
    firstName: "Daily",
    lastName: "Logger",
    email,
    password,
    projectIds: [projectId],
  });

  const token = reg.data.token;

  const client = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000,
  });

  const isoDate = (d) => d.toISOString().slice(0, 10);
  const baseDate = new Date();

  const tryCreate = async (logDate, shift) =>
    client.post(`/projects/${projectId}/daily-logs`, {
      logDate,
      shift,
      status: "draft",
      weatherConditions: "Sunny",
      workSummary: "Concrete prep",
      safetyNotes: "PPE enforced",
      delaysIssues: null,
      labor: [{ trade: "Concrete", headcount: 6 }],
      equipment: [{ equipmentName: "Telehandler", hours: 3.5 }],
    });

  let created;
  const candidates = [
    { logDate: isoDate(baseDate), shift: "day" },
    { logDate: isoDate(baseDate), shift: "night" },
    {
      logDate: isoDate(new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)),
      shift: "day",
    },
  ];

  for (const c of candidates) {
    try {
      created = await tryCreate(c.logDate, c.shift);
      break;
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error;
      if (status === 409 || msg?.includes("already exists")) {
        continue;
      }
      throw err;
    }
  }

  if (!created) {
    throw new Error(
      "Could not create a unique daily log (date/shift conflict)"
    );
  }

  const logId = created.data.id;

  const list = await client.get(`/projects/${projectId}/daily-logs`, {
    params: { page: 1, pageSize: 20 },
  });

  const found = (list.data.data || []).some((l) => l.id === logId);
  if (!found) throw new Error("Created daily log not found in list");

  const detail = await client.get(`/projects/${projectId}/daily-logs/${logId}`);
  if (!detail.data?.id) throw new Error("Detail not returned");

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: BASE_URL,
        orgId,
        projectId,
        createdLogId: logId,
        total: list.data?.meta?.total,
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(
      "Daily Logs API test failed:",
      err?.response?.data || err.message || err
    );
    process.exit(1);
  });
