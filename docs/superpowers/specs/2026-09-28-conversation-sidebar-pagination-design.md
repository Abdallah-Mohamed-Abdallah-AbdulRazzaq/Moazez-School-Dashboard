# Conversation Sidebar Button Pagination Design

## Goal

Replace infinite-scroll conversation loading with explicit previous/next page navigation while preserving the backend response order and keeping the conversation list visually stable.

## Scope

This change affects the School Dashboard conversation sidebar only. It does not change the backend API, database schema, conversation message pagination, unread-count contract, or conversation detail view.

## Confirmed Backend Contract

- Endpoint: `GET /communication/conversations`
- Default page: `1`
- Default limit: `50`
- Maximum limit: `100`
- Supported filters: `status`, `type`, and `search`
- Response pagination metadata includes `total`, with `page` and `limit` available through the existing frontend response normalization.
- Backend ordering is authoritative. The frontend must not reorder a fetched page.

## Product Decisions

- Page size is fixed at `100` conversations.
- Pagination uses Previous and Next buttons with a `Page X of Y` label.
- The list preserves its current scroll position when a different page replaces the current one, subject to the browser clamping the position when the new page is shorter.
- Search, status, and type filter changes reset pagination to page `1`.
- During page loading, the current page remains visible.
- Pagination controls are disabled while a request is in progress, and a compact loading indicator is shown.
- Realtime updates modify a conversation in place and do not move it to the top.
- A realtime event for a conversation outside the current page does not insert it or refresh the page.
- Manual refresh reloads the current page.

## Architecture

### Conversation state

`useConversations` owns server-pagination state:

- `page`: the successfully loaded page number.
- `pageSize`: the fixed value `100`.
- `total`: the backend total for the active filters.
- `totalPages`: `Math.ceil(total / pageSize)`, with `0` when `total` is `0`.
- `conversations`: only the currently loaded page.
- `isLoading`: the initial-load state.
- `isRefreshing`: page navigation, filter refresh, or manual refresh while existing rows remain visible.

The hook exposes `goToPage(nextPage: number)`. The requested page is committed to state only after a successful response. Page-navigation requests outside the valid range or made while another page-navigation request is active are ignored. A search or filter change always starts a new request generation and supersedes any older request.

### Request and replacement flow

Every request includes:

```ts
{
  page: requestedPage,
  limit: 100,
  status?: ConversationStatus,
  type?: ConversationType,
  search?: string,
}
```

After a successful response, the hook normalizes each conversation for display and replaces `conversations` with the returned page. It does not append, merge pages, or call `sortConversations`. Response normalization remains necessary to support the existing flexible API envelope and last-message display model.

The frontend does not deduplicate or otherwise reshape the page membership. It maps the response items to display models in their original order.

### Filters and search

Changing `search`, `status`, or `type` requests page `1` for the new filter set. The existing search debounce remains. Older requests are ignored through the existing request-generation mechanism.

While filtered results load, the current page remains visible. If the filtered request fails, the sidebar displays the existing error state rather than presenting stale rows as if they matched the selected filters.

### Realtime behavior

For a message event whose `conversationId` exists in the current page:

- Update the row's last-message fields.
- Update the timestamp displayed in the row.
- Update the local unread count according to the existing sender rules.
- Preserve the row index.

For a message event whose conversation is absent from the current page, take no list action. The event must not insert a row, trigger a debounced refresh, or change the current page.

## Pagination UI

Add a focused conversation-pagination component next to the conversation sidebar components. It must reuse `Button` from `src/components/ui/button` and existing Lucide icons.

The footer layout is:

```text
[ Previous ]       Page 2 of 6       [ Next ]
```

Requirements:

- The footer sits outside the scrollable conversation-list container and remains visible.
- Controls fit the sidebar's supported width range of 280–640 pixels.
- Previous is disabled on page `1`.
- Next is disabled on the last page.
- Both controls are disabled while loading a page.
- A compact spinner appears beside the page label during a page request.
- Labels and accessible names come from the existing conversation redesign labels in Arabic and English.
- Directional icons respect RTL and LTR direction.
- The footer is hidden when `total` is `0`.
- There is no page-size selector, page-number list, first-page button, or last-page button.

