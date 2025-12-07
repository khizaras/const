# Development Roadmap - Procore MVP

## ✅ Completed: Phase 1 Foundation (Week 1-2)

### What We Built:

- ✅ **Core Authentication System**

  - JWT-based auth with access tokens
  - Multi-tenant organization structure
  - User registration and login
  - Password hashing with bcrypt

- ✅ **Database Schema**

  - Organizations, users, projects
  - Project-user role mappings
  - RFI entities with full workflow support
  - Comments, attachments, notifications tables
  - Files, audit logs infrastructure

- ✅ **RFI Management (MVP-first)**

  - Full CRUD operations
  - Status workflow (open → answered → closed)
  - Priority levels (low, medium, high, urgent)
  - Ball-in-court assignment tracking
  - Due date management
  - Watchers functionality
  - Response threading
  - List with advanced filtering

- ✅ **Frontend Application**

  - Enterprise-grade UI with Inter font
  - React + Redux Toolkit architecture
  - Ant Design component library
  - Responsive layout (desktop, tablet, mobile)
  - RFI dashboard with metrics
  - Real-time filtering and search
  - Professional design system

- ✅ **API Foundation**
  - RESTful endpoints structure
  - Request validation with Zod
  - Error handling middleware
  - Structured logging with Pino
  - CORS and security headers
  - Project-based access control

---

## 🎯 Next Steps: Week 3-4 (Issues/Punch + Daily Logs)

### Priority 1: Issues & Punch List System (Week 3)

Following the **MVP-first release** strategy from PRD, we'll implement the Issues/Punch system which is critical for field teams.

#### Backend Tasks:

1. **Database Enhancements**

   - [ ] Add `issues` table with fields:
     - Type (issue, punch, observation)
     - Location/area reference
     - Trade/discipline
     - Cost impact fields
     - Resolution details
   - [ ] Add `issue_photos` linking table
   - [ ] Add location/area master tables

2. **Issue API Endpoints**

   - [ ] `POST /api/projects/:projectId/issues` - Create issue
   - [ ] `GET /api/projects/:projectId/issues` - List with filters
   - [ ] `GET /api/projects/:projectId/issues/:issueId` - Get details
   - [ ] `PATCH /api/projects/:projectId/issues/:issueId` - Update
   - [ ] `POST /api/projects/:projectId/issues/bulk-close` - Bulk operations
   - [ ] `POST /api/projects/:projectId/issues/:issueId/photos` - Add photos

3. **Photo Upload Infrastructure**
   - [ ] Set up file storage service (AWS S3 or compatible)
   - [ ] Implement resumable upload middleware
   - [ ] Image processing pipeline (thumbnails, compression)
   - [ ] Photo metadata extraction (EXIF, GPS)

#### Frontend Tasks:

1. **Issue Management Pages**

   - [ ] Issue list view with status filters
   - [ ] Issue detail view/modal
   - [ ] Create/edit issue form
   - [ ] Photo upload component with preview
   - [ ] Bulk action toolbar
   - [ ] Location/trade selectors

2. **Dashboard Integration**

   - [ ] Issue metrics cards (open, overdue, by trade)
   - [ ] Issue aging chart
   - [ ] Recent issues feed
   - [ ] Quick create button

3. **Mobile Considerations**
   - [ ] Design touch-friendly issue forms
   - [ ] Camera integration prep
   - [ ] Offline queue structure

**Estimated Time:** 5-6 days  
**Key Deliverable:** Functional issue tracking with photo attachments

---

### Priority 2: Daily Logs with Offline Support (Week 4)

This is a **critical field tool** and differentiator. Superintendents need reliable offline capture.

#### Backend Tasks:

1. **Database Schema**

   - [ ] `daily_logs` table with:
     - Date, shift, weather conditions
     - Work performed summary
     - Safety notes
     - Delays/issues encountered
   - [ ] `daily_log_labor` - Labor counts by trade
   - [ ] `daily_log_equipment` - Equipment hours
   - [ ] `daily_log_photos` - Photo attachments
   - [ ] Add sync conflict resolution fields

