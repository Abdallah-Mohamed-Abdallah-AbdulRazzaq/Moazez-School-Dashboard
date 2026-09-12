# Conversation State Consistency Design

## Goal

Fix the identified conversation-module consistency problems without changing the backend contract or replacing the existing hook architecture. The conversation list and detail view must remain usable when an individual operation or secondary tab fails.

## Scope

This change covers:

- conversation-list loading and mutation error separation;
- participant, invitation, and join-request loading errors;
- join-request access for users who can create but cannot review requests;
- last-message reconciliation between list responses and realtime events;
- media-aware last-message previews;
- backend-confirmed unread-count clearing;
- the default `hasFilters` calculation.

It does not introduce a new server-state library, change backend endpoints, or redesign unrelated communication screens.

## State and Error Boundaries

Each data hook will expose an error that represents only failure to load its owned collection. Mutation failures will continue to reject so the calling component can show one localized toast, but they will not replace collection data or populate a loading-error state.

The conversation sidebar will show its blocking error only when the conversation list itself cannot load. A failed create, update, close, reopen, or archive operation will leave the existing list visible and will be reported once by the action owner.

Participant, invitation, and join-request load failures will render a scoped inline error inside the affected tab with a retry action. They will not replace the conversation header. Existing shared UI primitives will be used for the retry control and error presentation.

The main conversation and message list retain their existing dedicated load-error behavior because those resources are required to render the active thread.

## Join-Request Access

The join-request hook will load after the tab is opened when the user can either create a join request or review join requests. This keeps tab visibility and data activation aligned. A creator-only user can therefore see the relevant request state and see newly created data after the mutation refresh.

Review and approval actions remain protected by their existing review permissions. Expanding data activation does not expand mutation authorization.

## Last-Message Data Flow

The conversation list will continue using the `lastMessage` object returned by the list-conversations endpoint. It will not issue one message request per conversation.

The normalized last-message model will retain message identity, type, status, text, sender information, and timestamps. Timestamp selection will use `createdAt`, then `sentAt`, then `updatedAt`, with the conversation-level `lastMessageAt` as a final fallback.

When list data and local realtime state both provide a last message, reconciliation will preserve the demonstrably newer message. A valid timestamp wins over an invalid or absent timestamp. If both versions represent the same message, their fields will be merged so fresh server fields do not discard useful local fields. Deterministic fallback behavior will prevent invalid timestamps from replacing a known valid message.

This allows reconnect refreshes to recover missed messages while preventing an older cached API response from rolling back a newer realtime preview.

## Sidebar Message Previews

Text messages with a body use that body. Deleted messages use the existing deleted-message label. Messages without text use localized semantic labels based on their type:

- image: Image / صورة;
- video: Video / فيديو;
- voice or audio: Voice note / رسالة صوتية;
- file: Attachment / مرفق.

An existing media message with a null body must never be displayed as “No messages yet.” Unknown non-text message types fall back to the localized attachment label.

## Read-State Synchronization

The active detail view remains responsible for calling the conversation-read backend endpoint. It will do so only when:

- the messages tab is active;
- the document is visible;
- the window has focus;
- there is a message from another user that has not already triggered the same request.

The detail view will notify the parent page only after the backend read request succeeds. The parent will then clear the selected conversation's local unread count. This applies equally to sidebar selections and directly opened conversation URLs.

If the read request fails, the local unread count remains unchanged and the existing request guard resets so a later focus, visibility change, or message update can retry. Re-renders must not duplicate a successful read request for the same latest incoming message.

## Filter State

The unfiltered baseline is an empty search with status `all` and type `all`. `hasFilters` is true only when at least one value differs from that baseline.

## Testing

Focused regression coverage will verify:

- list responses provide last-message data without per-conversation message requests;
- media message types produce localized non-empty previews;
- newer realtime data survives an older refresh;
- newer API data replaces older local data;
- conversation mutations do not set a list-load error;
- default filters report `hasFilters: false`;
- direct-link unread counts clear only after backend read success;
- failed read requests do not clear local unread counts and can retry;
- creator-only and reviewer users activate join-request data appropriately;
- secondary-tab load errors remain scoped and expose retry;
- mutation failures create exactly one toast;
- message operation failures keep the thread visible while genuine load failures retain the existing load-error state.

Verification will use the relevant communication test files, TypeScript type checking, targeted ESLint, and `git diff --check`. The full test suite will run only after explicit user approval.

## Constraints

- Do not merge to `main`.
- Preserve unrelated and pre-existing working-tree changes.
- Use existing components from the UI folder for UI changes.
- Review every production-code change with `clean-code-guard`.
- Review every test change with `test-guard`.
