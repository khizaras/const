# RFI Module Implementation Checklist

## Setup Points → Implementation Points

### 1. Database Setup

**Setup:**

- PostgreSQL connection configured in `server/db/pool.js`
- Database `procore` created
- Port: 5432 (default PostgreSQL)

**Implementation:**

- ✅ Schema created: `server/db/schema.sql`
  - `users` table: id, email, firstName, lastName, password, organizationId
  - `projects` table: id, name, description, organizationId
  - `rfis` table: id, projectId, title, description, status, priority, assigneeId, createdBy, createdAt, updatedAt, dueDate, category
  - `rfi_files` table: id, rfiId, fileId, uploadedBy, uploadedAt
  - `rfi_watchers` table: id, rfiId, userId, addedAt
  - `rfi_responses` table: id, rfiId, responderId, response, attachmentId, createdAt
  - `files` table: id, originalName, storagePath, mimeType, size, uploadedBy, uploadedAt

### 2. Backend Server Setup

**Setup:**

- Node.js/Express server
- Port: 5000
- Environment: `NODE_ENV=development`

**Implementation:**

- ✅ `server/src/app.js`: Express app configuration with middleware (CORS, JSON parsing)
- ✅ `server/src/index.js`: Server initialization and database connection
- ✅ `server/src/config/env.js`: Environment variable validation with Zod schema
- ✅ Modular routes structure:
  - `server/src/routes/index.js`: Main route aggregator
  - `server/src/modules/auth/auth.routes.js`: Login, register
  - `server/src/modules/rfis/rfi.routes.js`: CRUD + status updates
  - `server/src/modules/files/file.routes.js`: File upload/download
  - `server/src/modules/projects/project.routes.js`: Project management

### 3. Authentication Setup

**Setup:**

- JWT Secret: `f3456c78-9d01-4e2b-8f90-1234567890ab`
- Test users in `.env` (auth array)

**Implementation:**

- ✅ `server/src/middleware/auth.js`: JWT verification middleware
- ✅ `server/src/modules/auth/auth.controller.js`: Login endpoint
- ✅ `server/src/modules/auth/auth.service.js`: Password hashing (bcrypt) & JWT token generation
- ✅ `server/src/modules/auth/auth.validators.js`: Input validation (email, password)
- ✅ Protected routes: All RFI operations require valid JWT token

### 4. Frontend Setup

**Setup:**

- React + Webpack configuration
- Port: 5173 (Vite dev server)
- Babel configuration for JSX

**Implementation:**

- ✅ `client/src/App.jsx`: Main app component with routing
- ✅ `client/src/store/index.js`: Redux store with auth + RFI slices
- ✅ Pages:
  - `client/src/pages/Login.jsx`: Authentication page
  - `client/src/pages/RfiDashboard.jsx`: Main RFI dashboard
- ✅ Components:
  - `client/src/components/LayoutShell.jsx`: Layout wrapper
  - `client/src/components/RfiList.jsx`: RFI list with pagination
  - `client/src/components/RfiCreateModal.jsx`: Create RFI form
  - `client/src/components/RfiDetailModal.jsx`: RFI detail view (drawer-based)
  - `client/src/components/RfiFilters.jsx`: Filter controls

### 5. API Client Setup

**Setup:**

- Base URL: `http://localhost:5000/api`
- JWT token stored in Redux state

**Implementation:**

- ✅ `client/src/services/apiClient.js`: Axios instance with request/response interceptors
- ✅ Automatic JWT token injection in Authorization header
- ✅ Error handling with token refresh logic

### 6. File Upload Setup

**Setup:**

- Upload directory: `server/uploads/`
- Multer middleware for file handling

**Implementation:**

- ✅ `server/src/services/fileStorage.js`: File management (save, delete, retrieve)
- ✅ `server/src/modules/files/file.controller.js`: File upload endpoint
- ✅ `server/src/modules/files/file.service.js`: File database operations
- ✅ Frontend file upload in RFI create modal with progress tracking
- ✅ File preview capability in RFI detail view

### 7. Email Notification Setup

**Setup:**

- Email Provider: Gmail SMTP
- Host: `smtp.gmail.com`, Port: 587
- User: `info.hands2gether@gmail.com`
- Password: `AlwaysWin@8888` (Gmail App Password)
- From: `info.hands2gether@gmail.com`
- App URL: `http://localhost:5173`

**Implementation:**

- ✅ `server/src/services/emailService.js`: Nodemailer service (286 lines)
  - `initializeTransporter()`: Create Gmail SMTP transport
  - `sendEmail()`: Send email with detailed logging (recipient, subject, SMTP details)
  - Email templates:
    - `sendRfiCreatedEmail()`: New RFI notification (blue theme)
    - `sendRfiAssignedEmail()`: Assignment notification (blue theme)
    - `sendRfiResponseEmail()`: New response notification (orange theme)
    - `sendRfiStatusChangeEmail()`: Status change notification (gray theme)
- ✅ Integration in `server/src/modules/rfis/rfi.service.js`:
  - RFI creation: Sends email to watchers + assigned user
  - RFI assignment: Sends email to newly assigned user
  - RFI response: Sends email to all watchers
  - Status change: Sends email to all watchers