## Scroll Preservation

The sidebar owns the scroll-container ref. Before requesting another page, it records the current `scrollTop`. After the new rows render, it restores that value in a layout-safe effect. If the new content is shorter, the browser may clamp the value to the largest valid scroll position.

Filter and search changes reset the list to the top because they create a new result set. Scroll restoration applies only when the user navigates between pages or retries the current page.

## Error Handling

### Page-navigation failure

- Keep the previous rows visible.
- Keep the previous successful page number.
- Re-enable the pagination controls.
- Surface the existing retryable error notification.
- Retry requests the originally selected target page only if it is still valid; otherwise it reloads the current page.

### Filter or search failure

- Keep rows visible during loading.
- On failure, show the sidebar error state so rows from the previous filter are not mislabeled as current results.
- Clear the previous rows and pagination total after the active filter request fails.
- Retry page `1` with the active filters.

### Page becomes invalid

If a successful response shows that the requested page is greater than the new last page, request the last valid page once. If the total is zero, commit page `1`, an empty list, and `totalPages = 0` without a second request.

## Testing Strategy

### Hook tests

Update focused `useConversations` tests to prove:

- Initial requests use `limit: 100` and `page: 1`.
- Response order is preserved.
- `goToPage(2)` requests page `2` and replaces rather than appends conversations.
- A failed page transition preserves the previous rows and successful page number.
- Search, status, and type changes request page `1`.
- `totalPages` handles zero, one, exact multiples of 100, and a partial final page.
- Realtime updates modify a matching row without changing its index.
- Realtime events for absent conversations do not insert rows or refresh the list.
- Manual refresh reloads the current page.

Remove or rewrite property tests that require client-side pinned/recent sorting because backend response order is now authoritative.

### Component tests

Add focused sidebar pagination tests to prove:

- The Previous and Next controls call the expected page numbers.
- Boundary and loading states disable the correct buttons.
- The page label and spinner are accessible in Arabic and English.
- Replacing conversations restores `scrollTop` as far as the new list height permits.
- Scrolling the list does not request another page.
- The footer is absent when there are no results.

### Verification

Run focused conversation hook and sidebar tests first, followed by lint and typecheck. Do not run the full test suite without explicit owner approval.

## Files Expected to Change

- `src/features/communication/hooks/useConversations.ts`
  - Replace accumulated infinite-scroll state with single-page server pagination.
  - Preserve backend response ordering.
  - Expose page metadata and `goToPage`.
  - Keep realtime updates in place.
- `src/features/communication/conversations_redesign/components/sidebar.tsx`
  - Remove scroll-triggered loading.
  - Preserve the list scroll position across page replacement.
  - Render the pagination footer.
- `src/features/communication/conversations_redesign/components/ConversationPagination.tsx`
  - Encapsulate the Previous/Page/Next controls using the shared UI Button.
- `src/features/communication/conversations_redesign/pages/ConversationPage.tsx`
  - Pass page state and navigation callbacks into the sidebar.
- `src/features/communication/conversations_redesign/labels.ts`
  - Add Arabic and English pagination labels and accessible names.
- `src/features/communication/__tests__/hooks/useConversations.test.ts`
  - Cover page replacement, request state, filters, failures, and realtime stability.
- `src/features/communication/__tests__/hooks/useConversations.property.test.ts`
  - Replace obsolete client-sort properties with response-order and pagination-boundary properties.
- `src/features/communication/__tests__/components/ConversationSidebar.test.tsx`
  - Cover controls, loading state, scrolling, and scroll restoration.

## Out of Scope

- Backend API or database changes.
- Fetching every page into memory.
- Infinite scrolling.
- Client-side conversation sorting.
- Complete pinned-only results across all backend pages.
- Fixing the backend-owned unread-count contract.
- URL synchronization for the selected conversation-list page.
- Prefetching or caching pages.

