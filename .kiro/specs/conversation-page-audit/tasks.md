# Implementation Plan: Conversation Page Audit

## Overview

This plan implements a comprehensive audit system for the Conversation Page, producing automated test suites (Vitest unit/integration + Playwright E2E), a manual QA checklist, and an issue documentation report. The implementation builds test infrastructure first, then layers hook tests, component tests, E2E tests, and finally the documentation deliverables.

## Tasks

- [x] 1. Set up test infrastructure and mock utilities
  - [x] 1.1 Create mock Socket.IO utility (`src/features/communication/__tests__/utils/mock-socket.ts`)
    - Implement `createMockSocket()` with `on`, `off`, `emit`, `simulateEvent`, `simulateDisconnect`, `simulateReconnect`
    - Track registered listeners per event in a Map
    - Support `connected` state toggling
    - _Requirements: 14.2_

  - [x] 1.2 Create mock API service (`src/features/communication/__tests__/utils/mock-api.ts`)
    - Mock all communication service functions: `getConversations`, `getMessages`, `sendMessage`, `updateMessage`, `deleteMessage`, `markConversationRead`, etc.
    - Use `vi.fn()` with default resolved values matching the API response shapes
    - _Requirements: 14.3_

  - [x] 1.3 Create test data generators (`src/features/communication/__tests__/utils/test-data-generators.ts`)
    - Implement `createConversation()`, `createMessage()`, `createParticipant()`, `createInvite()`, `createJoinRequest()` factory functions
    - Support overrides via partial parameters
    - Generate realistic IDs, timestamps, and content
    - _Requirements: 14.1_

  - [x] 1.4 Create render helpers (`src/features/communication/__tests__/utils/render-helpers.ts`)
    - Implement `renderWithProviders()` wrapping components with necessary context (auth, locale, socket)
    - Mock `useAuth` to return a configurable test user
    - Mock `useLocale` to return configurable locale ('en' or 'ar')
    - Mock `useCommunicationSocket` to return the mock socket
    - _Requirements: 14.1_

- [x] 2. Checkpoint - Verify test infrastructure compiles
  - Ensure all test utility files compile without TypeScript errors, ask the user if questions arise.

- [x] 3. Implement hook tests
  - [x] 3.1 Write tests for `useConversationMessages` (`src/features/communication/__tests__/hooks/useConversationMessages.test.ts`)
    - Test initial fetch with correct conversation ID (Property 4)
    - Test `upsertFromRealtime` adds message without refetch (Property 8)
    - Test `patchFromRealtime` updates message body in place without reordering (Property 10)
    - Test `deleteFromRealtime` marks message as deleted (Property 11)
    - Test `send` produces optimistic message in list (Property 15)
    - _Requirements: 3.2, 4.1, 4.4, 4.5, 6.1_

  - [x] 3.2 Write property test: Real-Time Message Upsert Without Refetch
    - **Property 8: Real-Time Message Upsert Without Refetch**
    - For any valid messageCreated payload, verify message appears in state via local upsert without API call
    - **Validates: Requirements 4.1**

  - [x] 3.3 Write property test: Message Update Preserves Order
    - **Property 10: Message Update Preserves Order**
    - For any messageUpdated payload, verify body updates in place and sort order is unchanged
    - **Validates: Requirements 4.4**

  - [x] 3.4 Write tests for `useConversations` (`src/features/communication/__tests__/hooks/useConversations.test.ts`)
    - Test initial fetch calls `getConversations` with default filters (Property 7)
    - Test socket `messageCreated` from other user increments unread count (Property 9)
    - Test socket `messageCreated` from current user does NOT increment unread count (Property 9)
    - Test `markAsRead` sets unread count to 0 (Property 20)
    - Test enrichment does not overwrite newer real-time lastMessage (Property 6)
    - Test filter changes trigger new API call with updated params (Property 7)
    - _Requirements: 3.1, 3.4, 3.6, 4.2, 4.3, 7.4_

  - [x] 3.5 Write property test: Unread Count Correctness
    - **Property 9: Unread Count Correctness on Message Events**
    - For any messageCreated event, if sender ≠ current user → unread increments; if sender = current user → unchanged
    - **Validates: Requirements 4.2, 4.3**

  - [x] 3.6 Write property test: Conversation Sort Order
    - **Property 18: Conversation Sort Order**
    - For any list of conversations, pinned items appear first, then sorted by most recent activity descending
    - **Validates: Requirements 7.1**

  - [x] 3.7 Write tests for `useConversationRealtime` (`src/features/communication/__tests__/hooks/useConversationRealtime.test.ts`)
    - Test `joinConversation` called on mount when connected
    - Test `leaveConversation` called on unmount (Property 26)
    - Test socket events only dispatched for matching conversation ID
    - Test `onReconnect` called when `resyncVersion` increments (Property 26)
    - Simulate disconnect/reconnect and verify full data refresh triggered
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [x] 3.8 Write property test: Socket Lifecycle Management
    - **Property 26: Socket Lifecycle Management**
    - For any conversation ID, verify join on connect, refreshAll on resync, leave + cleanup on unmount
    - **Validates: Requirements 11.1, 11.2, 11.3**

  - [x] 3.9 Write tests for `useTypingIndicator` (`src/features/communication/__tests__/hooks/useTypingIndicator.test.ts`)
    - Test `handleTypingStarted` adds user to typing list (Property 12)
    - Test `handleTypingStopped` removes user from typing list (Property 12)
    - Test `emitTyping` emits socket event
    - Test `stopOwnTyping` emits stop event
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.10 Write property test: Typing Indicator Round-Trip
    - **Property 12: Typing Indicator Round-Trip**
    - For any typingStarted followed by typingStopped for same user, user appears then disappears from typing list
    - **Validates: Requirements 5.1, 5.2**

