# API Reference

All paths use the global prefix:

```text
/api/v1
```

## School Dashboard APIs

### `GET /school-support/conversation`

Permission: `school.support.view`

Returns the current school's support conversation summary and unread state. Creates the conversation if it does not exist.

### `GET /school-support/messages`

Permission: `school.support.view`

Query:

- `before?: ISO datetime`
- `after?: ISO datetime`
- `page?: number = 1`
- `limit?: number = 50`

Returns conversation status, safe message items, and pagination.

### `POST /school-support/messages`

Permission: `school.support.send`

Body:

```json
{
  "body": "Message text",
  "clientMessageId": "optional-client-message-id"
}
```

Creates or returns an idempotent existing school-authored support message.

### `POST /school-support/read`

Permission: `school.support.view`

Body:

```json
{
  "readAt": "2026-07-08T12:05:00.000Z"
}
```

Marks messages read for the current school actor.

## Platform Admin APIs

### `GET /platform-admin/support/conversations`

Permission: `platform.support.view`

Query:

- `schoolId?: UUID`
- `organizationId?: UUID`
- `status?: active|closed|archived`
- `search?: string`
- `hasUnread?: boolean`
- `page?: number = 1`
- `limit?: number = 20`

Returns the platform support inbox.

### `GET /platform-admin/support/conversations/:conversationId`

Permission: `platform.support.view`

Returns detail for a support conversation.

### `GET /platform-admin/support/conversations/:conversationId/messages`

Permission: `platform.support.view`

Query:

- `before?: ISO datetime`
- `after?: ISO datetime`
- `page?: number = 1`
- `limit?: number = 50`

Returns messages in a support conversation.

### `POST /platform-admin/support/conversations/:conversationId/messages`

Permission: `platform.support.reply`

Body:

```json
{
  "body": "Support reply text",
  "clientMessageId": "optional-client-message-id"
}
```

Creates or returns an idempotent existing platform support reply.

### `POST /platform-admin/support/conversations/:conversationId/read`

Permission: `platform.support.view`

Marks messages read for the current platform actor only.

### `POST /platform-admin/support/conversations/:conversationId/close`

Permission: `platform.support.manage`

Body:

```json
{
  "reason": "optional reason"
}
```

Closes an active support conversation.

### `POST /platform-admin/support/conversations/:conversationId/reopen`

Permission: `platform.support.manage`

Body:

```json
{
  "reason": "optional reason"
}
```

Reopens a closed support conversation.
