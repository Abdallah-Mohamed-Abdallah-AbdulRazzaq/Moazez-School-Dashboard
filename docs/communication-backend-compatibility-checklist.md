# Communication Backend Compatibility Checklist

Use this checklist when changing or QA-ing the Communication module against the Moazez backend DTOs. The backend rejects unknown request fields, so every request body should pass through the Communication service and mapper layer before it reaches `src/lib/api.ts`.

## 1. Environment

- [ ] `NEXT_PUBLIC_API_URL=https://api.moazez.sa/api/v1`
- [ ] `NEXT_PUBLIC_REALTIME_URL=https://api.moazez.sa/api/v1/realtime`
- [ ] `NEXT_PUBLIC_REALTIME_SOCKET_PATH=` is empty unless the backend explicitly adds a custom Engine.IO path.
- [ ] Seeing `/socket.io` in the browser network tab is expected when the backend uses the default Socket.IO transport path.
- [ ] `NEXT_PUBLIC_REALTIME_DEBUG=true` is enabled only when diagnosing realtime connection issues.

## 2. REST Payload Compatibility

- [ ] Policies send only backend policy fields: `isEnabled`, communication allow flags, limits, `moderationMode`, and `metadata`.
- [ ] Conversations send only backend create/update fields: `type`, `title`, `description`, scope IDs, `avatarFileId`, `isReadOnly`, `isPinned`, and `metadata`.
- [ ] Participants use participant endpoints after conversation creation; conversation create does not send `participantIds`.
- [ ] Invites send only `invitedUserId`, `expiresAt`, and `metadata`.
- [ ] Join requests send only `note` and `metadata`; approve/reject send only optional `reason`.
- [ ] Messages send only `type`, `body`, `content`, `clientMessageId`, `replyToMessageId`, and `metadata`.
- [ ] Message list `before` and `after` query params are ISO datetime strings, not message IDs.
- [ ] Reactions use only backend reaction values: `like`, `love`, `laugh`, `wow`, `sad`, `angry`, `thumbs_up`, `thumbs_down`.
- [ ] Message attachments use `/files` first, then link with `fileId`, `caption`, and `sortOrder`.
- [ ] Announcements send `title`, `body`, `status`, `priority`, `audienceType`, `scheduledAt`, `expiresAt`, `audiences`, and `metadata`.
- [ ] Announcement attachments use the announcement attachment list/link/delete endpoints with `fileId`, `caption`, and `sortOrder`.
- [ ] Notifications list filters use backend query names: `status`, `priority`, `type`, `sourceModule`, `sourceType`, `sourceId`, `recipientUserId`, `createdFrom`, `createdTo`, `limit`, `page`.
- [ ] Notification deliveries use backend query names: `notificationId`, `recipientUserId`, `channel`, `status`, `deliveryStatus`, `provider`, `createdFrom`, `createdTo`, `limit`, `page`.
- [ ] Reports send `reason`, `description`, `comment`, and `metadata`; UI `details` must map to `description`.
- [ ] Moderation actions send only `action` and `reason`.
- [ ] Restrictions use backend type values: `mute`, `read_only`, `send_disabled`, `group_create_disabled`, `direct_message_disabled`.
- [ ] Blocks send only `targetUserId`, `reason`, and `metadata`.
- [ ] Frontend-only fields are not sent: `titleAr`, `titleEn`, `bodyAr`, `bodyEn`, `targets`, `scopeType`, `scopeId`, `kind`, `attachmentIds`, `parentMessageId`, `details`, `message_send_disabled`, `attachment_upload_disabled`, `reaction_disabled`.

## 3. UI Form Compatibility

- [ ] Form fields match backend DTO names or are mapped before submit.
- [ ] No form spreads raw UI state directly into API calls.
- [ ] No frontend-only fields are submitted to the backend.
- [ ] Dropdown options match backend allowed values.
- [ ] Datetime inputs are converted to ISO strings before submission or query use.
- [ ] UUID fields are passed as UUID strings from existing selections or manual ID inputs.
- [ ] Backend validation errors are shown to the user and treated as the source of truth.

## 4. Realtime Compatibility

- [ ] Socket namespace URL is `/api/v1/realtime`.
- [ ] Default Socket.IO path `/socket.io` is expected unless the backend adds a custom path.
- [ ] Auth token is sent as `auth.token`; token contents are never logged.
- [ ] Join command is `communication.chat.conversation.join`.
- [ ] Leave command is `communication.chat.conversation.leave`.
- [ ] Typing commands are `communication.typing.start` and `communication.typing.stop`.
- [ ] Server listener events match backend names:
  - [ ] `communication.chat.message.created`
  - [ ] `communication.chat.message.updated`
  - [ ] `communication.chat.message.deleted`
  - [ ] `communication.chat.message.read`
  - [ ] `communication.chat.reaction.upserted`
  - [ ] `communication.chat.reaction.deleted`
  - [ ] `communication.chat.attachment.linked`
  - [ ] `communication.chat.attachment.deleted`
  - [ ] `communication.presence.user.updated`
  - [ ] `communication.typing.started`
  - [ ] `communication.typing.stopped`
  - [ ] `communication.announcement.published`
  - [ ] `communication.notification.created`
  - [ ] `communication.notification.read`
- [ ] If websocket fails in production while config is correct, check backend CORS origins and websocket upgrade support.

## 5. Manual QA Scenarios

- [ ] Create group conversation.
- [ ] Add participant after conversation creation.
- [ ] Send text message.
- [ ] Edit message.
- [ ] Mark conversation read.
- [ ] Add allowed reaction.
- [ ] Upload file and link message attachment.
- [ ] Create announcement with `audienceType` and `audiences`.
- [ ] Link announcement attachment.
- [ ] Publish announcement.
- [ ] Read notification detail.
- [ ] Mark notification read.
- [ ] Archive notification.
- [ ] Create report with required `reason`.
- [ ] Resolve report with `resolutionNote`.
- [ ] Create restriction with `send_disabled`.
- [ ] Revoke restriction.
- [ ] Create block.
- [ ] Delete block.

## Verification Commands

- [ ] `npm run test:run`
- [ ] `npm run lint`
- [ ] `npm run build`
