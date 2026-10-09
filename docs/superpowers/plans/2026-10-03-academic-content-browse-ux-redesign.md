# Academic Content Browse UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Academic Content Library, Review Queue, and Preparation Templates browsing experiences so users work with localized names and actionable context instead of UUIDs, while polishing the editor's remaining technical-data leaks.

**Architecture:** Keep the existing Academic Content vertical slice and backend contracts intact. Add one shared read-only browse-options hook plus pure display-name helpers, then inject that state into feature filters and tables so each page owns one loading lifecycle. Preserve URL-driven filters, server pagination, permissions, and the existing Wave 3 review-detail redesign.

**Tech Stack:** Next.js App Router, React 19, TypeScript, next-intl, Tailwind CSS, Lucide icons, existing `src/components/ui` primitives, Vitest, and Testing Library.

**Spec:** `docs/superpowers/plans/2026-10-02-academic-content-wave-3-review-approval-preparation-templates.md` (this is a UI/UX hardening follow-up to the implemented Wave 3 scope).

## Global Constraints

- Work in the existing `feat/academic-content-center-wave-1-2` worktree and preserve all current uncommitted Wave 1/2/3 and review-page redesign changes.
- Do not modify backend endpoints or DTOs. The backend continues returning identifiers; the frontend resolves display names through existing academic and teacher-directory APIs.
- Never render academic year, term, stage, grade, section, classroom, subject, teacher, revision, approval, content, or template UUIDs as user-facing copy. When a lookup is unavailable, show a localized unavailable label rather than the identifier.
- Preserve URL-backed search, filters, pagination, and the backend's oldest-first review-queue ordering.
- Reuse `Button`, `Input`, `Select`, `FilterPanel`, `DataTable`, `EmptyState`, `PartialLoader`, `ConfirmDialog`, and other established components from `src/components/ui`; do not create competing generic primitives inside the feature.
- Preserve English/LTR and Arabic/RTL behavior. All new visible strings must exist in both `src/messages/en.json` and `src/messages/ar.json`.
- Use Lucide icons only, keep keyboard focus visible, do not use color as the sole state indicator, and retain minimum 44px touch targets where the existing UI component supports them.
- Verify responsive behavior at 375px, 768px, 1024px, and 1440px without horizontal page overflow. A table's own scroll container may scroll when needed.
- Run `clean-code-guard` after every production-code change and `test-guard` after every test change.
- Ask the user before running the repository-wide `npm run test:run`. Targeted tests, ESLint, typecheck, and build do not require additional approval.
- Do not commit `.next*`, `node_modules*`, screenshots, logs, or local environment files.

## Design Decisions

- Keep the established indigo primary and emerald success palette; do not import the UI skill's suggested font or a new color system.
- Use progressive disclosure for filters: search and common filters remain immediately visible, while type-specific/date filters remain in the expandable area.
- Show applied filters as removable chips with human-readable labels.
- Keep desktop data tables because they support comparison and server pagination, but improve each primary cell into a compact information hierarchy rather than adding more columns.
- Use localized absolute dates in `<time>` elements. Review Queue may additionally show relative age, but the accessible label and tooltip must include the absolute date.
- Keep fallback states explicit: loading, partial option failure, no results, request failure, and permission denial must remain distinguishable.

## Planned File Map

