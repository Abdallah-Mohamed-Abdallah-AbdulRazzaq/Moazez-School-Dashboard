# Requirements Document

## Introduction

A comprehensive verification and audit plan for the Conversation Page in the SIS Dashboard communication module. The audit covers correctness, absence of runtime errors, excessive re-renders, data fetching integrity, event handling, and real-time functionality across all tabs and sub-features (messages, participants, invites, join requests, reactions, attachments, typing indicators, and presence). The plan produces both a manual QA checklist for visual/UX verification against the live backend and automated tests (Vitest unit + Playwright E2E) using mocked API responses and simulated socket events. Discovered issues are flagged with proposed fixes.

## Glossary

- **Audit_System**: The combined set of manual QA checklists and automated test suites that verify the Conversation Page
- **Conversation_Page**: The top-level page component (`ConversationPage.tsx`) comprising the sidebar and detail panels
- **Conversation_Detail**: The detail panel component (`ConversationDetail.tsx`) managing messages, participants, invites, and join requests tabs
- **Messages_Panel**: The messages display area including message bubbles, context menus, reactions, and attachments
- **Bubble_Context_Menu**: The floating context menu (`BubbleContextMenu.tsx`) providing reply, copy, edit, delete, react, and report actions on message bubbles
- **Socket_Layer**: The Socket.IO real-time communication layer using `useCommunicationSocket` and `useConversationRealtime` hooks
- **Data_Hooks**: Custom React hooks (`useConversations`, `useConversation`, `useConversationMessages`, etc.) responsible for fetching, caching, and updating conversation data
- **Typing_Indicator**: The real-time typing status feature using `useTypingIndicator` hook
- **Presence_System**: The online/offline presence tracking using `usePresence` hook
- **Render_Profiler**: React DevTools Profiler or custom instrumentation used to detect excessive re-renders
- **Manual_Checklist**: A structured QA document for human testers to verify visual/UX behavior against the live backend
- **Automated_Tests**: Vitest unit tests and Playwright E2E tests using mocked APIs and simulated socket events

## Requirements

### Requirement 1: Runtime Error Detection

**User Story:** As a QA engineer, I want to identify and document all runtime errors on the Conversation Page, so that developers can fix them before release.

#### Acceptance Criteria

1. WHEN the Conversation_Page renders with a selected conversation, THE Audit_System SHALL verify that no React error boundaries are triggered and no uncaught exceptions appear in the browser console.
2. WHEN the Bubble_Context_Menu opens on a message bubble, THE Audit_System SHALL verify that no "Cannot access refs during render" error is produced by the `@floating-ui/react` integration.
3. IF a runtime error is detected during any audit scenario, THEN THE Audit_System SHALL document the error with its stack trace, affected component, reproduction steps, and a proposed fix.
4. THE Audit_System SHALL include a Vitest unit test for Bubble_Context_Menu that renders the component and asserts no console errors are emitted when the menu opens and closes.
5. WHEN the Conversation_Detail component mounts with a valid conversation ID, THE Audit_System SHALL verify that all 8+ hooks initialize without throwing exceptions.

### Requirement 2: Excessive Re-render Detection

**User Story:** As a developer, I want to identify components that re-render excessively, so that I can optimize performance.

#### Acceptance Criteria

1. THE Audit_System SHALL include a manual checklist item to profile the Conversation_Detail component using React DevTools Profiler and document any component that re-renders more than 3 times per single user action.
2. WHEN a new message arrives via Socket_Layer, THE Audit_System SHALL verify that only the Messages_Panel and affected MessageBubble components re-render, not the entire Conversation_Detail tree.
3. WHEN the typing indicator state changes, THE Audit_System SHALL verify that the Messages_Panel re-renders without causing re-renders in ParticipantsPanel, InvitesPanel, or JoinRequestsPanel.
4. THE Audit_System SHALL include a Vitest test that uses a render counter to verify Conversation_Page does not re-render more than twice during initial mount with mocked conversation data.
5. WHEN the user switches between tabs (messages, participants, invites, joinRequests), THE Audit_System SHALL verify that previously loaded tab content does not re-fetch data unnecessarily.

### Requirement 3: Data Fetching Correctness

