# RFI Module - Implementation Status

**Last Updated:** December 29, 2025  
**Module:** Request for Information (RFI)  
**Status:** ✅ MVP Complete

---

## ✅ Completed Features

### Backend Infrastructure

- ✅ **Database Schema**

  - `rfis` table with all core fields
  - `rfi_responses` for threaded responses
  - `rfi_watchers` for notification distribution
  - `comments` generic table (supports RFIs)
  - `attachments` generic table (supports RFIs)
  - `notifications` system table
  - `audit_logs` for tracking changes
  - `files` storage reference table
  - `workflow_definition` JSON column for customizable workflows

- ✅ **Core API Endpoints** (`/api/projects/:projectId/rfis`)

  - `GET /` - List RFIs with filtering (status, priority, assignee, ball-in-court, due date, search)
  - `POST /` - Create new RFI
  - `GET /:rfiId` - Get RFI detail (includes responses, watchers, attachments)
  - `PATCH /:rfiId` - Update RFI (with workflow validation)
  - `POST /:rfiId/responses` - Add response
  - `POST /:rfiId/watchers` - Add watcher
  - `DELETE /:rfiId/watchers/:userId` - Remove watcher
  - `GET /:rfiId/comments` - List comments
  - `POST /:rfiId/comments` - Add comment
  - `DELETE /:rfiId/comments/:commentId` - Delete comment
  - `GET /:rfiId/audit` - Audit trail
  - `GET /metrics` - Dashboard metrics
  - `GET /workflow` - Workflow definition
  - `GET /sla-status` - SLA summary (overdue/due_today/due_soon)

- ✅ **RFI Service Logic**

  - List with pagination and advanced filters
  - Auto-incrementing RFI numbers (project-scoped)
  - Status workflow (open → in_review → answered → closed / void)
  - Ball-in-court tracking
  - Due date management
  - Priority levels (low, medium, high, urgent)
  - Watchers management
  - Response threading
  - Audit logging on all changes

- ✅ **Workflow System**

  - Configurable stages per project
  - Transition validation (allowed paths)
  - Default workflow: open → in_review → answered → closed
  - Void status for cancelled RFIs

- ✅ **Validation**
  - Zod schemas for all endpoints
  - Project access middleware
  - User membership verification

### File Management

- ✅ **File Upload API**

  - `POST /api/projects/:projectId/files` - Upload file
  - `GET /api/files/:fileId/download` - Download (auth or signed URL)
  - `GET /api/files/:fileId/signed-url` - Generate signed download URL
  - `DELETE /api/files/:fileId` - Delete file

- ✅ **Attachments API**

  - `POST /api/projects/:projectId/rfis/:rfiId/attachments` - Attach file
  - `GET /api/projects/:projectId/rfis/:rfiId/attachments` - List attachments
  - `DELETE /api/projects/:projectId/rfis/:rfiId/attachments/:attachmentId` - Remove

- ✅ **File Security**
  - MIME type whitelist validation
  - Magic bytes verification (content type verification)
  - Dangerous extension blacklist (.exe, .bat, etc.)
  - Size limit (50MB default, configurable)
  - Signed download URLs with HMAC-SHA256 and expiry

### Notifications System

- ✅ **Backend**

  - `notifications` table with user/type/entity tracking
  - `createNotification()` service helper
  - REST endpoints: list, mark-read, mark-all-read
  - Automatic notifications on RFI events:
    - Assignment changes
    - Status transitions
    - New responses

- ✅ **Frontend**
  - Notification bell icon with unread count badge
  - Dropdown panel with notification list
  - Mark as read (individual and all)
  - Click-through to RFI detail

### SLA & Aging

- ✅ **Backend**

  - SLA service with threshold configuration
  - Scheduled job (daily at 9 AM) to check overdue RFIs
  - Automatic notifications:
    - Warning (2 days before due)
    - Overdue (on due date)
    - Escalation (3+ days past due)
  - SLA status endpoint for dashboards

- ✅ **Frontend**
  - SLA risk column in RFI list
  - Aging/SLA metrics card on dashboard
  - Overdue indicators

