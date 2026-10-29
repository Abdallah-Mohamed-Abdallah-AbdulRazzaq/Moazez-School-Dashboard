# Dashboard server sessions

The browser calls the same-origin Next.js route at /api/session instead of attaching a Bearer token. Login and refresh return only the user object. Successful /api/session/auth/me responses additionally return the access token in X-Moazez-Realtime-Token for the existing Socket.IO handshake. The persistent access and refresh token copies are stored by the route handler in HttpOnly, host-only, SameSite=Lax cookies. Production cookies additionally use Secure and the __Host- prefix.

## Configuration and API contract

The server resolves the backend API base from API_PROXY_TARGET, falling back to an absolute NEXT_PUBLIC_API_URL. The browser always uses /api/session. An installation whose public API URL is relative must supply the already-supported API_PROXY_TARGET on the server. This change does not modify environment files, deployment workflows, or production values.

POST /api/session/auth/login forwards credentials to /auth/login. POST /api/session/auth/refresh reads the refresh cookie and forwards it to /auth/refresh; browser-supplied refresh tokens are not used. The access cookie expires after the backend's expiresIn seconds. The refresh cookie is a browser-session cookie; the backend still enforces its actual token expiry and revocation. A closed browser may restore session cookies according to its own session-restore policy.

POST /api/session/auth/logout clears both session cookies and legacy cookie names, and attempts backend revocation within five seconds. When access has expired, the server can refresh once to revoke that session without returning the new credentials. If the backend is unreachable, local cookies are still cleared; backend revocation is not guaranteed.

Other requests are proxied to the configured backend with the access cookie converted to its Authorization header. Browser Authorization headers and cookies are not forwarded. Backend cookies and redirects are not relayed. Responses use Cache-Control: no-store and a sandbox content policy for direct document views. Both /api/files/:fileId/download and /api/session/files/:fileId/download resolve backend storage redirects on the server without forwarding session credentials to storage, then stream the file without Content-Length. Missing or non-HTTP storage locations and HTML file responses are rejected.

## CSRF, refresh, and session transitions

Mutation requests require X-Moazez-CSRF: 1. An Origin, when present, must match the request protocol and Host header, falling back to the Next.js URL host when no Host header exists; cross-site Fetch Metadata is rejected. This accommodates Next.js using its internal listening address behind an HTTPS proxy. The existing proxy must preserve the public Host and communicate the public protocol to Next.js. The routes do not grant cross-origin CORS access. The Axios client supplies the custom header.

A 401 can trigger one refresh and retry. Concurrent requests in a tab share a refresh promise. Login, logout, and refresh are serialized with Web Locks across tabs where supported, and a local promise queue otherwise. Before rotating, a queued refresh checks /auth/me to avoid rotating again if another tab already renewed access. Profile requests share an ordering counter, including these refresh probes, so a delayed response cannot replace a newer in-memory realtime token. Browsers without Web Locks have no cross-tab serialization guarantee.

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

The full test suite requires owner permission under AGENTS.md. Mocked checks alone do not validate backend authentication, proxy configuration, or a live realtime connection. The dated verification records below distinguish mocked checks from local dashboard checks against the existing backend.

## Local verification on 2026-10-27

- Focused Vitest checks: 101 tests passed across 12 files. The refresh-queue tests were rerun after their final test-isolation correction: 10 passed.
- Typecheck and production build passed. Repository lint reported two unused-parameter warnings in a changed test; those were fixed, and lint over all changed source/test files then passed without warnings.
- Chromium smoke checks: reinforcement route loading and mutation-contract checks passed. The dashboard smoke reached the dashboard but failed its existing expectation that the Homework heading is hidden. Current dashboard rendering shows that heading. No production dashboard layout or Homework behavior was changed to resolve this unrelated expectation.
- Browser checks used installed Chromium headless shell revision 1228 through a temporary local configuration on port 3117; the lockfile-requested revision 1223 was unavailable. No browser/dependency versions were changed.
- Full unit and end-to-end suites were not run; owner permission is required. No live-backend authentication or deployment/realtime validation was performed.

## Realtime compatibility follow-up

The initial realtime restriction was removed at the request of the owner. Socket.IO again authenticates with an access token. Persistent storage remains removed, and the refresh token remains HttpOnly. New regression checks cover the access-token response header, rejection without disclosure, memory-token renewal, unchanged-token reconnect suppression, and immediate socket teardown on session invalidation. The follow-up focused run passed 95 tests across nine files.

## Local verification on 2026-10-29

The owner authorized the full checks. The frontend ran from this branch at localhost:3117, with API requests forwarded to the existing backend. No backend source or deployed frontend was changed.

