# Design Document: Conversation Page Audit

## Overview

This design defines the architecture for a comprehensive audit system covering the Conversation Page in the SIS Dashboard communication module. The audit produces three deliverables: a manual QA checklist, automated test suites (Vitest unit + Playwright E2E), and an issue documentation report with proposed fixes.

The audit system is structured as a layered verification approach:
1. **Static analysis layer** — Lint, type-check, and known-issue detection
2. **Unit test layer** — Vitest tests for hooks, utilities, and component logic with mocked dependencies
3. **Integration test layer** — Vitest tests for component interactions with simulated socket events
4. **E2E test layer** — Playwright tests with route interception for full-page flows
5. **Manual QA layer** — Structured checklist for visual/UX verification against live backend

## Architecture

### Component Hierarchy Under Audit

```
ConversationPage
├── ConversationSidebar
│   ├── SearchInput
│   ├── FilterTabs (all | mine | unread | pinned)
│   ├── TypeFilter
│   └── ConversationListItem[] (sorted: pinned first, then by date)
├── ConversationDetail (key={conversationId})
│   ├── ConversationHeader
│   ├── ConversationTabs (messages | participants | invites | joinRequests)
│   ├── MessagesPanel
│   │   ├── MessageBubble[]
│   │   │   └── BubbleContextMenu (@floating-ui/react)
│   │   └── TypingIndicator
│   ├── ParticipantsPanel
│   ├── InvitesPanel
│   ├── JoinRequestsPanel
│   ├── MessageComposer | ReadOnlyComposer
│   └── Dialogs (Add/Edit/Remove Participant, Leave, Invite, JoinRequest, etc.)
└── ToastMessage
```

### Hook Dependency Graph

```
ConversationPage
└── useConversations (list fetch, socket listeners, enrichment, CRUD)

ConversationDetail
├── useConversation (single conversation fetch)
├── useConversationMessages (messages fetch, send, edit, delete, realtime upsert)
├── useConversationParticipants (lazy-loaded on tab switch)
├── useConversationInvites (lazy-loaded on tab switch)
├── useConversationJoinRequests (lazy-loaded on tab switch)
├── useConversationRealtime (socket event routing)
├── usePresence (online/offline status)
├── useTypingIndicator (typing events emit/receive)
├── useMessageReactions (per-message reactions)
├── useMessageAttachments (per-message file attachments)
└── useCommunicationPolicy (feature flags: reactions, attachments, maxLength)
```

### Data Flow

```
API Layer (communication.service.ts)
    ↕ HTTP (fetch/axios)
Data Hooks (useConversations, useConversationMessages, etc.)
    ↕ React state (useState/useRef)
Components (ConversationPage, ConversationDetail, MessagesPanel)
    ↕ Props drilling + callbacks
UI (MessageBubble, BubbleContextMenu, Composer)

Socket Layer (useCommunicationSocket)
    ↕ Socket.IO events
useConversationRealtime (event router per conversation)
    ↕ Callback refs
Data Hooks (upsertFromRealtime, deleteFromRealtime, patchReadFromRealtime)
```

## Test Infrastructure Design

### Vitest Unit/Integration Tests

```typescript
// Test file structure
src/features/communication/__tests__/
├── hooks/
│   ├── useConversationMessages.test.ts
│   ├── useConversations.test.ts
│   ├── useConversationRealtime.test.ts
│   └── useTypingIndicator.test.ts
├── components/
│   ├── BubbleContextMenu.test.tsx
│   ├── ConversationDetail.test.tsx
│   ├── ConversationPage.test.tsx
│   └── MessagesPanel.test.tsx
└── utils/
    ├── mock-socket.ts          // Socket.IO mock utility
    ├── mock-api.ts             // API service mocks
    ├── test-data-generators.ts // Random data generators for PBT
    └── render-helpers.ts       // Custom render with providers
```

### Mock Socket Utility

```typescript
// mock-socket.ts
interface MockSocket {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  connected: boolean;
  simulateEvent: (event: string, payload: unknown) => void;
  simulateDisconnect: () => void;
  simulateReconnect: () => void;
}

function createMockSocket(): MockSocket {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    connected: true,
    on(event, handler) { /* register listener */ },
    off(event, handler) { /* remove listener */ },
    emit(event, ...args) { /* record emission */ },
    simulateEvent(event, payload) { /* trigger all listeners for event */ },
    simulateDisconnect() { /* set connected=false, trigger disconnect */ },
    simulateReconnect() { /* set connected=true, trigger connect */ },
  };
}
```

### Mock API Service

