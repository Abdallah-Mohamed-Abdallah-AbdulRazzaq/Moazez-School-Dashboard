# Request and Response Shapes

## School conversation response

```json
{
  "conversation": {
    "id": "uuid",
    "type": "support",
    "status": "active",
    "title": "Moazez Support",
    "lastMessageAt": null
  },
  "unread": {
    "count": 0,
    "lastReadAt": null
  }
}
```

## School message item

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "body": "We need help.",
  "sender": {
    "kind": "school",
    "displayName": "School Admin"
  },
  "isMine": true,
  "sentAt": "2026-07-08T12:00:00.000Z"
}
```

`sender.kind` values:

- `school`
- `support`
- `system`

`support` display name is always `Moazez Support`.

## School messages list

```json
{
  "conversation": {
    "id": "uuid",
    "status": "active"
  },
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0
  }
}
```

## Read response

```json
{
  "conversationId": "uuid",
  "readAt": "2026-07-08T12:05:00.000Z",
  "markedCount": 1
}
```

## Platform inbox item

```json
{
  "conversation": {
    "id": "uuid",
    "status": "active",
    "lastMessageAt": "2026-07-08T12:00:00.000Z"
  },
  "school": {
    "id": "uuid",
    "name": "Example School",
    "status": "active"
  },
  "organization": {
    "id": "uuid",
    "name": "Example Organization"
  },
  "lastMessage": {
    "preview": "We need help...",
    "senderKind": "school",
    "sentAt": "2026-07-08T12:00:00.000Z"
  },
  "unread": {
    "count": 1
  }
}
```

## Platform conversation detail

```json
{
  "conversation": {
    "id": "uuid",
    "type": "support",
    "status": "active",
    "lastMessageAt": "2026-07-08T12:00:00.000Z",
    "createdAt": "2026-07-08T11:55:00.000Z"
  },
  "school": {
    "id": "uuid",
    "name": "Example School",
    "status": "active"
  },
  "organization": {
    "id": "uuid",
    "name": "Example Organization"
  },
  "unread": {
    "count": 1,
    "lastReadAt": null
  }
}
```

## Transition response

Close:

```json
{
  "conversation": {
    "id": "uuid",
    "status": "closed",
    "closedAt": "2026-07-08T12:30:00.000Z"
  }
}
```

Reopen:

```json
{
  "conversation": {
    "id": "uuid",
    "status": "active",
    "reopenedAt": "2026-07-08T12:45:00.000Z"
  }
}
```
