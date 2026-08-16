# Architecture and Scope

## Module wiring

`SchoolSupportModule` is imported into the main application module and exposes two controllers:

- `SchoolSupportController` for school-scoped School Dashboard users.
- `PlatformSupportController` for platform-scoped support operators.

The module imports:

- `AuthModule`
- `CommunicationModule`
- `RealtimeModule`

It provides:

- `SchoolSupportRepository`
- `SchoolSupportSideEffectsService`
- School use-cases: conversation, messages, send, read.
- Platform use-cases: inbox list, conversation detail, messages, reply, read, close, reopen.

## Storage strategy

School Support Chat V1 reuses existing Communication tables:

- `CommunicationConversation`
- `CommunicationConversationParticipant`
- `CommunicationMessage`
- `CommunicationMessageRead`
- `CommunicationNotification`
- `CommunicationNotificationDelivery`

No School Support-specific migration was added in this range.

## Support conversation identity

A support conversation is identified by:

- `CommunicationConversation.type = SUPPORT`
- `metadata.supportConversation = true`
- `metadata.surface = school_dashboard_help`
- `metadata.version = 1`

The product expectation is one support conversation per school. The repository finds the earliest matching support conversation for a school and creates one if none exists.

## REST-first design

REST remains the canonical state source for:

- Conversation status.
- Message list.
- Read state.
- Platform inbox freshness.

Realtime events are refetch hints only. Clients must not rely on realtime as an authoritative store.

## Separation from generic Communication

The feature deliberately avoids exposing Platform Admin support replies through generic Communication routes. Platform support uses `/api/v1/platform-admin/support/*` with platform scope and support-specific permissions.
