/**
 * SLA Reminder Service
 * Checks for overdue RFIs and sends notifications/escalations
 */
const { pool } = require("../../db/pool");
const { createNotification } = require("../notifications/notification.service");
const { logger } = require("../../logger");

// SLA thresholds in days
const SLA_THRESHOLDS = {
  warning: 2, // days before due date to send warning
  overdue: 0, // on due date
  escalation: -3, // 3 days past due for escalation
};

/**
 * Get RFIs approaching or past due date
 */
async function getOverdueRfis() {
  const today = new Date().toISOString().split("T")[0];

  const [rows] = await pool.execute(
    `SELECT r.id, r.rfi_number, r.subject, r.due_date, r.status, r.project_id,
            r.assignee_id, r.created_by_user_id,
            p.name as project_name,
            DATEDIFF(r.due_date, ?) as days_until_due,
            a.first_name as assignee_first_name, a.last_name as assignee_last_name, a.email as assignee_email,
            c.first_name as creator_first_name, c.last_name as creator_last_name
     FROM rfis r
     JOIN projects p ON r.project_id = p.id
     LEFT JOIN users a ON r.assignee_id = a.id
     LEFT JOIN users c ON r.created_by_user_id = c.id
     WHERE r.status NOT IN ('closed', 'void', 'answered')
       AND r.due_date IS NOT NULL
       AND r.due_date <= DATE_ADD(?, INTERVAL ? DAY)
     ORDER BY r.due_date ASC`,
    [today, today, SLA_THRESHOLDS.warning]
  );

  return rows;
}

/**
 * Get last reminder sent for an RFI (to avoid duplicate notifications)
 */
async function getLastReminder(rfiId, reminderType) {
  const [rows] = await pool.execute(
    `SELECT id, created_at FROM notifications
     WHERE entity_type = 'rfi' AND entity_id = ? AND type = ?
     ORDER BY created_at DESC LIMIT 1`,
    [rfiId, reminderType]
  );
  return rows[0] || null;
}

/**
 * Check if reminder was already sent today
 */
function wasReminderSentToday(lastReminder) {
  if (!lastReminder) return false;
  const today = new Date().toISOString().split("T")[0];
  const reminderDate = new Date(lastReminder.created_at)
    .toISOString()
    .split("T")[0];
  return today === reminderDate;
}

/**
 * Process overdue RFIs and send appropriate notifications
 */
async function processOverdueRfis() {
  const overdueRfis = await getOverdueRfis();
  const results = { warnings: 0, overdue: 0, escalations: 0, skipped: 0 };

  for (const rfi of overdueRfis) {
    const daysUntilDue = rfi.days_until_due;

    try {
      // Determine notification type based on days until due
      let notificationType, message, recipients;

      if (daysUntilDue <= SLA_THRESHOLDS.escalation) {
        // Escalation - notify creator AND assignee
        notificationType = "sla_escalation";
        message = `ESCALATION: RFI-${rfi.rfi_number} "${
          rfi.subject
        }" is ${Math.abs(daysUntilDue)} days overdue`;
        recipients = [rfi.assignee_id, rfi.created_by_user_id].filter(Boolean);
      } else if (daysUntilDue <= SLA_THRESHOLDS.overdue) {
        // Overdue - notify assignee
        notificationType = "sla_overdue";
        message = `OVERDUE: RFI-${rfi.rfi_number} "${rfi.subject}" was due ${
          daysUntilDue === 0 ? "today" : `${Math.abs(daysUntilDue)} days ago`
        }`;
        recipients = [rfi.assignee_id].filter(Boolean);
      } else {
        // Warning - approaching due date
        notificationType = "sla_warning";
        message = `REMINDER: RFI-${rfi.rfi_number} "${rfi.subject}" is due in ${daysUntilDue} days`;
        recipients = [rfi.assignee_id].filter(Boolean);
      }

      // Check if we already sent this type of reminder today
      const lastReminder = await getLastReminder(rfi.id, notificationType);
      if (wasReminderSentToday(lastReminder)) {
        results.skipped++;
        continue;
      }

      // Send notifications to recipients
      for (const userId of recipients) {
        await createNotification({
          userId,
          type: notificationType,
          title:
            notificationType === "sla_escalation"
              ? "SLA Escalation"
              : notificationType === "sla_overdue"
              ? "RFI Overdue"
              : "RFI Due Soon",
          message,
          entityType: "rfi",
          entityId: rfi.id,
          projectId: rfi.project_id,
        });
      }

      // Track results
      if (notificationType === "sla_escalation") results.escalations++;
      else if (notificationType === "sla_overdue") results.overdue++;
      else results.warnings++;

      logger.info(
        `SLA ${notificationType} sent for RFI-${rfi.rfi_number} (${rfi.id})`
      );
    } catch (error) {
      logger.error(`Failed to process SLA for RFI ${rfi.id}: ${error.message}`);
    }
  }

  logger.info(
    `SLA check complete: ${results.warnings} warnings, ${results.overdue} overdue, ${results.escalations} escalations, ${results.skipped} skipped`
  );

  return results;
}

/**
 * Get SLA status summary for dashboard
 */
async function getSlaStatusSummary(projectId = null) {
  const today = new Date().toISOString().split("T")[0];

  let query = `
    SELECT 
      COUNT(CASE WHEN due_date < ? THEN 1 END) as overdue,
      COUNT(CASE WHEN due_date = ? THEN 1 END) as due_today,
      COUNT(CASE WHEN due_date BETWEEN DATE_ADD(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 3 DAY) THEN 1 END) as due_soon,
      COUNT(*) as total_open
    FROM rfis
    WHERE status NOT IN ('closed', 'void', 'answered')
      AND due_date IS NOT NULL
  `;

  const params = [today, today, today, today];

  if (projectId) {
    query += ` AND project_id = ?`;
    params.push(projectId);
  }

  const [rows] = await pool.execute(query, params);
  return rows[0];
}

module.exports = {
  processOverdueRfis,
  getOverdueRfis,
  getSlaStatusSummary,
  SLA_THRESHOLDS,
};
