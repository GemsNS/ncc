# NCC Phase 2 Admin and Media Platform Plan

This document defines the future custom backend and administrative panel for New Community Church media operations.

## Scope

- Secure administrative login for church staff.
- Role-based admin panel for media and gallery management.
- API-backed content delivery for `messages` and `gallery` pages.
- Auditability and moderation for uploaded assets.

## Proposed Architecture

### Core Services

- **Auth service**
  - Email/password login with MFA.
  - Roles: `super_admin`, `editor`, `publisher`.
  - Session management with rotating refresh tokens.

- **Media API**
  - Upload image/video assets.
  - Edit metadata (title, speaker, date, tags, platform links).
  - Archive or unpublish content without deleting history.

- **Storage layer**
  - Object storage bucket for original files and optimized derivatives.
  - CDN delivery for transformed images.

- **Database**
  - Relational tables for users, roles, media items, audit logs.
  - Soft-delete fields and status lifecycle.

## Suggested Data Model (Initial)

- `users`: id, email, password_hash, role_id, mfa_enabled, created_at
- `roles`: id, name, permissions_json
- `media_items`: id, type, title, description, source_url, storage_key, status, published_at, created_by, updated_at
- `media_tags`: id, media_item_id, tag
- `audit_logs`: id, actor_id, action, target_type, target_id, payload_json, created_at

## Admin Panel Modules

- Dashboard metrics: upload counts, pending approvals, recent edits.
- Media library table with filters and bulk actions.
- Upload form with drag-and-drop and metadata inputs.
- Gallery curator view with ordering and feature pinning.
- Message series editor for sermon/video publishing.

## Security Requirements

- Password hashing (Argon2 or bcrypt).
- Optional IP restrictions for admin routes.
- Strict CORS policy and CSRF protections.
- Malware/file-type validation during upload.
- Audit logs retained for compliance and accountability.

## Migration Path

1. Keep current static JSON feed for MVP.
2. Build Phase 2 backend in a separate service.
3. Point frontend fetch endpoints to media API.
4. Replace static archive cards with API responses.
5. Enable admin publishing workflows and turn off static write path.

## Recommended Backlog

- Milestone 1: Auth + role model + admin shell.
- Milestone 2: Media upload + storage + metadata CRUD.
- Milestone 3: Publish/archive workflow + audit logs.
- Milestone 4: Frontend API integration + migration tooling.
