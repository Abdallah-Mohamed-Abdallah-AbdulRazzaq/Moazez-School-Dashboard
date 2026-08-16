# Conversation Page Audit — Manual QA Checklist

This checklist provides structured manual test cases for verifying the Conversation Page in the SIS Dashboard communication module. Each test case includes preconditions, steps, expected results, locale context, and viewport requirements.

**References:** Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 5.5, 11.4

---

## 1. Sidebar Navigation & Filtering

### 1.1 Sidebar — Conversation List Loads on Page Mount

**Preconditions:** User is authenticated and has at least 5 conversations (mix of group, direct, classroom).
**Steps:**
1. Navigate to the Conversations page.
2. Observe the sidebar panel.
**Expected Result:** All conversations load in the sidebar. Pinned conversations appear first, followed by remaining conversations sorted by most recent activity (lastMessage date or updatedAt) descending.
**Locale:** Both
**Viewport:** Both

### 1.2 Sidebar — Search Filters Conversations by Title

**Preconditions:** User has conversations with distinct titles.
**Steps:**
1. Navigate to the Conversations page.
2. Type a partial conversation title into the search input.
3. Observe the conversation list updates as you type.
**Expected Result:** Only conversations whose title matches the search query are displayed. Results update in real-time as the user types.
**Locale:** Both
**Viewport:** Both

### 1.3 Sidebar — "Mine" Filter Shows Only User-Created Conversations

**Preconditions:** User has created some conversations and is a participant in others created by different users.
**Steps:**
1. Navigate to the Conversations page.
2. Select the "Mine" filter tab.
**Expected Result:** Only conversations where `createdById` matches the current user are displayed. Conversations created by others are hidden.
**Locale:** Both
**Viewport:** Desktop

### 1.4 Sidebar — "Unread" Filter Shows Only Unread Conversations

**Preconditions:** User has at least 2 conversations with unread messages and 2 that are fully read.
**Steps:**
1. Navigate to the Conversations page.
2. Select the "Unread" filter tab.
**Expected Result:** Only conversations with `unreadCount > 0` are displayed. Fully read conversations are hidden.
**Locale:** Both
**Viewport:** Desktop

### 1.5 Sidebar — "Pinned" Filter Shows Only Pinned Conversations

**Preconditions:** User has at least 1 pinned and 1 unpinned conversation.
**Steps:**
1. Navigate to the Conversations page.
2. Select the "Pinned" filter tab.
**Expected Result:** Only conversations where `isPinned` is true are displayed.
**Locale:** Both
**Viewport:** Desktop

---

## 2. Message Display & Scrolling

### 2.1 Messages — Messages Render with Correct Sender and Body

**Preconditions:** A conversation exists with at least 10 messages from multiple participants.
**Steps:**
1. Select the conversation from the sidebar.
2. Observe the messages panel.
**Expected Result:** Each message bubble displays the correct sender name and body text. Own messages are visually distinguished from others (alignment/color).
**Locale:** Both
**Viewport:** Both

### 2.2 Messages — Deleted Messages Show Deleted State

**Preconditions:** A conversation contains at least 1 deleted message.
**Steps:**
1. Select the conversation.
2. Locate the deleted message in the list.
**Expected Result:** The deleted message shows an empty body or a "message deleted" indicator. It remains in its original position in the message order.
**Locale:** Both
**Viewport:** Both

### 2.3 Messages — Scroll to Bottom on New Message

**Preconditions:** A conversation has enough messages to require scrolling.
**Steps:**
1. Select the conversation and scroll up in the messages panel.
2. Send a new message or receive a real-time message.
**Expected Result:** The messages panel scrolls to the bottom to show the newest message.
**Locale:** Both
**Viewport:** Both

### 2.4 Messages — Context Menu Opens Without Errors

**Preconditions:** A conversation with messages is open.
**Steps:**
1. Right-click (or long-press on mobile) on a message bubble.
2. Observe the context menu (BubbleContextMenu).
3. Open browser DevTools console before performing the action.
**Expected Result:** The context menu opens with available actions (reply, copy, edit, delete, react, report). No "Cannot access refs during render" error appears in the console.
**Locale:** Both
**Viewport:** Both

