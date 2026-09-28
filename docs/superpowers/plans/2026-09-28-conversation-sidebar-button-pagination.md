# Conversation Sidebar Button Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace conversation infinite scrolling with stable Previous/Next server pagination using the backend's maximum page size of 100 while preserving backend response order.

**Architecture:** `useConversations` will own one successfully loaded server page and expose page metadata plus `goToPage`. The sidebar will replace scroll-triggered loading with a compact footer built from the shared UI Button, preserve scroll only across page navigation, and update realtime rows in place without reordering. Filters and search will request page 1 and treat the backend order as authoritative.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Vitest 2, Testing Library, fast-check, Tailwind CSS, Lucide React, next-intl.

**Spec:** `docs/superpowers/specs/2026-09-28-conversation-sidebar-pagination-design.md`

## Global Constraints

- Start implementation from the latest `main` in a clean dedicated branch named `codex/fix-conversation-sidebar-pagination`; do not build this task on the current unrelated `refactor/extract-large-page-responsibilities` branch.
- Read `Must Read Before Push.txt` before implementation and follow its branch, commit, push, and verification rules.
- Do not modify the backend repository or API contract.
- Use a fixed page size of `100`; do not add a page-size selector.
- Preserve the exact conversation order returned by each backend page; do not sort, append, cache, or prefetch pages.
- Keep only the current conversation page in memory.
- Use components from `src/components/ui`; pagination buttons must use `Button` from `src/components/ui/button`.
- Invoke `clean-code-guard` for every production-code change and complete its guard pass before each production commit.
- Invoke `test-guard` for every test-code change and complete its guard pass before each test-bearing commit.
- Do not run the full test suite without explicit owner approval. Focused Vitest files are allowed by the project agreement.
- Preserve current unrelated worktree changes; stage only files named by the active task.

---

## File Map

- Create `src/features/communication/conversations_redesign/components/ConversationPagination.tsx`: render Previous/Page/Next controls with shared UI primitives.
- Create `src/features/communication/__tests__/components/ConversationPagination.test.tsx`: verify the isolated pagination control contract.
- Modify `src/features/communication/hooks/useConversations.ts`: request and replace one server page, expose pagination state, and stop realtime reordering.
- Modify `src/features/communication/conversations_redesign/components/sidebar.tsx`: remove infinite-scroll loading, render response order directly, preserve page-navigation scroll, and host the footer.
- Modify `src/features/communication/conversations_redesign/pages/ConversationPage.tsx`: pass server pagination state and callbacks to the sidebar.
- Modify `src/features/communication/conversations_redesign/labels.ts`: add localized pagination copy and accessible labels.
- Modify `src/features/communication/__tests__/labels.test.ts`: require the new pagination keys in both locales.
- Modify `src/features/communication/__tests__/hooks/useConversations.test.ts`: cover fixed limit, page replacement, failures, filter resets, refresh, and realtime stability.
- Modify `src/features/communication/__tests__/hooks/useConversations.property.test.ts`: replace obsolete client-sort properties with response-order and total-page properties.
- Modify `src/features/communication/__tests__/components/ConversationSidebar.test.tsx`: cover footer integration, removal of scroll loading, and scroll restoration/reset.

---

### Task 1: Replace accumulated conversation loading with single-page server pagination

**Files:**
- Modify: `src/features/communication/__tests__/hooks/useConversations.test.ts`
- Modify: `src/features/communication/__tests__/hooks/useConversations.property.test.ts`
- Modify: `src/features/communication/hooks/useConversations.ts`

**Interfaces:**
- Consumes: `getConversations(params: ListConversationsParams)` and the existing flexible response envelope.
- Produces: `page: number`, `pageSize: 100`, `totalPages: number`, `goToPage(nextPage: number): Promise<void>`, `refresh(): Promise<void>`, and `retry(): Promise<void>` on the `useConversations` return value.
- Invariant: `conversations` contains only the last successfully loaded page and retains response order.

- [ ] **Step 1: Invoke `test-guard` and replace obsolete request expectations**

Update all initial-request assertions from:

```ts
expect(mockGetConversations).toHaveBeenCalledWith({ limit: 20, page: 1 });
```

