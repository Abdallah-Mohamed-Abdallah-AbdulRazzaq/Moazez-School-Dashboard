# Conversation State Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make conversation list previews, unread state, permissions, and error presentation consistent across initial loads, mutations, refreshes, and realtime updates.

**Architecture:** Keep the existing React hook architecture, but make each hook's public `error` load-only while action callers own mutation toasts. Normalize the list endpoint's `lastMessage`, reconcile it deterministically with realtime state, and report successful backend reads from the detail view to the sidebar.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library, existing communication hooks, existing UI `Button` component.

**Spec:** `docs/superpowers/specs/2026-09-12-conversation-state-consistency-design.md`

## Global Constraints

- Do not merge to `main`.
- Preserve unrelated and pre-existing working-tree changes.
- Do not change backend endpoints or add a server-state dependency.
- Use existing components from `src/components/ui` for UI controls.
- Review every production-code change with `clean-code-guard` before committing it.
- Review every test change with `test-guard` before committing it.
- Run only targeted tests unless the user explicitly approves the full test suite.
- Stage exact paths for each commit; never use `git add .` in the dirty working tree.

---

### Task 1: Normalize and reconcile conversation-list summaries

**Files:**
- Modify: `src/features/communication/hooks/useConversations.ts`
- Modify: `src/features/communication/__tests__/hooks/useConversations.test.ts`

**Interfaces:**
- Consumes: `Conversation.lastMessage`, `Conversation.lastMessageAt`, and realtime message payloads.
- Produces: `ConversationLastMessage` with `type?: string` and `sentAt?: string`; `newerLastMessage(apiMessage, localMessage, fallbackAt)` used by first-page refresh reconciliation.

- [ ] **Step 1: Add failing tests for fresh API replacement, realtime preservation, response mapping, and default filters**

Add focused tests that assert:

```ts
expect(result.current.conversations[0]?.lastMessage).toEqual(
  expect.objectContaining({
    id: "image-1",
    type: "image",
    sentAt: "2026-09-11T21:15:43.915Z",
    createdAt: "2026-09-11T21:15:43.915Z",
  }),
);
expect(mockGetMessages).not.toHaveBeenCalled();
expect(result.current.hasFilters).toBe(false);
```

Then seed an older local realtime message and return a newer API `lastMessage`; assert the newer API message replaces it. Retain the existing inverse test proving a newer realtime message survives an older or missing API summary.

- [ ] **Step 2: Run the hook test and verify the new assertions fail**

Run:

```powershell
npm run test:run -- src/features/communication/__tests__/hooks/useConversations.test.ts
```

Expected: failures show that `type`/`sentAt` are missing, an existing last message always wins, and the default `hasFilters` value is true.

- [ ] **Step 3: Extend the normalized last-message model**

Update the interface and both API/realtime mappers:

```ts
export interface ConversationLastMessage {
  id?: string;
  body?: string;
  type?: string;
  status?: string;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
  senderName?: string;
}
```

Map `type` and `sentAt` with `stringFromUnknown`. Keep `body`, `content`, and `text` as the text precedence order.

- [ ] **Step 4: Implement deterministic summary reconciliation**

Add focused helpers in `useConversations.ts`:

```ts
function lastMessageTimestamp(
  message: ConversationLastMessage | null | undefined,
  fallback?: string | null,
): number | null {
  const value =
    message?.createdAt ?? message?.sentAt ?? message?.updatedAt ?? fallback;
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function newerLastMessage(
  apiMessage: ConversationLastMessage | null | undefined,
  localMessage: ConversationLastMessage | null | undefined,
  apiFallback?: string | null,
  localFallback?: string | null,
): ConversationLastMessage | null {
  if (!apiMessage) return localMessage ?? null;
  if (!localMessage) return apiMessage;
  if (apiMessage.id && apiMessage.id === localMessage.id) {
    return {
      ...localMessage,
      ...apiMessage,
      body: apiMessage.body ?? localMessage.body,
      type: apiMessage.type ?? localMessage.type,
      status: apiMessage.status ?? localMessage.status,
      sentAt: apiMessage.sentAt ?? localMessage.sentAt,
      createdAt: apiMessage.createdAt ?? localMessage.createdAt,
      updatedAt: apiMessage.updatedAt ?? localMessage.updatedAt,
      senderName: apiMessage.senderName ?? localMessage.senderName,
    };
  }

  const apiTimestamp = lastMessageTimestamp(apiMessage, apiFallback);
  const localTimestamp = lastMessageTimestamp(localMessage, localFallback);
  if (apiTimestamp === null) return localMessage;
  if (localTimestamp === null) return apiMessage;
  return apiTimestamp >= localTimestamp ? apiMessage : localMessage;
}
```