### 2.5 Messages — Reply Preview Displays Correctly

**Preconditions:** A message in the conversation has been replied to.
**Steps:**
1. Select the conversation.
2. Locate a message that is a reply to another message.
**Expected Result:** The reply message shows a preview of the original message it replies to, with the original sender's name and a truncated body.
**Locale:** Both
**Viewport:** Both

---

## 3. Message Composition & Send

### 3.1 Composer — Send Plain Text Message

**Preconditions:** User is a participant in an active conversation with send permissions.
**Steps:**
1. Select the conversation.
2. Type a message in the composer input.
3. Press Enter or click the send button.
**Expected Result:** The message appears optimistically in the messages panel immediately. After server confirmation, the message persists without duplication.
**Locale:** Both
**Viewport:** Both

### 3.2 Composer — Reply to a Message

**Preconditions:** A conversation with messages is open.
**Steps:**
1. Open the context menu on a message.
2. Select "Reply".
3. Observe the composer shows a reply preview.
4. Type a reply and send.
**Expected Result:** The composer shows the original message preview. The sent message includes `replyToMessageId` and displays as a reply in the messages list.
**Locale:** Both
**Viewport:** Both

### 3.3 Composer — Edit an Existing Message

**Preconditions:** User has sent a message in the conversation that is eligible for editing.
**Steps:**
1. Open the context menu on the user's own message.
2. Select "Edit".
3. Observe the composer pre-fills with the existing message body.
4. Modify the text and submit.
**Expected Result:** The composer pre-fills with the original text. After submission, the message updates in place with the new body. An "edited" indicator may appear.
**Locale:** Both
**Viewport:** Both

### 3.4 Composer — ReadOnly Composer for Restricted Users

**Preconditions:** User is in a conversation where they are muted, blocked, or the conversation is read-only/closed.
**Steps:**
1. Select the restricted conversation.
2. Observe the composer area.
**Expected Result:** The ReadOnlyComposer is displayed instead of the MessageComposer. The user cannot type or send messages. A message indicates why sending is disabled.
**Locale:** Both
**Viewport:** Both

### 3.5 Composer — Send Message with Attachments

**Preconditions:** User is in an active conversation. Policy allows attachments.
**Steps:**
1. Click the attachment button in the composer.
2. Select one or more files within the allowed size limit.
3. Send the message.
**Expected Result:** The message is created first, then attachments are uploaded sequentially. Upload progress is shown. After completion, attachments appear in the message.
**Locale:** Both
**Viewport:** Desktop

---

## 4. Real-Time Updates

### 4.1 Real-Time — New Message Appears Without Refresh

**Preconditions:** Two browser sessions are logged in as different users in the same conversation.
**Steps:**
1. In Session A, send a message.
2. Observe Session B's messages panel.
**Expected Result:** The new message appears in Session B within 500ms without a page refresh or manual data refetch.
**Locale:** Both
**Viewport:** Both

### 4.2 Real-Time — Unread Count Increments for Other Users

**Preconditions:** Two sessions in the same conversation. Session B has the conversation in the sidebar but is viewing a different conversation.
**Steps:**
1. In Session A, send a message.
2. Observe Session B's sidebar unread badge for that conversation.
**Expected Result:** The unread count badge increments by 1 in Session B's sidebar. The sender's (Session A) unread count does not increment.
**Locale:** Both
**Viewport:** Desktop

### 4.3 Real-Time — Typing Indicator Appears and Disappears

**Preconditions:** Two sessions in the same conversation.
**Steps:**
1. In Session A, start typing in the composer.
2. Observe Session B's messages panel for the typing indicator.
3. In Session A, stop typing and wait.
**Expected Result:** Session B sees a typing indicator with Session A's user name. After Session A stops typing, the indicator disappears.
**Locale:** Both
**Viewport:** Both

