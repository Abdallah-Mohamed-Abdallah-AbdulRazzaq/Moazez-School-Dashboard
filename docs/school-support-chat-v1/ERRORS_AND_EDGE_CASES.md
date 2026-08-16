# Errors and Edge Cases

## Domain errors

| Code | HTTP | Meaning |
| --- | --- | --- |
| `school_support.conversation.not_found` | 404 | School support conversation not found. Mostly defensive because school route creates it. |
| `school_support.conversation.closed` | 409 | School tried to send to closed support conversation. |
| `school_support.message.empty` | 422 | School message body is empty after trimming. |
| `platform_support.actor.invalid_type` | 403 | Platform route caller is not membershipless `PLATFORM_USER`. |
| `platform_support.conversation.not_found` | 404 | Platform support conversation hidden/not found/not support conversation. |
| `platform_support.conversation.closed` | 409 | Platform tried to reply to closed support conversation. |
| `platform_support.conversation.invalid_state` | 409 | Close/reopen requested from an invalid state. |
| `platform_support.message.empty` | 422 | Platform reply body is empty after trimming. |

## Idempotent message replay

Same `clientMessageId` for same sender and same conversation returns the existing message. It must not duplicate:

- Message row.
- Realtime message event.
- Notification records.
- Notification realtime events.

## Closed conversation sends

If a conversation is closed:

- School send returns 409.
- Platform reply returns 409.
- No realtime or notification side effects are emitted.

Platform can reopen the conversation, then normal sends are allowed again.

## Tenant override rejection

School-side request DTOs do not define tenant override fields. With global validation whitelist/forbid rules, client-supplied fields such as `schoolId`, `organizationId`, `membershipId`, and `participantId` must be rejected.

## Platform invalid actor

Platform support requires membershipless `UserType.PLATFORM_USER`. A school-scoped actor or platform-like actor with active membership should be rejected.

## No generic communication shortcut

Platform support cannot use generic `/api/v1/communication/*` routes to reply to school support messages. Those routes remain school-scoped.
