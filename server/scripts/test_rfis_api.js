/*
 End-to-end RFI API test (requires server running).

 What it does:
 - Ensures org + project exist in DB
 - Registers a fresh user and attaches to the project
 - Creates an RFI via authenticated API
 - Lists RFIs and ensures the new one is present
 - Adds a comment and a response, then validates they exist

 Usage:
   BASE_URL=http://localhost:5000 node server/scripts/test_rfis_api.js
   npm run test:rfis
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
  const projectId = await ensureProject(orgId, "North River Terminal", "NRT-001");

  const email = `rfis.tester+${Date.now()}@example.com`;
  const password = "Password123!";

  let token;
  try {
    const reg = await axios.post(`${BASE_URL}/api/auth/register`, {
      organizationId: orgId,
      firstName: "RFIs",
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
    title: "Confirm exterior glazing spec",
    question: "Glass type called out differs between A6.01 and spec 08800. Clarify.",
    priority: "medium",
    discipline: "Architecture",
    specSection: "08800",
    location: "South elevation",
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
  };

  const created = await client.post(`/projects/${projectId}/rfis`, createPayload);
  const rfiId = created.data.id;

  const list = await client.get(`/projects/${projectId}/rfis`, {
    params: { page: 1, pageSize: 20 },
  });
  const found = (list.data.data || []).some((r) => r.id === rfiId);
  if (!found) {
    throw new Error("Created RFI not found in list response");
  }

  await client.post(`/projects/${projectId}/rfis/${rfiId}/comments`, {
    body: "Following up with architect for confirmation.",
  });

  await client.post(`/projects/${projectId}/rfis/${rfiId}/responses`, {
    responseText: "Use 1"/8" tempered, low-e per spec 08800.",
    isOfficial: true,
  });

  const detail = await client.get(`/projects/${projectId}/rfis/${rfiId}`);
  const hasComment = (detail.data.comments || []).length > 0;
  const hasResponse = (detail.data.responses || []).length > 0;

  if (!hasComment) throw new Error("Comment did not persist");
  if (!hasResponse) throw new Error("Response did not persist");

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: BASE_URL,
        orgId,
        projectId,
        rfiId,
        metrics: detail.data.status,
        comments: detail.data.comments.length,
        responses: detail.data.responses.length,
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("RFI API test failed:", err.message || err);
    process.exit(1);
  });
