# Timetable Creation Stepper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible, interactive six-step progress bar that guides users from selecting a timetable scope through publication using the selected scope's real saved state.

**Architecture:** A pure resolver converts current timetable data into typed creation-step states without persistence or duplicate validation. A presentational stepper renders those states and reports an action identifier; `TimetableView` routes each action to an existing control.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-04-timetable-creation-stepper-design.md`

## Global Constraints

- Use existing shared UI components and Lucide icons; do not add a dependency.
- Add all user-facing copy to `academics.timetable.creationProgress` in both English and Arabic.
- Derive all status from selected scope, effective config, periods, entries, dirty state, validation, conflicts, publication, loading, and existing permissions.
- Scope changes must show neutral checking progress until the new scope has loaded; never render prior-scope status.
- Schedule requires saved entries; review requires no blocking validation issue or conflict; publish requires backend readiness and published state.
- Preserve current read-only rules. Do not change frontend/backend API contracts.
- Apply `clean-code-guard` after every production-code change and `test-guard` after every test-code change.
- Run focused tests, lint, and typecheck. Ask the owner before `npm run test:run` without file arguments or another full suite.

---

## File structure

- Create `src/features/academics/timetable/services/timetableCreationProgress.ts` — pure state resolver.
- Create `src/features/academics/timetable/services/__tests__/timetableCreationProgress.test.ts` — resolver tests.
- Create `src/features/academics/timetable/components/TimetableCreationStepper.tsx` — accessible responsive UI.
- Create `src/features/academics/timetable/components/__tests__/TimetableCreationStepper.test.tsx` — UI tests.
- Modify `src/features/academics/timetable/components/TimetableView.tsx` — input, action routing, destinations.
- Modify `src/messages/en.json` and `src/messages/ar.json` — locale copy.

### Task 1: Resolve scope-aware creation progress

**Files:**
- Create: `src/features/academics/timetable/services/timetableCreationProgress.ts`
- Test: `src/features/academics/timetable/services/__tests__/timetableCreationProgress.test.ts`

**Interfaces:**
- Consumes existing `ResolvedTimetableConfig`, backend periods, UI entries, validation summary, conflicts, publication state, and UI flags.
- Produces `resolveTimetableCreationProgress(input): TimetableCreationProgress`.
- Action union: `"scope" | "configuration" | "periods" | "schedule" | "validation" | "publish"`.

- [ ] **Step 1: Write failing resolver tests**

```ts
describe("resolveTimetableCreationProgress", () => {
  it("uses checking state while a new selected scope is loading", () => {
    expect(resolveTimetableCreationProgress(loadingInput).state).toBe("checking");
  });

  it("blocks review when the schedule contains unsaved edits", () => {
    const progress = resolveTimetableCreationProgress({ ...readyScheduleInput, isDirty: true });
    expect(step(progress, "validation")).toMatchObject({
      status: "blocked",
      prerequisiteKey: "saveSchedule",
      actionable: false,
    });
  });

  it("enables publish only after review passes and backend readiness allows it", () => {
    const progress = resolveTimetableCreationProgress(readyToPublishInput);
    expect(step(progress, "validation")?.status).toBe("complete");
    expect(step(progress, "publish")?.actionable).toBe(true);
  });
});
```

Use fixture factories that produce valid imported types. Cover: the default term scope, no resolved config, config with no active day, no instructional period, no saved entry, a `temp-` entry, dirty entries, validation blocking reasons, conflicts, ready-but-unpublished data, published data, and read-only data.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:run -- src/features/academics/timetable/services/__tests__/timetableCreationProgress.test.ts`

Expected: FAIL because the resolver module does not exist.

- [ ] **Step 3: Implement the minimal typed resolver**

```ts
export type TimetableCreationAction =
  | "scope" | "configuration" | "periods" | "schedule" | "validation" | "publish";

export type TimetableCreationStepStatus =
  | "complete" | "current" | "blocked" | "published";

export interface TimetableCreationStep {
  id: TimetableCreationAction;
  status: TimetableCreationStepStatus;
  actionable: boolean;
  prerequisiteKey?: string;
}

export function resolveTimetableCreationProgress(
  input: TimetableCreationProgressInput,
): TimetableCreationProgress {
  // Return checking before evaluating any incomplete/completed step.
}
```

