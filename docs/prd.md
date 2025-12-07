# Construction Platform (Procore-like) – PRD

## Goal

Deliver an MVP construction management platform modeled after Procore, focused on fast field execution and core project controls, with a clear path to Phase 2 expansion.

## Personas

- Project Manager (GC): needs RFIs/submittals, drawings, issues, budget tracking, approvals.
- Superintendent/Field Engineer: captures daily logs, photos, punch/issues, works offline.
- Subcontractor PM: responds to RFIs/submittals, submits invoices/pay apps, receives drawings.
- Owner Rep: reviews/approves RFIs, submittals, and pay apps; portfolio-level visibility.
- Finance/Contracts: manages budgets, commitments, change orders, invoicing, compliance docs.

## MVP Scope (Phase 1)

- Projects & RBAC: orgs, projects, roles/permissions, audit logs.
- RFIs: create, assign, route, due dates/aging, threaded responses, attachments, email in/out.
- Submittals: items, packages, workflows, approvals, stamps, attachments, distribution.
- Tasks/Issues/Punch: statuses, assignees, locations, photos, due dates, bulk close.
- Daily Logs: labor/equipment/weather/notes/photos; offline capture with later sync.
- Documents: file repo with folders, permissions, versioning, share links, transmittals.
- Schedule (read-only): import MSP/P6, show milestones/activities, progress % notes.
- Light Financials: budgets + cost codes, commitments (POs/subcontracts), change events/COs, simple invoicing, exports (CSV/QuickBooks), retainage fields (calculated but optional).
- Reporting: dashboards for RFIs aging, submittal status, issues closure rate, budget vs actual, CO exposure; exports.
- Drawings: upload, version stack, sheet metadata, callout hyperlinks, compare revisions, markup/comment, distributions.
- Mobile: iOS/Android (React Native/Expo) with offline for logs/issues/photos; resumable uploads; background sync.

### MVP-first Release (smaller cut to launch faster)

- Core platform: orgs/projects, RBAC, audit logs, notifications.
- RFIs: create/assign/respond, due dates/aging, attachments, email in/out.
- Issues/Punch: create/assign/status, photos, locations, due dates, bulk close; quick create from mobile/photos.
- Daily Logs: labor/equipment/weather/notes/photos; offline-first capture and sync.
- Documents: file repo with folders, permissions, versioning, share links.
- Reporting: aging dashboards for RFIs/issues, basic project health; exports.
- Drawings: upload, version stack, view/compare, hyperlinks, markups/comments, distribution.
- Integrations (initial): email ingest, S3-compatible storage; CSV export for financial handoff.
- Optional for MVP if time permits: Submittals (single-step review) and read-only schedule import.

## Phase 2 (post-MVP)

- Pay Apps: owner & sub pay apps, retainage workflows, lien waivers, compliance docs (COI), signatures.
- WIP & Forecasting: production tracking vs quantities, earned value, cash flow curves, forecasting.
- Resource Planning: labor/equipment scheduling, timecards, productivity metrics.
- Quality & Safety: inspections/checklists/templates, observations, incidents, NCRs, root cause, analytics.
- BIM/VDC: model viewer, issue pins, model-to-drawing links, clash context.
- Marketplace/API: public REST + webhooks, app directory; SSO/SCIM.
- Advanced Analytics/AI: risk scoring, auto-classify docs, suggested reviewers, text extraction from drawings/PDFs.

## Integrations (prioritized)

1. QuickBooks Online export; 2) MSP/P6 schedule import; 3) Email ingest for RFIs/Submittals; 4) S3-compatible object storage; later: Sage 300/Intacct, HR/safety tools, BI (Snowflake/BigQuery connectors).

## Architecture (high level)