**User Story:** As a QA engineer, I want to verify that all API calls return expected data and are handled correctly, so that users see accurate conversation information.

#### Acceptance Criteria

1. WHEN the Conversation_Page mounts, THE Audit_System SHALL verify that `getConversations` is called exactly once with default filters (`status: "all"`, `search: ""`, `limit: 50`).
2. WHEN a conversation is selected, THE Audit_System SHALL verify that `useConversation`, `useConversationMessages`, and related Data_Hooks fetch data for the correct conversation ID.
3. IF the API returns an error response, THEN THE Audit_System SHALL verify that the error state is displayed to the user via a toast message and no stale data is shown.
4. WHEN the conversation list enrichment runs, THE Audit_System SHALL verify that `getMessages` is called with `limit: 1` for each conversation lacking a `lastMessage` and that results are merged without overwriting newer real-time data.
5. THE Audit_System SHALL include a Playwright E2E test that intercepts the conversations API endpoint, returns mocked data, and asserts the sidebar renders the correct number of conversation items with expected titles.
6. WHEN filters (search, status, type) change, THE Audit_System SHALL verify that a new API call is triggered with the updated filter parameters and the conversation list updates accordingly.

### Requirement 4: Real-Time Message Events

**User Story:** As a QA engineer, I want to verify that real-time message events (create, update, delete) are processed correctly, so that users see live updates without page refresh.

#### Acceptance Criteria

1. WHEN a `messageCreated` socket event is received for the active conversation, THE Audit_System SHALL verify that the new message appears in the Messages_Panel within 500ms without a full data refetch.
2. WHEN a `messageCreated` socket event is received from another user, THE Audit_System SHALL verify that the unread count increments by 1 in the conversation sidebar item.
3. WHEN a `messageCreated` socket event is received from the current user, THE Audit_System SHALL verify that the unread count does not increment.
4. WHEN a `messageUpdated` socket event is received, THE Audit_System SHALL verify that the corresponding message bubble updates its body text in place without re-ordering the message list.
5. WHEN a `messageDeleted` socket event is received, THE Audit_System SHALL verify that the message is marked as deleted (body cleared, status set to "deleted") in the Messages_Panel.
6. THE Audit_System SHALL include a Vitest test that simulates socket events via a mocked Socket.IO client and asserts the correct state transitions in `useConversationMessages`.

### Requirement 5: Real-Time Typing and Presence

**User Story:** As a QA engineer, I want to verify that typing indicators and presence status update correctly in real-time, so that users have accurate awareness of other participants.

#### Acceptance Criteria

1. WHEN a `typingStarted` socket event is received for the active conversation, THE Audit_System SHALL verify that the typing indicator displays the typing user's name within the Messages_Panel.
2. WHEN a `typingStopped` socket event is received, THE Audit_System SHALL verify that the typing indicator for that user is removed.
3. WHEN the current user types in the message composer, THE Audit_System SHALL verify that a typing event is emitted via Socket_Layer and that `stopOwnTyping` is called after the user stops typing.
4. WHEN a `presenceUserUpdated` socket event is received, THE Audit_System SHALL verify that the participant's online/offline status updates in the ParticipantsPanel.
5. THE Audit_System SHALL include a manual checklist item to verify that typing indicators disappear after a reasonable timeout (within 5 seconds) if no `typingStopped` event is received.

### Requirement 6: Message Composer and Send Flow

**User Story:** As a QA engineer, I want to verify that the message composer correctly sends messages, handles replies, edits, and attachments, so that users can communicate reliably.

#### Acceptance Criteria

1. WHEN the user submits a message via the MessageComposer, THE Audit_System SHALL verify that `messagesState.send` is called with the correct body text and that the message appears optimistically in the Messages_Panel.
2. WHEN the user replies to a message, THE Audit_System SHALL verify that the reply context (`replyToMessageId`) is included in the send payload and the reply preview is displayed in the composer.
3. WHEN the user edits a message, THE Audit_System SHALL verify that the composer pre-fills with the existing message body and that `messagesState.edit` is called with the correct message ID and updated body.
4. WHEN the user sends a message with attachments, THE Audit_System SHALL verify that the message is created first, then `attachmentsState.attachFile` is called for each file sequentially.
5. IF the conversation is read-only or the user is muted/blocked/removed, THEN THE Audit_System SHALL verify that the ReadOnlyComposer is displayed instead of the MessageComposer.
6. THE Audit_System SHALL include a Vitest test that renders the MessageComposer, simulates form submission, and asserts the `onSend` callback is invoked with the expected arguments.