```typescript
// mock-api.ts
import { vi } from 'vitest';

export function createMockApiService() {
  return {
    getConversations: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getMessages: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    sendMessage: vi.fn().mockResolvedValue({ id: 'msg-1', body: '' }),
    updateMessage: vi.fn().mockResolvedValue({}),
    deleteMessage: vi.fn().mockResolvedValue({}),
    markConversationRead: vi.fn().mockResolvedValue({}),
    // ... other service functions
  };
}
```

### Test Data Generators (for Property-Based Tests)

```typescript
// test-data-generators.ts
import { fc } from '@fast-check/vitest';

export const conversationArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  type: fc.constantFrom('group', 'direct', 'classroom'),
  status: fc.constantFrom('active', 'closed', 'archived'),
  createdById: fc.uuid(),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString()),
  unreadCount: fc.nat({ max: 99 }),
  isPinned: fc.boolean(),
  pinnedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
  lastMessageAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
});

export const messageArb = fc.record({
  id: fc.uuid(),
  conversationId: fc.uuid(),
  senderId: fc.uuid(),
  body: fc.string({ minLength: 1, maxLength: 2000 }),
  type: fc.constant('text'),
  status: fc.constantFrom('sent', 'deleted'),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
});

export const socketMessagePayloadArb = fc.record({
  message: messageArb,
  conversationId: fc.uuid(),
});
```

### Playwright E2E Tests

```typescript
// e2e/conversation-page-audit.spec.ts
import { test, expect } from '@playwright/test';

// Route interception pattern for all E2E tests
test.beforeEach(async ({ page }) => {
  await page.route('**/api/communication/conversations*', (route) => {
    route.fulfill({ json: mockConversationsResponse });
  });
  await page.route('**/api/communication/conversations/*/messages*', (route) => {
    route.fulfill({ json: mockMessagesResponse });
  });
});
```

## Components and Interfaces

### ConversationPage Props

```typescript
interface ConversationPageProps {
  initialConversationId?: string | null;
}
```

### ConversationDetail Props

```typescript
interface ConversationDetailProps {
  conversationId: string;
  labels: ConversationRedesignLabels;
  onBack: () => void;
  onToast: (toast: ToastState) => void;
}
```

### Key State Derivations in ConversationDetail

```typescript
// Derived permission flags
const permissions = getConversationPermissionFlags({
  conversation, currentUserId, participants
});

// Derived send-ability
const canSendMessages = !readOnly && !isMuted && !isBlocked && !isRemovedOrLeft && isCommunicationEnabled;

// Lazy tab loading
const shouldLoadParticipants = loadedTabs.participants || loadedTabs.invites || loadedTabs.joinRequests;
```

## Data Models

### ConversationListItemModel

```typescript
interface ConversationListItemModel extends Conversation {
  lastMessage?: ConversationLastMessage | null;
  isPinned?: boolean;
  pinnedAt?: string | null;
}
```

### ConversationMessage (extended for local state)

```typescript
interface ConversationMessage extends Message {
  clientMessageId?: string;
  deliveryStatus?: 'pending' | 'sent' | 'failed';
  readByUserIds?: string[];
  readCount?: number;
}
```

### Socket Event Payloads

```typescript
// All socket payloads are typed as `unknown` and defensively parsed
// via extractConversationId() and messageFromPayload() utilities
type SocketEventHandler = (payload: unknown) => void;
```

## Error Handling

### Known Issue: BubbleContextMenu refs Error

**Error:** `Cannot access refs during render` from `@floating-ui/react`

**Root Cause:** In React 19 strict mode, `refs.setFloating` is accessed during render when passed directly as a ref prop. The `useFloating` hook returns callback refs that React 19 treats as ref access during render.

**Proposed Fix:**
```typescript
// Option A: Use useRef + useEffect to set floating element
const floatingRef = useRef<HTMLDivElement | null>(null);
const { refs, floatingStyles } = useFloating({ /* ... */ });

useEffect(() => {
  if (floatingRef.current) {
    refs.setFloating(floatingRef.current);
  }
}, [open, refs]);

// Option B: Upgrade @floating-ui/react and use `elements` option
const { floatingStyles } = useFloating({
  elements: { reference: referenceEl, floating: floatingEl },
  // ...
});
```

### Error Propagation Pattern

All API errors in ConversationDetail flow through `runMutation`:
```typescript
const runMutation = async <T>(
  operation: () => Promise<T>,
  successMessage: string,
  fallbackError: string,
) => {
  try {
    const result = await operation();
    onToast({ tone: 'success', message: successMessage });
    return result;
  } catch (error) {
    onToast({ tone: 'error', message: communicationErrorMessage(error, fallbackError) });
    throw error;
  }
};
```

### Socket Reconnection Recovery