Use the helper when merging first-page API rows with existing state. Pass each row's `lastMessageAt` fallback. Keep API `unreadCount` authoritative when it is a number.

- [ ] **Step 5: Correct the filter baseline**

Change the status predicate to:

```ts
filters.status !== "all"
```

- [ ] **Step 6: Run the targeted hook test**

Run the Task 1 command again. Expected: all `useConversations` tests pass.

- [ ] **Step 7: Apply the code and test quality gates**

Review the production diff using `clean-code-guard` and the test diff using `test-guard`. Confirm the reconciliation helper has deterministic null/invalid-date behavior and the tests assert public hook state rather than helper internals.

- [ ] **Step 8: Commit Task 1**

```powershell
git add -- src/features/communication/hooks/useConversations.ts src/features/communication/__tests__/hooks/useConversations.test.ts
git commit -m "fix(communication): reconcile conversation summaries"
```

---

### Task 2: Render media-aware sidebar previews

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/sidebar.tsx`
- Modify: `src/features/communication/conversations_redesign/labels.ts`
- Create: `src/features/communication/__tests__/components/ConversationSidebar.test.tsx`

**Interfaces:**
- Consumes: Task 1's `ConversationLastMessage.type` and existing `ConversationRedesignLabels`.
- Produces: localized `lastMessageImage`, `lastMessageVideo`, `lastMessageVoice`, and `lastMessageAttachment` labels.

- [ ] **Step 1: Write failing rendering tests for non-text summaries**

Render `ConversationSidebar` with a minimal conversation whose last message matches the supplied backend payload:

```ts
lastMessage: {
  id: "image-1",
  type: "image",
  body: undefined,
  status: "sent",
  createdAt: "2026-09-11T21:15:43.915Z",
},
```

Assert English renders `Image`, Arabic renders `صورة`, and neither render contains the localized “No messages yet” text. Add table-driven cases for `video`, `voice`, `audio`, `file`, an unknown non-text type, text with a body, and deleted status.

- [ ] **Step 2: Run the new component test and verify failure**

```powershell
npm run test:run -- src/features/communication/__tests__/components/ConversationSidebar.test.tsx
```

Expected: media rows render the no-messages label before implementation.

- [ ] **Step 3: Add localized labels**

Extend both locale objects in `labels.ts` with:

```ts
lastMessageImage: "Image",
lastMessageVideo: "Video",
lastMessageVoice: "Voice note",
lastMessageAttachment: "Attachment",
```

and the Arabic values:

```ts
lastMessageImage: "صورة",
lastMessageVideo: "فيديو",
lastMessageVoice: "رسالة صوتية",
lastMessageAttachment: "مرفق",
```

- [ ] **Step 4: Implement semantic preview selection**

Keep deleted status first and text body second. When there is no body, switch on the normalized message type:

```ts
const type = conversation.lastMessage.type?.toLowerCase();
if (type === "image") return labels.lastMessageImage;
if (type === "video") return labels.lastMessageVideo;
if (type === "voice" || type === "audio") return labels.lastMessageVoice;
if (type) return labels.lastMessageAttachment;
return labels.noMessagesYet;
```

Prefix the semantic label with `senderName` using the same formatting used for text when a sender name exists.

- [ ] **Step 5: Run the sidebar and label tests**

```powershell
npm run test:run -- src/features/communication/__tests__/components/ConversationSidebar.test.tsx src/features/communication/__tests__/labels.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Apply `clean-code-guard` and `test-guard`, then commit**

Confirm the preview function has one fallback path and tests use one representative row per behavior.

```powershell
git add -- src/features/communication/conversations_redesign/components/sidebar.tsx src/features/communication/conversations_redesign/labels.ts src/features/communication/__tests__/components/ConversationSidebar.test.tsx
git commit -m "fix(communication): show media conversation previews"
```

---

### Task 3: Separate conversation-list loading errors from action failures

**Files:**
- Modify: `src/features/communication/hooks/useConversations.ts`
- Modify: `src/features/communication/__tests__/hooks/useConversations.test.ts`
- Modify: `src/features/communication/__tests__/components/ConversationPage.test.tsx`

**Interfaces:**
- Consumes: existing `useConversations().error` public field.
- Produces: the same public field with load-only semantics; action promises still reject with their original errors.

- [ ] **Step 1: Add failing regression tests**

Cover both boundaries:

```ts
mockGetConversations.mockRejectedValueOnce(new Error("List failed"));
expect(result.current.error).toBe("List failed");
```

and:

```ts
mockCreateConversation.mockRejectedValueOnce(new Error("Create failed"));
await expect(result.current.create(values)).rejects.toThrow("Create failed");
expect(result.current.error).toBeNull();
expect(result.current.conversations).toEqual(existingConversations);
```

In `ConversationPage.test.tsx`, assert a failed create produces one alert/toast and does not pass a mutation error to the sidebar.

- [ ] **Step 2: Run the two targeted tests and verify failure**

```powershell
npm run test:run -- src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/components/ConversationPage.test.tsx
```

Expected: the mutation test observes a populated hook error or duplicate error presentation.

- [ ] **Step 3: Make the internal state explicitly load-only**

Rename the internal state while preserving the public API:

```ts
const [loadError, setLoadError] = useState<string | null>(null);
```

Only `refresh` may call `setLoadError`. Remove error-state writes from `mutate`; leave `throw nextError` intact so page/detail action handlers remain responsible for one localized toast. Return `error: loadError` and rename `clearError` internally to clear that state without changing its public name.

- [ ] **Step 4: Run the targeted tests**

Run the Task 3 command again. Expected: all tests pass, including existing request-deduplication and debounce coverage.

- [ ] **Step 5: Apply quality gates and commit**

Use `clean-code-guard` to confirm no mutation catch writes to load state. Use `test-guard` to confirm the test distinguishes a list failure from an action failure.

```powershell
git add -- src/features/communication/hooks/useConversations.ts src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/components/ConversationPage.test.tsx
git commit -m "fix(communication): isolate conversation action errors"
```

---

### Task 4: Scope secondary-tab loading errors and align join-request activation

**Files:**
- Modify: `src/features/communication/hooks/useConversationParticipants.ts`
- Modify: `src/features/communication/hooks/useConversationInvites.ts`
- Modify: `src/features/communication/hooks/useConversationJoinRequests.ts`
- Modify: `src/features/communication/conversations_redesign/components/PanelLayout.tsx`
- Modify: `src/features/communication/conversations_redesign/components/ParticipantsPanel.tsx`
- Modify: `src/features/communication/conversations_redesign/components/InvitesPanel.tsx`
- Modify: `src/features/communication/conversations_redesign/components/JoinRequestsPanel.tsx`
- Modify: `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`
- Modify: `src/features/communication/__tests__/hooks/useConversationParticipants.test.ts`
- Create: `src/features/communication/__tests__/hooks/useConversationInvites.test.ts`
- Create: `src/features/communication/__tests__/hooks/useConversationJoinRequests.test.ts`
- Modify: `src/features/communication/__tests__/components/ParticipantsPanel.test.tsx`
- Modify: `src/features/communication/__tests__/components/InvitesPanel.test.tsx`
- Modify: `src/features/communication/__tests__/components/JoinRequestsPanel.test.tsx`
- Modify: `src/features/communication/__tests__/components/ConversationDetail.test.tsx`

**Interfaces:**
- Produces: load-only `error` fields from the three collection hooks.
- Produces: `PanelErrorState({ error, labels, onRetry })` using `Button` from `src/components/ui/button/Button.tsx`.
- Adds: `onRetry: () => void` to `ParticipantsPanel`, `InvitesPanel`, and `JoinRequestsPanel`.

- [ ] **Step 1: Add failing hook tests for load/action separation**

For each of the participants, invitation, and join-request hooks, assert a rejected initial fetch populates `error`. Then load one record, reject one representative mutation, and assert the promise rejects, the loaded array remains visible, and `error` remains null.

- [ ] **Step 2: Add failing panel tests for scoped retry**

For each panel, render `error="Load failed"`, `isLoading={false}`, and an `onRetry` spy. Assert the alert text is visible, clicking the localized Retry button invokes the spy once, and the collection rows/empty state are not rendered simultaneously.

- [ ] **Step 3: Add failing detail tests for activation and one-toast behavior**

Capture the options passed to `useConversationJoinRequestsMock` and verify:

```ts
expect(useConversationJoinRequestsMock).toHaveBeenLastCalledWith(
  TEST_CONVERSATION_ID,
  expect.objectContaining({ enabled: true }),
);
```

for a user with create permission but without review permission after opening the join-request tab. Also assert hook load errors are passed into their matching panels and that a rejected participant/invite/join mutation calls `onToast` exactly once.

- [ ] **Step 4: Run the targeted hook, panel, and detail tests and verify failure**