Use named pure helpers: `hasInstructionalPeriod`, `hasSavedEntries`, `hasBlockingReviewIssue`, and `isPublished`. `hasSavedEntries` requires at least one subject entry with a non-`temp-` ID. The resolver only consumes existing validation/readiness results; it does not fetch or calculate them. In read-only state, completed steps stay visible but incomplete mutating steps are not actionable.

- [ ] **Step 4: Run focused resolver tests**

Run: `npm run test:run -- src/features/academics/timetable/services/__tests__/timetableCreationProgress.test.ts`

Expected: PASS.

- [ ] **Step 5: Run quality review**

Use `test-guard` on the test file, then `clean-code-guard` on the resolver. Confirm behavior-based tests and no React, translation, side effect, or API dependency in the resolver.

- [ ] **Step 6: Commit**

```powershell
git add src/features/academics/timetable/services/timetableCreationProgress.ts src/features/academics/timetable/services/__tests__/timetableCreationProgress.test.ts
git commit -m "feat(timetable): derive creation progress state"
```

### Task 2: Render an accessible responsive stepper

**Files:**
- Create: `src/features/academics/timetable/components/TimetableCreationStepper.tsx`
- Test: `src/features/academics/timetable/components/__tests__/TimetableCreationStepper.test.tsx`

**Interfaces:**
- Consumes `TimetableCreationProgress`, translated copy, and `onAction(action: TimetableCreationAction): void`.
- Produces a labelled `nav` with an ordered six-step list. Only actionable steps can invoke `onAction`.

- [ ] **Step 1: Write failing component tests**

```tsx
it("announces and invokes the current actionable step", async () => {
  const onAction = vi.fn();
  const user = userEvent.setup();
  render(<TimetableCreationStepper progress={readyProgress} copy={copy} onAction={onAction} />);

  const validation = screen.getByRole("button", { name: /review and validate/i });
  expect(validation).toHaveAttribute("aria-current", "step");
  await user.click(validation);
  expect(onAction).toHaveBeenCalledWith("validation");
});

it("shows a blocked prerequisite without rendering a button", () => {
  render(<TimetableCreationStepper progress={blockedProgress} copy={copy} onAction={vi.fn()} />);
  expect(screen.getByText(/save the schedule first/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /publish/i })).not.toBeInTheDocument();
});
```

Also test the checking state, a complete state’s text/icon, and that a read-only incomplete step cannot be clicked.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableCreationStepper.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the presentational component**

```tsx
export default function TimetableCreationStepper({ progress, copy, onAction }: Props) {
  if (progress.state === "checking") {
    return <section aria-live="polite" aria-busy="true">{copy.checking}</section>;
  }

  return (
    <nav aria-label={copy.navigationLabel}>
      <ol className="flex min-w-max items-start gap-2">{/* six resolved steps */}</ol>
    </nav>
  );
}
```

Use Lucide `Check`, `Circle`, and `Lock`. Place the list inside `overflow-x-auto` for narrow screens. Actionable steps use the existing `Button`, `cursor-pointer`, visible focus treatment, and `transition-colors duration-200 motion-reduce:transition-none`. Blocked steps are not buttons and expose both visible and screen-reader prerequisite text. Do not use color as the only state cue.

- [ ] **Step 4: Run focused component tests**

