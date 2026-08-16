# Hero Journey Search Debounce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the Hero Journey missions API from firing once per keystroke while preserving responsive input, URL synchronization, and normal filter behavior.

**Architecture:** Keep `useUrlQueryState` unchanged. In `HeroJourneyMissionsPage`, derive a 300 ms debounced copy of the local `q` value with the existing `use-debounce` package, build the API filter from that value, and skip the loading effect while the raw and debounced values differ. The overview student selector remains unchanged because its search is client-side.

**Tech Stack:** React, Next.js, `use-debounce`, `useUrlQueryState`, Vitest, Testing Library, TypeScript, ESLint.

## Global Constraints

- Preserve immediate input rendering and existing URL synchronization.
- Use the existing `use-debounce` dependency and its 300 ms debounce interval.
- Do not change `useUrlQueryState` or API request contracts.
- Preserve cancellation, error handling, pagination, status, archived, academic-year, and term filtering.

---

### Task 1: Add regression coverage for the missions search boundary

**Files:**
- Create: `src/features/hero-journey/components/__tests__/HeroJourneyMissionsPage.test.tsx`
- Reference: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx`
- Reference: `src/features/hero-journey/services/heroJourneyService.ts`

**Interfaces:**
- Consumes: the missions page search input and `getHeroJourneyMissions` service call.
- Produces: a focused test proving the request is deferred during typing and sent once after 300 ms of inactivity.

- [ ] **Step 1: Write the failing test**

Use fake timers and mock the page dependencies needed to render the search input. Reset timers and mocks after each test. The core assertion should follow this sequence:

```tsx
vi.useFakeTimers();
const getHeroJourneyMissions = vi.mocked(heroJourneyService.getHeroJourneyMissions);
getHeroJourneyMissions.mockResolvedValue([]);

render(<HeroJourneyMissionsPage />);
const search = screen.getByPlaceholderText(
  "Search mission title, lesson, quiz, or mission ID",
);

await userEvent.type(search, "read");
expect(getHeroJourneyMissions).not.toHaveBeenCalledWith(
  expect.objectContaining({ search: "r" }),
);
expect(getHeroJourneyMissions).not.toHaveBeenCalledWith(
  expect.objectContaining({ search: "read" }),
);

await vi.advanceTimersByTimeAsync(299);
expect(getHeroJourneyMissions).not.toHaveBeenCalledWith(
  expect.objectContaining({ search: "read" }),
);

await vi.advanceTimersByTimeAsync(1);
expect(getHeroJourneyMissions).toHaveBeenCalledWith(
  expect.objectContaining({ search: "read" }),
);
```

Also cover clearing the input: after entering a value and allowing it to settle, clear it, advance 300 ms, and assert that the next request omits `search` or passes it as `undefined`.

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npx vitest run src/features/hero-journey/components/__tests__/HeroJourneyMissionsPage.test.tsx
```

Expected: FAIL because the current page consumes `queryState.values.q` immediately and calls the missions service while the user is typing.

### Task 2: Debounce the Hero Journey missions API filter

**Files:**
- Modify: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx:3,182-219,459-503`

**Interfaces:**
- Consumes: raw `queryState.values.q` from `useUrlQueryState`.
- Produces: `missionFilters.search` based on the debounced value and a fetch effect that waits for the search to settle.

- [ ] **Step 1: Import and derive the debounced search value**

Add the existing hook import and derive the 300 ms value beside `queryState`:

```tsx
import { useDebounce } from "use-debounce";

const [debouncedSearch] = useDebounce(queryState.values.q, 300);
const isSearchDebouncing = queryState.values.q !== debouncedSearch;
```

- [ ] **Step 2: Build the API filter from the debounced value**

Replace the raw query value in `missionFilters`:

```tsx
search: debouncedSearch || undefined,
```

Add `debouncedSearch` to the `useMemo` dependency list and keep `queryState.values.q` for the input value and URL behavior.

- [ ] **Step 3: Skip the loading effect while typing**

At the top of the missions loading effect, after the academic-context guard, add:

```tsx
if (isSearchDebouncing) {
  return;
}
```

Include `isSearchDebouncing` and `debouncedSearch` in the effect dependencies. This prevents a page reset or raw query update from causing an intermediate request with stale search text, while allowing the settled debounced value to trigger one request.

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
npx vitest run src/features/hero-journey/components/__tests__/HeroJourneyMissionsPage.test.tsx
```

Expected: PASS with no request for intermediate characters and one request after 300 ms.

### Task 3: Verify the feature and review the diff

**Files:**
- Review: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx`
- Review: `src/features/hero-journey/components/__tests__/HeroJourneyMissionsPage.test.tsx`

- [ ] **Step 1: Run Hero Journey service and focused component tests**

```bash
npx vitest run src/features/hero-journey/__tests__/heroJourneyService.test.ts src/features/hero-journey/components/__tests__/HeroJourneyMissionsPage.test.tsx
```

Expected: all tests pass.

- [ ] **Step 2: Run TypeScript and ESLint**

```bash
npm run typecheck
npx eslint src/features/hero-journey/components/HeroJourneyMissionsPage.tsx src/features/hero-journey/components/__tests__/HeroJourneyMissionsPage.test.tsx
```

Expected: both commands exit successfully without errors.

- [ ] **Step 3: Review the final diff**

```bash
git diff --check
git diff -- src/features/hero-journey/components/HeroJourneyMissionsPage.tsx src/features/hero-journey/components/__tests__/HeroJourneyMissionsPage.test.tsx
```

Confirm that only the search debounce boundary and its regression coverage changed; no shared hook, API contract, URL shape, or unrelated filter behavior is modified.