```text
src/features/academic-content/
├── hooks/
│   ├── useAcademicContentBrowseOptions.ts                  # shared academic/teacher option loading
│   └── __tests__/useAcademicContentBrowseOptions.test.tsx
├── model/
│   ├── academicContentDisplay.ts                           # pure localized name resolvers
│   └── __tests__/academicContentDisplay.test.ts
├── components/
│   ├── filters/AcademicContentAppliedFilters.tsx           # feature-specific applied-filter chips
│   ├── library/{AcademicContentFilters,AcademicContentTable}.tsx
│   ├── review/{ReviewQueueFilters,ReviewQueueTable}.tsx
│   ├── templates/{PreparationTemplateFilters,PreparationTemplateTable}.tsx
│   └── editor/{EditorSectionNav,ReadinessPanel,RevisionHistoryPanel}.tsx
├── pages/
│   ├── AcademicContentLibraryPage.tsx
│   ├── AcademicContentReviewQueuePage.tsx
│   ├── PreparationTemplatesPage.tsx
│   └── AcademicContentEditorPage.tsx
└── existing colocated tests

src/messages/{en,ar}.json
src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

---

### Task 1: Centralize Browse Options and Localized Display Names

**Files:**
- Create: `src/features/academic-content/model/academicContentDisplay.ts`
- Create: `src/features/academic-content/model/__tests__/academicContentDisplay.test.ts`
- Create: `src/features/academic-content/hooks/useAcademicContentBrowseOptions.ts`
- Create: `src/features/academic-content/hooks/__tests__/useAcademicContentBrowseOptions.test.tsx`

**Interfaces:**
- Consumes: `loadAcademicTargetOptions`, `teacherApi.list`, `AcademicTargetOptions`, `TeacherDirectoryListItem`, and the active academic year/term layout context.
- Produces:

```ts
export interface AcademicContentBrowseOptionsState {
  targetOptions: AcademicTargetOptions | null;
  teachers: TeacherDirectoryListItem[];
  isLoadingTargets: boolean;
  isLoadingTeachers: boolean;
  targetOptionsUnavailable: boolean;
  teachersUnavailable: boolean;
}

export function useAcademicContentBrowseOptions(input?: {
  includeTeachers?: boolean;
}): AcademicContentBrowseOptionsState;

export function localizedAcademicName(
  entity: { name: string; nameAr?: string; nameEn?: string } | undefined,
  locale: string,
): string | undefined;

export function academicTargetScopeName(
  target: Pick<AcademicContentTarget, "scopeType" | "stageId" | "gradeId" | "sectionId" | "classroomId">,
  options: AcademicTargetOptions | null,
  locale: string,
): string | undefined;

export function academicSubjectName(
  subjectId: string | null | undefined,
  options: AcademicTargetOptions | null,
  locale: string,
): string | undefined;

export function teacherDisplayName(
  userId: string | null | undefined,
  teachers: TeacherDirectoryListItem[],
): string | undefined;
```

- [ ] **Step 1: Write failing pure resolver tests**

```ts
expect(localizedAcademicName(grade, "ar")).toBe("الصف الخامس");
expect(academicTargetScopeName(gradeTarget, options, "en")).toBe("Grade 5");
expect(academicSubjectName("subject-1", options, "ar")).toBe("الرياضيات");
expect(teacherDisplayName("teacher-user-1", teachers)).toBe("Mona Ali");
expect(teacherDisplayName("missing-user", teachers)).toBeUndefined();
```

- [ ] **Step 2: Run the resolver tests and verify they fail**

Run:

```bash
npm run test:run -- src/features/academic-content/model/__tests__/academicContentDisplay.test.ts
```

Expected: failure because `academicContentDisplay.ts` does not exist.

- [ ] **Step 3: Implement the pure resolvers**

Use explicit `scopeType` branches and array lookups. Return `undefined` for unresolved identifiers; never return the identifier as a label.

```ts
if (target.scopeType === "GRADE") {
  return localizedAcademicName(
    options?.structure.grades.find((grade) => grade.id === target.gradeId),
    locale,
  );
}
```

- [ ] **Step 4: Write failing hook tests**

Cover successful target/teacher loading, `includeTeachers: false`, missing year/term, independent partial failures, academic-context changes, and stale-response suppression.

```ts
expect(result.current.targetOptionsUnavailable).toBe(true);
expect(result.current.teachersUnavailable).toBe(false);
expect(teacherApi.list).toHaveBeenCalledWith({ page: 1, limit: 100 });
```

- [ ] **Step 5: Implement the shared hook**

Load academic options only when both context identifiers exist. Load the teacher directory only when requested. Keep failures independent so a teacher-directory failure does not disable academic selectors.

- [ ] **Step 6: Run targeted tests**

```bash
npm run test:run -- src/features/academic-content/model/__tests__/academicContentDisplay.test.ts src/features/academic-content/hooks/__tests__/useAcademicContentBrowseOptions.test.tsx
```

Expected: both files pass.

- [ ] **Step 7: Apply Test Guard and Clean Code Guard, then commit**

```bash
git add src/features/academic-content/model/academicContentDisplay.ts src/features/academic-content/model/__tests__/academicContentDisplay.test.ts src/features/academic-content/hooks/useAcademicContentBrowseOptions.ts src/features/academic-content/hooks/__tests__/useAcademicContentBrowseOptions.test.tsx
git commit -m "refactor(academic-content): centralize browse display options"
```

### Task 2: Redesign the Academic Content Library Filters and Results

**Files:**
- Create: `src/features/academic-content/components/filters/AcademicContentAppliedFilters.tsx`
- Modify: `src/features/academic-content/components/library/AcademicContentFilters.tsx`
- Modify: `src/features/academic-content/components/library/AcademicContentTable.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentLibraryPage.tsx`
- Modify: `src/features/academic-content/components/library/__tests__/AcademicContentFilters.test.tsx`
- Modify: `src/features/academic-content/components/library/__tests__/AcademicContentTable.test.tsx`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentLibraryPage.test.tsx`

