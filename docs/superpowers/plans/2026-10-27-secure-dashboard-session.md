# Secure Dashboard Session Implementation Plan

**Goal:** Remove persistent browser token storage and keep refresh tokens inaccessible to JavaScript while preserving the existing realtime handshake.

**Architecture:** Next.js route handlers own host-only HttpOnly cookies and forward Bearer credentials to the existing backend. The browser uses same-origin HTTP requests and serializes session mutations. At the request of the owner, Socket.IO retains its token handshake using an access token held only in memory.

**Tech stack:** Existing Next.js 16 App Router, TypeScript, Axios, Vitest, Socket.IO.

**Spec:** User-approved dashboard portion of the token-storage security finding in this chat.

## Constraints

- No backend, deployment, production configuration, or UI redesign changes.
- Preserve Arabic/English redirects, authorization errors, file streaming, and stale-session safeguards.
- Review production changes with clean-code-guard and test changes with test-guard.
- Run focused tests, typecheck, lint and build; full test suite requires user permission.

## Task 1: Server authentication boundary

- [x] Add constants, cookie lifecycle, fixed backend origin, CSRF validation, and streaming helpers under `src/lib/auth/`.
- [x] Add `src/app/api/session/[...path]/route.ts`: intercept POST login/refresh/logout; strip credentials from JSON responses; proxy other requests using the access cookie.
- [x] Adapt the existing download route and `src/proxy.ts` to server cookies.
- [x] Verify cookie flags, cross-origin rejection, renewal, revocation, path confinement, and large-file streaming with real route handlers and mocked HTTP fetch.

## Task 2: Browser session lifecycle

- [x] Replace token-storage with notification-only session utilities, legacy cleanup, and serialized session mutations.
- [x] Adapt `api.ts`, `auth-service.ts`, user response types, and AuthProvider to credential-free responses.
- [x] Verify one refresh for concurrent unauthorized requests, logout ordering, stale responses, and cross-tab account changes.

## Task 3: Realtime boundary and verification

- [x] Preserve Socket.IO token handshakes and connection handling using in-memory access tokens; resynchronize on HTTP refresh and clear on session invalidation.
- [x] Migrate affected tests to cookie/session behavior without dropping production regression scenarios.
- [x] Run focused tests, lint, typecheck, and build. Document backend dependency and verification results.

Verification results and rollout constraints are recorded in docs/dashboard-server-sessions.md. The owner authorized both full suites. The historical dashboard smoke assertion was corrected; the final verification section records the subsequent results and Windows WebKit runner limitation.
