const { pool } = require("../../db/pool");
const { AppError } = require("../../utils/appError");
const { insertAuditLog } = require("../rfis/rfi.service");
const { logger } = require("../../logger");

const extractRfiNumber = (subject) => {
  if (!subject) return null;
  const match = subject.match(/RFI[-\s]?(\d+)/i);
  return match ? Number(match[1]) : null;
};

const findRfiByNumber = async (projectId, number) => {
  const [[row]] = await pool.execute(
    "SELECT * FROM rfis WHERE project_id = ? AND number = ? LIMIT 1",
    [projectId, number]
  );
  return row || null;
};

const resolveProjectFromToAddress = async (toAddress) => {
  // Expect format: rfi+<projectId>@domain or <projectId>@rfis.domain
  if (!toAddress) return null;
  const addr = Array.isArray(toAddress) ? toAddress[0] : String(toAddress);
  const m = addr.match(/\+?(\d+)/);
  return m ? Number(m[1]) : null;
};

const resolveUserByEmail = async (email) => {
  if (!email) return null;
  const normalized = String(email).toLowerCase().trim();
  const [[user]] = await pool.execute(
    "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
    [normalized]
  );
  return user ? user.id : null;
};

exports.processInboundEmail = async ({
  subject,
  from,
  to,
  text,
  html,
  tex0t,
}) => {
  const projectId = await resolveProjectFromToAddress(to);
  if (!projectId)
    throw new AppError("Cannot resolve project from recipient", 400);

  const rfiNumber = extractRfiNumber(subject);
  if (!rfiNumber) throw new AppError("Subject missing RFI number", 400);

  const rfi = await findRfiByNumber(projectId, rfiNumber);
  if (!rfi) throw new AppError("Target RFI not found", 404);

  const responderUserId = await resolveUserByEmail(from);

  const bodyText = text || tex0t; // accept common payload typo
  const content =
    bodyText && bodyText.trim().length ? bodyText.trim() : (html || "").trim();
  if (!content) throw new AppError("Empty email body", 400);

  const fallbackUserId =
    responderUserId ||
    rfi.ball_in_court_user_id ||
    rfi.assigned_to_user_id ||
    rfi.created_by_user_id;

  if (!fallbackUserId) {
    throw new AppError(
      "No valid user found to attribute response (responder, BIC, assigned, creator)",
      400
    );
  }

  const [result] = await pool.execute(
    `INSERT INTO rfi_responses (rfi_id, responded_by_user_id, response_text)
     VALUES (?, ?, ?)`,
    [rfi.id, fallbackUserId, content]
  );

  await pool.execute(
    `UPDATE rfis SET updated_at = NOW(), status = CASE WHEN status = 'open' THEN 'answered' ELSE status END WHERE id = ?`,
    [rfi.id]
  );

  try {
    await insertAuditLog({
      projectId,
      rfiId: rfi.id,
      userId: responderUserId || null,
      action: "response_added",
      field: "responses",
      oldValue: null,
      newValue: { response_id: result.insertId },
    });
  } catch (e) {
    logger.warn({ err: e }, "Failed to write audit log for inbound email");
  }

  return { rfiId: rfi.id, responseId: result.insertId };
};
