# Progress Summary (as of 2025-12-14)

## Completed (MVP build-out)

- Projects: list + create project, global active project selection persisted in localStorage, header project switcher.
- Teams: project members list + add member (role-gated for admin/pm), UI visibility fixed for the add button.
- RFIs: watchers management UI, comments API + UI thread (add/delete with author or admin/pm rule).
- Issues: attachments API + UI panel (upload/list/download/remove).
- Daily Logs: attachments end-to-end (backend + UI panel upload/list/download/remove).
- Files: shared upload/download + entity attachments pattern reused across modules.
- UI: fixed header layout overlap issue.

## Production readiness changes

- Frontend build output corrected to generate a production `dist/` at repo root (hashed assets) via `npm run client:build`.
- Server updated to serve the built SPA from `dist/` when `NODE_ENV=production` (with history fallback) while keeping `/api` routes.
- Added a gated Setup Installer:
  - UI: `/setup`
  - API: `/api/setup/status`, `/api/setup/install` (requires `ENABLE_SETUP_UI=true` and `SETUP_TOKEN`, plus `x-setup-token` header)
  - Applies `server/db/schema.sql`, `server/db/daily_logs.sql`, `server/db/issues.sql`; optional initial seed if DB has 0 users.

## Ops/Dev tooling

- Added `kill-port` dev dependency and npm scripts to resolve `EADDRINUSE` (cPanel/Linux friendly):
  - `npm run kill:3500`
  - `npm run start:clean` (kills port 3500 then starts server)

## Diagnostics added

- Server startup and DB init now log clearer failure details (listen errors, unhandled errors, MySQL connection context + hints).

## Current notes / next checks

- Confirm deployment env vars (MySQL creds, JWT secret, `NODE_ENV=production`, `PORT`) and disable the installer after first run (`ENABLE_SETUP_UI=false`, rotate `SETUP_TOKEN`).
- (Optional) validate production routing in your hosting: `/` serves the SPA from `dist/` and `/api/health` or `/health` returns JSON.