- Frontend Web: React + Redux Toolkit, UI with Ant Design, styling in Less, bundler Webpack; SSR optional later.
- Mobile: React Native/Expo with offline store and background sync jobs (unchanged stack for field use).
- Backend: Node.js (Express ) RESTL; background workers with BullMQ; WebSockets for live updates.
- Data: MySQL for core models; Redis for cache/queues; S3-compatible object storage for files; optional OpenSearch/Elastic for document/drawing search.
- AuthN/Z: JWT access + refresh; org/project RBAC; approval workflows; audit trails.
- Files: PDF/DWG processing pipeline for versioning, thumbnails, markups, hyperlinking; resumable uploads; CDN.
- Observability: structured logs, tracing, metrics, feature flags.

## Repository / Folder Structure

- root/
  - server/ (Node.js backend)
  - client/ (React + Redux Toolkit + ANTD + Webpack + Less)
  - node_modules/ (hoisted/common dependencies)
  - shared config: `.editorconfig`, `.eslintrc`, `.prettierrc`, `tsconfig.*` as needed.

## Key Entities

Organization, Project, User, Role/PermissionSet, Drawing, DrawingRevision, RFI, Submittal, SubmittalItem, Task/Issue, PunchItem, DailyLog, Photo/Attachment, Budget, CostCode, Commitment (PO/Subcontract), ChangeEvent, ChangeOrder, Invoice/PayApp, Vendor, ScheduleImport, Transmittal, Comment, Notification.

## Workflows (MVP examples)

- RFI: Create → assign → distribute → respond → close; SLA timers, reminders, audit trail; email reply-to ingest.
- Submittal: Package with items → route for review → capture stamp/decision → distribute updated docs.
- Change: Change Event → price via commitments → generate Prime CO → update budget impact and exposure.
- Drawing Publish: Upload set → auto version stack → hyperlink callouts → notify distribution list; compare revisions.
- Daily Log Offline: capture entries/photos offline → sync → conflict resolution (last-write + audit).

## Success Metrics (MVP)

- RFI cycle time; Submittal cycle time; Issue closure rate; Daily logs submitted per active project per week; App crash rate and offline sync success; Time-to-first-value in onboarding (<2 weeks); Support tickets per active project.

## Risks & Mitigations

- Scope creep: enforce MVP module flags, phased rollout.
- Heavy files: async processing, CDN, chunked uploads, backpressure.
- Permissions complexity: design RBAC matrix early, centralize checks, full audit trail.
- Integrations delays: start with exports/ingest, add native connectors later.
- Offline conflicts: clear rules (last-write wins + audit), surface conflicts in UI.

## Milestones (rough)

- Week 2: Core data models, auth, projects, RBAC, file upload path.
- Week 4: Drawings (upload/version/markup), RFIs, tasks/issues; basic dashboards.
- Week 6: Submittals, daily logs (mobile offline), schedule import read-only.
- Week 8: Light financials (budget/cost codes/commitments/COs), invoicing export, notifications.
- Week 10: Hardening, performance, observability, onboarding flows; pilot-ready.

## MVP Sprint Plan (8 weeks)

- Week 1: Foundations — repo setup, CI, envs, authN/Z skeleton, org/project CRUD, RBAC checks, notifications stub, S3-compatible storage wiring.
- Week 2: Drawings v1 — upload pipeline, version stack, sheet metadata, viewer, compare, hyperlinks; basic distributions.
- Week 3: RFIs v1 — create/assign/respond, due dates/aging, attachments, notifications; email in/out ingest stub.
- Week 4: Issues/Punch — create/assign/status, photos, locations, due dates, bulk close; quick create from mobile/photos.
- Week 5: Daily Logs — labor/equipment/weather/notes/photos; offline-first capture and sync; conflict handling (last-write + audit).
- Week 6: Reporting — RFI/issue aging, project health dashboard; CSV exports; tighten audit logs.
- Week 7: Integrations — email ingest hardening, CSV export for finance, S3/infra tuning; optional Submittals single-step review if time.
- Week 8: Hardening — perf passes on drawing/RFI flows, mobile offline polish, error budgets/observability, onboarding flow, pilot readiness.