### 4.4 Real-Time — Typing Indicator Timeout (5 Seconds)

**Preconditions:** Two sessions in the same conversation. Network tools available to block specific socket events.
**Steps:**
1. In Session A, start typing (triggers `typingStarted` event).
2. Simulate a scenario where `typingStopped` is never received (e.g., Session A disconnects abruptly).
3. Observe Session B's typing indicator.
4. Wait 5 seconds.
**Expected Result:** The typing indicator for Session A's user disappears after approximately 5 seconds even without receiving a `typingStopped` event.
**Locale:** Both
**Viewport:** Both

### 4.5 Real-Time — Message Edit Updates in Place

**Preconditions:** Two sessions in the same conversation with existing messages.
**Steps:**
1. In Session A, edit an existing message.
2. Observe Session B's messages panel.
**Expected Result:** The edited message updates its body text in Session B without changing its position in the message list. No full refetch occurs.
**Locale:** Both
**Viewport:** Both

---

## 5. Participant Management

### 5.1 Participants — Tab Loads Participant List

**Preconditions:** User is in a group conversation with multiple participants.
**Steps:**
1. Select the conversation.
2. Switch to the "Participants" tab.
**Expected Result:** The participants list loads showing display names, roles, and online/offline presence indicators.
**Locale:** Both
**Viewport:** Both

### 5.2 Participants — Management Actions for Admins

**Preconditions:** User has management permissions (admin/owner) in the conversation.
**Steps:**
1. Switch to the Participants tab.
2. Observe available actions for each participant.
**Expected Result:** Add, promote, demote, and remove participant actions are visible and functional. Clicking each opens the appropriate dialog (AddParticipantDialog, EditParticipantRoleDialog, RemoveParticipantDialog).
**Locale:** Both
**Viewport:** Desktop

### 5.3 Participants — No Management Actions for Regular Members

**Preconditions:** User is a regular member (not admin/owner) in the conversation.
**Steps:**
1. Switch to the Participants tab.
2. Observe available actions.
**Expected Result:** Add, promote, demote, and remove actions are hidden. Only the "Leave Conversation" option is available.
**Locale:** Both
**Viewport:** Both

### 5.4 Participants — Presence Status Updates in Real-Time

**Preconditions:** Two sessions. Session B is viewing the Participants tab.
**Steps:**
1. Session A logs out or disconnects.
2. Observe Session B's participants list.
**Expected Result:** Session A's user shows as "offline" in the participants list. When Session A reconnects, their status updates to "online".
**Locale:** Both
**Viewport:** Desktop

### 5.5 Participants — Leave Conversation Dialog

**Preconditions:** User is a participant in a group conversation.
**Steps:**
1. Switch to the Participants tab.
2. Click "Leave Conversation".
3. Confirm in the dialog.
**Expected Result:** The LeaveConversationDialog opens. Upon confirmation, the user is removed from the conversation and redirected. A success toast is displayed.
**Locale:** Both
**Viewport:** Both

---

## 6. Invites & Join Requests

### 6.1 Invites — Tab Loads Invite List

**Preconditions:** User has management permissions. The conversation has pending, accepted, and rejected invites.
**Steps:**
1. Select the conversation.
2. Switch to the "Invites" tab.
**Expected Result:** The invites list loads showing user display names, invite status (pending/accepted/rejected), and action buttons for pending invites.
**Locale:** Both
**Viewport:** Both

### 6.2 Invites — Accept an Invite

**Preconditions:** A pending invite exists in the conversation.
**Steps:**
1. Switch to the Invites tab.
2. Click "Accept" on a pending invite.
**Expected Result:** The invite status updates to "accepted". A success toast is displayed.
**Locale:** Both
**Viewport:** Desktop

### 6.3 Invites — Reject an Invite with Confirmation

**Preconditions:** A pending invite exists in the conversation.
**Steps:**
1. Switch to the Invites tab.
2. Click "Reject" on a pending invite.
3. Confirm in the RejectInviteDialog.
**Expected Result:** The RejectInviteDialog opens. Upon confirmation, the invite is rejected and a success toast is displayed.
**Locale:** Both
**Viewport:** Desktop