- Full Vitest run: 4,727 tests passed across 774 files. After the download redirect fix, the affected session and download routes were rerun: 30 tests passed.
- Browser checks with the owner's test account confirmed login, page reload, access-cookie expiry followed by refresh and retry, refresh propagation to a second tab, and logout propagation with both session cookies removed.
- The existing realtime namespace accepted the token handshake before and after refresh. The second tab renewed its in-memory handshake token after refresh. Sending messages and other changes to school records were not exercised.
- Read-only checks loaded the dashboard, communication, students, teachers, homework, timetable, assessments, attendance reports, and published academic resources. Arabic and English switching updated the document direction.
- Browser inspection found HttpOnly, Secure, SameSite=Lax session cookies and no access/refresh tokens in localStorage or JavaScript-readable cookies. Anonymous HTTP checks confirmed authentication rejection, CSRF rejection, and method restrictions.
- Download regression checks cover the backend's signed-storage redirect through both dashboard routes and verify that storage requests carry neither Authorization nor Cookie headers.
- Repository-wide lint, typecheck, and the final production build passed. The dashboard smoke test was corrected to expect the existing visible Homework heading, the Source filter's accessible name, and automatic filtering when a source is selected. The focused dashboard and reinforcement checks passed three tests in desktop Chromium and three in Mobile Chrome.
- After rebuilding and restarting the local branch, a published 8,662,354-byte PPTX attachment downloaded successfully and had the expected ZIP file signature. The test used an existing resource without changing school records.
- The attempted 185-case Playwright run reached case 182 before its final WebKit worker stopped progressing; the run was interrupted. Its log recorded 77 failures, including missing authentication fixtures, mocks targeting the previous /api/v1 browser URL, and the stale dashboard filter selector. This run is not a passing browser-suite result. Real school records were not modified to satisfy these scenarios.

## Browser fixture corrections on 2026-10-29

The attendance, grades, teachers, conversations, and application-table tests now establish an isolated mock session and complete school-setup data. Their API mocks target /api/session. Unmocked browser API requests fail the test instead of reaching the live backend, and the shared fixture rejects non-local dashboard origins.

The assertions follow the current interface: roll call explicitly opens attendance; teacher detail does not expose unsupported archive; conversation load errors offer Retry; and question deletion uses its action menu. The question-order check targets the question card rather than the answer-option controls. Application table tests assert row ordering, pagination, and filtered results without conditional passes. Grades tests seed their own assessment instead of depending on a previous test's writes.

For WebKit tests over local HTTP, page-navigation requests carry only the synthetic session marker required by the local middleware. API authentication remains mocked. This handles WebKit's refusal to send Secure cookies over HTTP without modifying production cookies or real credentials. This suite checks UI and API contracts; the live session and realtime checks are recorded separately above.

With the branch already running locally, PLAYWRIGHT_TEST_BASE_URL points both the browser and Playwright's existing-server check at that server. For example, set it to http://localhost:3117 before running npm run test:e2e. Start the matching local server first when using a custom port.

The final full browser run completed in 7.8 minutes: 179 passed, six skipped, zero failures, and zero flaky results across Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari. The six skips are the existing Chromium-only dashboard and reinforcement route-render checks in the three non-Chromium profiles; no skips were added. Changed-file lint, application typecheck, and a separate typecheck including the E2E files passed. This follow-up changes test code, test configuration, and verification notes only; dashboard runtime code, backend code, and realtime behavior are unchanged.

The question edit scenario also passed through the standard Playwright configuration with PLAYWRIGHT_TEST_BASE_URL=http://localhost:3117, confirming that the existing local server is reused on the custom port.

## Final push review on 2026-10-29

Review found and fixed two additional session bugs: out-of-order profile responses could replace a newer realtime access token, and an HTTPS proxy's public Host could differ from Next.js's internal URL host. Regression tests reproduced both failures before their fixes. The local HTTP proxy-origin check now accepts the matching public HTTPS origin and rejects a different host or protocol.

The repeated full Vitest run at 267316e6 passed all 4,737 tests across 774 files. Repository-wide lint, application typecheck, the production build, and a separate E2E typecheck passed. Application source has not changed since the successful build at 8094f7b6; subsequent changes concern browser-test lifecycle and synchronization only.

The final browser reruns must not be described as a complete passing full suite. Windows WebKit intermittently hangs during browser shutdown after assertions pass. A standalone diagnostic reproduced that hang on iteration 13 while opening only the local favicon, without executing dashboard JavaScript. Earlier interrupted runs and the historical 179-pass result above remain separate from this final verification.

On the final browser-test revision, the assertion logs cover all 185 cases across the five profiles: 179 passed and six existing Chromium-only skips, with no failed assertions. This combines the all-profile run through WebKit with separate Mobile Chrome and Mobile Safari runs; the case manifest was checked for missing or duplicate cases in each profile. Mobile Chrome exited successfully. WebKit and Mobile Safari shutdown hangs prevent treating these results as a clean full-suite process pass.

The reruns also exposed two browser-fixture timing issues. The shared fixture now waits for intercepted prefetch handlers before context teardown, and the attendance page-hop scenario waits for its initial absences response to finish before navigating away. The six teacher scenarios passed in WebKit after the fixture fix; the attendance scenario subsequently passed three repetitions each in WebKit and Mobile Safari, with successful process exits. No assertions or API-error checks were disabled.

An authenticated diagnostic through the local session boundary connected to the cloud realtime namespace for 45 seconds: one connection, WebSocket transport, no disconnect or connection error, and the socket still connected at the end. The diagnostic revoked its own test session afterward. The built client contains the default https://api.moazez.cloud/api/v1/realtime namespace URL. Frontend tests targeted the local branch; backend source, deployment configuration, and the deployed frontend were unchanged.