- [x] 4. Checkpoint - Verify hook tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement component tests
  - [x] 5.1 Write tests for `BubbleContextMenu` (`src/features/communication/__tests__/components/BubbleContextMenu.test.tsx`)
    - Test renders without console errors when menu opens and closes (Property 1)
    - Test reaction option hidden when `allowReactions: false` (Property 24)
    - Test edit/delete options visible only for own messages with permissions
    - Test report option visible only for other users' messages
    - Document the "Cannot access refs during render" error if reproduced
    - _Requirements: 1.2, 1.4, 10.3_

  - [x] 5.2 Write property test: Error-Free Rendering
    - **Property 1: Error-Free Rendering**
    - For any valid props combination, BubbleContextMenu renders without console errors or exceptions
    - **Validates: Requirements 1.1, 1.5**

  - [x] 5.3 Write tests for `ConversationDetail` (`src/features/communication/__tests__/components/ConversationDetail.test.tsx`)
    - Test all hooks initialize without throwing (Property 1)
    - Test tab switch does not re-fetch previously loaded data (Property 3)
    - Test ReadOnlyComposer shown when conversation is read-only or user is muted/blocked/removed (Property 17)
    - Test permission-based action visibility in participants panel (Property 21)
    - _Requirements: 1.5, 2.5, 6.5, 8.2, 8.3_

  - [x] 5.4 Write property test: Tab Switch Does Not Re-Fetch
    - **Property 3: Tab Switch Does Not Re-Fetch Loaded Data**
    - For any sequence of tab switches, returning to a loaded tab does not trigger new API fetch
    - **Validates: Requirements 2.5**

  - [x] 5.5 Write property test: ReadOnly Composer for Restricted Users
    - **Property 17: ReadOnly Composer for Restricted Users**
    - For any restricted user state (readOnly, muted, blocked, removed), ReadOnlyComposer is rendered
    - **Validates: Requirements 6.5**

  - [x] 5.6 Write tests for `ConversationPage` (`src/features/communication/__tests__/components/ConversationPage.test.tsx`)
    - Test does not re-render more than twice during initial mount (Property 2 partial)
    - Test filter correctness: "mine", "unread", "pinned" filters (Property 19)
    - Test mobile responsive toggle: selecting conversation shows detail, back shows sidebar (Property 28)
    - Test `userClosedRef` prevents auto-selection after back navigation
    - _Requirements: 2.4, 7.2, 7.3, 7.5, 13.4_

  - [x] 5.7 Write property test: Filter Correctness
    - **Property 19: Filter Correctness**
    - For any conversation list, "mine" returns only user's conversations, "unread" returns only unread, "pinned" returns only pinned
    - **Validates: Requirements 7.2, 7.3**

  - [x] 5.8 Write property test: Mobile Responsive Toggle
    - **Property 28: Mobile Responsive Toggle**
    - For viewport < 768px, selecting conversation shows detail/hides sidebar; back shows sidebar/hides detail
    - **Validates: Requirements 13.4**

  - [x] 5.9 Write tests for `MessagesPanel` (`src/features/communication/__tests__/components/MessagesPanel.test.tsx`)
    - Test render isolation: new message only re-renders MessagesPanel, not sibling panels (Property 2)
    - Test typing indicator displays typing user names
    - Test typing state change does not re-render ParticipantsPanel (Property 2)
    - _Requirements: 2.2, 2.3, 5.1_

  - [x] 5.10 Write property test: Render Isolation on Real-Time Events
    - **Property 2: Render Isolation on Real-Time Events**
    - For any socket event, only the directly affected panel re-renders; sibling panels do not
    - **Validates: Requirements 2.2, 2.3**

