# Backend Required Changes — Communication Module

This document lists backend issues and missing features identified during the frontend conversation redesign implementation.

---

## 🔴 Critical (Blocking proper functionality)

### 1. Conversations not filtered by participant

**Current:** `GET /api/v1/communication/conversations` returns ALL conversations in the school regardless of whether the authenticated user is a participant.

**Impact:** Users see conversations they don't belong to.

**Fix:** Add participant filter to `buildConversationWhere()` in `communication-conversation.repository.ts`:

```typescript
// Add to the where clause:
participants: {
  some: {
    userId: scope.actorId,
    status: { in: ['ACTIVE', 'MUTED'] }
  }
}
```

---

### 2. No `lastMessage` or `unreadCount` in conversation list response

**Current:** `presentCommunicationConversationList` only returns `lastMessageAt` (a timestamp). No message body, sender name, or unread count.

**Impact:** Frontend must make N+1 requests (`GET /messages?limit=1` for each conversation) to show last message previews in the sidebar.

**Fix:** Include in the conversation list response:

```json
{
  "lastMessage": {
    "id": "uuid",
    "body": "Hello!",
    "senderUserId": "uuid",
    "senderName": "Ahmed",
    "createdAt": "ISO"
  },
  "unreadCount": 3
}
```

**Implementation:** Join the latest message and count unread (messages after the participant's `lastReadMessageId` or `readPointer`).

---

### 3. Notification socket event not emitted to user

**Current:** `CommunicationNotificationGenerationService` creates notifications via BullMQ queue worker, but does NOT emit a socket event to the recipient.

**Impact:** Frontend cannot show real-time notification toasts. Must poll `GET /notifications` every 30 seconds as a fallback.

**Fix:** After the queue worker creates a notification record, emit:

```typescript
this.publisher.publishToUser(
  recipientUserId,
  REALTIME_SERVER_EVENTS.COMMUNICATION_NOTIFICATION_CREATED,
  { notification: presentedNotification }
);
```

---

## 🟡 Important (Frontend has workarounds)

### 4. `readCount` includes self-reads

**Current:** `GET /messages/:id` returns `readCount` which includes the sender reading their own message.

**Impact:** Frontend must subtract 1 from `readCount` for own messages to determine if others have read it. This is fragile.

**Fix options:**
- Exclude the sender from `readCount` in the presenter
- OR add a separate `readByOthersCount` field
- OR don't create a read receipt when the sender views their own message

---

### 5. No endpoint to list who read a message

**Current:** Only `readCount` (a number) is available. No way to show individual reader names.

**Impact:** Cannot implement WhatsApp-style "Read by: Ahmed, Sara, ..." info panel.

**Fix:** Add endpoint:

```
GET /api/v1/communication/messages/:messageId/reads
```

Response:
```json
{
  "items": [
    { "userId": "uuid", "readAt": "ISO", "user": { "name": "Ahmed" } }
  ],
  "total": 3
}
```

---

### 6. `participantUserId` query param not supported

**Current:** `ListCommunicationConversationsQueryDto` only accepts `type`, `status`, `search`, `limit`, `page`. The frontend sends `participantUserId` but it's ignored.

**Impact:** Cannot filter conversations by participant from the API level.

**Fix:** Add to DTO:

```typescript
@IsOptional()
@IsUUID()
participantUserId?: string;
```

And use it in `buildConversationWhere()`:

```typescript
if (filters.participantUserId) {
  where.participants = {
    some: { userId: filters.participantUserId, status: 'ACTIVE' }
  };
}
```

---

### 7. File download requires auth but `<img>` can't send headers

**Current:** `GET /files/:id/download` requires Bearer token and returns 307 redirect. HTML `<img src="...">` tags cannot send Authorization headers.

**Impact:** Frontend must fetch avatars as blobs with authenticated requests, then create object URLs. This is slow and complex.

**Fix options:**
- Return a pre-signed URL field in the conversation response: `avatarUrl: "https://s3.../signed-url"`
- OR add a query-param based auth: `GET /files/:id/download?token=short-lived-token`
- OR make avatar files public (visibility: PUBLIC) since they're not sensitive

---

## 🟢 Nice to Have (Enhancements)

### 8. Verify `type` filter works in conversation list

The `type` field is in `ListCommunicationConversationsQueryDto` and `buildConversationWhere()` uses it. Verify it actually filters correctly when the frontend sends `?type=group`.

---

### 9. Realtime event for conversation list updates

**Current:** When a new message arrives, the frontend relies on being in the conversation's socket room to update the sidebar.

**Suggestion:** Emit a lightweight `conversation.updated` event to all participants when a conversation's `lastMessageAt` changes. This would allow the sidebar to update without joining every room.

---

### 10. Per-conversation `unreadCount` endpoint

**Suggestion:** Add `GET /api/v1/communication/conversations/:id/unread-count` or include it in the list response (see #2).

---

### 11. Emit socket event after notification generation

**Current:** The queue worker (`CommunicationNotificationQueueService`) processes notification generation but doesn't emit realtime events.

**Fix:** After creating notification records, emit `communication.notification.created` to each recipient's user-level socket room.

---

### 12. Consider message ID-based cursor pagination

**Current:** `before` param in `GET /messages` accepts ISO datetime strings.

**Suggestion:** Support `beforeId` (message UUID) for more reliable cursor pagination. Two messages at the same timestamp could cause pagination issues with datetime cursors.

---

## Priority Order

1. **#1** — Filter conversations by participant (most impactful UX fix)
2. **#2** — Include `lastMessage` + `unreadCount` in list (eliminates N+1 requests)
3. **#3** — Emit notification socket events (enables real-time toasts)
4. **#4** — Fix `readCount` self-read inclusion
5. **#7** — Simplify avatar/file URL access
6. **#6** — Add `participantUserId` filter param
7. **#5** — Add message reads list endpoint
8. **#9-12** — Nice-to-have enhancements
