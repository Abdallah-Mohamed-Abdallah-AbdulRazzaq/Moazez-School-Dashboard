# Data Model and Storage

## Reused communication models

The feature uses existing Communication persistence. No dedicated `school_support_*` database tables were added.

Primary records:

- `CommunicationConversation`
- `CommunicationConversationParticipant`
- `CommunicationMessage`
- `CommunicationMessageRead`
- `CommunicationNotification`
- `CommunicationNotificationDelivery`
- `AuditLog`

## Conversation fields

Support conversation records use:

```text
CommunicationConversation.type = SUPPORT
CommunicationConversation.status = ACTIVE | CLOSED | ARCHIVED
CommunicationConversation.titleEn/titleAr = Moazez Support
CommunicationConversation.metadata.supportConversation = true
CommunicationConversation.metadata.surface = school_dashboard_help
CommunicationConversation.metadata.version = 1
```

## Participant rows

School actor:

- Ensured as `CommunicationParticipantRole.OWNER`.
- Has active participant row in the support conversation.

Platform support actor:

- Ensured as `CommunicationParticipantRole.ADMIN`.
- This participant row does not create a school membership.
- It must not make platform users visible in school Settings Users.

## Message metadata

Each support message stores metadata:

```json
{
  "supportMessage": true,
  "surface": "school_dashboard_help",
  "senderKind": "school|support",
  "version": 1
}
```

## Read state

Read state is represented through:

- `CommunicationMessageRead`
- `CommunicationConversationParticipant.lastReadAt`
- `CommunicationConversationParticipant.lastReadMessageId`

Unread count is derived from messages without read rows for the current actor.

## Audit logging

Audit logs are written for:

- Support conversation creation.
- Participant ensure.
- School message creation.
- Platform support reply.
- Read actions.
- Platform close/reopen transitions.

## Schema and migration status

The final acceptance docs confirm no new schema or migration changes in 1C. The runtime uses existing Communication schema and seed updates only add permissions.