**Interfaces:**
- Consumes: `AcademicContentBrowseOptionsState` and Task 1 display-name resolvers.
- Produces:

```ts
export interface AppliedAcademicContentFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface AcademicContentFiltersProps {
  // existing props remain
  browseOptions: AcademicContentBrowseOptionsState;
}
```

- [ ] **Step 1: Add failing filter tests for name-based cascade controls**

Assert that the page shows `Primary`, `Grade 5`, `Section A`, `Class 5A`, and `Mathematics`, and does not render their UUIDs. Verify dependent clearing:

```ts
fireEvent.click(screen.getByLabelText("Stage"));
fireEvent.click(screen.getByRole("button", { name: "Secondary" }));
expect(onFiltersChange).toHaveBeenCalledWith({
  stageId: "stage-2",
  gradeId: "",
  sectionId: "",
  classroomId: "",
});
```

- [ ] **Step 2: Add failing applied-filter tests**

Verify human-readable chips, individual removal, clear-all, and keyboard-accessible remove buttons. The DOM must not contain `stage-1`, `grade-1`, `subject-1`, or `teacher-user-1` as visible text.

- [ ] **Step 3: Run the three targeted Library test files and verify failure**

```bash
npm run test:run -- src/features/academic-content/components/library/__tests__/AcademicContentFilters.test.tsx src/features/academic-content/components/library/__tests__/AcademicContentTable.test.tsx src/features/academic-content/pages/__tests__/AcademicContentLibraryPage.test.tsx
```

- [ ] **Step 4: Replace raw ID inputs with shared searchable selectors**

Remove the five text inputs for `stageId`, `gradeId`, `sectionId`, `classroomId`, and `subjectId`. Use `Select` with these dependencies:

```text
Stage -> limits Grade
Grade -> limits Section
Section -> limits Classroom
Selected scope -> leaves Subject searchable
Teacher -> uses loaded teacher display names
```

Place type, status, and audience in `FilterPanel.bodySlot` so the common filters stay visible. Keep the academic scope, teacher, dates, resource category, platform, guardian priority, and tag in the expandable `filtersSlot`.

- [ ] **Step 5: Add applied-filter chips through `FilterPanel.bodySlot`**

Each chip uses the resolved label and a `Button` or semantic button for removal. Announce the result count with `aria-live="polite"` after filter changes.

- [ ] **Step 6: Improve Library result hierarchy without changing contracts**

Render the title cell as title plus localized type, keep status as a badge, group audience and summary as secondary information, and retain localized update time. Do not add backend-derived values that are absent from `AcademicContentLibraryItem`.

- [ ] **Step 7: Re-run Library tests**

Expected: selectors cascade correctly, UUIDs are absent, URL filter callbacks remain exact, and loading/error/empty/pagination behavior is unchanged.

- [ ] **Step 8: Apply Test Guard and Clean Code Guard, then commit**

```bash
git add src/features/academic-content/components/filters src/features/academic-content/components/library src/features/academic-content/pages/AcademicContentLibraryPage.tsx src/features/academic-content/pages/__tests__/AcademicContentLibraryPage.test.tsx
git commit -m "feat(academic-content): redesign content library browsing"
```

### Task 3: Redesign the Review Queue for Fast Triage

**Files:**
- Modify: `src/features/academic-content/components/review/ReviewQueueFilters.tsx`
- Modify: `src/features/academic-content/components/review/ReviewQueueTable.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentReviewQueuePage.tsx`
- Modify: `src/features/academic-content/components/review/__tests__/ReviewQueueFilters.test.tsx`
- Modify: `src/features/academic-content/components/review/__tests__/ReviewQueueTable.test.tsx`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentReviewQueuePage.test.tsx`

**Interfaces:**

```ts
interface ReviewQueueFiltersProps {
  // existing props remain
  browseOptions: AcademicContentBrowseOptionsState;
}

