# Email Notification Setup Guide

This guide will help you configure email notifications for the Procore MVP application using Gmail.

## Prerequisites

- A Gmail account
- Access to Google Account Security settings

## Gmail App Password Setup

Since Google requires 2-Factor Authentication for app passwords, follow these steps:

### Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "2-Step Verification"
3. Follow the prompts to set up 2-Step Verification if not already enabled

### Step 2: Generate App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Enter "Procore MVP" as the custom name
5. Click "Generate"
6. Google will display a 16-character password - **copy this immediately**
7. This is your `EMAIL_PASSWORD` - you won't be able to see it again

### Step 3: Update .env File

Open your `.env` file and update these values:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=your-email@gmail.com
APP_URL=http://localhost:5173
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Use the 16-character App Password (with or without spaces) as `EMAIL_PASSWORD`
- Do NOT use your regular Gmail password
- `EMAIL_FROM` should match `EMAIL_USER` for Gmail

## Testing Email Configuration

After updating the `.env` file:

1. Restart your server:
   ```bash
   npm run server:dev
   ```

2. Check the server logs for:
   ```
   Email transporter initialized successfully
   ```

3. Test by creating a new RFI with an assigned user - they should receive an email

## Email Notifications Implemented

The following email notifications are automatically sent:

### 1. RFI Created
- **Sent to:** Watchers (excluding creator)
- **Trigger:** New RFI is created
- **Contains:** RFI number, title, creator, project name, link to RFI

### 2. RFI Assigned
- **Sent to:** Assigned user
- **Trigger:** RFI is assigned to a user (during creation or update)
- **Contains:** RFI number, title, assigned by, project name, link to RFI

### 3. Response Added
- **Sent to:** All watchers (excluding responder)
- **Trigger:** Someone adds a response to the RFI
- **Contains:** RFI number, title, responder, response text, link to RFI

### 4. Status Changed
- **Sent to:** All watchers
- **Trigger:** RFI status changes (open → answered → closed)
- **Contains:** RFI number, title, new status, changed by, link to RFI

## Troubleshooting

### "Email service not available" in logs
- Check that `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
- Restart the server after updating `.env`

### Emails not being sent
- Verify your App Password is correct (regenerate if needed)
- Check that 2-Factor Authentication is enabled on your Google Account
- Look for error messages in server logs
- Ensure recipient email addresses exist in the `users` table

### "Invalid login" error
- You might be using your regular Gmail password instead of the App Password
- Regenerate a new App Password and update `.env`

### Rate Limiting
Gmail has sending limits:
- ~500 emails per day for regular Gmail accounts
- Consider using a G Suite/Google Workspace account for higher limits

## Alternative Email Providers

While this setup uses Gmail, you can configure other SMTP providers:

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
```

## Security Notes

- **Never commit your `.env` file to git**
- The `.env` file is already in `.gitignore`
- Use `.env.example` as a template for other developers
- Rotate your App Password if it's compromised
- Use environment-specific configurations for production

## Disabling Email Notifications

To disable email notifications temporarily:
1. Remove or comment out `EMAIL_USER` and `EMAIL_PASSWORD` from `.env`
2. Restart the server
3. The app will log "Email notifications will be disabled" and continue working

No code changes required - emails are optional and the system degrades gracefully.