- ✅ Async email processing with `setImmediate()` (non-blocking)
- ✅ Enhanced logging with full email details (from, to, subject, SMTP config)
- ✅ Error logging with SMTP codes and responses
- ✅ Documentation: `docs/EMAIL_SETUP.md`

### 8. RFI Core Features

**Setup:**

- Database schema with RFI tables
- Routes and middleware in place

**Implementation:**

- ✅ **Create RFI** (`POST /api/rfis`)
  - Input: title, description, status, priority, assignee, category, dueDate
  - Triggers: Email to watchers & assignee
  - Response: Created RFI with ID
- ✅ **Read RFI** (`GET /api/rfis/:id`)
  - Returns: Full RFI details with files, watchers, responses
  - Includes: RFI aging info, SLA status
- ✅ **Update RFI** (`PUT /api/rfis/:id`)
  - Can update: title, description, priority, dueDate, assignee
  - Triggers: Email on status/assignee change
- ✅ **Delete RFI** (`DELETE /api/rfis/:id`)
  - Soft delete via status update
- ✅ **List RFIs** (`GET /api/rfis`)
  - Filters: status, assignee, priority, category
  - Pagination: limit, offset
  - Sorting: createdAt, dueDate, priority

### 9. RFI Advanced Features

**Setup:**

- Additional schema columns and relationships

**Implementation:**

- ✅ **Status Workflow** (New → In Progress → On Hold → Closed)

  - UI: Status buttons in RFI detail with confirmation
  - Validation: Only allowed transitions
  - Triggers: Email notifications on status change
  - Tracking: createdAt, updatedAt, statusChangedAt (calculated via response count)

- ✅ **RFI Aging & SLA Tracking**

  - Calculation: SQL DATEDIFF for days open
  - Visual Indicators:
    - < 3 days: Green (normal)
    - 3-7 days: Orange (aging)
    - > 7 days: Red (overdue)
  - Display: Badge in RFI list and detail view

- ✅ **File Management**

  - Upload: Multiple files per RFI
  - Preview: Display inline (txt, images)
  - Download: Retrieve from storage
  - Progress Indicator: Upload progress tracking

- ✅ **Watchers System**

  - Add/Remove users to track RFI
  - Email notifications to all watchers
  - Watcher list in RFI detail
  - Creator automatically added as watcher

- ✅ **RFI Responses**

  - Add response/comments to RFI
  - Attach files to responses
  - Display: Response history with user info & timestamp
  - Triggers: Email to all watchers on new response

- ✅ **Audit Trail**
  - Capture create, update, status change, assignment, and responses
  - Stored in `rfi_audit_logs` with old/new values and actor
  - Provides immutable history for each RFI

### 10. Logging & Error Handling

**Setup:**

- Logger: Pino with pino-pretty in dev mode
- Error handling middleware

**Implementation:**

- ✅ `server/src/logger.js`: Pino logger configuration
- ✅ `server/src/utils/asyncHandler.js`: Async error wrapper
- ✅ `server/src/utils/appError.js`: Custom error class
- ✅ Detailed email logging:
  - Pre-send: from, to, subject, SMTP config
  - Post-send: messageId, accepted, rejected, response
  - Errors: Full error details with SMTP codes
- ✅ Structured logging across all modules (auth, RFI, files, email)

### 11. Middleware & Security

**Setup:**

- Express middleware chain

**Implementation:**

- ✅ CORS middleware: Enable cross-origin requests
- ✅ JSON parser: Handle request bodies
- ✅ Auth middleware: JWT verification on protected routes
- ✅ Project access: `server/src/middleware/requireProjectAccess.js`
- ✅ Error handler: Global error handling middleware

### 12. Frontend State Management

**Setup:**

- Redux store structure

**Implementation:**

- ✅ `server/src/features/auth/authSlice.js`: Auth state (user, token, loading)
- ✅ `server/src/features/rfis/rfiSlice.js`: RFI state (list, detail, filters, loading)
- ✅ Thunks for async operations (fetch, create, update, delete)
- ✅ Redux persistence in localStorage

### 13. Frontend Styling

**Setup:**

- Ant Design components
- LESS preprocessing

**Implementation:**

- ✅ `client/src/styles/global.less`: Global styles
- ✅ Component-level styling with Ant Design themes
- ✅ Responsive design for mobile/tablet/desktop
- ✅ Color scheme: Blue (#1890ff) primary, with status-specific colors

---

## Summary by Status

### ✅ Completed (13/13)

1. Database Setup
2. Backend Server Setup
3. Authentication Setup
4. Frontend Setup
5. API Client Setup
6. File Upload Setup
7. Email Notification Setup
8. RFI Core Features
9. RFI Advanced Features
10. Logging & Error Handling
11. Middleware & Security
12. Frontend State Management
13. Frontend Styling

### 🔧 Next Pending Features

- Email reply ingestion (parse incoming emails to create RFI responses)
- Bulk RFI operations (status change, assignment, export)
- Advanced reporting and analytics
- Mobile-optimized UI improvements

## Audit Logging Notes

- Table: `rfi_audit_logs` (rfi_id, project_id, user_id, action, field, old_value, new_value, created_at)
- Actions captured: create, update, status_change, assign, response
- Logged from `rfi.service.js` for create, update (field-level), status change, assignment changes, and responses
- Values serialized safely (JSON for objects, strings otherwise)