interface ReviewQueueTableProps {
  // existing props remain
  targetOptions: AcademicTargetOptions | null;
  teachers: TeacherDirectoryListItem[];
}
```

- [ ] **Step 1: Add failing review-table tests for resolved names**

```ts
expect(screen.getByText("Mona Ali")).toBeInTheDocument();
expect(screen.getByText("Grade 5")).toBeInTheDocument();
expect(screen.getByText("Mathematics")).toBeInTheDocument();
expect(screen.queryByText("teacher-user-1")).not.toBeInTheDocument();
```

Also verify unresolved users and targets show localized unavailable copy rather than IDs.

- [ ] **Step 2: Add failing page tests for triage hierarchy**

Assert the page exposes the pending total, explains oldest-first ordering, keeps title/round/submission time visible, and opens the exact submitted revision when a row is activated.

- [ ] **Step 3: Run targeted Review Queue tests and verify failure**

```bash
npm run test:run -- src/features/academic-content/components/review/__tests__/ReviewQueueFilters.test.tsx src/features/academic-content/components/review/__tests__/ReviewQueueTable.test.tsx src/features/academic-content/pages/__tests__/AcademicContentReviewQueuePage.test.tsx
```

- [ ] **Step 4: Lift option loading into the page**

Call `useAcademicContentBrowseOptions({ includeTeachers: true })` once. Remove the duplicate academic/teacher effects from `ReviewQueueFilters` and pass the same data to both filters and table.

- [ ] **Step 5: Recompose queue rows**

Use a strong title cell with a round badge, a localized `<time>`, the submitter display name, and up to two resolved target summaries followed by localized `+N` overflow copy. Keep row navigation and server pagination unchanged.

- [ ] **Step 6: Add partial-data feedback**

If target or teacher options fail, show one non-blocking warning above the results. The queue remains usable and never exposes identifiers.

- [ ] **Step 7: Re-run Review Queue tests**

Expected: oldest-first input order is preserved, all display names resolve when available, and partial failures degrade to localized unavailable labels.

- [ ] **Step 8: Apply Test Guard and Clean Code Guard, then commit**

```bash
git add src/features/academic-content/components/review src/features/academic-content/pages/AcademicContentReviewQueuePage.tsx src/features/academic-content/pages/__tests__/AcademicContentReviewQueuePage.test.tsx
git commit -m "feat(academic-content): redesign review queue triage"
```

### Task 4: Redesign the Preparation Template Library

**Files:**
- Modify: `src/features/academic-content/components/templates/PreparationTemplateFilters.tsx`
- Modify: `src/features/academic-content/components/templates/PreparationTemplateTable.tsx`
- Modify: `src/features/academic-content/pages/PreparationTemplatesPage.tsx`
- Modify: `src/features/academic-content/components/templates/__tests__/PreparationTemplateFilters.test.tsx`
- Modify: `src/features/academic-content/components/templates/__tests__/PreparationTemplateTable.test.tsx`
- Modify: `src/features/academic-content/pages/__tests__/PreparationTemplatesPage.test.tsx`

**Interfaces:**

```ts
interface PreparationTemplateTableProps {
  // existing props remain
  targetOptions: AcademicTargetOptions | null;
}
```

- [ ] **Step 1: Add failing tests for localized template scope**

Assert `Primary` and `Mathematics` appear for scoped templates, localized “All stages”/“All subjects” appear for null scope, and `stage-1`/`subject-1` never appear as visible text.

- [ ] **Step 2: Add failing page hierarchy tests**

Verify a proper page heading, descriptive copy, total template count, permission-gated New Template action, filter panel, table, and delete confirmation.

- [ ] **Step 3: Run targeted Template Library tests and verify failure**

```bash
npm run test:run -- src/features/academic-content/components/templates/__tests__/PreparationTemplateFilters.test.tsx src/features/academic-content/components/templates/__tests__/PreparationTemplateTable.test.tsx src/features/academic-content/pages/__tests__/PreparationTemplatesPage.test.tsx
```

- [ ] **Step 4: Lift target-option loading into the page**

Call `useAcademicContentBrowseOptions({ includeTeachers: false })` and pass the same target options to the filters and table. Remove the filter component's private loading effect.

- [ ] **Step 5: Build the redesigned page header and table cells**

Use the existing `Button`, Lucide `LayoutTemplate`, and current card tokens. Render the template name and description together, scope as named chips, preparation contents as labeled counts, and update time as localized `<time>`.

- [ ] **Step 6: Preserve destructive-action safety**

Keep `ConfirmDialog`, permission checks, disabled/loading states, and soft-delete refresh behavior unchanged. Do not make the entire row clickable because edit and delete are distinct actions.

- [ ] **Step 7: Re-run Template Library tests**

Expected: page hierarchy and names pass while CRUD, permissions, pagination, and confirmation behavior remain intact.

- [ ] **Step 8: Apply Test Guard and Clean Code Guard, then commit**

```bash
git add src/features/academic-content/components/templates src/features/academic-content/pages/PreparationTemplatesPage.tsx src/features/academic-content/pages/__tests__/PreparationTemplatesPage.test.tsx
git commit -m "feat(academic-content): redesign template library"
```

### Task 5: Remove Remaining Technical Data from the Editor Experience

**Files:**
- Modify: `src/features/academic-content/components/editor/EditorSectionNav.tsx`
- Create: `src/features/academic-content/components/editor/__tests__/EditorSectionNav.test.tsx`
- Modify: `src/features/academic-content/components/editor/ReadinessPanel.tsx`
- Modify: `src/features/academic-content/components/editor/__tests__/ReadinessPanel.test.tsx`
- Modify: `src/features/academic-content/components/editor/RevisionHistoryPanel.tsx`
- Modify: `src/features/academic-content/components/editor/__tests__/RevisionHistoryPanel.test.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`

**Interfaces:**

```ts
export type EditorSectionIndicator =
  | "unsaved"
  | "saving"
  | "error"
  | "ready"
  | "blocked";

