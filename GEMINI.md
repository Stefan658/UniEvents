# UniEvents — Project Context for Gemini CLI

---

# 1. Project Identity

UniEvents is a university events management web application developed for "Ștefan cel Mare" University of Suceava.

The application provides a centralized digital platform for:
- discovering events
- managing events
- registering participants
- collecting feedback
- generating reports

The system is designed as a **multi-role web platform** supporting:
- students
- organizers
- administrators

---

# 2. Product Vision

The goal of UniEvents is to solve the fragmentation of event information in the university ecosystem by providing:
- a unified platform
- role-based access
- structured event lifecycle
- data-driven reporting

The platform combines:
- event discovery (student perspective)
- event management (organizer perspective)
- system control & analytics (admin perspective)

---

# 3. User Roles and Responsibilities

## 3.1 Student

Authentication:
- Google Sign-In (ONLY @student.usv.ro)

Capabilities:
- browse events
- search and filter events
- view event details
- view calendar of events
- register for events
- attend events
- leave feedback (rating + comment)

Restrictions:
- cannot create or edit events
- cannot access reports
- cannot manage users

---

## 3.2 Organizer

Authentication:
- email + password (stored locally)

Capabilities:
- create events
- edit events
- delete events
- manage event status
- manage participants
- upload materials (PDFs, slides, resources)
- view event-related data

Restrictions:
- cannot manage users globally
- cannot access full system reports (admin only)

---

## 3.3 Admin

Authentication:
- email + password

Capabilities:
- manage organizer accounts
- approve / moderate events
- monitor platform usage
- access all reports
- ensure system integrity

---

# 4. Application Flow (End-to-End)

## 4.1 Student Flow

1. Login via Google (@student.usv.ro)
2. Landing page → list of events
3. Actions:
   - browse events
   - search/filter
   - open event details
4. From event page:
   - view details
   - register (if applicable)
5. Attend event
6. After event:
   - leave feedback (rating + comment)
7. Optional:
   - view calendar view

---

## 4.2 Organizer Flow

1. Login via email/password
2. Dashboard:
   - list of owned events
3. Actions:
   - create new event
   - edit event
   - delete event
4. Event management:
   - manage participants
   - upload materials
   - update event status
5. View event-related data

---

## 4.3 Admin Flow

1. Login via email/password
2. Dashboard:
   - system overview
3. Actions:
   - manage organizers
   - monitor events
   - validate event lifecycle
4. Reporting:
   - view aggregated reports
   - analyze usage metrics

---

# 5. Backend Architecture

## Stack
- Python 3
- Flask
- Flask-SQLAlchemy
- PostgreSQL
- Docker / docker-compose
- JWT authentication

## Structure

- backend/app/__init__.py → app factory
- backend/app/routes → API layer
- backend/app/services → business logic
- backend/app/models → DB models
- backend/app/utils → validators/helpers
- backend/seed.py → seed data

## Architectural Rules

- routes handle HTTP (request/response)
- services handle business logic
- models handle persistence
- utils handle validation

DO NOT:
- move logic into routes
- refactor architecture without explicit request

---

# 6. Backend Status

- ~95% implemented
- tested via Postman
- Zone 1 (polish) completed
- currently in Zone 2 (hardening)

---

# 7. API Conventions

## Responses

Error:
    { "error": "..." }

Success (delete):
    { "message": "..." }

List:
- return plain arrays

Create / Update:
- return serialized entity objects

---

## Language

All API messages MUST be in English.

This applies to:
- route-level responses
- service-level ValueError messages
- validators
- helper functions

---

# 8. Current Development Phase

## Zone 1 — Polish and Consistency
Status: COMPLETED

Completed goals:
- API message consistency improved
- duplicate route definitions removed
- response formats aligned
- debug traces removed from responses
- endpoint inventory stabilized

---

## Zone 2 — Hardening and Robustness
Status: IN PROGRESS (CURRENT PHASE)

Goals:
1. SECRET_KEY hardening
2. registration status validation
3. max_participants validation
4. convert ValueError messages to English
5. minimal ownership checks

---

# 9. Hardening Details

## SECRET_KEY
- remove insecure fallback usage
- enforce presence of SECRET_KEY in configuration
- fail fast if missing

## Registration Status
Allowed values:
- confirmed
- cancelled
- pending

Reject any other value.

## max_participants
- must be a positive integer
- reject null, negative, zero, or invalid types

## Error Messages
- ALL ValueError messages must be in English
- must be consistent with API-level error responses

## Ownership Checks
- apply minimal checks only where safe
- do not implement full RBAC system
- avoid overengineering

---

# 10. Frontend (Planned Implementation)

Frontend stack:
- React
- Tailwind CSS
- Axios
- React Router

## Main Pages

### Public
- Home (events list)
- Event Details
- Search results
- Calendar view

### Auth
- Student Google login
- Organizer/Admin login

### Organizer Dashboard
- My events
- Create event
- Edit event
- Participants management
- Materials upload

### Admin Dashboard
- Manage users
- Reports
- System overview

---

## Frontend Flow

### Student
Home → Event List → Event Details → Register → Feedback

### Organizer
Login → Dashboard → Create/Edit Event → Manage Participants → Upload Materials

### Admin
Login → Dashboard → Manage Users → Reports

---

# 11. Development Rules for Gemini

## Core Rule
Make minimal safe changes only.

## DO
- analyze before editing
- propose plan first
- group changes by file
- preserve architecture
- preserve routes

## DO NOT
- refactor entire project
- change endpoint URLs
- change database schema
- rewrite large files
- introduce unnecessary abstractions

---

# 12. AI-assisted Development Context

Manual validation is REQUIRED for:
- correctness
- architecture decisions
- API consistency
- safe scope control

---

# 13. Known Constraints

DO NOT implement now:
- rate limiting
- full RBAC system
- logging system
- pagination for all endpoints
- frontend redesign
- major refactors

These should be documented as:
→ future improvements (for research report)

---

# 14. Testing Strategy

After any change, perform manual validation:

- authentication (all roles)
- event create/update/delete
- registration flow
- feedback flow
- invalid input handling
- edge cases (null, wrong types, duplicates)
- health endpoint

Use Postman-style testing approach.