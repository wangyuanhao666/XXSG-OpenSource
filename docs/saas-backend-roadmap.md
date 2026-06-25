# XXSG Gradual SaaS Backend Roadmap

## Positioning

XXSG remains a local-first static SPA in the short term. The current `api-server.js` and `api-client.js` are local sync helpers, not SaaS-grade backend security. They can support development and personal LAN sync, but they do not provide multi-tenant authentication, durable database isolation, server-side authorization, or protected AI credentials.

## Target Boundaries

- Auth boundary: server-owned login, logout, refresh, session validation, password reset, role and permission checks.
- Data API boundary: server-owned tasks, calendar events, user settings, templates, productivity records, and audit logs.
- AI Proxy boundary: server-owned provider credentials, request validation, quota checks, model routing, and sanitized response logging.

## Minimum Future API Surface

- `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /api/auth/session`.
- `GET/POST/PATCH/DELETE /api/tasks` and `GET/POST/PATCH/DELETE /api/calendar-events`.
- `GET/PATCH /api/settings/me` and `GET /api/admin/usage-summary`.
- `POST /api/ai/analyze-task` and `POST /api/ai/fortune`, with provider keys stored only on the server.

## Migration Strategy

- Phase 1: keep local storage as source of truth, but route page code through storage and session boundaries only.
- Phase 2: add a sync adapter that can read local data and push/pull through the Data API without changing the UI layer.
- Phase 3: switch authenticated users to server source of truth, keeping local storage as offline cache.
- Phase 4: move all AI provider calls behind AI Proxy and remove browser-visible provider credentials from production flows.

## Commercial Acceptance Criteria

- No production page logs raw user objects, session objects, provider credentials, API responses, or task text.
- Sensitive field audit separates compatibility fields from page-level risk and fails if page-level risk grows.
- Public deployment copy clearly says local-first until server authentication and cloud storage are implemented.
- Before true SaaS launch, replace the local Express file store with a managed database and server-side authorization checks.

## V2 Backend Readiness Checklist

- Auth: password reset, session refresh, logout invalidation, role checks, and account recovery are server-owned.
- Data: tasks, calendar events, settings, templates, pomodoro sessions, and audit events have tenant-scoped CRUD APIs.
- AI Proxy: provider credentials never reach the browser; proxy requests are validated, rate-limited, and logged without raw prompts or provider responses.
- Migration: local export/import remains available, and a sync adapter can upload existing browser data after user consent.
- Operations: CI runs checks, smoke tests, and audit scripts; production has security headers, backups, observability, and rollback instructions.
