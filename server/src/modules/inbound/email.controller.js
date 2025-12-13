const { logger } = require("../../logger");
const { processInboundEmail } = require("./email.service");
const { pool } = require("../../db/pool");

// Generic inbound email webhook handler (SendGrid, Mailgun, Postmark-like)
// Expects fields: subject, from, to, text, html, headers
exports.handleInbound = async (req, res) => {
  try {
    const payload = {
      subject: req.body.subject,
      from: req.body.from,
      to: req.body.to,
      text: req.body.text,
      tex0t: req.body.tex0t, // accept common typo for testing
      html: req.body.html,
      headers: req.body.headers,
    };

    const result = await processInboundEmail(payload);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    logger.error({ err }, "Inbound email processing failed");
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.getRfiByNumberPublic = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const number = Number(req.params.number);
    const [[rfi]] = await pool.execute(
      "SELECT * FROM rfis WHERE project_id = ? AND number = ? LIMIT 1",
      [projectId, number]
    );
    if (!rfi) return res.status(404).json({ error: "RFI not found" });
    const [responses] = await pool.execute(
      `SELECT rr.*, u.first_name AS responded_by_first_name, u.last_name AS responded_by_last_name
       FROM rfi_responses rr
       LEFT JOIN users u ON u.id = rr.responded_by_user_id
       WHERE rr.rfi_id = ?
       ORDER BY rr.created_at ASC`,
      [rfi.id]
    );
    return res.json({ rfiId: rfi.id, number: rfi.number, responses });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