### Requirement 7: Conversation Sidebar Functionality

**User Story:** As a QA engineer, I want to verify that the conversation sidebar correctly displays, filters, and selects conversations, so that users can navigate their conversations efficiently.

#### Acceptance Criteria

1. THE Audit_System SHALL verify that conversations are sorted with pinned conversations first, then by most recent activity (lastMessage date or updatedAt).
2. WHEN the user applies the "mine" filter, THE Audit_System SHALL verify that only conversations where `createdById` matches the current user ID are displayed.
3. WHEN the user applies the "unread" filter, THE Audit_System SHALL verify that only conversations with `unreadCount > 0` are displayed.
4. WHEN the user selects a conversation, THE Audit_System SHALL verify that `markAsRead` is called for that conversation and the unread count resets to 0 in the sidebar.
5. WHEN the user navigates back from a conversation on mobile, THE Audit_System SHALL verify that the conversation list refreshes and the `userClosedRef` prevents auto-selection of the first conversation.
6. THE Audit_System SHALL include a Playwright E2E test that verifies the search input filters conversations by title in real-time as the user types.

### Requirement 8: Participants Panel Verification

**User Story:** As a QA engineer, I want to verify that the participants panel correctly displays members and supports management actions, so that conversation administrators can manage membership.

#### Acceptance Criteria

1. WHEN the user switches to the participants tab, THE Audit_System SHALL verify that `useConversationParticipants` fetches participant data and renders the list with correct display names and roles.
2. WHEN the user has management permissions, THE Audit_System SHALL verify that add, promote, demote, and remove participant actions are available and functional.
3. WHEN the user does not have management permissions, THE Audit_System SHALL verify that management actions are hidden and only the leave conversation option is available.
4. THE Audit_System SHALL verify that participant presence status (online/offline) from the Presence_System is correctly reflected next to each participant's name.
5. THE Audit_System SHALL include a manual checklist item to verify that the AddParticipantDialog, EditParticipantRoleDialog, RemoveParticipantDialog, and LeaveConversationDialog open and close without errors.

### Requirement 9: Invites and Join Requests Panels

**User Story:** As a QA engineer, I want to verify that the invites and join requests panels function correctly, so that conversation access management works as expected.

#### Acceptance Criteria

1. WHEN the user switches to the invites tab, THE Audit_System SHALL verify that `useConversationInvites` fetches invite data and renders pending, accepted, and rejected invites with correct user display names.
2. WHEN the user accepts an invite, THE Audit_System SHALL verify that the invite status updates and a success toast is displayed.
3. WHEN the user rejects an invite, THE Audit_System SHALL verify that the RejectInviteDialog opens, and upon confirmation the invite is rejected with a success toast.
4. WHEN the user switches to the join requests tab, THE Audit_System SHALL verify that `useConversationJoinRequests` fetches request data and renders the list correctly.
5. WHEN a reviewer approves or rejects a join request, THE Audit_System SHALL verify that the ReviewJoinRequestDialog processes the action and displays appropriate feedback.
6. THE Audit_System SHALL include a Vitest test that mocks the invites API and verifies the accept/reject flows update component state correctly.

### Requirement 10: Reactions and Attachments

**User Story:** As a QA engineer, I want to verify that message reactions and file attachments work correctly, so that users can interact with messages beyond text.

#### Acceptance Criteria

1. WHEN the user adds a reaction via the Bubble_Context_Menu, THE Audit_System SHALL verify that `reactionsState.addReaction` is called with the correct message ID and reaction type, and the reaction count updates in the message bubble.
2. WHEN the user removes a reaction, THE Audit_System SHALL verify that `reactionsState.removeMyReaction` is called and the reaction is removed from the message bubble display.
3. WHEN the policy disables reactions (`allowReactions: false`), THE Audit_System SHALL verify that the reaction option is hidden from the Bubble_Context_Menu.
4. WHEN a file attachment is uploaded, THE Audit_System SHALL verify that the attachment appears in the message's attachment list and the upload progress indicator is shown during upload.
5. WHEN an attachment is deleted, THE Audit_System SHALL verify that `attachmentsState.removeAttachment` is called and the attachment is removed from the display.
6. THE Audit_System SHALL include a manual checklist item to verify that attachment file size limits (from `policy.maxAttachmentSizeMb`) are enforced and appropriate error messages are shown for oversized files.

