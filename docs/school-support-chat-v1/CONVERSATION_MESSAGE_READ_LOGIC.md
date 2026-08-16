# Conversation, Message, and Read Logic

## Conversation creation

School Dashboard `GET /conversation` and dependent message/read flows call `getOrCreateSchoolConversationInTx`.

Creation rules:

- Conversation type is `SUPPORT`.
- Status is `ACTIVE`.
- Title is `Moazez Support`.
- Metadata marks it as support conversation for `school_dashboard_help` surface.
- The current school actor is ensured as an active owner participant.
- Audit log is written for conversation creation and participant ensure.

## Message creation

Both school send and platform reply use the same internal `createSupportMessageInTx` helper.

Common rules:

- Conversation must be active.
- Text body is trimmed and must not be empty.
- `CommunicationMessage.kind = TEXT`.
- `CommunicationMessage.status = SENT`.
- Message metadata includes `supportMessage`, `surface`, `senderKind`, and metadata version.
- Conversation `lastMessageAt` is updated.
- Audit log is written.

## Idempotency

If `clientMessageId` is provided, the repository checks for an existing message by:

- `conversationId`
- `senderUserId`
- `clientMessageId`

If found, it returns the existing message with `wasCreated = false`.

Use-cases only call side effects when `wasCreated = true`; this prevents duplicated realtime events, notifications, and unread side effects on replay.

## Closed conversation behavior

If the conversation status is not active:

- School send throws `school_support.conversation.closed`.
- Platform reply throws `platform_support.conversation.closed`.

Rejected closed-conversation sends/replies do not emit realtime events or create notifications.

## Read logic

Read action creates read rows for messages that:

- Belong to the conversation.
- Are `SENT`.
- Are not deleted.
- Were sent at or before `readAt`.
- Were not sent by the current actor.

It uses `createMany(..., skipDuplicates: true)` and updates the participant read pointer.

## Unread logic

Unread count is computed as sent, non-deleted messages in the conversation that:

- Were not sent by the current actor.
- Have no read row for the current actor.

Platform unread is per platform actor, not a shared global platform inbox read state.