interface EditorSectionNavProps {
  activeSection: AcademicContentEditorPanel;
  onChange: (section: AcademicContentEditorPanel) => void;
  variant: "desktop" | "mobile";
  indicators?: Partial<Record<AcademicContentEditorPanel, EditorSectionIndicator>>;
}
```

- [ ] **Step 1: Add failing navigation-indicator tests**

Verify visible icon/text or screen-reader text for unsaved, saving, error, ready, and blocked states. Verify state is not communicated by color alone.

- [ ] **Step 2: Add failing readiness and revision-history tests**

```ts
expect(screen.queryByText(/\{"/u)).not.toBeInTheDocument();
expect(screen.queryByText("2026-09-30T00:00:00.000Z")).not.toBeInTheDocument();
expect(screen.getByText(localizedCapturedDate)).toBeInTheDocument();
```

- [ ] **Step 3: Run the four targeted editor test files and verify failure**

```bash
npm run test:run -- src/features/academic-content/components/editor/__tests__/EditorSectionNav.test.tsx src/features/academic-content/components/editor/__tests__/ReadinessPanel.test.tsx src/features/academic-content/components/editor/__tests__/RevisionHistoryPanel.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx
```

- [ ] **Step 4: Derive section indicators in `AcademicContentEditorPage`**

Use the existing section state with strict precedence:

```ts
const indicator = section.error
  ? "error"
  : section.saving
    ? "saving"
    : section.dirty
      ? "unsaved"
      : undefined;
```

Map readiness to `ready` or `blocked`. Do not infer completion for sections without an authoritative rule.

- [ ] **Step 5: Remove raw readiness diagnostics**

Keep the localized reason text and omit `reason.details` from the user interface. The backend reason message remains the fallback only for unknown codes; raw objects and UUIDs are not displayed.

- [ ] **Step 6: Localize revision timestamps**

Use the shared `formatRevisionDateTime` helper and semantic `<time dateTime={revision.capturedAt}>`. Keep revision number, snapshot version, title, pagination, and modal behavior unchanged.

- [ ] **Step 7: Re-run targeted editor tests**

Expected: status indicators are accessible, raw JSON/ISO strings are absent, and editor navigation still selects the correct panel.

- [ ] **Step 8: Apply Test Guard and Clean Code Guard, then commit**

```bash
git add src/features/academic-content/components/editor src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx
git commit -m "fix(academic-content): remove technical editor presentation"
```

### Task 6: Complete Localization and Cross-Page Acceptance Coverage

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/academicContentWorkflowTranslations.test.ts`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx`

- [ ] **Step 1: Add failing translation parity assertions**

Cover browse option warnings, unavailable-name fallback, applied-filter removal, result totals, oldest-first queue help, target overflow, template page header, and editor indicator labels in both languages.

- [ ] **Step 2: Extend the workflow acceptance test**

The acceptance sequence must prove:

```text
Library selects Grade 5 and Mathematics by name
Library opens the selected content without displaying filter UUIDs
Review Queue shows submitter and target names
Review page opens the immutable submitted revision
Template Library shows named scope and opens edit
Editor readiness/history contain no raw JSON, UUID, or ISO timestamp
```

- [ ] **Step 3: Run the acceptance and translation tests**

```bash
npm run test:run -- src/messages/__tests__/academicContentWorkflowTranslations.test.ts src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx
```

Expected: both pass with no publish/notification behavior introduced.

- [ ] **Step 4: Run all redesign-targeted tests together**

```bash
npm run test:run -- src/features/academic-content/model/__tests__/academicContentDisplay.test.ts src/features/academic-content/hooks/__tests__/useAcademicContentBrowseOptions.test.tsx src/features/academic-content/components/library/__tests__/AcademicContentFilters.test.tsx src/features/academic-content/components/library/__tests__/AcademicContentTable.test.tsx src/features/academic-content/pages/__tests__/AcademicContentLibraryPage.test.tsx src/features/academic-content/components/review/__tests__/ReviewQueueFilters.test.tsx src/features/academic-content/components/review/__tests__/ReviewQueueTable.test.tsx src/features/academic-content/pages/__tests__/AcademicContentReviewQueuePage.test.tsx src/features/academic-content/components/templates/__tests__/PreparationTemplateFilters.test.tsx src/features/academic-content/components/templates/__tests__/PreparationTemplateTable.test.tsx src/features/academic-content/pages/__tests__/PreparationTemplatesPage.test.tsx src/features/academic-content/components/editor/__tests__/EditorSectionNav.test.tsx src/features/academic-content/components/editor/__tests__/ReadinessPanel.test.tsx src/features/academic-content/components/editor/__tests__/RevisionHistoryPanel.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx
```

- [ ] **Step 5: Run static verification**

```bash
npx eslint src/features/academic-content src/messages/__tests__/academicContentWorkflowTranslations.test.ts
npm run typecheck
npm run build
git diff --check
```

- [ ] **Step 6: Run final guard reviews**

Run Test Guard on the complete test diff and Clean Code Guard on the complete production diff. Resolve findings, then repeat only the affected targeted tests.

- [ ] **Step 7: Manually verify both locales**

Verify English/LTR and Arabic/RTL at 375px, 768px, 1024px, and 1440px for Library, Review Queue, Templates, and Editor. Confirm keyboard navigation, focus visibility, filter removal, loading/error/empty states, row actions, and absence of visible UUIDs or raw JSON.

- [ ] **Step 8: Ask before the full suite**

Stop and ask the user before running the unscoped command:

```bash
npm run test:run
```

- [ ] **Step 9: Commit the localization and acceptance gate**

```bash
git add src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx
git commit -m "test(academic-content): cover redesigned browse experiences"
```

## Plan Self-Review

- The Library task replaces all five raw academic identifier inputs with named cascading selectors and keeps every existing backend filter.
- The Review Queue task resolves submitter and target labels, preserves server ordering, and remains usable during partial lookup failures.
- The Templates task removes stage/subject identifiers and strengthens hierarchy without changing CRUD semantics.
- The Editor task is intentionally a focused cleanup, not another full redesign; it removes raw JSON/ISO presentation and adds authoritative state indicators only.
- Shared option loading avoids three independent implementations and keeps business-independent primitives in `src/components/ui`.
- Every production task has a focused red/green test cycle, a Clean Code Guard review, a Test Guard review, and an independently reviewable commit.
- No task requires a backend change, changes permissions, adds publication/notification behavior, or alters immutable revision semantics.
- The repository-wide test suite remains explicitly gated on user approval.