### Requirement 11: Socket Connection Lifecycle

**User Story:** As a QA engineer, I want to verify that the Socket.IO connection lifecycle is handled correctly, so that real-time features recover gracefully from disconnections.

#### Acceptance Criteria

1. WHEN the socket connects, THE Audit_System SHALL verify that `joinConversation` is called for all conversations in the list to subscribe to their rooms.
2. WHEN the socket disconnects and reconnects (resyncVersion increments), THE Audit_System SHALL verify that `refreshAll` is called to resynchronize all data from the server.
3. WHEN the Conversation_Detail component unmounts, THE Audit_System SHALL verify that `leaveConversation` is called for the active conversation and all socket event listeners are cleaned up.
4. THE Audit_System SHALL include a manual checklist item to verify real-time functionality by disconnecting the network for 10 seconds, reconnecting, and confirming that messages sent during disconnection appear after reconnection.
5. THE Audit_System SHALL include a Vitest test that simulates socket disconnect/reconnect and asserts that the `onReconnect` handler triggers a full data refresh.

### Requirement 12: Known Issue Documentation and Fix Proposals

**User Story:** As a developer, I want discovered issues documented with proposed fixes, so that I can resolve them efficiently.

#### Acceptance Criteria

1. THE Audit_System SHALL document the existing "Cannot access refs during render" error in Bubble_Context_Menu with a proposed fix using `useRef` + `useEffect` pattern or upgrading to `@floating-ui/react` v0.27+ `useFloating` with `elements` option.
2. THE Audit_System SHALL flag any state management concern in Conversation_Detail (15+ state variables, 8+ hooks) with a proposed refactoring strategy (e.g., `useReducer` or context extraction).
3. IF the audit discovers additional runtime errors, console warnings, or performance issues, THEN THE Audit_System SHALL document each issue with severity (critical/major/minor), affected component, reproduction steps, and a proposed fix.
4. THE Audit_System SHALL categorize all discovered issues into: runtime errors, performance issues, UX inconsistencies, and accessibility gaps.

### Requirement 13: Manual QA Checklist Structure

**User Story:** As a QA engineer, I want a structured manual checklist, so that I can systematically verify all visual and UX aspects of the Conversation Page against the live backend.

#### Acceptance Criteria

1. THE Manual_Checklist SHALL organize test cases by feature area: sidebar navigation, message display, message composition, real-time updates, participant management, invites, join requests, and error states.
2. THE Manual_Checklist SHALL include preconditions, steps, and expected results for each test case.
3. THE Manual_Checklist SHALL include test cases for both Arabic (RTL) and English (LTR) locale rendering to verify bidirectional layout correctness.
4. THE Manual_Checklist SHALL include mobile-responsive test cases verifying the sidebar/detail toggle behavior (`showMobileThread` state) on viewports below 768px.
5. THE Manual_Checklist SHALL include test cases for conversation lifecycle actions: create, edit, close, reopen, and archive with confirmation dialogs.

### Requirement 14: Automated Test Infrastructure

**User Story:** As a developer, I want automated tests with proper mocking infrastructure, so that the audit tests are reliable and repeatable in CI.

#### Acceptance Criteria

1. THE Automated_Tests SHALL use Vitest with `@testing-library/react` for unit/integration tests of individual hooks and components.
2. THE Automated_Tests SHALL mock the Socket.IO client using a test utility that simulates `emit`, `on`, `off`, and connection lifecycle events.
3. THE Automated_Tests SHALL mock API service functions (`getConversations`, `getMessages`, etc.) using Vitest's `vi.mock` to return predictable test data.
4. THE Automated_Tests SHALL use Playwright with route interception (`page.route`) to mock API responses for E2E tests without requiring a live backend.
5. WHEN any automated test fails, THE Automated_Tests SHALL produce a clear failure message indicating which audit criterion was violated and the actual vs. expected behavior.
