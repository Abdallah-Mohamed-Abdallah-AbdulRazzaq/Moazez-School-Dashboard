# Sidebar Tab Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a localized, animated sidebar search that finds both top-level navigation items and child tabs.

**Architecture:** Keep search state local to `Sidebar`. Add a pure navigation filter in `src/config/navigation.ts` that preserves the existing menu tree shape while removing non-matching descendants. The sidebar renders the filtered tree through the existing subgroup/link paths, automatically expands matching parents, restores the pre-search expansion state on clear, and exposes a collapsed search trigger that opens and focuses the sidebar input.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide, Vitest, Testing Library.

## Global Constraints

- Search the permission-filtered navigation tree locally in the browser; do not add API calls or URL query state.
- Match labels in the active language using trimmed, case-insensitive text comparison.
- Preserve existing subgroup headings, permissions, active states, badges, guarded navigation, RTL layout, and grade query preservation.
- Use 150–200ms transitions, no scale transforms that shift layout, visible focus states, and `motion-reduce:transition-none`.
- Restore the user’s expansion state after clearing the query.
- Render a localized no-results state when no item matches.

---

### Task 1: Add pure localized navigation filtering

**Files:**
- Modify: `src/config/navigation.ts`
- Test: `src/components/layout/__tests__/Sidebar.test.tsx`

**Interfaces:**
- `filterMenuItems(menuItems: MenuItem[], query: string, isArabic: boolean): MenuItem[]` returns a filtered tree with the original object data preserved.
- A top-level item is retained when its localized label matches or a descendant matches.
- A parent with a matching label keeps all of its visible children; otherwise only matching children/grandchildren remain.

- [ ] **Step 1: Add failing behavior tests for top-level and child matching**

Import `filterMenuItems` and `menuItems` in the existing Sidebar test file. Add one test that searches `"dash"` and expects only the Dashboard top-level item, and one that searches `"application"` and expects Admissions & Registration with Applications retained while an unrelated child such as Leads is absent.

```tsx
it("filters top-level and child navigation labels", () => {
  const topLevelMatches = filterMenuItems(menuItems, "dash", false);
  const childMatches = filterMenuItems(menuItems, "application", false);

  expect(topLevelMatches.map((item) => item.key)).toEqual(["dashboard"]);
  expect(childMatches.map((item) => item.key)).toEqual([
    "admissions-registration",
  ]);
  expect(childMatches[0].children?.map((child) => child.key)).toContain(
    "admissions-applications",
  );
  expect(childMatches[0].children?.map((child) => child.key)).not.toContain(
    "admissions-leads",
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run test:run -- src/components/layout/__tests__/Sidebar.test.tsx`

Expected: FAIL because `filterMenuItems` is not defined.

- [ ] **Step 3: Implement the filter with recursive child matching**

Add a small normalization function and recursive filter in `navigation.ts`. Preserve the existing child/grandchild fields by spreading original objects; do not mutate `menuItems`.

```ts
const normalizeNavigationText = (value: string) => value.trim().toLocaleLowerCase();

export function filterMenuItems(
  items: MenuItem[],
  query: string,
  isArabic: boolean,
): MenuItem[] {
  const normalizedQuery = normalizeNavigationText(query);
  if (!normalizedQuery) return items;

  return items.flatMap((item) => {
    const itemLabel = isArabic ? item.label_ar : item.label_en;
    const itemMatches = normalizeNavigationText(itemLabel).includes(normalizedQuery);
    if (!item.children) {
      return itemMatches ? [item] : [];
    }

    const matchingChildren = filterMenuItems(item.children, query, isArabic);
    if (!itemMatches && matchingChildren.length === 0) return [];

    return [{ ...item, children: itemMatches ? item.children : matchingChildren }];
  });
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm run test:run -- src/components/layout/__tests__/Sidebar.test.tsx`

Expected: the new filter tests and existing sidebar tests pass.

- [ ] **Step 5: Commit the filter**

```bash
git add src/config/navigation.ts src/components/layout/__tests__/Sidebar.test.tsx
git commit -m "feat: filter sidebar navigation labels"
```

### Task 2: Add the search control and query-driven sidebar behavior

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Test: `src/components/layout/__tests__/Sidebar.test.tsx`

**Interfaces:**
- Search state is local to `Sidebar`; no new props or URL state.
- `filteredMenuItems` consumes `filterMenuItems` and the existing permission-filtered `visibleMenuItems`.
- Existing expanded/flyout rendering consumes `filteredMenuItems` while a query is active and `visibleMenuItems` otherwise.

- [ ] **Step 1: Add failing interaction tests**

Add tests for: entering `Applications` displays the matching child and its subgroup heading; entering an unmatched value shows the localized no-results text; clearing restores all tabs; and the collapsed search button calls `onToggle`.

```tsx
it("filters visible tabs and restores them after clearing", async () => {
  const user = userEvent.setup();
  render(<Sidebar isOpen onToggle={vi.fn()} />);

  const search = screen.getByRole("searchbox", { name: "Search navigation" });
  await user.type(search, "Applications");

  expect(screen.getByText("Applications")).toBeInTheDocument();
  expect(screen.queryByText("Leads")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Clear navigation search" }));
  expect(screen.getByText("Leads")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run test:run -- src/components/layout/__tests__/Sidebar.test.tsx`

