# Communication Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make communication threads and announcements faster while preserving realtime behavior and access controls.

**Architecture:** Feed viewport-adjacent message IDs from the message list to the existing reaction and attachment hooks, where bounded workers fetch missing details. Let core message data render independently of supporting requests. Replace the accumulated message DOM with a variable-height virtual list, then add paged, debounced announcement loading.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, React Testing Library, `react-virtuoso` 4.18.15.

**Spec:** `docs/superpowers/specs/2026-09-23-communication-performance-scope.md`

## Global Constraints

- Frontend only; keep existing backend API contracts and permission checks.
- Use components from `src/components/ui` for new controls.
- Apply `clean-code-guard` to production changes and `test-guard` to test changes.
- Run focused tests, lint, typecheck, and build; ask before the full `npm run test:run` suite.
- Commit and push a feature branch; do not merge or deploy.

---

### Task 1: Bounded visible-message enrichment

**Files:**
- Create: `src/features/communication/utils/runBoundedRequests.ts`
- Modify: `src/features/communication/hooks/useMessageReactions.ts`
- Modify: `src/features/communication/hooks/useMessageAttachments.ts`
- Modify: `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`
- Modify: `src/features/communication/conversations_redesign/components/messages/MessagesPanel.tsx`
- Test: `src/features/communication/__tests__/hooks/useMessageReactions.test.ts`
- Test: `src/features/communication/__tests__/hooks/useMessageAttachments.test.ts`
- Test: `src/features/communication/__tests__/components/MessagesPanel.test.tsx`

**Interfaces:** `MessagesPanel` emits `onVisibleMessageIdsChange(ids: string[])`; the detail view passes those IDs to `useMessageReactions` and filters its message inputs for `useMessageAttachments`. `runBoundedRequests<T>(items: readonly T[], limit: number, visit: (item: T) => Promise<void>): Promise<void>` limits fanout.

- [ ] **Step 1: Add focused failing tests.** Cover 30 messages with only a small visible subset, four concurrent calls maximum, cached IDs not refetched, inline attachments not fetched again, and stale responses ignored after a conversation change. Mock only the API and visibility boundaries.
- [ ] **Step 2: Run those tests and confirm they fail for the current all-message fetch.** Run `npx vitest run src/features/communication/__tests__/hooks/useMessageReactions.test.ts src/features/communication/__tests__/hooks/useMessageAttachments.test.ts src/features/communication/__tests__/components/MessagesPanel.test.tsx`.
- [ ] **Step 3: Implement bounded workers and viewport reporting.** Use a worker loop instead of `Promise.all(ids.map(...))`:

```ts
export async function runBoundedRequests<T>(items: readonly T[], limit: number, visit: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await visit(item);
    }
  }));
}
```

The hooks should track a conversation generation so a previous thread cannot update the new thread; a failed ID must remain retryable. Observe message rows with `IntersectionObserver` and `rootMargin: "100% 0px"`; if unavailable, use the current loaded IDs.
- [ ] **Step 4: Run focused tests, lint the touched files, and apply the clean-code and test guards.** Check the Network panel request ceiling with a 30-message fixture.
- [ ] **Step 5: Commit:** `refactor(communication): bound visible message enrichment`.

### Task 2: Progressive thread loading

**Files:**
- Modify: `src/features/communication/hooks/useConversationMessages.ts`
- Modify: `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`
- Test: `src/features/communication/__tests__/hooks/useConversationMessages.test.ts`
- Test: `src/features/communication/__tests__/components/ConversationDetail.test.tsx`

**Interfaces:** `refreshMessages()` controls message loading. `refreshReadSummary()` updates counts independently. `ConversationDetail` may render the history once messages are ready, while the composer and mutation actions require their existing permission inputs.

- [ ] **Step 1: Add tests with deferred policy, participant, and read-summary promises.** Assert fetched message text appears before those promises resolve, while send, edit, delete, invite, and participant controls remain unavailable until their inputs resolve.
- [ ] **Step 2: Run the two focused files and confirm the current full-thread spinner fails the new expectation.** Run `npx vitest run src/features/communication/__tests__/hooks/useConversationMessages.test.ts src/features/communication/__tests__/components/ConversationDetail.test.tsx`.
- [ ] **Step 3: Start read-summary loading without serializing it behind message fetch.** Keep read counts correct regardless of response order by applying the latest summary to the final message state:

```ts
const refresh = useCallback(async () => {
  const messagesRequest = refreshMessages();
  const readSummaryRequest = refreshReadSummary();
  await Promise.allSettled([messagesRequest, readSummaryRequest]);
}, [refreshMessages, refreshReadSummary]);
```

Keep the latest normalized summary in a ref and apply its counts when `refreshMessages` replaces the message array, so either response order is correct. Replace the combined spinner condition with a message-only loading state; render a safe header placeholder and read-only composer until conversation, policy, participants, and permission flags are ready. Do not default an unresolved policy to allowing mutations.
- [ ] **Step 4: Run focused tests, typecheck, and guard reviews.** Verify message history remains visible if policy or receipt requests fail.
- [ ] **Step 5: Commit:** `refactor(communication): render thread messages progressively`.

