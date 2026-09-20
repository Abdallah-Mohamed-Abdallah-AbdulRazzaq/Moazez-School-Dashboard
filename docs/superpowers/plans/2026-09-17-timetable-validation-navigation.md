# Timetable Validation Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the validation drawer's single long feed with accessible, count-badged navigation and progressive disclosure.

**Architecture:** Keep `ValidationPanel` as the drawer owner and derive four presentational areas from its existing validation, conflict, and publication data: overview, subject issues, conflicts, and publish blockers. Use the established MUI tab primitives for keyboard-accessible navigation, plus the existing UI `Button` for the overview's primary action; do not change API contracts or validation data.

**Tech Stack:** Next.js, React, TypeScript, MUI Drawer/Tabs/Accordion, Tailwind, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-17-timetable-contract-alignment-design.md`

## Global Constraints

- Reuse existing UI components from `src/components/ui` where available; use established MUI tabs because the UI library has no shared tab component.
- Preserve Arabic and English copy, right-to-left direction, current conflict selection, and all existing validation data.
- Keep the change limited to timetable validation navigation and its tests.
- Do not run the repository-wide test suite without explicit user approval.

---

### Task 1: Add a failing navigation regression test

**Files:**
- Modify: `src/features/academics/timetable/components/__tests__/ValidationPanel.test.tsx`

**Interfaces:**
- Consumes: `ValidationPanel` props and Testing Library's role-based queries.
- Produces: a regression test proving that selected tab content is shown while unrelated long-list content is hidden.

- [ ] **Step 1: Write the failing test**

```tsx
renderPanel({
  conflicts: [knownPeriodConflict],
  publicationReasons: [
    { code: "under_scheduled_subject", message: "Scheduled periods are below weekly hours." },
  ],
});

await user.click(screen.getByRole("tab", { name: /Publish blockers/i }));

expect(screen.getByText("Scheduled periods are below the required weekly hours.")).toBeInTheDocument();
expect(screen.queryByText("Teacher intervals overlap.")).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the component test and verify it fails**

Run: `npm exec vitest -- run src/features/academics/timetable/components/__tests__/ValidationPanel.test.tsx`

Expected: FAIL because the panel has no publish-blocker tab.

- [ ] **Step 3: Commit after implementation and verification**

```powershell
git add src/features/academics/timetable/components/__tests__/ValidationPanel.test.tsx src/features/academics/timetable/components/ValidationPanel.tsx
git commit -m "feat(timetable): streamline validation navigation"
```

### Task 2: Implement count-badged validation navigation

**Files:**
- Modify: `src/features/academics/timetable/components/ValidationPanel.tsx`

**Interfaces:**
- Consumes: `TimetableValidationSummary`, `TimetableConflictDisplay[]`, and `TimetablePublishReason[]` already passed to `ValidationPanel`.
- Produces: a controlled `ValidationNavigationTab` view and a `Review blockers` action that selects the highest-priority populated tab.

- [ ] **Step 1: Define the four tab values and derive their counts**

```tsx
type ValidationNavigationTab =
  | "overview"
  | "subjects"
  | "conflicts"
  | "blockers";

const tabs = validationNavigationTabs({
  subjectIssueCount: issueItems.length,
  conflictCount,
  blockerCount,
  locale,
});
```

- [ ] **Step 2: Render accessible MUI `Tabs` and `Tab` controls below the readiness header**

```tsx
<Tabs value={activeTab} onChange={(_event, nextTab) => setActiveTab(nextTab)} variant="scrollable">
  {tabs.map((tab) => (
    <Tab key={tab.value} value={tab.value} label={`${tab.label} (${tab.count})`} />
  ))}
</Tabs>
```

- [ ] **Step 3: Render only the selected tab's content**

```tsx
{activeTab === "overview" && <ValidationOverview />}
{activeTab === "subjects" && <SubjectIssuesPanel />}
{activeTab === "conflicts" && <ConflictIssuesPanel />}
{activeTab === "blockers" && <PublishBlockersPanel />}
```

- [ ] **Step 4: Use accordion groups for secondary issue categories**

```tsx
<Accordion defaultExpanded={group.severity === "error"}>
  <AccordionSummary>{group.title} ({group.issues.length})</AccordionSummary>
  <AccordionDetails>{/* existing issue rows */}</AccordionDetails>
</Accordion>
```

- [ ] **Step 5: Keep cards, conflict selection, localization, and no-issue state unchanged**

Use the existing `ValidationItemCard`, `ConflictCard`, `FallbackIssueSection`, `PublicationReasonCard`, `publicationReasonPresentation`, and `getCopy` helpers; reorganize their placement only.

### Task 3: Verify the finished interaction

**Files:**
- Modify: `src/features/academics/timetable/components/__tests__/ValidationPanel.test.tsx`
- Modify: `src/features/academics/timetable/components/ValidationPanel.tsx`

**Interfaces:**
- Consumes: component behavior introduced in Tasks 1 and 2.
- Produces: verified, linted TypeScript without a repository-wide test run.

- [ ] **Step 1: Run the focused component test**

Run: `npm exec vitest -- run src/features/academics/timetable/components/__tests__/ValidationPanel.test.tsx`

Expected: PASS, including the duplicate publication reason regression and tab navigation behavior.

- [ ] **Step 2: Run lint and type checking for the changed area**

Run:

```powershell
npm exec eslint -- src/features/academics/timetable/components/ValidationPanel.tsx src/features/academics/timetable/components/__tests__/ValidationPanel.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Review the final diff**

Run: `git diff --check` and inspect the two changed files. Confirm no DateTimePicker file is staged or committed.

## Self-Review

- Spec coverage: the four tabs remove the all-at-once feed; tab counts, overview, blocker action, and accordion grouping cover navigation, prioritization, and progressive disclosure.
- Placeholder scan: no TBD/TODO or unspecified implementation steps remain.
- Type consistency: tab values are shared between tab definitions, state, navigation action, and conditional content.
