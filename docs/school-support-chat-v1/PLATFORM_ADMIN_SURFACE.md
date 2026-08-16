# Platform Admin / System Dashboard Surface

Base path:

```text
/api/v1/platform-admin/support
```

All Platform Support routes use:

- `@PlatformScope()`.
- Membershipless `UserType.PLATFORM_USER` actor requirement.
- Per-handler `platform.support.*` permission metadata.
- Platform-safe repository access through `platformBypassScope(...)`.

## GET `/conversations`

Permission:

```text
platform.support.view
```

Query parameters:

- `schoolId`: optional UUID.
- `organizationId`: optional UUID.
- `status`: `active`, `closed`, or `archived`.
- `search`: optional text search by school/organization/message body.
- `hasUnread`: optional boolean.
- `page`: default `1`, max `10000`.
- `limit`: default `20`, max `100`.

Returns safe platform inbox rows with conversation summary, school summary, organization summary, last message preview, unread count, and pagination.

## GET `/conversations/:conversationId`

Permission:

```text
platform.support.view
```

Behavior:

- Verifies that the conversation is a support conversation.
- Ensures the platform actor is an admin participant.
- Returns conversation, school, organization, and unread state.

## GET `/conversations/:conversationId/messages`

Permission:

```text
platform.support.view
```

Query parameters match the school message list route:

- `before`
- `after`
- `page`
- `limit`

Behavior:

- Ensures platform participant.
- Lists messages safely.
- `isMine` is computed against the current platform actor.

## POST `/conversations/:conversationId/messages`

Permission:

```text
platform.support.reply
```

Request:

```json
{
  "body": "Thanks for reaching out. We will help you configure this.",
  "clientMessageId": "optional-client-id"
}
```

Behavior:

- Requires active support conversation.
- Ensures platform actor participant row.
- Creates support reply message with sender kind `support`.
- Emits realtime and in-app notifications only on newly created messages.
- Idempotent replay with same `clientMessageId` returns the persisted message without duplicate side effects.

## POST `/conversations/:conversationId/read`

Permission:

```text
platform.support.view
```

Marks conversation read for the current platform actor only. Platform unread state is per actor.

## POST `/conversations/:conversationId/close`

Permission:

```text
platform.support.manage
```

Closes an active support conversation. If the conversation is not active, the use case returns a conflict through `platform_support.conversation.invalid_state`.

## POST `/conversations/:conversationId/reopen`

Permission:

```text
platform.support.manage
```

Reopens a closed support conversation. After reopen, school and platform users can send messages again according to their permissions.
