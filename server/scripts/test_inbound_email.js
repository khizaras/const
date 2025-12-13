/*
 Simple end-to-end test for inbound email webhook:
 - Posts a mock inbound email to /webhooks/email
 - Then fetches the target RFI detail to verify the response exists

 Usage:
   npm run test:inbound

 Env:
   TEST_BASE_URL (default http://localhost:5000)
   TEST_PROJECT_ID (default 1)
   TEST_RFI_NUMBER (default 1)
*/

const axios = require("axios");

const BASE = process.env.TEST_BASE_URL || "http://localhost:5000";
const PROJECT_ID = Number(process.env.TEST_PROJECT_ID || 1);
const RFI_NUMBER = Number(process.env.TEST_RFI_NUMBER || 1);

async function findRfiByNumber(projectId, number) {
  // minimal listing to locate ID by number
  const url = `${BASE}/api/projects/${projectId}/rfis?page=1&pageSize=50`;
  const { data } = await axios.get(url, { headers: { Authorization: "" } });
  const rfi = data.data.find((r) => r.number === number);
  if (!rfi) throw new Error(`RFI #${number} not found in project ${projectId}`);
  return rfi.id;
}

async function postInboundEmail(projectId, number, bodyText) {
  const payload = {
    subject: `Re: RFI-${number} Test reply`,
    from: "responder@example.com",
    to: `rfi+${projectId}@example.com`,
    tex0t: bodyText,
  };
  const { data } = await axios.post(`${BASE}/webhooks/email`, payload);
  return data;
}

async function getRfiDetail(projectId, rfiId) {
  const url = `${BASE}/api/projects/${projectId}/rfis/${rfiId}`;
  const { data } = await axios.get(url, { headers: { Authorization: "" } });
  return data;
}

(async () => {
  try {
    console.log(`Base: ${BASE}`);
    console.log(`Locating RFI #${RFI_NUMBER} in project ${PROJECT_ID}...`);
    const rfiId = await findRfiByNumber(PROJECT_ID, RFI_NUMBER);
    console.log(`RFI id = ${rfiId}`);

    const body = `Automated test reply at ${new Date().toISOString()}`;
    console.log("Posting inbound email...");
    const inboundRes = await postInboundEmail(PROJECT_ID, RFI_NUMBER, body);
    console.log("Inbound result:", inboundRes);

    console.log("Fetching RFI detail...");
    const detail = await getRfiDetail(PROJECT_ID, rfiId);
    const found = (detail.responses || []).find((r) =>
      (r.response_text || "").includes(body)
    );
    if (!found) {
      console.error("ERROR: Response not found in RFI thread");
      process.exit(1);
    }
    console.log("SUCCESS: Response present in RFI thread");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message);
    process.exit(1);
  }
})();