### Email Integration

- ✅ **Outbound Email**

  - SMTP/Gmail transporter configuration
  - Notification emails on RFI events

- ✅ **Inbound Email Webhook**
  - POST `/api/inbound/email` for email service webhooks
  - Token authentication (`x-inbound-token` header)
  - IP allow-list validation
  - RFI reference parsing from subject/body
  - Auto-creates response or comment from email

### Frontend Application

- ✅ **RFI Dashboard Page**

  - Metrics cards (total, open, overdue, answered, cycle time)
  - RFI list with status badges
  - Priority indicators
  - Due date display
  - SLA risk column
  - Real-time filtering (status, priority, assignee, ball-in-court)

- ✅ **RFI Detail Modal**

  - Full RFI details view
  - Response composer
  - Comment thread
  - Attachment gallery with upload/download
  - Watcher management
  - Workflow stepper with transition buttons
  - Audit timeline

- ✅ **Redux State Management**

  - `rfiSlice` with async thunks
  - Filters state management
  - Loading/error states

- ✅ **Components**
  - `RfiList` - Main list component
  - `RfiFilters` - Advanced filter panel
  - `RfiCreateModal` - New RFI form
  - `RfiDetailModal` - Full detail view
  - `RfiWorkflowStepper` - Visual workflow stepper
  - `NotificationDropdown` - Notification panel

---

## Testing

- ✅ **CI Smoke Tests** (`npm run test:smoke`)
  - Auth login and token validation
  - Project access verification
  - RFI CRUD operations
  - File upload and attachment
  - Status transitions (workflow)
  - Signed URL generation
  - Notifications API
  - Audit logs

---

## Environment Variables

```bash
# Required
JWT_SECRET=your-secret-key
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DB=procore

# Optional - File Storage
MAX_FILE_SIZE=52428800  # 50MB in bytes
SIGNED_DOWNLOAD_SECRET=your-download-secret  # Falls back to JWT_SECRET
SIGNED_DOWNLOAD_EXPIRY=300  # 5 minutes

# Optional - Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@yourdomain.com

# Optional - Inbound Email
INBOUND_EMAIL_TOKEN=your-webhook-token
INBOUND_IP_ALLOWLIST=0.0.0.0/0  # Comma-separated CIDRs

# Optional - Scheduler
DISABLE_SCHEDULER=false  # Set to true for multi-instance deployments
TZ=UTC  # Timezone for scheduled jobs
```

---

## API Quick Reference

### RFIs

```
GET    /api/projects/:projectId/rfis
POST   /api/projects/:projectId/rfis
GET    /api/projects/:projectId/rfis/metrics
GET    /api/projects/:projectId/rfis/workflow
GET    /api/projects/:projectId/rfis/sla-status
GET    /api/projects/:projectId/rfis/:rfiId
PATCH  /api/projects/:projectId/rfis/:rfiId
POST   /api/projects/:projectId/rfis/:rfiId/responses
POST   /api/projects/:projectId/rfis/:rfiId/watchers
DELETE /api/projects/:projectId/rfis/:rfiId/watchers/:userId
GET    /api/projects/:projectId/rfis/:rfiId/comments
POST   /api/projects/:projectId/rfis/:rfiId/comments
DELETE /api/projects/:projectId/rfis/:rfiId/comments/:commentId
GET    /api/projects/:projectId/rfis/:rfiId/audit
POST   /api/projects/:projectId/rfis/:rfiId/attachments
GET    /api/projects/:projectId/rfis/:rfiId/attachments
DELETE /api/projects/:projectId/rfis/:rfiId/attachments/:attachmentId
```

### Files

```
POST   /api/projects/:projectId/files
GET    /api/files/:fileId/download
GET    /api/files/:fileId/signed-url
DELETE /api/files/:fileId
```

### Notifications

```
GET    /api/notifications
POST   /api/notifications/mark-read
POST   /api/notifications/mark-all-read
```

### Inbound Email

```
POST   /api/inbound/email  (x-inbound-token header required)
```
