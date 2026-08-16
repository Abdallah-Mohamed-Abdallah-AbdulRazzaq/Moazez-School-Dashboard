# Nedaa Academics Context Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap Nedaa in the shared academic year/term context and populate staff-assignment academic filters and forms from the selected term's structure tree.

**Architecture:** Reuse `AcademicsContextLayout` at the route boundary. Load the existing `fetchStructureTree` service through a focused Nedaa hook, derive hierarchical options with pure selectors, and keep dismissal listing and mutations on their existing server contracts.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl, existing academics structure services, Vitest, Testing Library.

## Global Constraints

- Use the existing `AcademicsContextLayout`, `useAcademicYearTermLayoutContext`, and `fetchStructureTree` contracts.
- Use default academic context query keys: `year`, `term`, and `status`.
- Do not add academic year or term fields to dismissal API requests.
- Source all general stage, grade, section, and classroom options from the selected term's structure tree.
- Keep assignment list filters server-side and reset pagination to page one when filters change.
- Keep table skeleton loading for assignment refetches.
- Preserve unrelated working-tree changes.

---

### Task 1: Wrap The Nedaa Route In Academics Context

**Files:**

- Modify: `src/app/[lang]/(dashboard)/nedaa/layout.tsx`
- Create: `src/app/[lang]/(dashboard)/nedaa/__tests__/layout.test.tsx`

**Interfaces:**

- Consumes: `AcademicsContextLayout({ children })`.
- Produces: Every Nedaa route receives `AcademicYearTermLayoutProvider` and the shared context bar.

- [ ] **Step 1: Write the failing layout test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NedaaLayout from "../layout";

vi.mock(
  "@/features/academics/components/layout/AcademicsContextLayout",
  () => ({
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="academics-context">{children}</div>
    ),
  }),
);