2. **Daily Log API**

   - [ ] `POST /api/projects/:projectId/daily-logs` - Create log
   - [ ] `GET /api/projects/:projectId/daily-logs` - List by date range
   - [ ] `GET /api/projects/:projectId/daily-logs/:logId` - Get details
   - [ ] `PATCH /api/projects/:projectId/daily-logs/:logId` - Update
   - [ ] `POST /api/projects/:projectId/daily-logs/sync` - Offline sync endpoint

3. **Sync Conflict Resolution**
   - [ ] Implement last-write-wins with audit trail
   - [ ] Conflict detection logic
   - [ ] Version tracking

#### Frontend Tasks:

1. **Daily Log Entry Form**

   - [ ] Date/time picker
   - [ ] Weather widget (temp, conditions)
   - [ ] Labor/equipment entry tables
   - [ ] Rich text editor for notes
   - [ ] Photo upload with captions
   - [ ] Save as draft functionality

2. **Daily Log List/Calendar View**

   - [ ] Calendar month view with indicators
   - [ ] List view with search/filter
   - [ ] Export functionality (PDF/CSV)
   - [ ] Copy from previous day feature

3. **Offline Infrastructure**
   - [ ] Service Worker setup
   - [ ] IndexedDB schema for local storage
   - [ ] Sync queue management
   - [ ] Online/offline status indicator
   - [ ] Background sync registration

**Estimated Time:** 6-7 days  
**Key Deliverable:** Offline-capable daily log system

---

## 📅 Week 5-6: Drawings & Documents

### Priority 3: Drawing Management System (Week 5)

Critical for field coordination and RFI context.

#### Backend Tasks:

1. **Drawing Schema**

   - [ ] `drawings` table (sheet number, title, discipline)
   - [ ] `drawing_revisions` with version history
   - [ ] `drawing_hyperlinks` for callout references
   - [ ] `drawing_markups` for annotations
   - [ ] `drawing_distributions` for notification lists

2. **Drawing Processing Pipeline**

   - [ ] PDF upload and storage
   - [ ] Thumbnail generation
   - [ ] Sheet metadata extraction
   - [ ] Version comparison service
   - [ ] DWG to PDF conversion (optional)

3. **Drawing API**
   - [ ] Upload drawings with metadata
   - [ ] Version management endpoints
   - [ ] Markup/annotation CRUD
   - [ ] Distribution list management
   - [ ] Sheet search and filtering

#### Frontend Tasks:

1. **Drawing Viewer**

   - [ ] PDF.js integration for viewing
   - [ ] Pan/zoom controls
   - [ ] Markup tools (pen, text, shapes)
   - [ ] Hyperlink navigation
   - [ ] Version comparison side-by-side

2. **Drawing Management**
   - [ ] Upload wizard with metadata
   - [ ] Drawing list with thumbnail grid
   - [ ] Filter by discipline/status
   - [ ] Version history timeline
   - [ ] Distribution list management

**Estimated Time:** 6-7 days  
**Key Deliverable:** Drawing upload, versioning, and markup

---

### Priority 4: Document Management (Week 6)

File repository for all project documents.

#### Backend Tasks:

1. **Document Schema**

   - [ ] `folders` with hierarchy support
   - [ ] `files` with versioning
   - [ ] `file_permissions` matrix
   - [ ] `transmittals` for formal distribution
   - [ ] `share_links` for external access

2. **Document API**
   - [ ] Folder CRUD operations
   - [ ] File upload with versioning
   - [ ] Permission management
   - [ ] Transmittal generation
   - [ ] Share link creation with expiry

#### Frontend Tasks:

1. **File Explorer Interface**

   - [ ] Tree view navigation
   - [ ] Drag-and-drop upload
   - [ ] Multi-select operations
   - [ ] Preview panel
   - [ ] Search across files

2. **Document Features**
   - [ ] Version history viewer
   - [ ] Permission editor
   - [ ] Transmittal composer
   - [ ] Share link generator

**Estimated Time:** 4-5 days  
**Key Deliverable:** Full document repository

---

## 📱 Week 7: Mobile App Foundation

### React Native Setup

#### Tasks:

1. **Project Initialization**

   - [ ] Expo setup with TypeScript
   - [ ] Navigation structure (React Navigation)
   - [ ] Redux Toolkit integration
   - [ ] Offline storage (Redux Persist + MMKV)

