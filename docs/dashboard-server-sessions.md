# Dashboard server sessions

The browser calls the same-origin Next.js route at /api/session instead of attaching a Bearer token. Login and refresh return only the user object. Successful /api/session/auth/me responses additionally return the access token in X-Moazez-Realtime-Token for the existing Socket.IO handshake. The persistent access and refresh token copies are stored by the route handler in HttpOnly, host-only, SameSite=Lax cookies. Production cookies additionally use Secure and the __Host- prefix.

## Configuration and API contract

The server resolves the backend API base from API_PROXY_TARGET, falling back to an absolute NEXT_PUBLIC_API_URL. The browser always uses /api/session. An installation whose public API URL is relative must supply the already-supported API_PROXY_TARGET on the server. This change does not modify environment files, deployment workflows, or production values.

POST /api/session/auth/login forwards credentials to /auth/login. POST /api/session/auth/refresh reads the refresh cookie and forwards it to /auth/refresh; browser-supplied refresh tokens are not used. The access cookie expires after the backend's expiresIn seconds. The refresh cookie is a browser-session cookie; the backend still enforces its actual token expiry and revocation. A closed browser may restore session cookies according to its own session-restore policy.

POST /api/session/auth/logout clears both session cookies and legacy cookie names, and attempts backend revocation within five seconds. When access has expired, the server can refresh once to revoke that session without returning the new credentials. If the backend is unreachable, local cookies are still cleared; backend revocation is not guaranteed.

Other requests are proxied to the configured backend with the access cookie converted to its Authorization header. Browser Authorization headers and cookies are not forwarded. Backend cookies and redirects are not relayed. Responses use Cache-Control: no-store and a sandbox content policy for direct document views. The existing /api/files/:fileId/download route also reads the access cookie and streams the backend body without forwarding Content-Length.

## CSRF, refresh, and session transitions

Mutation requests require X-Moazez-CSRF: 1. An Origin, when present, must match the dashboard request origin; cross-site Fetch Metadata is rejected. The routes do not grant cross-origin CORS access. The Axios client supplies the custom header.

A 401 can trigger one refresh and retry. Concurrent requests in a tab share a refresh promise. Login, logout, and refresh are serialized with Web Locks across tabs where supported, and a local promise queue otherwise. Before rotating, a queued refresh checks /auth/me to avoid rotating again if another tab already renewed access. Browsers without Web Locks have no cross-tab serialization guarantee.

Session-change notifications in localStorage contain a login/logout/refresh kind and random notification ID, never tokens. Existing localStorage tokens and JavaScript cookies are removed during AuthProvider startup; existing sessions must sign in again. Old responses cannot restore a user after a session change. Logout hides private data immediately and waits for cookie deletion before navigation.

## Realtime compatibility

At the request of the owner, realtime retains its existing auth: { token } handshake, token-change reconnects, room recovery, and bounded retry behavior. No backend or proxy change is required for this handshake.

The API client reads X-Moazez-Realtime-Token from successful /auth/me responses and stores the access token only in module memory. Session restoration loads it before authenticated realtime starts. HTTP refresh updates it and notifies other tabs to reload their own in-memory token; logout, expiration, and account switching clear it and detach old sockets. Refresh tokens are never exposed to browser JavaScript.

This is a deliberate partial mitigation of the storage finding: no token is persisted in JavaScript storage, but an XSS payload could still access or request the runtime access token. This version does not claim to make access tokens inaccessible to JavaScript. The response carrying the token is private and uses no-store; cross-origin response reads are not enabled.

Forwarding HTTP requests through Next.js also changes the backend's immediate network peer. Review backend trusted-proxy/IP attribution and rate limiting before production rollout. Browser-supplied forwarding headers are deliberately not relayed.

## Verification

Focused route tests cover credential stripping, HttpOnly/host-only/Secure cookie flags, CSRF rejection, cookie-only authorization, refresh revocation, expired-access logout, path confinement, and redirect handling. Client tests cover concurrent refresh, stale responses, account changes, and logout ordering. Existing download tests exercise a streamed 35 MiB response.

Run the focused unit checks with:

    npx vitest run src/app/api/session src/app/api/files src/lib/__tests__/session-client.test.ts src/lib/__tests__/api-refresh-queue.test.ts src/services/__tests__/auth-service.test.ts src/features/auth/context/__tests__ src/features/communication/__tests__/realtime src/__tests__/proxy.test.ts src/features/settings/hooks/__tests__/useBrandingProfile.test.tsx

The full test suite requires owner permission under AGENTS.md. Local mocked checks do not validate deployed backend authentication, proxy configuration, or a live realtime connection. Realtime compatibility is checked against the existing token-handshake contract, not a deployed backend session.

## Local verification on 2026-10-27

- Focused Vitest checks: 101 tests passed across 12 files. The refresh-queue tests were rerun after their final test-isolation correction: 10 passed.
- Typecheck and production build passed. Repository lint reported two unused-parameter warnings in a changed test; those were fixed, and lint over all changed source/test files then passed without warnings.
- Chromium smoke checks: reinforcement route loading and mutation-contract checks passed. The dashboard smoke reached the dashboard but failed its existing expectation that the Homework heading is hidden. Current dashboard rendering shows that heading. No production dashboard layout or Homework behavior was changed to resolve this unrelated expectation.
- Browser checks used installed Chromium headless shell revision 1228 through a temporary local configuration on port 3117; the lockfile-requested revision 1223 was unavailable. No browser/dependency versions were changed.
- Full unit and end-to-end suites were not run; owner permission is required. No live-backend authentication or deployment/realtime validation was performed.

## Realtime compatibility follow-up

The initial realtime restriction was removed at the request of the owner. Socket.IO again authenticates with an access token. Persistent storage remains removed, and the refresh token remains HttpOnly. New regression checks cover the access-token response header, rejection without disclosure, memory-token renewal, unchanged-token reconnect suppression, and immediate socket teardown on session invalidation. The follow-up focused run passed 95 tests across nine files.