### 6.4 Join Requests — Tab Loads Request List

**Preconditions:** The conversation has pending join requests. User has reviewer permissions.
**Steps:**
1. Switch to the "Join Requests" tab.
**Expected Result:** The join requests list loads showing requester names, request status, and approve/reject actions for pending requests.
**Locale:** Both
**Viewport:** Both

### 6.5 Join Requests — Approve or Reject a Request

**Preconditions:** A pending join request exists. User has reviewer permissions.
**Steps:**
1. Switch to the Join Requests tab.
2. Click "Approve" or "Reject" on a pending request.
3. Confirm in the ReviewJoinRequestDialog.
**Expected Result:** The dialog processes the action. A success toast is displayed and the request status updates accordingly.
**Locale:** Both
**Viewport:** Desktop

---

## 7. Reactions & Attachments

### 7.1 Reactions — Add a Reaction via Context Menu

**Preconditions:** User is in an active conversation. Policy allows reactions (`allowReactions: true`).
**Steps:**
1. Open the context menu on a message.
2. Select a reaction type from the available options.
**Expected Result:** The reaction is added to the message. The reaction count updates in the message bubble display.
**Locale:** Both
**Viewport:** Both

### 7.2 Reactions — Remove Own Reaction

**Preconditions:** User has previously added a reaction to a message.
**Steps:**
1. Click on the user's own reaction on the message bubble.
**Expected Result:** The reaction is removed. The reaction count decrements or the reaction disappears if count reaches 0.
**Locale:** Both
**Viewport:** Both

### 7.3 Reactions — Hidden When Policy Disables

**Preconditions:** The conversation policy has `allowReactions: false`.
**Steps:**
1. Open the context menu on a message.
2. Look for the reaction option.
**Expected Result:** The reaction option is not visible in the BubbleContextMenu.
**Locale:** Both
**Viewport:** Both

### 7.4 Attachments — Upload File Within Size Limit

**Preconditions:** User is in an active conversation. Policy allows attachments with a defined `maxAttachmentSizeMb`.
**Steps:**
1. Click the attachment button.
2. Select a file within the allowed size limit.
3. Send the message.
**Expected Result:** The file uploads with a progress indicator. After completion, the attachment appears in the message's attachment list.
**Locale:** Both
**Viewport:** Desktop

### 7.5 Attachments — Reject Oversized File

**Preconditions:** Policy defines `maxAttachmentSizeMb` (e.g., 10 MB).
**Steps:**
1. Click the attachment button.
2. Select a file exceeding the size limit.
**Expected Result:** An error message is displayed indicating the file exceeds the maximum allowed size. The file is not uploaded.
**Locale:** Both
**Viewport:** Both

---

## 8. Conversation Lifecycle

### 8.1 Lifecycle — Create a New Conversation

**Preconditions:** User has permission to create conversations.
**Steps:**
1. Click the "Create Conversation" button.
2. Fill in the conversation title, type, and initial participants.
3. Submit the form.
**Expected Result:** A new conversation is created and appears in the sidebar. The user is navigated to the new conversation. A success toast is displayed.
**Locale:** Both
**Viewport:** Both

### 8.2 Lifecycle — Edit Conversation Details

**Preconditions:** User is the owner/admin of an active conversation.
**Steps:**
1. Open the conversation settings/edit dialog.
2. Modify the conversation title or description.
3. Save changes.
**Expected Result:** The conversation details update. The sidebar reflects the new title. A success toast is displayed.
**Locale:** Both
**Viewport:** Desktop

### 8.3 Lifecycle — Close a Conversation

**Preconditions:** User is the owner/admin of an active conversation.
**Steps:**
1. Open conversation actions.
2. Select "Close Conversation".
3. Confirm in the dialog.
**Expected Result:** The conversation status changes to "closed". The MessageComposer is replaced with ReadOnlyComposer. Participants can no longer send messages. A success toast is displayed.
**Locale:** Both
**Viewport:** Both

