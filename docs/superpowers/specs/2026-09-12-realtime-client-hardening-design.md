# Realtime Client Hardening Design

## Status

- Date: 2026-09-12
- Repository: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-School-Dashboard`
- Baseline: `origin/main` at `05fbd09be4b2b3329545a538005c7f1a3f3453ba`
- Scope: frontend only
- Selected approach: targeted hardening with one Socket.IO client per authenticated browser tab

## Problem statement

The production incident was not proven to originate in the frontend. The backend and hosting capacity remain outside this task. The frontend audit did, however, confirm amplification paths that can increase pressure during an outage or reconnect wave:

1. Active conversation rooms are restored from both the socket `connect` event and the manager `reconnect` event, producing two join commands for the same room after a reconnect.
2. Socket.IO uses its default unlimited reconnection attempts and a five-second maximum delay.
3. The provider polls token storage every five seconds in every tab and disconnects/reconnects when it detects a new access token.
4. Message events on the communication overview debounce for 500 ms, then refetch all six overview resources.
5. Notification presentation may fetch message information and conversation information separately for each notification, without sharing concurrent identical requests.
6. Reconnect resynchronization is broadcast as one global version counter, so independently mounted hooks may refetch at the same time.

The fix must reduce this amplification without changing the backend protocol, removing global realtime notifications, or introducing cross-tab leader election.

## Audit disposition for the 31 handoff items

The audit classified the handoff items as follows. “Outside scope” means the item cannot be established or changed by this frontend-only task.

| # | Area | Frontend disposition |
|---:|---|---|
| 1 | Incident context | Outside scope |
| 2 | Backend facts | Contract verified; no frontend defect |
| 3 | Audit method | Passed |
| 4 | Socket ownership | Passed: one provider owns `io()` |
| 5 | React lifecycle | Passed |
| 6 | Per-feature sockets | Passed: none found |
| 7 | Multiple tabs | Known linear risk: one socket per tab |
| 8 | Authentication | Partial: contract correct; refresh handling needs hardening |
| 9 | Reconnection | Risk confirmed |
| 10 | Timeout behavior | Partial; no 300-second production simulation |
| 11 | Room lifecycle | Defect confirmed: duplicate rejoin |
| 12 | Delivery, duplication, ordering | Partial; no client ordering contract |
| 13 | REST amplification | Defect confirmed |
| 14 | Typing and presence | Passed |
| 15 | Transport | Partial: WebSocket first with polling fallback; proxy matrix outside scope |
| 16 | Browser network and visibility | Missing explicit online/offline handling |
| 17 | Connection state machine | Missing |
| 18 | Application ACK and retry | Not applicable to current client commands |
| 19 | Listener leaks | Passed in focused lifecycle simulation |
| 20 | Error handling | Partial |
| 21 | Security | Passed for reviewed token transport and logging |
| 22 | Observability | Missing structured client metrics |
| 23 | Test matrix | Partial |
| 24 | Load and stress | Partial; local client simulations only |
| 25 | Client contract documentation | Missing before this design |
| 26 | Scope control | Passed |
| 27 | Implementation philosophy | Not an auditable defect |
| 28 | Git workflow | Passed for the audit |
| 29 | Final implementation report | Not applicable before implementation |
| 30 | Acceptance | Failed before implementation |
| 31 | Stop boundary | Passed |

Focused audit tests passed 97 tests across 11 files. A disposable lifecycle harness passed single-socket, listener-cleanup, and shutdown-cleanup checks, but observed two room joins where one was expected after reconnect. The full test suite and production verification were not run.

## Goals

- Preserve exactly one physical communication socket per authenticated browser tab.
- Emit at most one conversation join per active room for each successful socket connection.
- Bound and classify reconnect behavior so offline and authentication failures do not create sustained retry pressure.
- React to actual token changes instead of polling token storage every five seconds.
- Refresh only communication overview resources affected by an event.
- Coalesce concurrent identical notification-context requests.
- Expose a small, testable connection state and development diagnostics without logging tokens or message contents.
- Preserve the existing Socket.IO namespace, authentication payload, event names, transport order, and room reference counting.

## Non-goals

- Backend, Cloud Run, Redis, proxy, deployment, or infrastructure changes.
- Cross-tab leader election, `BroadcastChannel`, SharedWorker, or a single browser-wide socket.
- Changing the server event contract or adding acknowledgement semantics.
- Removing global notifications or connecting only on communication routes.
- A new external monitoring vendor or production telemetry pipeline.
- Broad refactoring of communication hooks unrelated to request amplification.
- UI redesign. Existing status UI may consume the richer state, but no new visual treatment is required by this task.

## Architecture

`CommunicationRealtimeProvider` remains the only owner of socket creation and teardown. The implementation separates four responsibilities behind small frontend-only units:

1. **Connection policy** describes retry delays, retry classification, cooldown, and connection-state transitions.
2. **Token change notification** lets the provider react when `tokenStorage` writes or clears the access token in the current tab. The existing browser `storage` listener continues to cover changes made by other tabs.
3. **Room restoration** is one idempotent provider operation invoked only by the socket `connect` handler.
4. **Refresh scheduling** maps realtime events to affected overview resources and coalesces duplicate work.

The provider still owns one `Socket` instance in `socketRef`. Feature hooks continue to receive that instance through `useCommunicationSocket`; they must not call `io()` themselves.

## Connection state and policy

The public connection state becomes an explicit union:

```text
idle | connecting | connected | reconnecting | offline | auth-error | degraded
```

`isConnected` remains available as a compatibility projection of `state === "connected"`. `connectionError`, `retryConnection`, room methods, and typing methods remain available.

The retry policy is:

- exponential delay starting at 1 second;
- delay capped at 30 seconds;
- Socket.IO randomization factor of 0.5;
- eight consecutive automatic attempts per cycle;
- after exhaustion, a 60-second cooldown before another bounded cycle;
- no automatic attempts while `navigator.onLine` is false;
- authentication failures enter `auth-error` and wait for an access-token change;
- a rate-limit failure honors a positive server retry delay when supplied; otherwise it uses the 60-second cooldown;
- other temporary connection and 5xx failures use the bounded retry policy;
- a successful connection resets attempt and cooldown state.

The browser `online` event may resume a stopped or cooled-down connection. The `offline` event stops the manager and moves the provider to `offline`. Manual retry does nothing while offline or while the current token is still rejected as an authentication failure.

Error classification must inspect only fields actually present on `connect_error` or its attached data and must have a conservative unknown-error fallback. The implementation must not infer a successful authentication refresh from elapsed time.

## Socket and room lifecycle

On an authenticated provider mount:

1. Read the current access token.
2. Create one socket with `autoConnect: false`.
3. Attach socket and manager listeners once.
4. Enter `connecting` and call `connect()`.

On every socket `connect`:

1. Enter `connected` and clear the current error.
2. Reset retry bookkeeping.
3. Iterate the room reference-count map once and emit one `communication.chat.conversation.join` for each active room.
4. Increment `resyncVersion` only when the connection is a recovery rather than the initial connection.

The manager `reconnect` listener must not restore rooms. It may be removed entirely if all required bookkeeping is handled by socket lifecycle events.

`joinConversation` and `leaveConversation` keep the existing reference-count contract. The first local subscriber joins a room when connected, additional subscribers only increment the count, and the final subscriber leaves the room. Logout, missing authentication, and provider unmount remove listeners, stop manager timers, disconnect the socket, clear room counts, and clear provider timers.

## Token lifecycle

`tokenStorage` will publish a same-tab access-token change notification after `setAccessToken`, `removeAccessToken`, and `clearTokens`. The event contains no token value. Consumers reread storage when notified. The provider also listens to the native `storage` event for cross-tab changes.

When the reread token equals `socket.auth.token`, the provider does nothing. When a non-empty token changes, it updates the existing socket auth payload and starts one controlled reconnect. When the token disappears, it performs the normal authenticated teardown. This removes the five-second polling interval.

If token writes outside `tokenStorage` exist, they are not supported same-tab mutation paths and must not be accommodated with polling. Existing application writes identified by the audit use `tokenStorage`.

## Targeted refresh flow

The communication overview retains its initial six-resource load and its explicit public `refresh()` operation. Realtime-triggered refreshes use a resource-key scheduler instead:

```text
socket event
  -> map event to affected resource keys
  -> add keys to one pending set
  -> wait for the debounce window
  -> issue at most one request per pending resource
  -> merge successful resource results into current overview state
