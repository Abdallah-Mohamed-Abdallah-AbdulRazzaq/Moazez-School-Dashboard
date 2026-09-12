# Realtime Client Integration

This document defines the frontend communication realtime contract. It describes the implementation in this repository; backend capacity, proxy behavior, and deployment configuration are separate concerns.

## Ownership and scope

`CommunicationRealtimeProvider` is mounted once by `src/app/providers.tsx`. It owns the Socket.IO client, its listeners, reconnect timers, and conversation-room state. Feature code accesses that client through `useCommunicationSocket()` and must not call `io()` directly.

The ownership boundary is one communication socket per authenticated browser tab. Opening more tabs creates more sockets. Cross-tab leader election, `BroadcastChannel`, and SharedWorker coordination are not implemented.

The provider creates a socket only when authentication loading has finished and the current user and access token are both present. Logout, token removal, provider unmount, or loss of the authenticated user stops the session, disconnects the socket, clears owned timers, removes listeners, and clears room bookkeeping.

## Connection configuration

The client uses Socket.IO Client 4.8.3 with these project settings:

| Setting | Value |
|---|---|
| Namespace URL | `NEXT_PUBLIC_REALTIME_URL`, falling back to `https://api.moazez.sa/api/v1/realtime` |
| Engine.IO path | `NEXT_PUBLIC_REALTIME_SOCKET_PATH` when non-empty; otherwise the Socket.IO default |
| Authentication | `auth: { token }` |
| Transport order | `websocket`, then `polling` |
| Initial transport fallback | `tryAllTransports: true` |
| Credentials | `withCredentials: true` |
| Automatic connection | Disabled during construction; the session calls `connect()` after listeners are attached |

`NEXT_PUBLIC_REALTIME_URL` identifies the Socket.IO namespace. `NEXT_PUBLIC_REALTIME_SOCKET_PATH` changes the Engine.IO transport path; it is not another namespace setting. Keep the path empty unless the backend or proxy explicitly exposes a custom Engine.IO path.

## Connection state and retry policy

`useCommunicationSocket()` exposes the following connection states:

```text
idle | connecting | connected | reconnecting | offline | auth-error | degraded
```

`isConnected` is true only for `connected`. `connectionError` contains the current user-facing connection error, and `retryConnection()` requests a manual retry when the session is online, has a token, and is not blocked by rejection of that same token.

Automatic retries use an exponential delay starting at 1 second, capped at 30 seconds, with a randomization factor of 0.5. A retry cycle is limited to eight attempts. Exhaustion enters `degraded` for a 60-second cooldown before a new cycle can begin. A successful connection resets retry and cooldown bookkeeping.

The browser `offline` event disables manager reconnection and moves the state to `offline`. The `online` event can resume the connection when a usable token is present. No automatic retry is scheduled while the browser reports that it is offline.

Connection failure classification accepts namespace errors and Engine.IO transport errors:

- HTTP 401/403 and `AUTHENTICATION_ERROR`, `UNAUTHORIZED`, or `FORBIDDEN` enter `auth-error`. Reconnection remains paused until the access-token value changes.
- HTTP 429 and `RATE_LIMITED` enter the rate-limit path. A positive `retryAfterMs` is used directly; a positive `retryAfter` is interpreted as seconds. Without either field, the 60-second cooldown is used.
- Other errors, including 5xx transport failures, use the bounded temporary-failure policy.

Status values are read from the error's attached `data`, outer `status`, Engine.IO `description`, or `context.status` fields.

## Token synchronization

The access token is read from `tokenStorage` under `moazez_access_token`. Writes through `tokenStorage.setAccessToken()`, `removeAccessToken()`, and `clearTokens()` publish a same-tab notification without including the token value. A native browser `storage` listener covers changes made by another tab.

On notification, the session rereads storage:

- An unchanged value causes no reconnect.
- A different non-empty token updates `socket.auth.token` and performs one controlled disconnect/connect cycle.
- A missing token stops and detaches the session.

The realtime client does not poll token storage.

## Conversation rooms

`joinConversation(conversationId)` and `leaveConversation(conversationId)` are reference-counted within the provider:

