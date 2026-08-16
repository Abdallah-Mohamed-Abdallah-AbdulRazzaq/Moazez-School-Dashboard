# School Support Chat V1 Backend

## Purpose

School Support Chat V1 implements a narrow support conversation between a school-scoped School Dashboard user and Moazez Platform Support.

It is not a generic communication chat surface. It reuses the existing Communication persistence layer but exposes support-specific wrapper endpoints and presenters.

## Implemented surfaces

### School Dashboard

Base path:

```text
/api/v1/school-support
```

Implemented routes:

- `GET /conversation`
- `GET /messages`
- `POST /messages`
- `POST /read`

### Platform Admin / System Dashboard

Base path:

```text
/api/v1/platform-admin/support
```

Implemented routes:

- `GET /conversations`
- `GET /conversations/:conversationId`
- `GET /conversations/:conversationId/messages`
- `POST /conversations/:conversationId/messages`
- `POST /conversations/:conversationId/read`
- `POST /conversations/:conversationId/close`
- `POST /conversations/:conversationId/reopen`

## Core product behavior

- One persistent `CommunicationConversationType.SUPPORT` conversation per school at V1 product level.
- Text-only messages.
- REST is the source of truth.
- Realtime message/read events are best-effort.
- Notifications are in-app only.
- Platform Admin support is intentionally separated from generic `/api/v1/communication/*` routes.

## Not implemented in V1

- Push delivery for support chat.
- Email/SMS support messaging.
- Attachments.
- Ticket numbers, categories, assignment, SLA, priority, internal notes, or bot/AI support.
- Platform-safe support socket room join.
- Database-level uniqueness enforcement for one support conversation per school.