### 8.4 Lifecycle — Reopen a Closed Conversation

**Preconditions:** User is the owner/admin of a closed conversation.
**Steps:**
1. Select the closed conversation.
2. Open conversation actions.
3. Select "Reopen Conversation".
4. Confirm in the dialog.
**Expected Result:** The conversation status changes back to "active". The MessageComposer is restored. Participants can send messages again. A success toast is displayed.
**Locale:** Both
**Viewport:** Both

### 8.5 Lifecycle — Archive a Conversation

**Preconditions:** User is the owner/admin of a conversation (active or closed).
**Steps:**
1. Open conversation actions.
2. Select "Archive Conversation".
3. Confirm in the dialog.
**Expected Result:** The conversation status changes to "archived". The conversation may be hidden from the default sidebar view (depending on active filters). A success toast is displayed.
**Locale:** Both
**Viewport:** Desktop

---

## 9. Error States & Edge Cases

### 9.1 Error — API Failure Shows Toast

**Preconditions:** Network tools available to simulate API failures.
**Steps:**
1. Navigate to the Conversations page.
2. Simulate a 500 error on the conversations API endpoint.
3. Observe the page behavior.
**Expected Result:** An error toast is displayed with a descriptive message. No stale data is shown in the affected section. The page does not crash.
**Locale:** Both
**Viewport:** Both

### 9.2 Error — Network Disconnect and Reconnect Recovery

**Preconditions:** User is in an active conversation with real-time features working.
**Steps:**
1. Disconnect the network (disable Wi-Fi or use DevTools throttling to "Offline").
2. Wait 10 seconds.
3. Reconnect the network.
4. Have another user send messages during the disconnection period.
**Expected Result:** After reconnection, `refreshAll` is triggered. Messages sent during disconnection appear in the messages panel. No duplicate messages are created. Real-time features resume (typing indicators, presence).
**Locale:** Both
**Viewport:** Both

### 9.3 Error — Empty Conversation State

**Preconditions:** User has no conversations.
**Steps:**
1. Navigate to the Conversations page.
**Expected Result:** The sidebar shows an empty state message or prompt to create a conversation. No errors in the console.
**Locale:** Both
**Viewport:** Both

### 9.4 Error — Selecting a Conversation That No Longer Exists

**Preconditions:** A conversation was deleted or the user was removed while the page is open.
**Steps:**
1. Have the conversation open.
2. From another session or admin panel, delete the conversation or remove the user.
3. Attempt to interact with the conversation.
**Expected Result:** An appropriate error message is displayed. The user is not stuck on a broken detail view.
**Locale:** Both
**Viewport:** Both

### 9.5 Error — Send Message Failure

**Preconditions:** User is in an active conversation. Network is unreliable.
**Steps:**
1. Type a message in the composer.
2. Simulate a network failure before sending.
3. Press send.
**Expected Result:** The optimistic message may appear briefly. An error toast is displayed indicating the send failed. The message is marked as failed or removed from the list.
**Locale:** Both
**Viewport:** Both

---

## 10. RTL/LTR Layout Verification

### 10.1 RTL — Arabic Locale Page Layout

**Preconditions:** User switches to Arabic locale (`/ar/` route).
**Steps:**
1. Navigate to the Conversations page in Arabic locale.
2. Observe the overall page layout direction.
**Expected Result:** The page renders in RTL direction. The sidebar appears on the right side. Text alignment is right-to-left. All UI elements respect RTL layout.
**Locale:** RTL
**Viewport:** Desktop

### 10.2 RTL — Message Bubble Alignment

**Preconditions:** Arabic locale. A conversation with messages from the current user and other users.
**Steps:**
1. Open a conversation in Arabic locale.
2. Observe message bubble alignment.
**Expected Result:** Own messages align to the left (start in RTL). Other users' messages align to the right (end in RTL). This is the mirror of LTR behavior.
**Locale:** RTL
**Viewport:** Both

### 10.3 RTL — Context Menu Placement