When `resyncVersion` increments (socket reconnects), `refreshAll()` is called which re-fetches:
- Conversation metadata
- Messages list
- Participants (if tab loaded)
- Invites (if tab loaded)
- Join requests (if tab loaded)
- All reactions
- All attachments

## Testing Strategy

### Manual QA Checklist Structure

The checklist is organized by feature area with the following template per test case:

```markdown
### [Area] - [Test Case Title]
**Preconditions:** [Setup required]
**Steps:**
1. [Action]
2. [Action]
**Expected Result:** [Observable outcome]
**Locale:** LTR / RTL / Both
**Viewport:** Desktop / Mobile / Both
```

### Checklist Sections
1. Sidebar Navigation & Filtering
2. Message Display & Scrolling
3. Message Composition & Send
4. Real-Time Updates (Messages, Typing, Presence)
5. Participant Management
6. Invites & Join Requests
7. Reactions & Attachments
8. Conversation Lifecycle (Create, Edit, Close, Reopen, Archive)
9. Error States & Edge Cases
10. RTL/LTR Layout Verification
11. Mobile Responsive Behavior

## Issue Documentation Format

```markdown
### Issue [N]: [Title]
**Severity:** Critical | Major | Minor
**Category:** Runtime Error | Performance | UX Inconsistency | Accessibility
**Component:** [Component name]
**Reproduction Steps:**
1. [Step]
**Actual Behavior:** [What happens]
**Expected Behavior:** [What should happen]
**Proposed Fix:** [Code or approach]
**Related Requirements:** [Req X.Y]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Error-Free Rendering

For any valid conversation data (conversation object, messages list, participants list), rendering the ConversationDetail component with mocked hooks SHALL produce no console errors, no uncaught exceptions, and no React error boundary activations.

**Validates: Requirements 1.1, 1.5**

### Property 2: Render Isolation on Real-Time Events

For any incoming socket event (messageCreated, typingStarted, typingStopped, presenceUpdated), only the directly affected panel (MessagesPanel for message/typing events, ParticipantsPanel for presence events) SHALL re-render; sibling panels that are not consuming the changed state SHALL not re-render.

**Validates: Requirements 2.2, 2.3**

### Property 3: Tab Switch Does Not Re-Fetch Loaded Data

For any sequence of tab switches in ConversationDetail, switching back to a previously loaded tab SHALL not trigger a new API fetch for that tab's data (participants, invites, or join requests).

**Validates: Requirements 2.5**

### Property 4: Data Hook Fetches Correct Conversation ID

For any conversation ID passed to ConversationDetail, all data hooks (useConversation, useConversationMessages, useConversationParticipants, useConversationInvites, useConversationJoinRequests) SHALL issue API calls with that exact conversation ID as the resource identifier.

**Validates: Requirements 3.2**

### Property 5: API Error Produces Toast and No Stale Data

For any API call that returns an error response, the component SHALL display an error toast with a descriptive message and SHALL not render stale data from a previous successful response in the affected section.

**Validates: Requirements 3.3**

### Property 6: Enrichment Preserves Newer Real-Time Data

For any conversation whose `lastMessage` was updated via a real-time socket event, a subsequent enrichment fetch (getMessages with limit:1) SHALL not overwrite the existing lastMessage if the existing one has a newer `createdAt` timestamp.

**Validates: Requirements 3.4**

### Property 7: Filter Parameters Trigger Correct API Calls

For any combination of filter values (search string, status filter, type filter), changing a filter SHALL trigger a new API call with the updated parameters, and the resulting conversation list SHALL only contain items matching the active filters.

**Validates: Requirements 3.6**

### Property 8: Real-Time Message Upsert Without Refetch

For any valid messageCreated socket event payload targeting the active conversation, the new message SHALL appear in the messages list via local state upsert (upsertFromRealtime) without triggering a full messages refetch from the API.

**Validates: Requirements 4.1**

### Property 9: Unread Count Correctness on Message Events

For any messageCreated socket event, if the sender is NOT the current user, the unread count for that conversation in the sidebar SHALL increment by 1. If the sender IS the current user, the unread count SHALL remain unchanged.

**Validates: Requirements 4.2, 4.3**

### Property 10: Message Update Preserves Order

For any messageUpdated socket event, the corresponding message in the list SHALL have its body text updated in place, and the sort order of the messages array SHALL remain unchanged (sorted by createdAt ascending).

**Validates: Requirements 4.4**

### Property 11: Message Delete Marks as Deleted

For any messageDeleted socket event with a valid message ID, the corresponding message in the list SHALL have its body set to empty string and its status set to "deleted".

**Validates: Requirements 4.5**

### Property 12: Typing Indicator Round-Trip

For any typingStarted event followed by a typingStopped event for the same user, the typing indicator SHALL first display the user's name and then remove it. At no point SHALL a user appear in the typing list after their typingStopped event is processed.

**Validates: Requirements 5.1, 5.2**

### Property 13: Typing Emission on Composer Input

For any text input into the MessageComposer, the component SHALL emit a typing event via the socket layer. When the user stops typing (debounce timeout), stopOwnTyping SHALL be called.

**Validates: Requirements 5.3**

### Property 14: Presence Update Reflection

For any presenceUserUpdated socket event containing a user ID and online/offline status, the ParticipantsPanel SHALL reflect the updated status for that user.

**Validates: Requirements 5.4**

### Property 15: Composer Action Correctness

For any message submission (plain send, reply, or edit): (a) plain send SHALL call `messagesState.send` with the trimmed body and produce an optimistic message in the list; (b) reply SHALL include `replyToMessageId` in the send payload; (c) edit SHALL call `messagesState.edit` with the correct message ID and updated body.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 16: Attachment Send Order

For any message sent with N file attachments, the message SHALL be created first (via `messagesState.send`), and then `attachmentsState.attachFile` SHALL be called sequentially for each of the N files using the returned message ID.

**Validates: Requirements 6.4**

### Property 17: ReadOnly Composer for Restricted Users

For any conversation state where the conversation is read-only OR the current user's participant status is muted, blocked, or removed, the ReadOnlyComposer SHALL be rendered instead of the MessageComposer.

**Validates: Requirements 6.5**

### Property 18: Conversation Sort Order

For any list of conversations, the sorted output SHALL place all pinned conversations before unpinned ones, and within each group, conversations SHALL be ordered by most recent activity date (lastMessage.createdAt or updatedAt) in descending order.

**Validates: Requirements 7.1**

### Property 19: Filter Correctness

For any conversation list: (a) the "mine" filter SHALL return only conversations where `createdById` equals the current user ID; (b) the "unread" filter SHALL return only conversations where `unreadCount > 0`; (c) the "pinned" filter SHALL return only conversations where `isPinned` is true.

**Validates: Requirements 7.2, 7.3**

### Property 20: Mark As Read on Selection

For any conversation selection, `markAsRead` SHALL be called with that conversation's ID, and the conversation's `unreadCount` in the local state SHALL be set to 0.

**Validates: Requirements 7.4**

### Property 21: Permission-Based Action Visibility

For any user with management permissions (`canManageParticipants: true`), the ParticipantsPanel SHALL render add, promote, demote, and remove actions. For any user without management permissions, those actions SHALL be hidden and only the leave conversation option SHALL be available.

**Validates: Requirements 8.2, 8.3**

### Property 22: Participant Presence Display

For any participant in the ParticipantsPanel, their displayed online/offline status SHALL match the value from the Presence_System's `presenceByUserId` map for their user ID.

**Validates: Requirements 8.4**

### Property 23: Panel Action Flows

For any invite accept/reject action or join request approve/reject action, the corresponding API function SHALL be called, and upon success a toast with the appropriate message SHALL be displayed and the panel state SHALL update to reflect the new status.

**Validates: Requirements 9.2, 9.3, 9.5**

### Property 24: Reaction Toggle

For any message and reaction type: (a) adding a reaction SHALL call `reactionsState.addReaction` with the correct message ID and type; (b) removing a reaction SHALL call `reactionsState.removeMyReaction` with the correct message ID. The reaction display SHALL update accordingly after each operation.

**Validates: Requirements 10.1, 10.2**

### Property 25: Attachment Lifecycle

For any file attachment operation: (a) uploading SHALL call `attachmentsState.attachFile` and the attachment SHALL appear in the message's attachment list; (b) deleting SHALL call `attachmentsState.removeAttachment` and the attachment SHALL be removed from the display.

**Validates: Requirements 10.4, 10.5**

### Property 26: Socket Lifecycle Management

For any set of conversations: (a) when the socket connects, `joinConversation` SHALL be called for each conversation ID; (b) when `resyncVersion` increments, `refreshAll` SHALL be called; (c) when ConversationDetail unmounts, `leaveConversation` SHALL be called for the active conversation and all event listeners SHALL be removed.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 27: RTL/LTR Layout Direction

For any locale value ('ar' or 'en'), the Conversation Page layout direction SHALL match the locale's expected direction (RTL for Arabic, LTR for English), and the BubbleContextMenu placement SHALL use `start`/`end` logical properties correctly.

**Validates: Requirements 13.3**

### Property 28: Mobile Responsive Toggle

For any viewport width below 768px, selecting a conversation SHALL show the detail panel and hide the sidebar (`showMobileThread: true`), and pressing back SHALL show the sidebar and hide the detail panel (`showMobileThread: false`).

**Validates: Requirements 13.4**