Expected: FAIL because the search input, filtered display, clear action, and collapsed trigger do not exist.

- [ ] **Step 3: Add search state, refs, derived filtered items, and expansion restoration**

Import `Search` and `X`. Add `searchQuery`, `searchInputRef`, `searchSnapshotRef`, and `focusSearchOnOpenRef`. Derive `filteredMenuItems` with `useMemo` from `visibleMenuItems`, `searchQuery`, and `isArabic`. Use a `hasSearchQuery` boolean for trimmed state.

When the query changes from empty to non-empty, store the current `expandedItems` once and merge all filtered parent keys plus child keys with grandchildren into the expanded list. When the query becomes empty, restore the snapshot and clear it. When the collapsed trigger is clicked, call `onToggle` and set `focusSearchOnOpenRef.current = true`; an effect watching `isOpen` focuses `searchInputRef.current` after expansion.

- [ ] **Step 4: Render the expanded search field with modern motion and accessibility**

Place the control below the school selector and before the scroll container:

```tsx
{isOpen && (
  <div className="mx-2 mb-3">
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
      <input
        ref={searchInputRef}
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        aria-label={isArabic ? "بحث في التنقل" : "Search navigation"}
        placeholder={isArabic ? "ابحث في التبويبات..." : "Search tabs..."}
        className="h-10 w-full rounded-lg border border-white/15 bg-white/10 ps-9 pe-9 text-sm text-white outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-white/45 focus:border-white/45 focus:bg-white/15 focus:ring-2 focus:ring-white/25 motion-reduce:transition-none"
      />
      {hasSearchQuery && (
        <button
          type="button"
          onClick={clearSearch}
          aria-label={isArabic ? "مسح بحث التنقل" : "Clear navigation search"}
          className="absolute end-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white/60 opacity-100 transition-colors duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
)}
```

Keep the search placeholder and no-results copy in the sidebar’s existing locale branch so this focused change does not alter the translation namespace contract: English uses `Search tabs...`, `Clear navigation search`, and `No tabs found`; Arabic uses `ابحث في التبويبات...`, `مسح بحث التنقل`, and `لم يتم العثور على تبويبات`.

- [ ] **Step 5: Render filtered results and no-results state**

Replace the menu map’s source with `displayMenuItems`, preserving the current item/link callback body unchanged. Wrap that existing map in a conditional: when `hasSearchQuery && displayMenuItems.length === 0`, render `<p className="px-4 py-8 text-center text-sm text-white/60">{isArabic ? "لم يتم العثور على تبويبات" : "No tabs found"}</p>`; otherwise render the existing map callback with `displayMenuItems` as its source.

- [ ] **Step 6: Add the collapsed search trigger**

Render a square icon button beside the existing collapsed menu control when `!isOpen`, with localized `aria-label`, `cursor-pointer`, visible focus ring, and a 150–200ms transition. Its click handler sets the focus request ref and calls `onToggle?.()`.

- [ ] **Step 7: Run the focused tests and verify they pass**

Run: `npm run test:run -- src/components/layout/__tests__/Sidebar.test.tsx`

Expected: all search, subgroup, clear, collapsed-trigger, and existing toggle tests pass.

- [ ] **Step 8: Commit the UI behavior**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/__tests__/Sidebar.test.tsx
git commit -m "feat: add animated sidebar navigation search"
```

### Task 3: Verify RTL, accessibility, motion, and project health

**Files:**
- Modify: `src/components/layout/__tests__/Sidebar.test.tsx`

- [ ] **Step 1: Add Arabic search coverage**

Use the existing `next/navigation` test mock pattern with a mutable pathname and render an Arabic dashboard route such as `/ar/dashboard`. Assert the Arabic search label, Arabic matching subgroup/item, and RTL-aligned control are present.

- [ ] **Step 2: Add expansion restoration coverage**

Open a parent section, enter a query, clear it, and assert that the parent’s original expansion state remains open while temporary search expansions are removed.

- [ ] **Step 3: Run focused verification**

Run:

```bash
npm run test:run -- src/components/layout/__tests__/Sidebar.test.tsx
npm run typecheck
npx eslint src/config/navigation.ts src/components/layout/Sidebar.tsx src/components/layout/__tests__/Sidebar.test.tsx
git diff --check
```

Expected: focused tests pass, TypeScript has no errors, targeted ESLint has no errors, and `git diff --check` is clean.

- [ ] **Step 4: Review responsive behavior**

Manually verify the expanded input at mobile and desktop widths, the collapsed icon trigger at desktop widths, English LTR, Arabic RTL, keyboard focus, no-results state, clear transition, and `prefers-reduced-motion` behavior.

- [ ] **Step 5: Commit final test-only changes**

```bash
git add src/components/layout/__tests__/Sidebar.test.tsx
git commit -m "test: cover sidebar search localization and state"
```
