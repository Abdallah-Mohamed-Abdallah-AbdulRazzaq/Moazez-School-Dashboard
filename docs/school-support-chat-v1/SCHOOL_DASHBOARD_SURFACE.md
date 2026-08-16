# School Dashboard Surface

Base path:

```text
/api/v1/school-support
```

School routes require:

- Authenticated actor.
- Active school membership.
- Existing global guards: JWT, scope resolver, permissions.
- `school.support.view` or `school.support.send` depending on the route.

The client must not provide tenant override identifiers. School context is derived from request scope.

## GET `/conversation`

Permission:

```text
school.support.view
```

Behavior:

- Loads the current school support conversation.
- Creates it transactionally if no support conversation exists for the school.
- Ensures the current actor is an active support participant with owner role.
- Returns safe conversation summary and unread count.

## GET `/messages`

Permission:

```text
school.support.view
```

Query parameters:

- `before`: optional ISO datetime.
- `after`: optional ISO datetime.
- `page`: default `1`, max `10000`.
- `limit`: default `50`, max `100`.

Behavior:

- Ensures the support conversation exists.
- Returns sent/hidden/deleted messages through support presenter.
- Hidden/deleted message bodies are returned as `null`.
- Messages are ordered ascending by `sentAt`, then `id`.

## POST `/messages`

Permission:

```text
school.support.send
```

Request:

```json
{
  "body": "We need help with dashboard setup.",
  "clientMessageId": "optional-client-id"
}
```

Behavior:

- Trims message body and rejects empty messages.
- Writes `CommunicationMessage.kind = TEXT`.
- Adds support metadata to the message.
- Updates `conversation.lastMessageAt`.
- Writes audit log.
- Uses `clientMessageId` for idempotent replay for the same sender.
- Emits realtime and notifications only when a new message is created.
- Rejects send if the conversation is closed.

## POST `/read`

Permission:

```text
school.support.view
```

Request:

```json
{
  "readAt": "2026-07-08T12:05:00.000Z"
}
```

If `readAt` is omitted, server time is used.

Behavior:

- Ensures participant row exists.
- Creates read rows for unread messages not sent by the current actor.
- Updates participant `lastReadAt` and `lastReadMessageId`.
- Emits best-effort read realtime event.