### Task 3: Virtualize long message histories

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/features/communication/conversations_redesign/components/messages/MessagesPanel.tsx`
- Modify: `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`
- Test: `src/features/communication/__tests__/components/MessagesPanel.test.tsx`

**Interfaces:** `MessagesPanel` continues accepting its current message/action props and emitting viewport IDs from Task 1. Add `conversationId: string` so the virtual list resets measurement and scroll state on thread switch.

- [ ] **Step 1: Install `react-virtuoso@4.18.15` and add behavior tests.** Cover first load at bottom, prepend retaining the same visible message, incoming messages following only when already near bottom, date separators, thread switch reset, and bounded mounted rows after multiple loaded pages.
- [ ] **Step 2: Run the focused `MessagesPanel` tests to capture the current nonvirtual behavior.** Run `npx vitest run src/features/communication/__tests__/components/MessagesPanel.test.tsx`.
- [ ] **Step 3: Replace the message map with `Virtuoso`.** Use `data={messages}`, `computeItemKey` from `clientMessageId ?? id`, `firstItemIndex` adjusted downward on prepends, `initialTopMostItemIndex={messages.length - 1}`, `followOutput` for near-bottom appends, and `startReached` for older loading. Keep each message's date separator in its row and use `rangeChanged` for viewport IDs.

```tsx
<Virtuoso
  data={messages}
  computeItemKey={(_, message) => message.clientMessageId ?? message.id}
  firstItemIndex={firstItemIndex}
  followOutput={(atBottom) => atBottom ? "smooth" : false}
  rangeChanged={({ startIndex, endIndex }) => onVisibleMessageIdsChange?.(
    messages.slice(startIndex - firstItemIndex, endIndex - firstItemIndex + 1).map((message) => message.id),
  )}
  startReached={() => { if (hasOlderMessages && !isLoadingOlder) onLoadOlder(); }}
  itemContent={(index, message) => renderMessageRow(index, message)}
/>
```

- [ ] **Step 4: Run focused tests and manually check a thread with media of different heights, Arabic layout, loading older history, and sending while scrolled up.** Apply guards before commit.
- [ ] **Step 5: Commit:** `refactor(communication): virtualize message history`.

### Task 4: Paged, debounced announcements

**Files:**
- Modify: `src/features/communication/hooks/useAnnouncements.ts`
- Modify: `src/features/communication/pages/AnnouncementsPage.tsx`
- Modify: `src/features/communication/components/announcements/AnnouncementList.tsx` only if a list footer is needed
- Create: `src/features/communication/__tests__/hooks/useAnnouncements.test.ts`
- Test: `src/features/communication/components/announcements/__tests__/AnnouncementList.test.tsx`

**Interfaces:** `useAnnouncements` returns `hasMore`, `isLoadingMore`, and `loadMore()` alongside existing values. The page renders a `src/components/ui/button/Button` load-more control. Existing publish/archive actions remain unchanged.

- [ ] **Step 1: Add tests for 350 ms search debounce, page 2 append without duplicate IDs, stale response rejection after filter change, a retryable failed page, and focus refresh only after 60 seconds.** Use fake timers only for the debounce and freshness clock.
- [ ] **Step 2: Run the new hook test and confirm the current 50-item single request fails the page expectation.** Run `npx vitest run src/features/communication/__tests__/hooks/useAnnouncements.test.ts`.
- [ ] **Step 3: Implement page 1 replacement and later-page append.** Use `getAnnouncements({ status, search: debouncedSearch, page, limit: 20 })`; key requests by filter and page, ignore older generations, retain old items during refresh, and set `hasMore` from `total` or the returned page length. Store `lastSuccessfulFetchAt` and refresh on focus only if `Date.now() - lastSuccessfulFetchAt > 60_000`.
- [ ] **Step 4: Add the UI load-more button and translated labels, run focused hook/list/page tests, and apply both guards.** Check publish/archive still refreshes the current filter.
- [ ] **Step 5: Commit:** `refactor(communication): page and debounce announcements`.

### Task 5: Final integration and delivery

**Files:** No planned production edits; only fix regressions found by checks.

- [ ] **Step 1: Run focused communication tests covering all touched hooks and components.** Include realtime and optimistic-send suites.
- [ ] **Step 2: Run `npm run lint`, `npm run typecheck`, and `npm run build`.** Ask before `npm run test:run`; record if declined or unanswered.
- [ ] **Step 3: Compare before/after request counts for a 30-message thread and the first announcement page; check scroll behavior with multiple loaded pages.** Report measured results separately from estimates.
- [ ] **Step 4: Review `git diff --check`, clean-code-guard, test-guard, and scope.** Commit any fixes, normal-push `refactor/communication-performance`, and create a draft PR against `main` for owner review.

## Self-review

- Spec coverage: Tasks 1–4 map directly to its four required behaviors; Task 5 covers verification and delivery.
- Type consistency: viewport IDs are strings, page state is owned by the announcement hook, and the virtual-list reset uses the conversation ID.
- Dependency: `react-virtuoso` is MIT licensed and advertises React 19 peer support; the commercial message-list package is excluded.
