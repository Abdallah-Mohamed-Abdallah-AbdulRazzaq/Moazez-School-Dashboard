# Realtime, Notifications, and Unread

## Realtime events

School Support Chat V1 uses existing realtime event names:

- `communication.chat.message.created`
- `communication.chat.message.read`
- `communication.notification.created`

Message-created payloads include:

- `conversationId`
- `message` safe presenter output
- `eventAt`

Read payloads include:

- `conversationId`
- `reader.kind` as `school` or `support`
- `readAt`
- `markedCount`
- `eventAt`

Realtime is best-effort. A publish failure is logged and does not roll back the REST mutation.

## Platform socket join status

Platform-safe support socket room join is deferred. Platform Admin should use REST polling/refresh for inbox freshness in V1.

School Dashboard can listen to conversation events after loading the support conversation, but REST remains authoritative.

## Notification behavior

Notifications are in-app only.

When school sends a support message:

- The backend attempts to notify existing platform support participants.
- Non-participant platform users are not notified by this side-effect.

When platform replies:

- The backend attempts to notify active school support participants.

Common notification rules:

- Sender is excluded.
- Muted participants are excluded until `mutedUntil` passes.
- Recipient user must be active and not deleted.
- `actorUserId` is `null`.
- `sourceModule = COMMUNICATION`.
- `sourceType = school_support_message`.
- `type = MESSAGE_RECEIVED`.
- Delivery channel is `IN_APP` only.
- Notification generation failure is best-effort and does not roll back message creation.

## Push status

Support push delivery is deferred. V1 does not enqueue support push notifications.

## Unread behavior

School unread:

- Increases after platform replies.
- Resets after school `POST /school-support/read`.

Platform unread:

- Increases after school messages.
- Resets only for the platform actor who calls platform read.
- Another platform actor's unread state remains independent.
- A platform actor with no participant/read row still sees school-authored messages as unread in REST inbox.