- [x] 6. Checkpoint - Verify component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Playwright E2E tests
  - [x] 7.1 Write E2E test: Conversation sidebar rendering (`e2e/conversation-page-audit.spec.ts`)
    - Intercept conversations API with mocked data
    - Assert sidebar renders correct number of conversation items with expected titles
    - Assert pinned conversations appear first
    - _Requirements: 3.5, 7.1_

  - [x] 7.2 Write E2E test: Search filtering
    - Intercept API with search parameter
    - Type in search input and assert filtered results appear
    - _Requirements: 7.6_

  - [x] 7.3 Write E2E test: Conversation selection and message display
    - Intercept messages API for selected conversation
    - Click a conversation and assert messages panel renders with mocked messages
    - Assert message bubbles display correct sender names and body text
    - _Requirements: 3.2, 4.1_

  - [x] 7.4 Write E2E test: Mobile responsive behavior
    - Set viewport to 375x667
    - Assert only sidebar is visible initially
    - Click a conversation and assert detail panel is visible, sidebar hidden
    - Click back and assert sidebar returns
    - _Requirements: 13.4_

  - [x] 7.5 Write E2E test: Error state handling
    - Intercept API with error response (500)
    - Assert error toast is displayed
    - _Requirements: 3.3_

- [x] 8. Checkpoint - Verify E2E tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create manual QA checklist
  - [x] 9.1 Write manual QA checklist document (`docs/conversation-page-audit-qa-checklist.md`)
    - Organize by feature area: Sidebar Navigation, Message Display, Message Composition, Real-Time Updates, Participant Management, Invites & Join Requests, Reactions & Attachments, Conversation Lifecycle, Error States, RTL/LTR Layout, Mobile Responsive
    - Each test case includes: preconditions, steps, expected results, locale (LTR/RTL/Both), viewport (Desktop/Mobile/Both)
    - Include RTL Arabic layout verification cases
    - Include mobile responsive cases for viewports below 768px
    - Include conversation lifecycle actions: create, edit, close, reopen, archive
    - Include typing indicator timeout verification (5s without typingStopped)
    - Include network disconnect/reconnect recovery test
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 5.5, 11.4_

- [x] 10. Create issue documentation report
  - [x] 10.1 Write issue documentation report (`docs/conversation-page-audit-issues.md`)
    - Document Issue 1: "Cannot access refs during render" in BubbleContextMenu with proposed fix (useRef + useEffect or @floating-ui/react upgrade)
    - Document Issue 2: ConversationDetail state complexity (15+ state variables, 8+ hooks) with proposed refactoring strategy (useReducer or context extraction)
    - Categorize all issues by: Runtime Errors, Performance Issues, UX Inconsistencies, Accessibility Gaps
    - Include severity (Critical/Major/Minor), affected component, reproduction steps, and proposed fix for each issue
    - Reference related requirements for each issue
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The tech stack is TypeScript with Vitest + @testing-library/react for unit tests and Playwright for E2E
- Mock socket utility simulates Socket.IO without a real server connection
- All E2E tests use Playwright route interception — no live backend required
- The `@fast-check/vitest` package may need to be installed for property-based tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["3.1", "3.4", "3.7", "3.9"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.5", "3.6", "3.8", "3.10"] },
    { "id": 3, "tasks": ["5.1", "5.3", "5.6", "5.9"] },
    { "id": 4, "tasks": ["5.2", "5.4", "5.5", "5.7", "5.8", "5.10"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 6, "tasks": ["9.1", "10.1"] }
  ]
}
```
