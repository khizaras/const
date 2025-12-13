const nodemailer = require("nodemailer");
require("dotenv").config();

const sendTestEmail = async () => {
  try {
    // Create transporter with hands2gether.org SMTP using env config
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "hands2gether.org",
      port: parseInt(process.env.EMAIL_PORT || "465"),
      secure: true, // SSL
      auth: {
        user: process.env.EMAIL_USER || "admin@hands2gether.org",
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });

    // README.md content converted to HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 { color: #0066FF; font-size: 28px; margin-top: 30px; }
        h2 { color: #0066FF; font-size: 22px; margin-top: 25px; }
        h3 { color: #0066FF; font-size: 18px; margin-top: 20px; }
        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Courier New', monospace;
        }
        pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #0066FF;
        }
        pre code {
            background: none;
            padding: 0;
        }
        ul, ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
        }
        a {
            color: #0066FF;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .header {
            background: linear-gradient(135deg, #0066FF 0%, #1890ff 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 20px;
        }
        .badge {
            display: inline-block;
            background: #0066FF;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-right: 8px;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; padding: 0;">🎨 Procore Console - Enterprise RFI Hub</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">A modern, enterprise-grade Request for Information (RFI) management system built with React, Redux, Node.js, Express, and MySQL.</p>
    </div>

    <h2>🎨 Features</h2>

    <h3>Enterprise-Grade UI</h3>
    <ul>
        <li><strong>Premium Design System</strong>: Clean, professional interface inspired by Apple, Walmart, and leading SaaS platforms</li>
        <li><strong>Inter Font Family</strong>: Industry-standard typography for enterprise applications</li>
        <li><strong>Responsive Layout</strong>: Optimized for desktop (1920px), laptop (1440px), tablet (1024px), and mobile (768px)</li>
        <li><strong>Modern Components</strong>: Cards, pills, badges, and buttons with smooth transitions and hover effects</li>
    </ul>

    <h3>Core Functionality</h3>
    <ul>
        <li><strong>RFI Management</strong>: Create, track, and manage RFIs with status workflow (open → answered → closed)</li>
        <li><strong>Priority System</strong>: Urgent, high, medium, low priority levels with visual indicators</li>
        <li><strong>Ball-in-Court Tracking</strong>: Monitor who's responsible for each RFI response</li>
        <li><strong>Real-time Metrics</strong>: Dashboard with answer rates, cycle times, and urgent queue monitoring</li>
        <li><strong>Advanced Filtering</strong>: Filter by status, priority, due date, and search terms</li>
        <li><strong>Project Context</strong>: Multi-project support with project-based access control</li>
    </ul>

    <h3>Security & Authentication</h3>
    <ul>
        <li><strong>JWT Authentication</strong>: Secure token-based authentication</li>
        <li><strong>Organization Isolation</strong>: Multi-tenant architecture with organization-level data separation</li>
        <li><strong>Role-Based Access</strong>: Project-level user permissions</li>
        <li><strong>Password Hashing</strong>: bcrypt for secure password storage</li>
    </ul>

    <h2>🚀 Getting Started</h2>

    <h3>Prerequisites</h3>
    <ul>
        <li>Node.js 18+ and npm</li>
        <li>MySQL 8.0+</li>
        <li>Git</li>
    </ul>

    <h3>Installation</h3>
    <ol>
        <li><strong>Clone the repository</strong>
            <pre><code>git clone https://github.com/khizaras/const.git
cd const</code></pre>
        </li>
        <li><strong>Install dependencies</strong>
            <pre><code>npm install</code></pre>
        </li>
        <li><strong>Set up environment variables</strong>
            <pre><code># Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=procore

# Server
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_min_16_chars</code></pre>
        </li>
        <li><strong>Initialize the database</strong>
            <pre><code>mysql -u root -p < server/db/schema.sql</code></pre>
        </li>
        <li><strong>Start the development servers</strong>
            <pre><code>npm run server:dev
npm run client:dev</code></pre>
        </li>
        <li><strong>Access the application</strong>
            <p>Open <a href="http://localhost:5173">http://localhost:5173</a> in your browser</p>
        </li>
    </ol>

    <h3>Default Test Account</h3>
    <pre><code>Organization ID: 1
Email: eng@example.com
Password: Passw0rd!</code></pre>

    <h2>📊 Technology Stack</h2>

    <h3>Frontend</h3>
    <ul>
        <li><strong>React 18</strong> - UI library</li>
        <li><strong>Redux Toolkit</strong> - State management</li>
        <li><strong>React Router v6</strong> - Client-side routing</li>
        <li><strong>Ant Design 5</strong> - UI component library</li>
        <li><strong>Axios</strong> - HTTP client</li>
        <li><strong>Day.js</strong> - Date manipulation</li>
        <li><strong>LESS</strong> - CSS preprocessing</li>
        <li><strong>Webpack 5</strong> - Module bundler</li>
    </ul>

    <h3>Backend</h3>
    <ul>
        <li><strong>Node.js</strong> - Runtime environment</li>
        <li><strong>Express 4</strong> - Web framework</li>
        <li><strong>MySQL 2</strong> - Database</li>
        <li><strong>JWT</strong> - Authentication tokens</li>
        <li><strong>Bcrypt</strong> - Password hashing</li>
        <li><strong>Zod</strong> - Schema validation</li>
        <li><strong>Pino</strong> - Logging</li>
        <li><strong>Helmet</strong> - Security headers</li>
        <li><strong>CORS</strong> - Cross-origin resource sharing</li>
    </ul>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    
    <p style="text-align: center; color: #999; font-size: 12px;">
        Built with ❤️ using modern web technologies
    </p>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "admin@hands2gether.org",
      to: "khizaras@gmail.com",
      subject: "📋 Procore Console - Enterprise RFI Hub - Test Email",
      html: htmlContent,
      text: "Procore Console - Enterprise RFI Hub. Please view this email in HTML format.",
    };

    console.log("📧 Sending test email...");
    console.log(`From: ${mailOptions.from}`);
    console.log(`To: ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`SMTP Host: ${process.env.EMAIL_HOST}`);
    console.log(`SMTP Port: ${process.env.EMAIL_PORT}`);
    console.log(`SMTP User: ${process.env.EMAIL_USER}`);
    console.log("---");

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Accepted: ${info.accepted}`);
    console.log(`Response: ${info.response}`);
  } catch (error) {
    console.error("❌ Error sending email:");
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    if (error.response) {
      console.error(`SMTP Response: ${error.response}`);
    }
    process.exit(1);
  }
};

sendTestEmail();