```powershell
npm run test:run -- src/features/communication/__tests__/hooks/useConversationParticipants.test.ts src/features/communication/__tests__/hooks/useConversationInvites.test.ts src/features/communication/__tests__/hooks/useConversationJoinRequests.test.ts src/features/communication/__tests__/components/ParticipantsPanel.test.tsx src/features/communication/__tests__/components/InvitesPanel.test.tsx src/features/communication/__tests__/components/JoinRequestsPanel.test.tsx src/features/communication/__tests__/components/ConversationDetail.test.tsx
```

- [ ] **Step 5: Make the three hook error states load-only**

Rename internal error state to `loadError`. Only each hook's `refresh` may set or clear it. Mutation wrappers must reject the original action error without setting `loadError`; a post-success refresh may still expose a genuine refresh failure. Preserve the public return shape as `error: loadError`.

- [ ] **Step 6: Add a shared scoped panel error state**

Implement in `PanelLayout.tsx` using the required UI component:

```tsx
export function PanelErrorState({
  error,
  labels,
  onRetry,
}: {
  error: string;
  labels: ConversationRedesignLabels;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
      <p className="text-sm font-medium text-rose-800">{error}</p>
      <Button type="button" variant="danger" size="sm" className="mt-3" onClick={onRetry}>
        {labels.retry}
      </Button>
    </div>
  );
}
```

Import `Button` from `@/components/ui/button/Button` and the label type from the redesign labels module.

- [ ] **Step 7: Wire scoped errors and retry actions**

Replace each error-only `PanelState` with `PanelErrorState`. Pass `participantsState.error`, `invitesState.error`, and `joinRequestsState.error` from `ConversationDetail`, together with their `refresh` callbacks. Remove the three detail-level toast effects for these load errors so loading failures have one scoped presentation.

- [ ] **Step 8: Align join-request hook activation with tab visibility**

Use the same effective authorization condition for hook activation and tab visibility:

```ts
const canLoadJoinRequests =
  (permissions.canReviewJoinRequests &&
    hasPermission("communication.participants.manage")) ||
  (permissions.canCreateJoinRequest &&
    hasPermission("communication.conversations.view"));
```

Enable the hook with `loadedTabs.joinRequests && canLoadJoinRequests`. Keep review buttons controlled by `canReviewJoinRequests` and creation controlled by `canCreateJoinRequest`.

- [ ] **Step 9: Run the targeted Task 4 tests**

Run the Task 4 command again. Expected: all tests pass with one error presentation and one retry callback per panel.

- [ ] **Step 10: Apply quality gates and commit**

Use `clean-code-guard` on all changed production files and `test-guard` on all changed test files. Confirm no permission expansion occurs for approve/reject mutations.

```powershell
git add -- src/features/communication/hooks/useConversationParticipants.ts src/features/communication/hooks/useConversationInvites.ts src/features/communication/hooks/useConversationJoinRequests.ts src/features/communication/conversations_redesign/components/PanelLayout.tsx src/features/communication/conversations_redesign/components/ParticipantsPanel.tsx src/features/communication/conversations_redesign/components/InvitesPanel.tsx src/features/communication/conversations_redesign/components/JoinRequestsPanel.tsx src/features/communication/conversations_redesign/components/ConversationDetail.tsx src/features/communication/__tests__/hooks/useConversationParticipants.test.ts src/features/communication/__tests__/hooks/useConversationInvites.test.ts src/features/communication/__tests__/hooks/useConversationJoinRequests.test.ts src/features/communication/__tests__/components/ParticipantsPanel.test.tsx src/features/communication/__tests__/components/InvitesPanel.test.tsx src/features/communication/__tests__/components/JoinRequestsPanel.test.tsx src/features/communication/__tests__/components/ConversationDetail.test.tsx
git commit -m "fix(communication): scope conversation tab errors"
```

---

### Task 5: Synchronize unread state after backend confirmation

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`
- Modify: `src/features/communication/conversations_redesign/pages/ConversationPage.tsx`
- Modify: `src/features/communication/__tests__/components/ConversationDetail.test.tsx`
- Modify: `src/features/communication/__tests__/components/ConversationPage.test.tsx`

**Interfaces:**
- Adds: optional `onConversationRead?: (conversationId: string) => void` to `ConversationDetailProps`.
- Consumes: existing `useConversations().markAsRead(conversationId)`.

- [ ] **Step 1: Add failing detail tests for confirmed reads**

Extend the detail test renderer to accept `onConversationRead`. With an incoming message, visible document, and focused window, resolve `markConversationRead` and assert:

```ts
await waitFor(() => {
  expect(onConversationRead).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
});
```

Reject the backend call in a second test and assert the callback is not called. Trigger focus again and assert the backend function is retried.

- [ ] **Step 2: Add failing page tests for sidebar synchronization**

Update the mocked `ConversationDetail` to expose its `onConversationRead` callback. Render with `initialConversationId="conv-initial"`, invoke that callback, and assert `mockConversationsState.markAsRead` receives `conv-initial`. Also verify merely rendering or selecting a row does not call `markAsRead` before the detail callback.

- [ ] **Step 3: Run the focused tests and verify failure**

```powershell
npm run test:run -- src/features/communication/__tests__/components/ConversationDetail.test.tsx src/features/communication/__tests__/components/ConversationPage.test.tsx
```

- [ ] **Step 4: Notify the parent after successful backend read**

Add the optional prop to `ConversationDetail`. Replace the fire-and-forget catch chain with an explicit promise chain:

```ts
void markConversationRead(conversationId)
  .then(() => onConversationRead?.(conversationId))
  .catch(() => {
    if (lastMarkedReadRef.current === latestFromOther.id) {
      lastMarkedReadRef.current = null;
    }
  });
