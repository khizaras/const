const nodemailer = require("nodemailer");
const { env } = require("../config/env");
const { logger } = require("../logger");

let transporter = null;

const initializeTransporter = () => {
  if (!env.EMAIL_USER || !env.EMAIL_PASSWORD) {
    logger.warn(
      "Email credentials not configured. Email notifications will be disabled."
    );
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
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });

    logger.info("Email transporter initialized successfully");
    return transporter;
  } catch (error) {
    logger.error(
      {
        err: error,
        message: error.message,
        code: error.code,
      },
      "Failed to initialize email transporter"
    );
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

    logger.info(
      {
        to: mailOptions.to,
        from: mailOptions.from,
        subject: mailOptions.subject,
        emailHost: env.EMAIL_HOST,
        emailPort: env.EMAIL_PORT,
        emailUser: env.EMAIL_USER,
      },
      "Attempting to send email"
    );

    const info = await transporter.sendMail(mailOptions);

    logger.info(
      {
        messageId: info.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      },
      "Email sent successfully"
    );

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(
      {
        err: error,
        to,
        from: env.EMAIL_FROM || env.EMAIL_USER,
        subject,
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      },
      "Failed to send email"
    );
    return { success: false, error: error.message };
  }
};

const sendRfiCreatedEmail = async ({
  to,
  rfiNumber,
  rfiTitle,
  createdBy,
  projectName,
  rfiUrl,
}) => {
  const subject = `New RFI #${rfiNumber}: ${rfiTitle}`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2c3e50; background: #f8f9fa; }
        .wrapper { background: #f8f9fa; padding: 20px 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #0066ff 0%, #1890ff 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 600; }
        .header p { font-size: 14px; opacity: 0.9; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
        .content { padding: 40px 30px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 13px; font-weight: 600; color: #0066ff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-item { }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-value { font-size: 16px; color: #2c3e50; font-weight: 500; }
        .description { background: #f8f9fa; padding: 20px; border-left: 4px solid #0066ff; border-radius: 4px; margin: 20px 0; }
        .description p { color: #555; font-size: 14px; }
        .cta-button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0066ff 0%, #1890ff 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: transform 0.2s; margin-top: 20px; }
        .cta-button:hover { transform: translateY(-2px); }
        .divider { height: 1px; background: #ecf0f1; margin: 30px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #ecf0f1; }
        .footer p { font-size: 12px; color: #7f8c8d; margin-bottom: 8px; }
        .footer-links { margin-top: 15px; }
        .footer-links a { color: #0066ff; text-decoration: none; font-size: 12px; margin: 0 10px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>📋 New RFI Created</h1>
            <div class="badge">Action Required</div>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">RFI Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">RFI Number</div>
                  <div class="info-value">#${rfiNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Project</div>
                  <div class="info-value">${projectName}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Request Title</div>
              <div class="description">
                <p><strong>${rfiTitle}</strong></p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Created By</div>
              <p style="color: #555; font-size: 14px;">${createdBy}</p>
            </div>

            <p style="color: #555; font-size: 14px; margin-top: 20px;">A new Request for Information has been created and requires your attention. Please review the details and take appropriate action.</p>

            <a href="${rfiUrl}" class="cta-button">View RFI Details</a>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <p><strong>Procore RFI Hub</strong></p>
            <p>Enterprise Request for Information Management</p>
            <div class="footer-links">
              <a href="${rfiUrl}">View RFI</a>
              <a href="#">Help Center</a>
            </div>
            <p style="margin-top: 15px; color: #bdc3c7;">This is an automated notification from Procore RFI Hub. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `New RFI #${rfiNumber}: ${rfiTitle}\n\nProject: ${projectName}\nCreated by: ${createdBy}\n\nView RFI: ${rfiUrl}`;

  return sendEmail({ to, subject, html, text });
};

const sendRfiAssignedEmail = async ({
  to,
  rfiNumber,
  rfiTitle,
  assignedBy,
  projectName,
  rfiUrl,
}) => {
  const subject = `RFI #${rfiNumber} Assigned to You: ${rfiTitle}`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2c3e50; background: #f8f9fa; }
        .wrapper { background: #f8f9fa; padding: 20px 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 600; }
        .header p { font-size: 14px; opacity: 0.9; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
        .content { padding: 40px 30px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 13px; font-weight: 600; color: #52c41a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-item { }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-value { font-size: 16px; color: #2c3e50; font-weight: 500; }
        .description { background: #f8f9fa; padding: 20px; border-left: 4px solid #52c41a; border-radius: 4px; margin: 20px 0; }
        .description p { color: #555; font-size: 14px; }
        .cta-button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: transform 0.2s; margin-top: 20px; }
        .cta-button:hover { transform: translateY(-2px); }
        .divider { height: 1px; background: #ecf0f1; margin: 30px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #ecf0f1; }
        .footer p { font-size: 12px; color: #7f8c8d; margin-bottom: 8px; }
        .footer-links { margin-top: 15px; }
        .footer-links a { color: #52c41a; text-decoration: none; font-size: 12px; margin: 0 10px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>✅ RFI Assigned to You</h1>
            <div class="badge">Awaiting Your Response</div>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">Assignment Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">RFI Number</div>
                  <div class="info-value">#${rfiNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Project</div>
                  <div class="info-value">${projectName}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Request Title</div>
              <div class="description">
                <p><strong>${rfiTitle}</strong></p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Assigned By</div>
              <p style="color: #555; font-size: 14px;">${assignedBy}</p>
            </div>

            <p style="color: #555; font-size: 14px; margin-top: 20px;">This RFI has been assigned to you and requires your prompt response. Please review the details and provide your input as soon as possible.</p>

            <a href="${rfiUrl}" class="cta-button">View & Respond</a>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <p><strong>Procore RFI Hub</strong></p>
            <p>Enterprise Request for Information Management</p>
            <div class="footer-links">
              <a href="${rfiUrl}">View RFI</a>
              <a href="#">Help Center</a>
            </div>
            <p style="margin-top: 15px; color: #bdc3c7;">This is an automated notification from Procore RFI Hub. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `RFI #${rfiNumber} Assigned to You: ${rfiTitle}\n\nProject: ${projectName}\nAssigned by: ${assignedBy}\n\nView & Respond: ${rfiUrl}`;

  return sendEmail({ to, subject, html, text });
};

const sendRfiResponseEmail = async ({
  to,
  rfiNumber,
  rfiTitle,
  respondedBy,
  responseText,
  projectName,
  rfiUrl,
}) => {
  const subject = `New Response on RFI #${rfiNumber}: ${rfiTitle}`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2c3e50; background: #f8f9fa; }
        .wrapper { background: #f8f9fa; padding: 20px 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #722ed1 0%, #b37feb 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 600; }
        .header p { font-size: 14px; opacity: 0.9; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
        .content { padding: 40px 30px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 13px; font-weight: 600; color: #722ed1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-item { }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-value { font-size: 16px; color: #2c3e50; font-weight: 500; }
        .response-box { background: #f8f9fa; padding: 25px; border-left: 4px solid #722ed1; border-radius: 4px; margin: 20px 0; }
        .response-box p { color: #555; font-size: 14px; line-height: 1.8; }
        .responder { color: #7f8c8d; font-size: 12px; margin-top: 15px; }
        .cta-button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #722ed1 0%, #b37feb 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: transform 0.2s; margin-top: 20px; }
        .cta-button:hover { transform: translateY(-2px); }
        .divider { height: 1px; background: #ecf0f1; margin: 30px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #ecf0f1; }
        .footer p { font-size: 12px; color: #7f8c8d; margin-bottom: 8px; }
        .footer-links { margin-top: 15px; }
        .footer-links a { color: #722ed1; text-decoration: none; font-size: 12px; margin: 0 10px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>💬 New Response on RFI</h1>
            <div class="badge">Update Available</div>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">RFI Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">RFI Number</div>
                  <div class="info-value">#${rfiNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Project</div>
                  <div class="info-value">${projectName}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Request Title</div>
              <p style="color: #555; font-size: 14px; font-weight: 500;">${rfiTitle}</p>
            </div>

            <div class="section">
              <div class="section-title">Response from ${respondedBy}</div>
              <div class="response-box">
                <p>${responseText.replace(/\n/g, "<br>")}</p>
                <div class="responder">Responded by: <strong>${respondedBy}</strong></div>
              </div>
            </div>

            <a href="${rfiUrl}" class="cta-button">View Full Thread</a>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <p><strong>Procore RFI Hub</strong></p>
            <p>Enterprise Request for Information Management</p>
            <div class="footer-links">
              <a href="${rfiUrl}">View RFI</a>
              <a href="#">Help Center</a>
            </div>
            <p style="margin-top: 15px; color: #bdc3c7;">This is an automated notification from Procore RFI Hub. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `New Response on RFI #${rfiNumber}: ${rfiTitle}\n\nProject: ${projectName}\nResponse by: ${respondedBy}\n\n${responseText}\n\nView Full Thread: ${rfiUrl}`;

  return sendEmail({ to, subject, html, text });
};

const sendRfiStatusChangeEmail = async ({
  to,
  rfiNumber,
  rfiTitle,
  newStatus,
  changedBy,
  projectName,
  rfiUrl,
}) => {
  const subject = `RFI #${rfiNumber} Status Changed to ${newStatus.toUpperCase()}`;

  const getStatusGradient = (status) => {
    const gradients = {
      new: "linear-gradient(135deg, #0066ff 0%, #1890ff 100%)",
      "in progress": "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
      "on hold": "linear-gradient(135deg, #fa8c16 0%, #ff7a45 100%)",
      closed: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
    };
    return gradients[status.toLowerCase()] || gradients.new;
  };

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2c3e50; background: #f8f9fa; }
        .wrapper { background: #f8f9fa; padding: 20px 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: ${getStatusGradient(
          newStatus
        )}; color: white; padding: 40px 20px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 600; }
        .header p { font-size: 14px; opacity: 0.9; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
        .content { padding: 40px 30px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 13px; font-weight: 600; color: #2c3e50; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-item { }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-value { font-size: 16px; color: #2c3e50; font-weight: 500; }
        .status-box { background: #f8f9fa; padding: 25px; border-left: 4px solid #52c41a; border-radius: 4px; margin: 20px 0; text-align: center; }
        .status-badge { display: inline-block; padding: 12px 28px; background: ${getStatusGradient(
          newStatus
        )}; color: white; border-radius: 20px; font-weight: 600; font-size: 16px; }
        .cta-button { display: inline-block; padding: 14px 32px; background: ${getStatusGradient(
          newStatus
        )}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: transform 0.2s; margin-top: 20px; }
        .cta-button:hover { transform: translateY(-2px); }
        .divider { height: 1px; background: #ecf0f1; margin: 30px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #ecf0f1; }
        .footer p { font-size: 12px; color: #7f8c8d; margin-bottom: 8px; }
        .footer-links { margin-top: 15px; }
        .footer-links a { color: #52c41a; text-decoration: none; font-size: 12px; margin: 0 10px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>🔄 RFI Status Updated</h1>
            <div class="badge">${newStatus.toUpperCase()}</div>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">RFI Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">RFI Number</div>
                  <div class="info-value">#${rfiNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Project</div>
                  <div class="info-value">${projectName}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Request Title</div>
              <p style="color: #555; font-size: 14px; font-weight: 500;">${rfiTitle}</p>
            </div>

            <div class="section">
              <div class="section-title">New Status</div>
              <div class="status-box">
                <div class="status-badge">${newStatus.toUpperCase()}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Changed By</div>
              <p style="color: #555; font-size: 14px;">${changedBy}</p>
            </div>

            <a href="${rfiUrl}" class="cta-button">View RFI Details</a>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <p><strong>Procore RFI Hub</strong></p>
            <p>Enterprise Request for Information Management</p>
            <div class="footer-links">
              <a href="${rfiUrl}">View RFI</a>
              <a href="#">Help Center</a>
            </div>
            <p style="margin-top: 15px; color: #bdc3c7;">This is an automated notification from Procore RFI Hub. Please do not reply to this email.</p>
          </div>
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