to:

```ts
expect(mockGetConversations).toHaveBeenCalledWith({ limit: 100, page: 1 });
```

Keep the existing filter assertions, but require `limit: 100` and `page: 1`.

- [ ] **Step 2: Add failing hook tests for page replacement and navigation failure**

Add this focused describe block to `useConversations.test.ts` using the existing `createDeferredResponse`, mocks, and fake-timer setup:

```ts
describe("server pagination", () => {
  it("replaces the current page without appending or sorting", async () => {
    const firstPage = [
      createConversation({ id: "conversation-b", lastMessageAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }),
      createConversation({ id: "conversation-a", lastMessageAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z" }),
    ];
    const secondPage = [
      createConversation({ id: "conversation-d", lastMessageAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" }),
      createConversation({ id: "conversation-c", lastMessageAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" }),
    ];
    mockGetConversations
      .mockResolvedValueOnce({ data: { items: firstPage, total: 200, page: 1, limit: 100 } })
      .mockResolvedValueOnce({ data: { items: secondPage, total: 200, page: 2, limit: 100 } });

    const useConversations = await importHook();
    const { result } = renderHook(() => useConversations());
    await act(async () => vi.runAllTimersAsync());

    await act(async () => result.current.goToPage(2));

    expect(mockGetConversations).toHaveBeenLastCalledWith({ limit: 100, page: 2 });
    expect(result.current.conversations.map(({ id }) => id)).toEqual([
      "conversation-d",
      "conversation-c",
    ]);
    expect(result.current.page).toBe(2);
    expect(result.current.totalPages).toBe(2);
  });

  it("keeps the successful page when the next page fails", async () => {
    const firstPage = [createConversation({ id: "conversation-stable" })];
    mockGetConversations
      .mockResolvedValueOnce({ data: { items: firstPage, total: 101, page: 1, limit: 100 } })
      .mockRejectedValueOnce(new Error("Page failed"));

    const useConversations = await importHook();
    const { result } = renderHook(() => useConversations());
    await act(async () => vi.runAllTimersAsync());
    await act(async () => result.current.goToPage(2));

    expect(result.current.page).toBe(1);
    expect(result.current.conversations.map(({ id }) => id)).toEqual([
      "conversation-stable",
    ]);
    expect(result.current.error).toBe("Page failed");
  });
});
```

- [ ] **Step 3: Add failing tests for filters, refresh, boundaries, and realtime stability**

Add explicit tests asserting:

```ts
expect(result.current.pageSize).toBe(100);
expect(result.current.totalPages).toBe(Math.ceil(total / 100));
```

For filter reset, first load page 2, change one filter, advance the debounce when applicable, and assert the last request contains `page: 1` and the hook commits `page === 1` only after success.

For manual refresh, load page 2, call `refresh()`, and assert the final request still contains `page: 2`.

For retry, make page 2 fail once, call `retry()`, resolve page 2 successfully, and assert the hook commits page 2. For a failed filter request, assert `conversations` is empty, `total === 0`, `page === 1`, and `retry()` requests page 1 with the active filters.

For the invalid-page boundary, request page 2 from a response whose new `total` is 50, mock the fallback response for page 1, and assert the hook makes exactly those two requests before committing page 1.

For realtime order stability, load two conversations in the order `conversation-a`, `conversation-b`, send `communication.chat.message.created` for `conversation-b`, then assert:

```ts
expect(result.current.conversations.map(({ id }) => id)).toEqual([
  "conversation-a",
  "conversation-b",
]);
expect(result.current.conversations[1]?.lastMessage?.body).toBe("new body");
```

For an absent realtime conversation, clear `mockGetConversations` after initial load, simulate an event for `conversation-outside-page`, advance 500ms, and assert the list is unchanged and `mockGetConversations` was not called.

- [ ] **Step 4: Rewrite the property test around response-order preservation**

Delete `getEffectiveDate` and all three sort-order properties. Keep the existing arbitrary and replace them with:

```ts
fcTest.prop(
  [fc.uniqueArray(conversationListItemArb, {
    selector: (conversation) => conversation.id,
    minLength: 0,
    maxLength: 100,
  })],
  { numRuns: 50 },
)("preserves backend conversation order", async (conversations) => {
  mockGetConversations.mockResolvedValue({
    data: { items: conversations, total: conversations.length, page: 1, limit: 100 },
  });

  const useConversations = await importHook();
  const { result, unmount } = renderHook(() => useConversations());
  await act(async () => vi.runAllTimersAsync());

  expect(result.current.conversations.map(({ id }) => id)).toEqual(
    conversations.map(({ id }) => id),
  );
  unmount();
});
```

Add a second property over `fc.nat({ max: 10_000 })` asserting `totalPages` is `0` for zero and `Math.ceil(total / 100)` otherwise.

- [ ] **Step 5: Run the focused hook tests and confirm the new contract fails**

Run:

```powershell
& {
  npm run test:run -- src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/hooks/useConversations.property.test.ts
}
```

Expected: FAIL because the hook still requests 20 items, appends/sorts pages, exposes `loadMore`/`hasMore`, lacks `goToPage`/`totalPages`, and reorders realtime updates.

- [ ] **Step 6: Invoke `clean-code-guard` and add focused pagination helpers**

In `useConversations.ts`:

```ts
const CONVERSATIONS_PAGE_SIZE = 100;

function totalPagesFromTotal(total: number): number {
  return total === 0 ? 0 : Math.ceil(total / CONVERSATIONS_PAGE_SIZE);
}

type PageRequestFailureMode = "clear-list" | "preserve-list";

interface ConversationPageRequest {
  page: number;
  failureMode: PageRequestFailureMode;
}
```

Add `failedPageRequestRef` with the exact shape `ConversationPageRequest | null` so Retry can repeat the failed request. Add `pageNavigationInFlightRef` to block rapid duplicate Previous/Next requests before React commits the loading state.

Remove `sortConversations`, `dedupeConversations`, `lastMessageTimestamp`, `mergeSameLastMessage`, and `newerLastMessage` after their call sites are removed. Remove `refreshTimerRef` and `debouncedRefresh` because absent realtime rows no longer refresh the list.

- [ ] **Step 7: Implement page request-and-replace behavior**

Replace the accumulated-page section of `refresh` with a focused `requestPage(pageToFetch, options)` callback. Its successful commit must follow this shape:

```ts
const normalized = list.items.map(toConversationListItem);
const nextTotal = list.total ?? normalized.length;
const nextTotalPages = totalPagesFromTotal(nextTotal);

if (nextTotalPages > 0 && pageToFetch > nextTotalPages) {
  // Repeat the same filtered request once with nextTotalPages before committing.
}

setConversations(normalized);
setTotal(nextTotal);
setPage(nextTotalPages === 0 ? 1 : pageToFetch);
```

Use a two-attempt loop for the invalid-page fallback rather than recursive callbacks:

```ts
let requestedPage = pageToFetch;
for (let attempt = 0; attempt < 2; attempt += 1) {
  const list = await loadPage(requestedPage);
  const pages = totalPagesFromTotal(list.total ?? list.items.length);
  if (pages > 0 && requestedPage > pages && attempt === 0) {
    requestedPage = pages;
    continue;
  }
  commitPage(list, requestedPage);
  break;
}
```

Keep the existing `latestRequestIdRef` guard. On `failureMode: "clear-list"`, clear `conversations`, `total`, and commit page `1` after an active filter/initial request failure. On page-navigation failure, preserve the previous list and page.

Before each request, clear `failedPageRequestRef`. In the active request's catch block, store the `ConversationPageRequest`; successful requests leave it null.

- [ ] **Step 8: Expose navigation and make filters request page 1**

Define the public callbacks:

```ts
const refresh = useCallback(
  () => requestPage({ page, failureMode: "preserve-list" }),
  [page, requestPage],
);

const goToPage = useCallback(
  async (nextPage: number) => {
    if (
      pageNavigationInFlightRef.current ||
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) return;
    pageNavigationInFlightRef.current = true;
    try {
      await requestPage({ page: nextPage, failureMode: "preserve-list" });
    } finally {
      pageNavigationInFlightRef.current = false;
    }
  },
  [page, requestPage, totalPages],
);

const retry = useCallback(() => {
  const failedRequest = failedPageRequestRef.current;
  return failedRequest ? requestPage(failedRequest) : refresh();
}, [refresh, requestPage]);
```