- The first local subscriber joins the server room when connected.
- Additional subscribers increment the local count without another server join.
- The final subscriber emits the server leave command.
- A disconnect clears only the server-membership set; local subscriber counts remain available for recovery.
- Every successful connection restores each active room once.

The room commands are:

- `communication.chat.conversation.join`
- `communication.chat.conversation.leave`

Room restoration occurs only from the socket `connect` lifecycle. Recovery increments `resyncVersion` after the first successful connection; the initial connection does not.

## Events and subscriptions

The event constants live in `src/features/communication/realtime/communication-events.ts`. Current server-to-client events are:

- Messages: `communication.chat.message.created`, `.updated`, `.deleted`, and `.read`
- Reactions: `communication.chat.reaction.upserted` and `.deleted`
- Attachments: `communication.chat.attachment.linked` and `.deleted`
- Typing: `communication.typing.started` and `.stopped`
- Presence: `communication.presence.user.updated`
- Announcements: `communication.announcement.published`
- Notifications: `communication.notification.created` and `.read`

The typing commands sent by the client are `communication.typing.start` and `communication.typing.stop`.

Hooks must unregister the exact callback they registered. The provider separately owns socket lifecycle listeners, manager retry listeners, browser online/offline listeners, token-change listeners, and its timeout handles.

## Recovery and REST reconciliation

`resyncVersion` is monotonic within a mounted provider session and represents a completed socket recovery. Route hooks use it to reconcile REST state that may have changed while disconnected.

- `useCommunicationOverview()` performs one full six-resource recovery refresh for a new version. Message, notification, and announcement bursts otherwise use the resource-key scheduler and its 500 ms debounce window.
- `useNotifications()` ignores a version already present when the hook mounts, then refreshes once for each later observed version change. A background feed that received HTTP 403 remains suppressed.
- `useConversationRealtime()` ignores a version already present on mount, then invokes its `onReconnect` callback once for each later observed version change while enabled.
- `useConversations()` ignores a version already present on mount and coalesces identical in-flight list requests.

This reconciliation is route-scoped. The frontend does not implement a global REST refresh coordinator.

## Diagnostics

Set `NEXT_PUBLIC_REALTIME_DEBUG=true` only for local or explicitly approved diagnostic sessions. The client logs structured records for socket creation, state changes, connections, disconnections, classified failures, retry scheduling, cooldowns, room counts, and overview refresh keys. Development warnings identify multiple live provider owners and suppressed duplicate room joins.

Diagnostics include booleans, counts, states, failure categories, retry timing, configured URL/path information, and event names. They do not log access-token values, message bodies, notification bodies, or realtime payload contents. These console diagnostics are not a production telemetry pipeline and do not establish backend health.

## Regression checks

The focused Vitest coverage is organized as follows:

| Contract | Test file |
|---|---|
| Socket options and transport fallback | `src/features/communication/__tests__/realtime/communication-socket.test.ts` |
| Failure classification, retry bounds, and 100-client jitter dispersion | `src/features/communication/__tests__/realtime/communication-connection-policy.test.ts` |
| Provider ownership, cross-tab token changes, room recovery, 100 mount/unmount cycles, and five-minute recovery | `src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx` |
| Token notification and storage cleanup | `src/lib/__tests__/token-storage.test.ts` |
| Overview event targeting and recovery | `src/features/communication/__tests__/hooks/useCommunicationOverview.test.tsx` |
| Conversation-list request coalescing | `src/features/communication/__tests__/hooks/useConversations.test.ts` |
| Notification recovery suppression | `src/features/communication/__tests__/hooks/useNotifications.test.ts` |
| Conversation-detail recovery callbacks and listener cleanup | `src/features/communication/__tests__/hooks/useConversationRealtime.test.ts` |

The 100-client check is a deterministic policy simulation of first-retry schedules, not a production WebSocket load test. The five-minute check advances the provider's fake clock and exercises disconnect/recovery behavior; it does not simulate a real proxy or backend outage.

## Non-goals and operational boundary

This frontend contract does not provide backend rate-limit capacity, Redis fan-out, proxy timeout validation, ordering guarantees across server events, application-level acknowledgements, cross-tab socket sharing, or production monitoring. Those require separate backend, infrastructure, or protocol work. No client-side retry setting should be treated as proof that the backend can absorb a reconnect wave.
