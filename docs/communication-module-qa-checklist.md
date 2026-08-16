# Communication Module QA Checklist

Use this checklist to verify the Communication module end to end in both English and Arabic dashboard routes where applicable.

## Setup

- [ ] User can log in using the existing Auth flow.
- [ ] API base URL is configured for the target environment.
- [ ] Realtime URL is configured through `NEXT_PUBLIC_REALTIME_URL`, or the fallback realtime URL is acceptable for the test environment.
- [ ] `socket.io-client` is installed in `package.json`.
- [ ] Communication routes load without console errors.
- [ ] Auth logout disconnects realtime sockets.

## Conversations

- [ ] Conversations list loads.
- [ ] Search and status filters work.
- [ ] User can create a conversation.
- [ ] Newly created conversation appears in the list after refresh/mutation.
- [ ] User can open a conversation thread.
- [ ] Thread loads conversation details, participants, and messages.
- [ ] User can send a message.
- [ ] Sent message appears once only, without duplicate optimistic/socket copies.
- [ ] User can edit an eligible message.
- [ ] Edited message content is reflected in the thread.
- [ ] User can delete an eligible message.
- [ ] Deleted message is hidden or marked deleted according to UI behavior.
- [ ] Opening a thread marks the conversation/message as read where applicable.
- [ ] Read summary/receipts update after reading.
- [ ] User can close a conversation.
- [ ] User can reopen a closed conversation.
- [ ] User can archive a conversation.
- [ ] Closed or archived conversations respect disabled actions in the UI.

## Realtime

- [ ] Two browser sessions can join the same conversation.
- [ ] A new message sent in session A appears in session B without manual refresh.
- [ ] A message edit in session A appears in session B.
- [ ] A message delete in session A appears in session B.
- [ ] Typing indicator appears live for the other session only.
- [ ] Typing indicator stops after the sender stops typing or leaves the thread.
- [ ] Presence updates appear when users connect/disconnect if backend supports presence events.
- [ ] Read receipts update live when the other user reads messages.
- [ ] Navigating between threads does not duplicate realtime events.
- [ ] Events from one conversation do not mutate another open conversation.
- [ ] Reconnect after network interruption triggers REST resync.
- [ ] Reconnected session does not duplicate existing messages, reactions, or attachments.

## Reactions

- [ ] User can add a reaction to a message when policy allows reactions.
- [ ] User can delete their own reaction.
- [ ] Reaction counts/state update after mutation.
- [ ] Other browser session sees reaction add/delete updates live.
- [ ] Duplicate reaction events do not create duplicate reaction UI.
- [ ] Reaction UI is hidden or disabled when policy disables reactions.

## Attachments

- [ ] User can upload a valid file when policy allows attachments.
- [ ] Uploaded file is linked to the selected message.
- [ ] Attachment appears in the message bubble.
- [ ] User can open/download the attachment.
- [ ] User can delete an attachment when allowed.
- [ ] Other browser session sees attachment add/delete updates live.
- [ ] Duplicate attachment events do not create duplicate attachment UI.
- [ ] Files larger than `maxAttachmentSizeMb` are blocked client-side when policy provides a limit.
- [ ] Backend attachment errors are displayed clearly.
- [ ] Attachment UI is hidden or disabled when policy disables attachments.

## Announcements

- [ ] Announcements list loads.
- [ ] Search/status filters work for draft, published, and archived announcements.
- [ ] Admin can create a draft announcement.
- [ ] Admin can edit a draft announcement.
- [ ] Admin can publish an announcement.
- [ ] Published announcement appears with the correct status.
- [ ] Admin can archive an announcement.
- [ ] Archived announcement appears with the correct status.
- [ ] Announcement details page loads.
- [ ] Read summary loads for an announcement.
- [ ] Mark read works where available.

## Notifications

- [ ] Notifications list loads.
- [ ] Read/unread filter works if supported by API.
- [ ] User can mark all notifications read.
- [ ] Notification list updates after marking all read.
- [ ] Notification delivery table loads.
- [ ] Notification page refreshes on window focus without errors.
- [ ] Empty, loading, and error states are clear.

## Safety

- [ ] User can create a message report from chat where supported.
- [ ] Duplicate report validation is displayed clearly.
- [ ] Moderator can list reports.
- [ ] Moderator can filter reports by status.
- [ ] Moderator can open report details.
- [ ] Report details show reported message context when available.
- [ ] Moderator can move a report to `in_review`.
- [ ] Moderator can resolve a report with a resolution note.
- [ ] Moderator can search/load a message by message ID.
- [ ] Admin can hide a message.
- [ ] Admin can unhide a message.
- [ ] Moderation history is visible.
- [ ] Admin can create a restriction.
- [ ] Restriction appears in the restrictions table.
- [ ] Admin can update a restriction.
- [ ] Admin can revoke a restriction.
- [ ] Restriction status displays active/lifted/expired when available.
- [ ] User/admin can create a block.
- [ ] Self-block validation error is displayed clearly.
- [ ] User/admin can delete a block.
- [ ] Block list refreshes after block/unblock.

## Settings

- [ ] Communication policy loads.
- [ ] Admin overview summary loads.
- [ ] Policy form shows returned policy values.
- [ ] Admin can update policy.
- [ ] Saved policy values persist after refresh.
- [ ] If `isEnabled` is false, chat shows disabled communication state.
- [ ] If attachments are disabled, attachment UI is hidden or disabled.
- [ ] If reactions are disabled, reaction UI is hidden or disabled.
- [ ] If message editing is disabled, edit actions are hidden.
- [ ] If message deleting is disabled, delete actions are hidden.
- [ ] If `maxMessageLength` is set, composer validates message length client-side.
- [ ] If `maxAttachmentSizeMb` is set, uploader validates file size client-side.
- [ ] Backend validation and permission errors remain visible to the user.

## Final Regression Checks

- [ ] `npm run build` passes.
- [ ] `npm run lint` passes with no new errors.
- [ ] `npm run test:run` passes.
- [ ] No real-time socket remains connected after logout.
- [ ] No unrelated Auth or Academic Year/Term behavior changed.