Use an effect keyed by `requestPage`'s filter dependencies to call:

```ts
void requestPage({ page: 1, failureMode: "clear-list" });
```

Return:

```ts
page,
pageSize: CONVERSATIONS_PAGE_SIZE,
totalPages: totalPagesFromTotal(total),
goToPage,
retry,
```

Remove `loadMore`, `hasMore`, and their state.

- [ ] **Step 9: Keep realtime updates in place**

In `handleCreated`, retain the existing `map` update but return `next` directly:

```ts
if (!found) return current;
return next;
```

For incomplete or absent event targets, return without scheduling a refresh. Keep update/delete handlers as index-preserving `map` operations.

- [ ] **Step 10: Run the focused tests and complete guard passes**

Run the two focused files from Step 5. Expected: PASS.

Run `test-guard` against both changed test files and `clean-code-guard` against `useConversations.ts`; fix every finding before continuing.

- [ ] **Step 11: Commit the hook contract**

```powershell
& {
  git add src/features/communication/hooks/useConversations.ts src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/hooks/useConversations.property.test.ts
  git commit -m "fix(communication): use stable conversation page state"
}
```

---

### Task 2: Build the shared-UI pagination footer

**Files:**
- Create: `src/features/communication/conversations_redesign/components/ConversationPagination.tsx`
- Create: `src/features/communication/__tests__/components/ConversationPagination.test.tsx`
- Modify: `src/features/communication/conversations_redesign/labels.ts`
- Modify: `src/features/communication/__tests__/labels.test.ts`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button` and `ConversationRedesignLabels`.
- Produces:

```ts
export interface ConversationPaginationProps {
  page: number;
  totalPages: number;
  isLoading: boolean;
  isRTL: boolean;
  labels: ConversationRedesignLabels;
  onPageChange: (page: number) => void;
}
```

- [ ] **Step 1: Invoke `test-guard` and add failing component tests**

Create `ConversationPagination.test.tsx` with the existing next-intl-free component pattern:

```tsx
it("navigates to the adjacent pages", async () => {
  const user = userEvent.setup();
  const onPageChange = vi.fn();
  render(
    <ConversationPagination
      page={2}
      totalPages={4}
      isLoading={false}
      isRTL={false}
      labels={conversationRedesignLabels.en}
      onPageChange={onPageChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
  expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();
});
```

Add tests for first/last-page disabled states, loading-disabled state with `role="status"`, Arabic `صفحة 2 من 4`, and `totalPages === 0` returning no footer. Verify RTL icon selection during the production-code guard pass rather than coupling tests to SVG internals.

- [ ] **Step 2: Run the component test and confirm it fails**

Run:

```powershell
& {
  npm run test:run -- src/features/communication/__tests__/components/ConversationPagination.test.tsx
}
```

Expected: FAIL because the component and pagination label keys do not exist.

- [ ] **Step 3: Add exact localized label keys**

Add to both locale objects in `labels.ts`:

```ts
// English
previousPage: "Previous",
nextPage: "Next",
conversationPageOf: "Page {page} of {totalPages}",

// Arabic
previousPage: "السابق",
nextPage: "التالي",
conversationPageOf: "صفحة {page} من {totalPages}",
```

Rely on the inferred `ConversationRedesignLabels` type at the bottom of the file; do not add a parallel manual interface.

Add `previousPage`, `nextPage`, and `conversationPageOf` to the interaction-label key list in `src/features/communication/__tests__/labels.test.ts`, so missing Arabic or English strings fail explicitly.

- [ ] **Step 4: Invoke `clean-code-guard` and implement `ConversationPagination`**

Implement the component with `Button variant="secondary" size="sm"`, `ChevronLeft`, `ChevronRight`, and `RefreshCw`. Select the logical icons explicitly:

```tsx
const PreviousIcon = isRTL ? ChevronRight : ChevronLeft;
const NextIcon = isRTL ? ChevronLeft : ChevronRight;
const pageLabel = labels.conversationPageOf
  .replace("{page}", String(page))
  .replace("{totalPages}", String(totalPages));

if (totalPages === 0) return null;
```

Use `aria-label={labels.previousPage}` and `aria-label={labels.nextPage}`. Disable Previous when `page <= 1 || isLoading`; disable Next when `page >= totalPages || isLoading`. Render the spinner inside an element with `role="status"`, `aria-label={labels.loadingConversations}`, and `motion-safe:animate-spin`.

- [ ] **Step 5: Run the focused component test and guard passes**

Run the file from Step 2. Expected: PASS.

Run `test-guard` on `ConversationPagination.test.tsx` and `labels.test.ts`, and `clean-code-guard` on `ConversationPagination.tsx` plus the label additions; fix every finding.

- [ ] **Step 6: Commit the pagination control**

```powershell
& {
  git add src/features/communication/conversations_redesign/components/ConversationPagination.tsx src/features/communication/conversations_redesign/labels.ts src/features/communication/__tests__/components/ConversationPagination.test.tsx src/features/communication/__tests__/labels.test.ts
  git commit -m "feat(communication): add conversation page controls"
}
```

---

### Task 3: Integrate page controls and preserve sidebar scroll

**Files:**
- Modify: `src/features/communication/__tests__/components/ConversationSidebar.test.tsx`
- Modify: `src/features/communication/conversations_redesign/components/sidebar.tsx`
- Modify: `src/features/communication/conversations_redesign/pages/ConversationPage.tsx`

**Interfaces:**
- Consumes: Task 1's `page`, `totalPages`, `goToPage`; Task 2's `ConversationPagination`.
- Produces the updated sidebar props:

```ts
page: number;
totalPages: number;
onPageChange: (page: number) => void;
```

- Removes `loadMore?: () => void` and `hasMore?: boolean`.

- [ ] **Step 1: Invoke `test-guard` and update the sidebar test renderer**

Replace the narrow `renderSidebar(lastMessage)` helper with an options-based helper so every test receives the complete required prop contract:

```tsx
function renderSidebarWithProps(
  overrides: Partial<React.ComponentProps<typeof ConversationSidebar>> = {},
) {
  const conversation = {
    id: "conversation-1",
    type: "group",
    status: "active",
    title: "Conversation",
    lastMessage: null,
  } as ConversationListItemModel;

  return render(
    <ConversationSidebar
      desktopWidth={360}
      conversations={[conversation]}
      filter="all"
      typeFilter=""
      search=""
      isLoading={false}
      isRefreshing={false}
      page={1}
      totalPages={1}
      onPageChange={vi.fn()}
      onSelect={vi.fn()}
      onFilterChange={vi.fn()}
      onTypeFilterChange={vi.fn()}
      onSearchChange={vi.fn()}
      onRefresh={vi.fn()}
      onCreateConversation={vi.fn()}
      {...overrides}
    />,
  );
}
```

Update preview tests to pass `conversations` with the required `lastMessage`. The baseline pagination props are:

```tsx
page={1}
totalPages={1}
onPageChange={vi.fn()}
```

Remove any `loadMore` or `hasMore` setup.

- [ ] **Step 2: Add failing integration tests for navigation and scroll behavior**

Add a test proving scroll does not load more and page navigation records/restores position:

```tsx
it("requests a page without using scroll as a loading trigger", async () => {
  const user = userEvent.setup();
  const onPageChange = vi.fn();
  const view = renderSidebarWithProps({
    page: 1,
    totalPages: 3,
    onPageChange,
  });
  const list = view.container.querySelector('[data-testid="conversation-list"]');
  expect(list).not.toBeNull();

  Object.defineProperty(list, "scrollTop", { value: 240, writable: true });
  fireEvent.scroll(list as Element);
  expect(onPageChange).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange).toHaveBeenCalledWith(2);
});
```

Add a rerender test: set `scrollTop = 240`, click Next, rerender with page 2 and different conversations, then assert `scrollTop === 240`. Add separate filter and search tests asserting their existing callbacks run and `scrollTop === 0`.

Add an order integration test with an unpinned row followed by a pinned row and assert the DOM titles remain in that exact order. This guards removal of the current pinned/recent regrouping.

- [ ] **Step 3: Run the sidebar test and confirm it fails**

Run:

```powershell
& {
  npm run test:run -- src/features/communication/__tests__/components/ConversationSidebar.test.tsx
}
```

Expected: FAIL because the sidebar still loads on scroll, regroups pinned conversations, lacks page props/footer, and has no scroll-restoration contract.

- [ ] **Step 4: Invoke `clean-code-guard` and change the sidebar contract**

Replace `loadMore` and `hasMore` in `ConversationSidebarProps` with:

```ts
page: number;
totalPages: number;
onPageChange: (page: number) => void;
```

Import `useLayoutEffect`, `ConversationPagination`, and keep using the existing shared `Input`.

- [ ] **Step 5: Remove infinite scroll and pinned regrouping**

Give the scroll container a ref and test id, and delete its `onScroll` handler:

```tsx
<div
  ref={listRef}
  data-testid="conversation-list"
  className="min-h-0 flex-1 overflow-y-auto"
>
```

Delete `pinnedConversations` and `unpinnedConversations`. Render the already filtered current-page rows in response order:

```tsx
{visibleConversations.map((conversation) => (
  <ConversationRow
    key={conversation.id}
    conversation={conversation}
    selected={selectedConversationId === conversation.id}
    locale={locale}
    labels={labels}
    onSelect={onSelect}
  />
))}
```

Do not call `.sort()` in the component.

- [ ] **Step 6: Implement page-only scroll preservation and filter reset**

Add refs:

```ts
const listRef = useRef<HTMLDivElement | null>(null);
const pendingPageScrollTopRef = useRef<number | null>(null);
```

Wrap page navigation:

```ts
const handlePageChange = (nextPage: number) => {
  pendingPageScrollTopRef.current = listRef.current?.scrollTop ?? 0;
  onPageChange(nextPage);
};
```

Restore only after the committed `page` changes:

```ts
useLayoutEffect(() => {
  const scrollTop = pendingPageScrollTopRef.current;
  if (scrollTop === null || !listRef.current) return;
  listRef.current.scrollTop = scrollTop;
  pendingPageScrollTopRef.current = null;
}, [page]);
```

Before calling `onSearchChange`, `onFilterChange`, or `onTypeFilterChange`, set `listRef.current.scrollTop = 0` and clear `pendingPageScrollTopRef.current`.

- [ ] **Step 7: Render the footer outside the scroll container**

Immediately after the scrollable list, render:

```tsx
<ConversationPagination
  page={page}
  totalPages={totalPages}
  isLoading={isRefreshing}
  isRTL={locale === "ar"}
  labels={labels}
  onPageChange={handlePageChange}
/>
```

The pagination component itself hides when `totalPages === 0`.

- [ ] **Step 8: Wire pagination through `ConversationPage`**

Replace:

```tsx
loadMore={conversationsState.loadMore}
hasMore={conversationsState.hasMore}
```

with:

```tsx
page={conversationsState.page}
totalPages={conversationsState.totalPages}
onPageChange={(nextPage) => void conversationsState.goToPage(nextPage)}
```

Keep manual refresh as `void conversationsState.refresh()` so it reloads the current page. Do not add URL state.

Change the existing retry toast action from `conversationsState.refresh` to `conversationsState.retry` so a failed page transition retries its intended target:

```tsx
onAction={() => void conversationsState.retry()}
```

- [ ] **Step 9: Run focused component and hook tests**

Run:

```powershell
& {
  npm run test:run -- src/features/communication/__tests__/components/ConversationPagination.test.tsx src/features/communication/__tests__/components/ConversationSidebar.test.tsx src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/hooks/useConversations.property.test.ts src/features/communication/__tests__/labels.test.ts
}
```

Expected: PASS.

- [ ] **Step 10: Complete code and test guard passes**

Run `test-guard` on `ConversationSidebar.test.tsx` and rerun it on any test file changed after its prior guard. Run `clean-code-guard` on `sidebar.tsx` and `ConversationPage.tsx`. Remove dead imports such as `Pin` if no remaining use exists.

- [ ] **Step 11: Commit sidebar integration**

```powershell
& {
  git add src/features/communication/conversations_redesign/components/sidebar.tsx src/features/communication/conversations_redesign/pages/ConversationPage.tsx src/features/communication/__tests__/components/ConversationSidebar.test.tsx
  git commit -m "fix(communication): replace conversation infinite scroll"
}
```

---

### Task 4: Verify the complete change and prepare handoff

**Files:**
- Review: all files listed in the File Map
- Review: `Must Read Before Push.txt`

**Interfaces:**
- Consumes: the completed hook, pagination component, sidebar integration, and focused tests.
- Produces: a verified feature branch ready for normal push and Draft PR creation under the project workflow.

- [ ] **Step 1: Inspect scope and whitespace**

Run:

```powershell
& {
  git status --short
  git diff --check
  git diff --stat main...HEAD
}
```

Expected: only the conversation pagination production files, focused tests, approved spec, and this plan are part of the task branch; `git diff --check` prints no errors.

- [ ] **Step 2: Run focused lint on changed source and test files**

```powershell
& {
  npx eslint src/features/communication/hooks/useConversations.ts src/features/communication/conversations_redesign/components/ConversationPagination.tsx src/features/communication/conversations_redesign/components/sidebar.tsx src/features/communication/conversations_redesign/pages/ConversationPage.tsx src/features/communication/conversations_redesign/labels.ts src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/hooks/useConversations.property.test.ts src/features/communication/__tests__/components/ConversationPagination.test.tsx src/features/communication/__tests__/components/ConversationSidebar.test.tsx src/features/communication/__tests__/labels.test.ts
}
```

Expected: exit code 0 with no new warnings from these files.

- [ ] **Step 3: Run typecheck**

```powershell
& {
  npm run typecheck
}
```

Expected: PASS.

- [ ] **Step 4: Run the focused test set once more**

Use the four-file command from Task 3 Step 9. Expected: PASS.

Do not run `npm run test:run` without file arguments or `npm run test:all` until the owner explicitly approves the full test run.

- [ ] **Step 5: Run the production build**

```powershell
& {
  npm run build
}
```

Expected: PASS with no new build errors. Existing baseline warnings must be reported rather than hidden.

- [ ] **Step 6: Perform final guard reviews**

Run `clean-code-guard` across the complete production diff and `test-guard` across the complete test diff. Confirm:

- No client-side conversation sorting remains in the list path.
- No infinite-scroll handler or `loadMore`/`hasMore` conversation API remains.
- Page navigation never appends conversations.
- Realtime updates preserve row order.
- Search and filters reset to page 1 and list scroll to zero.
- Page navigation restores the previous scroll position.
- No broad error catch swallows request failures.
- Tests assert observable behavior rather than implementation details where a user-visible query is available.

- [ ] **Step 7: Commit the approved design and plan if they are not yet committed**

```powershell
& {
  git add docs/superpowers/specs/2026-09-28-conversation-sidebar-pagination-design.md docs/superpowers/plans/2026-09-28-conversation-sidebar-button-pagination.md
  git commit -m "docs(communication): define sidebar pagination rollout"
}
```

- [ ] **Step 8: Request permission before the full test suite**

Ask the owner whether to run the complete School Dashboard test suite. If approved, run:

```powershell
& {
  npm run test:run
}
```

Record the exact result. If permission is not granted, report `TESTS=FOCUSED_PASS; FULL_TESTS=NOT_RUN_OWNER_APPROVAL_REQUIRED`.

- [ ] **Step 9: Push normally and create or update one Draft PR**

After required verification succeeds, use a normal push only:

```powershell
& {
  git push -u origin codex/fix-conversation-sidebar-pagination
}
```

Create one Draft PR targeting `main`; never force-push and never merge. Include Summary, Scope, Changed Files, Verification, known limitations about pinned-only completeness and unread counts, and the final MOAZEZ handoff fields from `Must Read Before Push.txt`.

**Implementation status:** Local implementation, focused tests, lint, typecheck, and production build are complete. The full test suite, push, and Draft PR remain pending owner approval and final delivery.