**Preconditions:** Arabic locale. A conversation with messages.
**Steps:**
1. Open the BubbleContextMenu on a message.
2. Observe the menu placement.
**Expected Result:** The context menu uses logical `start`/`end` placement properties. The menu appears on the correct side relative to the message bubble in RTL layout.
**Locale:** RTL
**Viewport:** Both

### 10.4 RTL — Sidebar Filters and Search

**Preconditions:** Arabic locale.
**Steps:**
1. Navigate to the Conversations page in Arabic locale.
2. Observe the search input and filter tabs.
3. Type Arabic text in the search input.
**Expected Result:** The search input has RTL text direction. Filter tabs are ordered right-to-left. Arabic text renders correctly in the search field and conversation titles.
**Locale:** RTL
**Viewport:** Desktop

### 10.5 LTR — English Locale Baseline

**Preconditions:** User is in English locale (`/en/` route).
**Steps:**
1. Navigate to the Conversations page in English locale.
2. Observe the overall page layout.
**Expected Result:** The page renders in LTR direction. The sidebar appears on the left side. Text alignment is left-to-right. All UI elements respect LTR layout.
**Locale:** LTR
**Viewport:** Desktop

---

## 11. Mobile Responsive Behavior

### 11.1 Mobile — Only Sidebar Visible Initially

**Preconditions:** Viewport width is below 768px (e.g., 375x667 iPhone SE).
**Steps:**
1. Navigate to the Conversations page on a mobile viewport.
**Expected Result:** Only the sidebar/conversation list is visible. The detail panel is hidden. The layout uses full width for the sidebar.
**Locale:** Both
**Viewport:** Mobile

### 11.2 Mobile — Selecting Conversation Shows Detail Panel

**Preconditions:** Mobile viewport. Conversations page is loaded with the sidebar visible.
**Steps:**
1. Tap on a conversation in the sidebar list.
**Expected Result:** The sidebar hides and the detail panel (messages, header, composer) takes full width. A back button/arrow is visible to return to the sidebar.
**Locale:** Both
**Viewport:** Mobile

### 11.3 Mobile — Back Button Returns to Sidebar

**Preconditions:** Mobile viewport. A conversation detail panel is currently displayed.
**Steps:**
1. Tap the back button/arrow in the conversation header.
**Expected Result:** The detail panel hides and the sidebar returns to full width. The conversation list refreshes. The previously selected conversation is not auto-reselected (`userClosedRef` prevents this).
**Locale:** Both
**Viewport:** Mobile

### 11.4 Mobile — Composer Usability on Small Screens

**Preconditions:** Mobile viewport. A conversation is open.
**Steps:**
1. Tap the message composer input.
2. Type a message.
3. Observe the keyboard interaction and composer layout.
**Expected Result:** The composer input is accessible and usable. The send button is reachable. The messages panel adjusts to accommodate the on-screen keyboard (no content hidden behind keyboard).
**Locale:** Both
**Viewport:** Mobile

### 11.5 Mobile — RTL Layout on Mobile

**Preconditions:** Mobile viewport. Arabic locale.
**Steps:**
1. Navigate to the Conversations page in Arabic locale on a mobile viewport.
2. Select a conversation.
3. Observe layout direction.
**Expected Result:** The mobile layout respects RTL direction. The back button appears on the right side. Message bubbles align correctly for RTL. The composer input has RTL text direction.
**Locale:** RTL
**Viewport:** Mobile

---

## Test Execution Notes

- **Browser:** Test in Chrome (latest) and Safari (latest for iOS mobile simulation).
- **DevTools:** Keep browser DevTools console open during all tests to catch runtime errors.
- **Network:** Use DevTools Network tab to verify API calls and simulate failures.
- **React DevTools:** Use the Profiler tab for re-render verification (Requirement 2.1).
- **Locales:** Test Arabic at `/ar/communication/conversations` and English at `/en/communication/conversations`.
- **Mobile Simulation:** Use Chrome DevTools device toolbar with responsive mode or actual mobile devices.