2. **Core Mobile Features**

   - [ ] Authentication screens
   - [ ] Project selector
   - [ ] Issue quick-create with camera
   - [ ] Daily log entry form
   - [ ] Photo capture with geolocation
   - [ ] Offline sync queue UI

3. **Platform-Specific**
   - [ ] Camera permissions
   - [ ] File system access
   - [ ] Background sync (iOS/Android)
   - [ ] Push notifications setup

**Estimated Time:** 6-7 days  
**Key Deliverable:** Mobile app with offline issue/log creation

---

## 🔧 Week 8: Hardening & Polish

### Performance & Reliability

1. **Backend Optimization**

   - [ ] Database query optimization
   - [ ] Add caching layer (Redis)
   - [ ] Rate limiting implementation
   - [ ] API response compression
   - [ ] Background job queue (BullMQ)

2. **Frontend Optimization**

   - [ ] Code splitting and lazy loading
   - [ ] Image optimization
   - [ ] Bundle size analysis
   - [ ] Performance profiling

3. **Testing & Monitoring**

   - [ ] Unit tests for critical paths
   - [ ] Integration tests for API
   - [ ] E2E tests for key workflows
   - [ ] Error tracking (Sentry)
   - [ ] Performance monitoring

4. **Documentation**
   - [ ] API documentation (Swagger/OpenAPI)
   - [ ] User guide
   - [ ] Admin guide
   - [ ] Mobile app guide

**Estimated Time:** Full week  
**Key Deliverable:** Production-ready MVP

---

## 🚀 Post-MVP (Phase 2)

Based on user feedback and priorities:

1. **Submittals Module** (2 weeks)

   - Package creation and routing
   - Approval workflow
   - Stamp management
   - Distribution

2. **Light Financials** (3 weeks)

   - Budget & cost codes
   - Commitments (POs/subcontracts)
   - Change events/orders
   - Simple invoicing
   - Reports

3. **Schedule Integration** (1 week)

   - MSP/P6 import (read-only)
   - Milestone tracking
   - Progress updates

4. **Advanced Features** (Ongoing)
   - Pay applications
   - Quality/safety checklists
   - BIM integration
   - Analytics/AI features

---

## 📊 Success Metrics to Track

### Technical Metrics:

- API response time (p95 < 500ms)
- Mobile app crash rate (< 1%)
- Offline sync success rate (> 99%)
- Photo upload success rate (> 98%)

### Business Metrics:

- RFI cycle time (target: < 7 days)
- Issue closure rate (target: > 80% in 30 days)
- Daily logs per active project/week (target: > 5)
- Time to first value for new users (< 2 weeks)

---

## 🎯 Immediate Next Action Plan

**Starting Week 3 (Next Monday):**

### Day 1-2: Issues Backend

- Create database migration for issues table
- Implement issue CRUD API endpoints
- Add photo upload infrastructure
- Write API tests

### Day 3-4: Issues Frontend

- Build issue list component
- Create issue form with validation
- Add photo upload UI
- Integrate with Redux

### Day 5: Integration & Testing

- End-to-end testing
- Mobile responsive testing
- Performance check
- Documentation

**Repeat pattern for Daily Logs Week 4, then Drawings/Documents Week 5-6**

---

## 💡 Key Decisions Needed

1. **File Storage Provider**

   - AWS S3 vs Cloudflare R2 vs DigitalOcean Spaces
   - Recommendation: AWS S3 (standard, good docs, free tier)

2. **Mobile Offline Strategy**

   - Redux Persist vs WatermelonDB vs custom
   - Recommendation: Redux Persist + AsyncStorage (simpler for MVP)

3. **Drawing Viewer Library**

   - PDF.js vs react-pdf vs PSPDFKit
   - Recommendation: react-pdf (open source, good for MVP)

4. **Background Jobs**

   - BullMQ vs Agenda vs pg-boss
   - Recommendation: BullMQ (Redis-based, mature)

5. **Testing Strategy**
   - Full TDD vs Critical paths only
   - Recommendation: Critical paths + integration tests

---

## 📝 Notes

- Keep sprint demos ready for stakeholders every Friday
- Maintain feature flags for gradual rollout
- Document all API changes in Swagger
- Keep PRD updated with scope changes
- Track technical debt in separate backlog

**Last Updated:** December 7, 2025  
**Current Phase:** Week 2 Complete, Starting Week 3
