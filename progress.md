# Progress Summary (as of 2025-12-14)

## Completed (MVP build-out)

### Core Features

- Projects: list + create project, global active project selection persisted in localStorage, header project switcher.
- Teams: project members list + add member (role-gated for admin/pm), UI visibility fixed for the add button.
- RFIs: watchers management UI, comments API + UI thread (add/delete with author or admin/pm rule).
- Issues: attachments API + UI panel (upload/list/download/remove).
- Daily Logs: attachments end-to-end (backend + UI panel upload/list/download/remove).
- Files: shared upload/download + entity attachments pattern reused across modules.
- UI: fixed header layout overlap issue.

### RFI Module Enhancements (Latest Session)

- **Workflow Management**: Visual stepper component showing RFI stages (open → in_review → answered → closed), transition buttons with confirmation dialogs
- **Notification System**: Backend notification service, REST endpoints, dropdown UI with unread count badge, mark-read functionality
- **Signed Download URLs**: Secure file downloads with HMAC-SHA256 signed tokens and expiry (5-minute default)
- **SLA Reminders**: Scheduled job (cron) runs daily at 9 AM to check overdue RFIs and send notifications for:
  - Warning (2 days before due)
  - Overdue (on due date)
  - Escalation (3+ days past due)
- **SLA Status Endpoint**: `/api/projects/:projectId/rfis/sla-status` returns overdue/due_today/due_soon counts
- **File Validation**: Content type verification via magic bytes, MIME whitelist, dangerous extension blacklist, 50MB size limit
- **CI Smoke Tests**: Comprehensive test script covering auth, projects, RFI CRUD, file uploads, attachments, workflow, notifications

## Production readiness changes

- Frontend build output corrected to generate a production `dist/` at repo root (hashed assets) via `npm run client:build`.
- Server updated to serve the built SPA from `dist/` when `NODE_ENV=production` (with history fallback) while keeping `/api` routes.
- Added a gated Setup Installer:
  - UI: `/setup`
  - API: `/api/setup/status`, `/api/setup/install` (requires `ENABLE_SETUP_UI=true` and `SETUP_TOKEN`, plus `x-setup-token` header)
  - Applies `server/db/schema.sql`, `server/db/daily_logs.sql`, `server/db/issues.sql`; optional initial seed if DB has 0 users.
- **Inbound Email Security**: Token header (`x-inbound-token`) and IP allow-list validation for webhook

## Ops/Dev tooling

- Added `kill-port` dev dependency and npm scripts to resolve `EADDRINUSE` (cPanel/Linux friendly):
  - `npm run kill:3500`
  - `npm run start:clean` (kills port 3500 then starts server)
- **CI Test Scripts**:
  - `npm run test:smoke` - Run full smoke test suite
  - `npm run test:ci` - Alias for CI pipelines
- **Scheduler**: Background job runner with node-cron for SLA checks

## Diagnostics added

- Server startup and DB init now log clearer failure details (listen errors, unhandled errors, MySQL connection context + hints).
- Scheduler logs registered jobs on startup

## File Structure Updates

```
server/src/
├── scheduler.js                    # NEW - cron job runner
├── modules/
│   ├── rfis/
│   │   ├── rfi.workflow.js         # NEW - workflow stages/transitions
│   │   └── sla.service.js          # NEW - SLA check logic
│   ├── files/
│   │   └── file.service.js         # Updated - signed URL generation
│   └── notifications/
│       └── notification.service.js  # Updated - createNotification helper
├── services/
│   └── fileStorage.js              # Updated - file validation

client/src/
├── components/
│   ├── RfiWorkflowStepper.jsx      # NEW - visual workflow component
│   └── NotificationDropdown.jsx    # NEW - notification panel
└── services/
    └── downloadUtils.js            # NEW - signed URL download helper
```

## Current notes / next checks

- Confirm deployment env vars (MySQL creds, JWT secret, `NODE_ENV=production`, `PORT`) and disable the installer after first run (`ENABLE_SETUP_UI=false`, rotate `SETUP_TOKEN`).
- (Optional) validate production routing in your hosting: `/` serves the SPA from `dist/` and `/api/health` or `/health` returns JSON.
- Set `SIGNED_DOWNLOAD_SECRET` env var for secure download URLs (falls back to JWT_SECRET)
- Set `DISABLE_SCHEDULER=true` if running multiple instances to prevent duplicate SLA checks