Run: `npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableCreationStepper.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run quality review**

Use `test-guard` on the test file, then `clean-code-guard` on the component. Confirm roles/text, no ownership of mutation/data fetches, and responsive/keyboard-safe markup.

- [ ] **Step 6: Commit**

```powershell
git add src/features/academics/timetable/components/TimetableCreationStepper.tsx src/features/academics/timetable/components/__tests__/TimetableCreationStepper.test.tsx
git commit -m "feat(timetable): add accessible creation stepper"
```

### Task 3: Integrate actions, locale copy, and scope-safe refresh behavior

**Files:**
- Modify: `src/features/academics/timetable/components/TimetableView.tsx:249-270,1263-1590`
- Modify: `src/messages/en.json:6341`
- Modify: `src/messages/ar.json:6097`
- Test: `src/features/academics/timetable/components/__tests__/TimetableCreationStepper.test.tsx`

**Interfaces:**
- Consumes the resolver/component from Tasks 1–2 and `publication` from `useTimetableData`.
- Produces one stepper before the existing action bar; all actions use existing dialog setters, validation panel, and publish handler.

- [ ] **Step 1: Extend component tests for each enabled action**

Assert that `scope`, `configuration`, `periods`, `schedule`, `validation`, and `publish` invoke their matching `onAction` when actionable. Assert no blocked step invokes it. Keep integration test scope at the component boundary; `TimetableView` owns API hooks, printing, dialogs, and permission context.

- [ ] **Step 2: Add matching locale data**

Add `academics.timetable.creationProgress` with `navigationLabel`, `checking`, six `steps`, four `status` labels, and these prerequisites in both locale files: `configureTimetable`, `addInstructionalPeriod`, `saveSchedule`, `resolveReviewIssues`, and `publicationNotReady`. Translate all Arabic values; preserve matching object shape. When the backend supplies a publication blocking message, display it instead of the fallback key.

- [ ] **Step 3: Wire existing destinations in TimetableView**

Import the resolver/component and destructure `publication` from `useTimetableData`. Create refs for filter scope, configuration button, periods button, timetable grid, validation button/panel trigger, and publish button. Give non-control destinations `tabIndex={-1}`.

Memoize resolver input with `isLoading || timetableLoading`, `resolvedConfig`, `periods`, `timetableEntries`, `isDirty`, `validationSummary`, `backendConflicts`, `publication`, and `!canWriteTimetable`. Render the stepper after `FilterBar` and before the target/action bars.

Route actions exactly:

```ts
if (action === "scope") return focusDestination(scopeRef);
if (action === "configuration") return setConfigDialogOpen(true);
if (action === "periods") return setPeriodsDialogOpen(true);
if (action === "schedule") return focusDestination(gridRef);
if (action === "validation") {
  setValidationPanelOpen(true);
  return focusDestination(validationRef);
}
focusDestination(publishRef);
void handlePublish();
```

`focusDestination` calls `scrollIntoView({ behavior: "smooth", block: "start" })` unless `prefers-reduced-motion` is active, then calls `.focus()`. Keep existing permissions/read-only guards intact; do not allow the stepper to bypass disabled actions.

- [ ] **Step 4: Run focused verification**

```powershell
npm run test:run -- src/features/academics/timetable/services/__tests__/timetableCreationProgress.test.ts src/features/academics/timetable/components/__tests__/TimetableCreationStepper.test.tsx
npm run lint -- src/features/academics/timetable/services/timetableCreationProgress.ts src/features/academics/timetable/components/TimetableCreationStepper.tsx src/features/academics/timetable/components/TimetableView.tsx
npm run typecheck
```

Expected: PASS. Do not run the full test suite without owner approval.

- [ ] **Step 5: Run quality review**

Use `test-guard` for test changes and `clean-code-guard` for the final production diff. Verify locale parity, resolver-only status rules, focus behavior, native/visible blocked-state explanation, and absence of stale scope data.

- [ ] **Step 6: Inspect and commit**

```powershell
git diff --check
git status --short
git add src/features/academics/timetable/components/TimetableView.tsx src/messages/en.json src/messages/ar.json src/features/academics/timetable/components/__tests__/TimetableCreationStepper.test.tsx
git commit -m "feat(timetable): guide scope-specific creation workflow"
```

Only stage the listed files; do not stage unrelated workspace changes.

## Plan self-review

- **Spec coverage:** Task 1 covers scope resets, effective config, unsaved/saved entries, validation, conflicts, readiness, publication, read-only, and loading. Task 2 covers desktop/mobile UX, accessibility, and interactive states. Task 3 covers localization and routing to every existing control.
- **Placeholder scan:** No implementation or test step is deferred.
- **Type consistency:** Tasks 2 and 3 consume the action union and progress output defined by Task 1.