```

The initial event mapping is deliberately narrow:

| Event | Overview resources |
|---|---|
| message created, updated, or deleted | `adminOverview`, `conversations` |
| notification created or read | `adminOverview`, `notifications` |
| announcement published | `adminOverview` |
| reconnect resynchronization | all six resources, once per recovery |

Policy, open reports, and active restrictions are not refetched for message events. A failed targeted request preserves the last successful value for unrelated resources and exposes the error through the existing hook error channel. Explicit refresh remains a full refresh.

The 500 ms debounce window remains, but it coalesces resource keys rather than scheduling the complete six-request bundle. The scheduler must cancel its timer on unmount and ignore late results after unmount.

## Notification request coalescing

Message notification presentation keeps its current fallback-first behavior and API contract. A module-level in-flight request map coalesces identical concurrent calls to `getMessageInfo(messageId)` and `getConversation(conversationId)`. Entries are removed when the promise settles, so this is request sharing rather than a long-lived data cache.

No notification body, message body, access token, or personally identifying payload is written to diagnostics. If context requests fail, the existing fallback presentation remains valid.

## Diagnostics

Diagnostics are local and gated by `NEXT_PUBLIC_REALTIME_DEBUG=true`, matching the existing debug switch. They record structured counters or log records for:

- socket creation, connect, disconnect, and reconnect attempts;
- current state transition and classified failure category;
- room join and leave emissions, identified only by a non-reversible or omitted room identifier;
- realtime-triggered overview refresh count and selected resource keys;
- development warnings for more than one live socket owned by the provider or a repeated room join in the same connection generation.

This design does not claim production observability until these signals are connected to an approved monitoring service.

## Expected source surfaces

Production changes are expected to remain within these existing frontend surfaces plus small colocated utilities if separation is needed:

- `src/features/communication/realtime/CommunicationRealtimeProvider.tsx`
- `src/features/communication/realtime/communication-socket.ts`
- `src/features/communication/hooks/useCommunicationSocket.ts`
- `src/features/communication/hooks/useCommunicationOverview.ts`
- `src/features/communication/utils/notificationPresentation.ts`
- `src/lib/token-storage.ts`
- `src/features/communication/conversations_redesign/components/RealtimeStatusBanner.tsx` only if the existing state consumer requires compatibility updates

No backend repository, deployment configuration, environment value, or UI component outside the existing communication status surface is authorized.

## Testing strategy

Focused Vitest tests will cover:

- one physical socket through repeated provider renders;
- no listener growth through repeated mount/unmount cycles;
- exactly one room join per active room after a recovery;
- no reconnect attempt while offline and resume on `online`;
- authentication-failure pause and resume only after token change;
- eight-attempt bound, cooldown, and successful reset;
- no reconnect when a token-change notification leaves the token value unchanged;
- same-tab and cross-tab token-change handling;
- event bursts coalescing to one request per affected overview resource;
- message events not requesting policy, reports, restrictions, or notifications;
- explicit overview refresh and reconnect recovery still loading all six resources once;
- concurrent identical notification-context requests sharing in-flight promises;
- cleanup of socket listeners, manager listeners, browser listeners, timers, room counts, and in-flight bookkeeping where owned by the component.

Tests should exercise public behavior with fake timers and controllable socket mocks. They must not duplicate Socket.IO internals or assert implementation-only call ordering unless ordering is part of the contract.

Focused tests, lint on changed files, and TypeScript type checking may run during implementation. The repository's full test suite requires explicit owner approval before it is run. Production or backend load testing is outside this frontend task.

## Acceptance criteria

The implementation is accepted when:

1. A tab owns no more than one communication socket at a time.
2. Each active room produces exactly one join command for each successful connection generation.
3. Offline and authentication failures cannot create an automatic reconnect loop.
4. Temporary failures use the approved bounded retry and cooldown policy.
5. Token synchronization has no five-second polling timer and reconnects only after an actual token-value change.
6. A message event cannot trigger the six-request overview bundle.
7. Bursts of equivalent realtime events issue at most one request per affected overview resource inside the debounce window.
8. Concurrent notification presentation calls do not duplicate identical message-info or conversation requests.
9. Existing listener and room reference-count guarantees remain intact.
10. Focused old and new tests pass, changed code passes lint, and the project passes type checking.
11. No backend, deployment, secret, production environment, or unrelated UI file is changed.

## Rollout and rollback

The work ships as one frontend pull request from a branch created at the recorded baseline. The pull request remains unmerged for owner review. No production deployment is part of developer delivery.

The changes are code-only and require no data migration. Rollback is a normal revert of the frontend pull request. The existing environment variables and backend contract remain compatible.

## Deferred decisions

Cross-tab socket coordination is deferred until measurements show that sockets per user session materially affect backend capacity. A future proposal may evaluate `BroadcastChannel` leader election, but it must include leader failover, room-subscription aggregation, browser compatibility, and multi-tab integration tests as a separate task.