```

Include `onConversationRead` in the read effect dependencies.

- [ ] **Step 5: Move local unread clearing behind the callback**

Pass this prop from `ConversationPage`:

```tsx
onConversationRead={conversationsState.markAsRead}
```

Remove eager `markAsRead` calls from selection and initial-conversation synchronization. This makes normal selection and direct-link behavior use the same backend-confirmed path.

- [ ] **Step 6: Run the Task 5 tests**

Run the Task 5 command again. Expected: successful reads clear local state, failed reads do not, and focus retry remains available.

- [ ] **Step 7: Apply quality gates and commit**

Use `clean-code-guard` to review the promise lifecycle and callback dependencies. Use `test-guard` to verify tests control visibility/focus and wait for observable callback behavior.

```powershell
git add -- src/features/communication/conversations_redesign/components/ConversationDetail.tsx src/features/communication/conversations_redesign/pages/ConversationPage.tsx src/features/communication/__tests__/components/ConversationDetail.test.tsx src/features/communication/__tests__/components/ConversationPage.test.tsx
git commit -m "fix(communication): confirm conversation read state"
```

---

### Task 6: Integrated verification and handoff

**Files:**
- Verify all files changed by Tasks 1-5.
- Do not modify unrelated files.

**Interfaces:**
- Consumes: all task outputs.
- Produces: a verified conversation module ready for user review on the current feature branch.

- [ ] **Step 1: Run the focused conversation regression set**

```powershell
npm run test:run -- src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/hooks/useConversationMessages.test.ts src/features/communication/__tests__/hooks/useConversationParticipants.test.ts src/features/communication/__tests__/hooks/useConversationInvites.test.ts src/features/communication/__tests__/hooks/useConversationJoinRequests.test.ts src/features/communication/__tests__/components/ConversationSidebar.test.tsx src/features/communication/__tests__/components/ConversationPage.test.tsx src/features/communication/__tests__/components/ConversationDetail.test.tsx src/features/communication/__tests__/components/ParticipantsPanel.test.tsx src/features/communication/__tests__/components/InvitesPanel.test.tsx src/features/communication/__tests__/components/JoinRequestsPanel.test.tsx src/features/communication/__tests__/components/MessageComposer.test.tsx
```

Expected: all listed test files pass.

- [ ] **Step 2: Run static checks**

```powershell
npm run typecheck
npx eslint src/features/communication/hooks/useConversations.ts src/features/communication/hooks/useConversationMessages.ts src/features/communication/hooks/useConversationParticipants.ts src/features/communication/hooks/useConversationInvites.ts src/features/communication/hooks/useConversationJoinRequests.ts src/features/communication/conversations_redesign/components/PanelLayout.tsx src/features/communication/conversations_redesign/components/sidebar.tsx src/features/communication/conversations_redesign/components/ParticipantsPanel.tsx src/features/communication/conversations_redesign/components/InvitesPanel.tsx src/features/communication/conversations_redesign/components/JoinRequestsPanel.tsx src/features/communication/conversations_redesign/components/ConversationDetail.tsx src/features/communication/conversations_redesign/pages/ConversationPage.tsx src/features/communication/conversations_redesign/labels.ts
git diff --check
```

Expected: all commands exit successfully. CRLF conversion warnings are informational; whitespace errors are not allowed.

- [ ] **Step 3: Perform final quality reviews**

Run `clean-code-guard` across the complete production diff and `test-guard` across the complete test diff. Confirm every spec item has a matching passing regression test and no action error can populate a blocking load-error state.

- [ ] **Step 4: Inspect branch state without merging**

```powershell
git status --short --branch
git log --oneline --decorate -8
```

Report the commits, targeted verification results, and any checks not run. Do not run the full test suite until the user explicitly approves it. Do not merge or push.
