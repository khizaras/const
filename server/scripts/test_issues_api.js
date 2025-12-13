/*
 End-to-end Issues API test (requires server running).

 What it does:
 - Ensures org + project exist via DB (no foreign keys assumed)
 - Registers a fresh user into that org and attaches to the project
 - Creates an Issue via authenticated API
 - Lists Issues and checks the created Issue is present

 Usage:
   BASE_URL=http://localhost:5000 node server/scripts/test_issues_api.js
   npm run test:issues
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

  const email = `issues.tester+${Date.now()}@example.com`;
  const password = "Password123!";

  let token;
  try {
    const reg = await axios.post(`${BASE_URL}/api/auth/register`, {
      organizationId: orgId,
      firstName: "Issues",
      lastName: "Tester",
      email,
      password,
      projectIds: [projectId],
    });
    token = reg.data.token;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    if (status === undefined) {
      throw new Error(
        `Cannot reach server at ${BASE_URL}. Start it (PORT=5000 npm run server:dev) or set BASE_URL. Original: ${err.message}`
      );
    }
    throw new Error(`Register failed (${status}): ${JSON.stringify(data)}`);
  }

  const client = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000,
  });

  const createPayload = {
    title: "Door hardware conflict",
    description:
      "Confirm hardware schedule vs. frame type and revise as needed.",
    type: "issue",
    status: "open",
    priority: "medium",
    trade: "Architectural",
    location: "Level 1",
  };

  const created = await client.post(
    `/projects/${projectId}/issues`,
    createPayload
  );
  const createdIssueId = created.data.id;

  const list = await client.get(`/projects/${projectId}/issues`, {
    params: { page: 1, pageSize: 20 },
  });

  const found = (list.data.data || []).some((i) => i.id === createdIssueId);
  if (!found) {
    throw new Error("Created issue not found in list response");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: BASE_URL,
        orgId,
        projectId,
        createdIssueId,
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
    console.error("Issues API test failed:", err.message || err);
    process.exit(1);
  });
