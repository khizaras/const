#!/usr/bin/env node
/**
 * CI Smoke Test Suite for RFI Module MVP
 *
 * Tests critical paths:
 * 1. Authentication (login, token validation)
 * 2. Project access
 * 3. RFI CRUD operations
 * 4. File upload and attachment
 * 5. Status transitions (workflow)
 * 6. Notifications
 *
 * Usage: node server/scripts/ci_smoke_test.js
 * Environment: Set BASE_URL, TEST_EMAIL, TEST_PASSWORD
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_EMAIL = process.env.TEST_EMAIL || "admin@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "password123";

let authToken = null;
let testProjectId = null;
let testRfiId = null;
let testFileId = null;
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

// Helper: Make HTTP request
function request(method, urlPath, body = null, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const headers = {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    };

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = lib.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      if (Buffer.isBuffer(body) || typeof body === "string") {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }

    req.end();
  });
}

// Helper: Upload file via multipart
function uploadFile(urlPath, filePath, fieldName = "file") {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const prefix = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n`
    );
    const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([prefix, fileContent, suffix]);

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
        Authorization: `Bearer ${authToken}`,
      },
    };

    const req = lib.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// Test runner
async function runTest(name, testFn) {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    console.log(`✅ PASS: ${name} (${duration}ms)`);
    testsPassed++;
    testResults.push({ name, passed: true, duration });
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ FAIL: ${name} (${duration}ms)`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
    testResults.push({
      name,
      passed: false,
      duration,
      error: error.message,
    });
  }
}

// Assert helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ==================== TESTS ====================

async function testHealthCheck() {
  const res = await request("GET", "/health");
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(res.data.status === "ok", "Health check failed");
}

async function testAuthLogin() {
  const res = await request("POST", "/api/auth/login", {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  assert(res.status === 200, `Login failed with status ${res.status}`);
  assert(res.data.token, "No token returned");
  authToken = res.data.token;
}

async function testAuthMe() {
  const res = await request("GET", "/api/auth/me");
  assert(res.status === 200, `Auth me failed with status ${res.status}`);
  assert(res.data.user?.email === TEST_EMAIL, "Email mismatch");
}

async function testListProjects() {
  const res = await request("GET", "/api/projects");
  assert(res.status === 200, `List projects failed with status ${res.status}`);
  assert(Array.isArray(res.data.data), "Expected data array");
  if (res.data.data.length > 0) {
    testProjectId = res.data.data[0].id;
    console.log(`   Using project ID: ${testProjectId}`);
  }
}

async function testProjectAccess() {
  if (!testProjectId) {
    throw new Error("No project available to test");
  }
  const res = await request("GET", `/api/projects/${testProjectId}`);
  assert(res.status === 200, `Project access failed with status ${res.status}`);
  assert(res.data.id === testProjectId, "Project ID mismatch");
}

async function testRfiList() {
  if (!testProjectId) throw new Error("No project");
  const res = await request("GET", `/api/projects/${testProjectId}/rfis`);
  assert(res.status === 200, `RFI list failed with status ${res.status}`);
  assert(Array.isArray(res.data.data), "Expected RFI data array");
}

async function testRfiCreate() {
  if (!testProjectId) throw new Error("No project");
  const res = await request("POST", `/api/projects/${testProjectId}/rfis`, {
    subject: `[CI Test] Smoke Test RFI ${Date.now()}`,
    question: "This is a smoke test RFI created by automated testing.",
    priority: "medium",
  });
  assert(res.status === 201, `RFI create failed with status ${res.status}`);
  assert(res.data.id, "No RFI ID returned");
  testRfiId = res.data.id;
  console.log(`   Created RFI ID: ${testRfiId}`);
}

async function testRfiDetail() {
  if (!testProjectId || !testRfiId) throw new Error("No project or RFI");
  const res = await request(
    "GET",
    `/api/projects/${testProjectId}/rfis/${testRfiId}`
  );
  assert(res.status === 200, `RFI detail failed with status ${res.status}`);
  assert(res.data.id === testRfiId, "RFI ID mismatch");
}

async function testRfiUpdate() {
  if (!testProjectId || !testRfiId) throw new Error("No project or RFI");
  const res = await request(
    "PATCH",
    `/api/projects/${testProjectId}/rfis/${testRfiId}`,
    {
      priority: "high",
    }
  );
  assert(res.status === 200, `RFI update failed with status ${res.status}`);
  assert(res.data.priority === "high", "Priority not updated");
}

async function testRfiWorkflow() {
  if (!testProjectId) throw new Error("No project");
  const res = await request(
    "GET",
    `/api/projects/${testProjectId}/rfis/workflow`
  );
  assert(res.status === 200, `Workflow fetch failed with status ${res.status}`);
  assert(res.data.workflow, "No workflow returned");
  assert(Array.isArray(res.data.workflow), "Workflow not an array");
}

async function testRfiStatusTransition() {
  if (!testProjectId || !testRfiId) throw new Error("No project or RFI");
  // Transition from open -> in_review
  const res = await request(
    "PATCH",
    `/api/projects/${testProjectId}/rfis/${testRfiId}`,
    {
      status: "in_review",
    }
  );
  assert(
    res.status === 200,
    `Status transition failed with status ${res.status}`
  );
  assert(res.data.status === "in_review", "Status not updated to in_review");
}

async function testRfiMetrics() {
  if (!testProjectId) throw new Error("No project");
  const res = await request(
    "GET",
    `/api/projects/${testProjectId}/rfis/metrics`
  );
  assert(res.status === 200, `Metrics fetch failed with status ${res.status}`);
  assert(typeof res.data.total === "number", "No total in metrics");
}

async function testRfiSlaStatus() {
  if (!testProjectId) throw new Error("No project");
  const res = await request(
    "GET",
    `/api/projects/${testProjectId}/rfis/sla-status`
  );
  assert(
    res.status === 200,
    `SLA status fetch failed with status ${res.status}`
  );
}

async function testFileUpload() {
  if (!testProjectId) throw new Error("No project");

  // Create a temp test file
  const testFilePath = path.join(__dirname, "test_upload_temp.txt");
  fs.writeFileSync(testFilePath, `Test file content ${Date.now()}`);

  try {
    const res = await uploadFile(
      `/api/projects/${testProjectId}/files`,
      testFilePath
    );
    assert(res.status === 201, `File upload failed with status ${res.status}`);
    assert(res.data.id, "No file ID returned");
    testFileId = res.data.id;
    console.log(`   Uploaded file ID: ${testFileId}`);
  } finally {
    // Cleanup
    fs.unlinkSync(testFilePath);
  }
}

async function testFileAttachToRfi() {
  if (!testProjectId || !testRfiId || !testFileId) {
    throw new Error("Missing project, RFI, or file");
  }

  const res = await request(
    "POST",
    `/api/projects/${testProjectId}/rfis/${testRfiId}/attachments`,
    {
      fileId: testFileId,
    }
  );
  assert(
    res.status === 201,
    `Attachment failed with status ${res.status}: ${JSON.stringify(res.data)}`
  );
}

async function testSignedDownloadUrl() {
  if (!testFileId) throw new Error("No file");
  const res = await request("GET", `/api/files/${testFileId}/signed-url`);
  assert(
    res.status === 200,
    `Signed URL fetch failed with status ${res.status}`
  );
  assert(res.data.url, "No signed URL returned");
  console.log(`   Signed URL: ${res.data.url.substring(0, 60)}...`);
}

async function testNotificationsList() {
  const res = await request("GET", "/api/notifications");
  assert(
    res.status === 200,
    `Notifications list failed with status ${res.status}`
  );
  assert(Array.isArray(res.data.data), "Expected notifications array");
}

async function testRfiAuditLogs() {
  if (!testProjectId || !testRfiId) throw new Error("No project or RFI");
  const res = await request(
    "GET",
    `/api/projects/${testProjectId}/rfis/${testRfiId}/audit`
  );
  assert(
    res.status === 200,
    `Audit logs fetch failed with status ${res.status}`
  );
  assert(Array.isArray(res.data.data), "Expected audit logs array");
}

async function testRfiVoid() {
  if (!testProjectId || !testRfiId) throw new Error("No project or RFI");
  // Void the test RFI to clean up
  const res = await request(
    "PATCH",
    `/api/projects/${testProjectId}/rfis/${testRfiId}`,
    {
      status: "void",
    }
  );
  assert(res.status === 200, `Void RFI failed with status ${res.status}`);
  assert(res.data.status === "void", "Status not updated to void");
}

// ==================== MAIN ====================

async function main() {
  console.log("\n🚀 RFI Module CI Smoke Tests");
  console.log("=".repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log("=".repeat(50));
  console.log("");

  const startTime = Date.now();

  // Run tests in order
  await runTest("Health Check", testHealthCheck);
  await runTest("Auth Login", testAuthLogin);
  await runTest("Auth Me", testAuthMe);
  await runTest("List Projects", testListProjects);
  await runTest("Project Access", testProjectAccess);
  await runTest("RFI List", testRfiList);
  await runTest("RFI Create", testRfiCreate);
  await runTest("RFI Detail", testRfiDetail);
  await runTest("RFI Update", testRfiUpdate);
  await runTest("RFI Workflow", testRfiWorkflow);
  await runTest("RFI Status Transition", testRfiStatusTransition);
  await runTest("RFI Metrics", testRfiMetrics);
  await runTest("RFI SLA Status", testRfiSlaStatus);
  await runTest("File Upload", testFileUpload);
  await runTest("File Attach to RFI", testFileAttachToRfi);
  await runTest("Signed Download URL", testSignedDownloadUrl);
  await runTest("Notifications List", testNotificationsList);
  await runTest("RFI Audit Logs", testRfiAuditLogs);
  await runTest("RFI Void (Cleanup)", testRfiVoid);

  const totalTime = Date.now() - startTime;

  console.log("");
  console.log("=".repeat(50));
  console.log(`📊 Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log("=".repeat(50));

  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