describe("NedaaLayout", () => {
  it("wraps Nedaa routes in the shared academics context", () => {
    render(
      <NedaaLayout>
        <div>Nedaa content</div>
      </NedaaLayout>,
    );
    expect(screen.getByTestId("academics-context")).toHaveTextContent(
      "Nedaa content",
    );
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:run -- "src/app/[lang]/(dashboard)/nedaa/__tests__/layout.test.tsx"`

Expected: FAIL because the layout does not render the mocked wrapper.

- [ ] **Step 3: Implement the route wrapper**

```tsx
import AcademicsContextLayout from "@/features/academics/components/layout/AcademicsContextLayout";

export default function NedaaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AcademicsContextLayout>{children}</AcademicsContextLayout>;
}
```

- [ ] **Step 4: Run the layout test and typecheck**

Run: `npm run test:run -- "src/app/[lang]/(dashboard)/nedaa/__tests__/layout.test.tsx" && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the layout integration**

```bash
git add "src/app/[lang]/(dashboard)/nedaa/layout.tsx" "src/app/[lang]/(dashboard)/nedaa/__tests__/layout.test.tsx"
git commit -m "feat(nedaa): add academics context layout"
```

---

### Task 2: Academic Tree Loader And Hierarchical Selectors

**Files:**

- Create: `src/features/nedaa/hooks/useNedaaAcademicStructure.ts`
- Create: `src/features/nedaa/utils/nedaaAcademicOptions.ts`
- Create: `src/features/nedaa/utils/__tests__/nedaaAcademicOptions.test.ts`
- Create: `src/features/nedaa/hooks/__tests__/useNedaaAcademicStructure.test.tsx`

**Interfaces:**

- Consumes: `academicYearId`, `termId`, `isInitializing`, and `fetchStructureTree(yearId, termId)`.
- Produces:

```ts
export interface NedaaAcademicSelection {
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
}

export interface NedaaAcademicOptions {
  stages: SelectOption[];
  grades: SelectOption[];
  sections: SelectOption[];
  classrooms: SelectOption[];
}

export function getNedaaAcademicOptions(
  tree: StructureTree,
  selection: NedaaAcademicSelection,
  locale: string,
): NedaaAcademicOptions;

export function reconcileNedaaAcademicSelection(
  tree: StructureTree,
  selection: NedaaAcademicSelection,
): NedaaAcademicSelection;

export function useNedaaAcademicStructure(): {
  tree: StructureTree | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
};
```

- [ ] **Step 1: Write failing selector tests**

Use a real `StructureTree` fixture with two branches. Assert:

```ts
it("limits descendants to the selected parent branch", () => {
  const options = getNedaaAcademicOptions(
    tree,
    {
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "",
    },
    "en",
  );
  expect(options.grades.map(({ value }) => value)).toEqual(["grade-1"]);
  expect(options.sections.map(({ value }) => value)).toEqual(["section-1"]);
  expect(options.classrooms.map(({ value }) => value)).toEqual(["room-1"]);
});

it("clears descendants that do not belong to their selected parents", () => {
  expect(
    reconcileNedaaAcademicSelection(tree, {
      stageId: "stage-2",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "room-1",
    }),
  ).toEqual({
    stageId: "stage-2",
    gradeId: "",
    sectionId: "",
    classroomId: "",
  });
});
```

Also assert Arabic uses `nameAr`, English uses `nameEn`, and both fall back to `name`.

- [ ] **Step 2: Run selector tests and verify RED**

Run: `npm run test:run -- src/features/nedaa/utils/__tests__/nedaaAcademicOptions.test.ts`

Expected: FAIL because the selector module does not exist.

- [ ] **Step 3: Implement selectors**

Map nodes to `{ value: node.id, label }`, sort by `order`, and filter each descendant array by its selected parent ID. `reconcileNedaaAcademicSelection` validates relationships in order: grade belongs to stage, section belongs to grade, classroom belongs to section; once a parent is invalid, clear that node and every descendant.

- [ ] **Step 4: Run selector tests and verify GREEN**

Run: `npm run test:run -- src/features/nedaa/utils/__tests__/nedaaAcademicOptions.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing hook tests**

Mock only the academics context and `fetchStructureTree` service boundaries. Verify:

```ts
it("loads the selected year and term tree", async () => {
  mockContext({ academicYearId: "year-1", termId: "term-1" });
  fetchStructureTreeMock.mockResolvedValue(tree);
  const { result } = renderHook(() => useNedaaAcademicStructure());
  await waitFor(() => expect(result.current.tree).toEqual(tree));
  expect(fetchStructureTreeMock).toHaveBeenCalledWith("year-1", "term-1");
});

it("ignores a stale tree after context changes", async () => {
  // Keep year-1 pending, rerender with year-2, resolve year-2 first, then year-1.
  // Assert the hook retains only the year-2 tree.
});

it("preserves a null tree error state and retries", async () => {
  // Reject once, invoke retry, resolve next call, and assert recovery.
});
```

- [ ] **Step 6: Run hook tests and verify RED**

Run: `npm run test:run -- src/features/nedaa/hooks/__tests__/useNedaaAcademicStructure.test.tsx`

Expected: FAIL because the hook does not exist.

- [ ] **Step 7: Implement the tree hook**

Read `academicYearId`, `termId`, and `isInitializing` from `useAcademicYearTermLayoutContext`. Clear the previous tree before each context load, track a request sequence to ignore stale completions, expose the caught `Error.message`, and increment an internal retry key from `retry()`.

- [ ] **Step 8: Run Task 2 tests and typecheck**

Run: `npm run test:run -- src/features/nedaa/utils/__tests__/nedaaAcademicOptions.test.ts src/features/nedaa/hooks/__tests__/useNedaaAcademicStructure.test.tsx && npm run typecheck`

Expected: PASS.

- [ ] **Step 9: Commit the academic option layer**

```bash
git add src/features/nedaa/hooks src/features/nedaa/utils/nedaaAcademicOptions.ts src/features/nedaa/utils/__tests__/nedaaAcademicOptions.test.ts
git commit -m "feat(nedaa): load academics tree options"
```

---

### Task 3: Staff Assignment Filters And Form Integration

**Files:**

- Modify: `src/features/nedaa/pages/NedaaStaffAssignmentsPage.tsx`
- Create: `src/features/nedaa/pages/__tests__/NedaaStaffAssignmentsPage.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/nedaaTranslations.test.ts`

**Interfaces:**

- Consumes: Task 2's hook and selectors.
- Produces: tree-backed, hierarchical server-side list filters and assignment form fields.

- [ ] **Step 1: Write failing page integration tests**

Mock the dismissal API, settings-user API, and Task 2 hook boundaries. Use real select interactions to verify:

```ts
it("offers tree nodes when the assignment response is empty", async () => {
  academicTreeHookMock.mockReturnValue({ tree, isLoading: false, error: null, retry });
  listAssignmentsMock.mockResolvedValue(emptyAssignmentsResponse);
  render(<NedaaStaffAssignmentsPage />);
  await user.click(screen.getByRole("button", { name: /stage/i }));
  expect(screen.getByRole("option", { name: "Primary" })).toBeVisible();
});

it("clears invalid descendants and sends selected tree IDs server-side", async () => {
  // Select stage-1/grade-1/section-1, then switch to stage-2.
  // Assert grade/section selections clear and the final list call contains stageId only.
});

it("keeps assignment rows visible when tree loading fails and retries", async () => {
  academicTreeHookMock.mockReturnValue({ tree: null, isLoading: false, error: "failed", retry });
  render(<NedaaStaffAssignmentsPage />);
  expect(await screen.findByText(existingAssignment.staff.displayName)).toBeVisible();
  await user.click(screen.getByRole("button", { name: /retry/i }));
  expect(retry).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run page tests and verify RED**

Run: `npm run test:run -- src/features/nedaa/pages/__tests__/NedaaStaffAssignmentsPage.test.tsx`

Expected: FAIL because options still come from assignment rows and no tree error retry exists.

- [ ] **Step 3: Replace response-harvested options**

Remove `getAcademicFilterOptions`, `uniqueSelectOptions`, and the accumulating `academicFilterOptions` state. Call `useNedaaAcademicStructure`, derive separate filter and form options with `getNedaaAcademicOptions`, and retain only a current edit-value fallback when an assigned node is absent from the tree.

- [ ] **Step 4: Implement hierarchical state transitions**

For each stage/grade/section change, construct the next selection, pass it through `reconcileNedaaAcademicSelection`, update all four IDs together, and reset page one for list filters. Use the same reconciliation for form state without changing pagination.

Disable academic dropdowns while context or tree loading prevents valid selection. Keep search, staff, gate, active, and lead filters usable during a tree error.

- [ ] **Step 5: Add localized error and retry copy**

Add identical keys in English and Arabic:

```text
nedaa.messages.load_academic_structure_failed
nedaa.actions.retry_academic_structure
```

Extend `requiredNedaaKeys` in `src/messages/__tests__/nedaaTranslations.test.ts` with both paths.

- [ ] **Step 6: Run integration and translation tests**

Run: `npm run test:run -- src/features/nedaa/pages/__tests__/NedaaStaffAssignmentsPage.test.tsx src/messages/__tests__/nedaaTranslations.test.ts`

Expected: PASS.

- [ ] **Step 7: Run complete verification**

```bash
npm run test:run -- "src/app/[lang]/(dashboard)/nedaa/__tests__/layout.test.tsx" src/features/nedaa/utils/__tests__/nedaaAcademicOptions.test.ts src/features/nedaa/hooks/__tests__/useNedaaAcademicStructure.test.tsx src/features/nedaa/pages/__tests__/NedaaStaffAssignmentsPage.test.tsx src/features/nedaa/services/__tests__/dismissalApiService.test.ts src/features/nedaa/utils/__tests__/nedaaFilters.test.ts src/messages/__tests__/nedaaTranslations.test.ts
npm run typecheck
npx eslint "src/app/[lang]/(dashboard)/nedaa/layout.tsx" src/features/nedaa/hooks src/features/nedaa/utils/nedaaAcademicOptions.ts src/features/nedaa/pages/NedaaStaffAssignmentsPage.tsx
npx prettier --check "src/app/[lang]/(dashboard)/nedaa/layout.tsx" src/features/nedaa/hooks src/features/nedaa/utils/nedaaAcademicOptions.ts src/features/nedaa/pages/NedaaStaffAssignmentsPage.tsx src/messages/en.json src/messages/ar.json
git diff --check
```

Expected: all commands exit `0`.

- [ ] **Step 8: Commit the page integration**

```bash
git add src/features/nedaa/pages/NedaaStaffAssignmentsPage.tsx src/features/nedaa/pages/__tests__/NedaaStaffAssignmentsPage.test.tsx src/messages/en.json src/messages/ar.json src/messages/__tests__/nedaaTranslations.test.ts
git commit -m "feat(nedaa): source filters from academics tree"
```
