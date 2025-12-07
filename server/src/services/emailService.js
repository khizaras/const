const nodemailer = require("nodemailer");
const { env } = require("../config/env");
const logger = require("../logger");

let transporter = null;

const initializeTransporter = () => {
  if (!env.EMAIL_USER || !env.EMAIL_PASSWORD) {
    logger.warn("Email credentials not configured. Email notifications will be disabled.");
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: parseInt(env.EMAIL_PORT),
      secure: env.EMAIL_PORT === "465", // true for 465, false for other ports
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });

    logger.info("Email transporter initialized successfully");
    return transporter;
  } catch (error) {
    logger.error("Failed to initialize email transporter:", error);
    return null;
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    transporter = initializeTransporter();
  }

  if (!transporter) {
    logger.warn("Email service not available. Skipping email send.");
    return { success: false, message: "Email service not configured" };
  }

  try {
    const mailOptions = {
      from: env.EMAIL_FROM || env.EMAIL_USER,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
};

const sendRfiCreatedEmail = async ({ to, rfiNumber, rfiTitle, createdBy, projectName, rfiUrl }) => {
  const subject = `New RFI #${rfiNumber}: ${rfiTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f5f5f5; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New RFI Created</h2>
        </div>
        <div class="content">
          <p><strong>RFI #${rfiNumber}: ${rfiTitle}</strong></p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Created by:</strong> ${createdBy}</p>
          <p>A new Request for Information has been created and requires your attention.</p>
          <a href="${rfiUrl}" class="button">View RFI</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from Procore MVP.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `New RFI #${rfiNumber}: ${rfiTitle}\n\nProject: ${projectName}\nCreated by: ${createdBy}\n\nView RFI: ${rfiUrl}`;

  return sendEmail({ to, subject, html, text });
};

const sendRfiAssignedEmail = async ({ to, rfiNumber, rfiTitle, assignedBy, projectName, rfiUrl }) => {
  const subject = `RFI #${rfiNumber} Assigned to You: ${rfiTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #52c41a; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f5f5f5; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #52c41a; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>RFI Assigned to You</h2>
        </div>
        <div class="content">
          <p><strong>RFI #${rfiNumber}: ${rfiTitle}</strong></p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Assigned by:</strong> ${assignedBy}</p>
          <p>This RFI has been assigned to you and requires your response.</p>
          <a href="${rfiUrl}" class="button">View & Respond</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from Procore MVP.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `RFI #${rfiNumber} Assigned to You: ${rfiTitle}\n\nProject: ${projectName}\nAssigned by: ${assignedBy}\n\nView & Respond: ${rfiUrl}`;

  return sendEmail({ to, subject, html, text });
};

const sendRfiResponseEmail = async ({ to, rfiNumber, rfiTitle, respondedBy, responseText, projectName, rfiUrl }) => {
  const subject = `New Response on RFI #${rfiNumber}: ${rfiTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #722ed1; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f5f5f5; padding: 20px; }
        .response { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #722ed1; }
        .button { display: inline-block; padding: 12px 24px; background-color: #722ed1; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Response on RFI</h2>
        </div>
        <div class="content">
          <p><strong>RFI #${rfiNumber}: ${rfiTitle}</strong></p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Response by:</strong> ${respondedBy}</p>
          <div class="response">
            <p>${responseText}</p>
          </div>
          <a href="${rfiUrl}" class="button">View Full Thread</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from Procore MVP.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `New Response on RFI #${rfiNumber}: ${rfiTitle}\n\nProject: ${projectName}\nResponse by: ${respondedBy}\n\n${responseText}\n\nView Full Thread: ${rfiUrl}`;

  return sendEmail({ to, subject, html, text });
};

const sendRfiStatusChangeEmail = async ({ to, rfiNumber, rfiTitle, newStatus, changedBy, projectName, rfiUrl }) => {
  const subject = `RFI #${rfiNumber} Status Changed to ${newStatus.toUpperCase()}`;
  const statusColors = {
    open: "#1890ff",
    answered: "#52c41a",
    closed: "#8c8c8c",
    void: "#ff4d4f",
  };
  const color = statusColors[newStatus] || "#1890ff";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color}; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f5f5f5; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${color}; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>RFI Status Updated</h2>
        </div>
        <div class="content">
          <p><strong>RFI #${rfiNumber}: ${rfiTitle}</strong></p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>New Status:</strong> ${newStatus.toUpperCase()}</p>
          <p><strong>Changed by:</strong> ${changedBy}</p>
          <a href="${rfiUrl}" class="button">View RFI</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from Procore MVP.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `RFI #${rfiNumber} Status Changed to ${newStatus.toUpperCase()}\n\nProject: ${projectName}\nChanged by: ${changedBy}\n\nView RFI: ${rfiUrl}`;

  return sendEmail({ to, subject, html, text });
};

module.exports = {
  initializeTransporter,
  sendEmail,
  sendRfiCreatedEmail,
  sendRfiAssignedEmail,
  sendRfiResponseEmail,
  sendRfiStatusChangeEmail,
};
