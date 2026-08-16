# Curriculum Confirmation Modals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every native curriculum confirmation with the existing accessible `ConfirmDialog` flow.

**Architecture:** Unit/lesson and content deletion dialogs remain owned by their initiating components through pending-target state. Academic-context guards become asynchronous, while `CurriculumPageContent` bridges the hook to `ConfirmDialog` with a single pending promise resolver.

**Tech Stack:** TypeScript, React 19, Next.js 16, next-intl, Vitest, Testing Library

---

## File map

- Modify `src/features/academics/hooks/useGuardedAcademicContextChange.ts`: await an asynchronous discard decision.
- Create `src/features/academics/hooks/__tests__/useGuardedAcademicContextChange.test.tsx`: verify cancel and confirm flows.
- Modify `src/features/academics/curriculum/pages/CurriculumPageContent.tsx`: render and settle the unsaved-change dialog.
- Modify `src/features/academics/curriculum/pages/__tests__/CurriculumPageContent.test.tsx`: verify pending discard decisions.
- Modify `src/features/academics/curriculum/components/CurriculumEditor.tsx`: replace native unit/lesson deletion confirmation.
- Modify `src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`: verify delete modal behavior.
- Modify `src/features/academics/curriculum/components/LearningContentPanel.tsx`: replace native content deletion confirmation.
- Modify `src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx`: verify content delete modal behavior.
- Modify `src/messages/en.json` and `src/messages/ar.json`: add missing dialog labels in existing curriculum namespaces.

### Task 1: Make academic-context guards await confirmation

**Files:**
- Create: `src/features/academics/hooks/__tests__/useGuardedAcademicContextChange.test.tsx`
- Modify: `src/features/academics/hooks/useGuardedAcademicContextChange.ts`

- [ ] **Step 1: Write failing hook tests**

Render a harness that calls `useGuardedAcademicContextChange`. Capture the handlers passed to `setGuardHandlers`, then test both decisions:

```ts
it("blocks an academic-year change when discard is cancelled", async () => {
  const confirmDiscard = vi.fn().mockResolvedValue(false);
  render(<GuardHarness hasUnsavedChanges confirmDiscard={confirmDiscard} />);

  await act(() => registeredHandlers!.onAcademicYearChange("year-2"));

  expect(confirmDiscard).toHaveBeenCalledOnce();
  expect(onDiscard).not.toHaveBeenCalled();
  expect(changeAcademicYear).not.toHaveBeenCalled();
});

it("discards and continues a term change after confirmation", async () => {
  const confirmDiscard = vi.fn().mockResolvedValue(true);
  render(<GuardHarness hasUnsavedChanges confirmDiscard={confirmDiscard} />);

  await act(() => registeredHandlers!.onTermChange("term-2"));

  expect(onDiscard).toHaveBeenCalledOnce();
  expect(changeTerm).toHaveBeenCalledWith("term-2");
});
```

- [ ] **Step 2: Run the hook tests and verify RED**

Run: `npm run test:run -- src/features/academics/hooks/__tests__/useGuardedAcademicContextChange.test.tsx`

Expected: FAIL because a promise is currently treated as an immediate truthy boolean.

- [ ] **Step 3: Change the hook contract and await it**

Change the parameter type to:

```ts
confirmDiscard: () => Promise<boolean>;
```

In both registered handlers, replace the synchronous check with:

```ts
if (hasUnsavedChanges && !(await confirmDiscard())) return;
```

Make `onTermChange` asynchronous so both branches have identical decision ordering: await decision, call `onDiscard`, then invoke the context change.

- [ ] **Step 4: Run the hook tests and verify GREEN**

Run: `npm run test:run -- src/features/academics/hooks/__tests__/useGuardedAcademicContextChange.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the asynchronous guard**

```bash
git add src/features/academics/hooks/useGuardedAcademicContextChange.ts src/features/academics/hooks/__tests__/useGuardedAcademicContextChange.test.tsx
git commit -m "refactor: await academic context confirmation"
```

### Task 2: Add the unsaved-change confirmation dialog

**Files:**
- Modify: `src/features/academics/curriculum/pages/__tests__/CurriculumPageContent.test.tsx`
- Modify: `src/features/academics/curriculum/pages/CurriculumPageContent.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing page tests**

Update the guarded-hook mock to capture `confirmDiscard`. Mock `ConfirmDialog` as buttons with visible title and invoke the captured callback. Assert cancel resolves `false` and confirm resolves `true`:

```ts
const decision = capturedGuardParams!.confirmDiscard();
expect(await screen.findByText("unsaved_changes.title")).toBeInTheDocument();

await user.click(screen.getByRole("button", { name: "unsaved_changes.cancel" }));
await expect(decision).resolves.toBe(false);
```

Use a second test that clicks `unsaved_changes.discard` and expects `true`.

- [ ] **Step 2: Run the page tests and verify RED**

Run: `npm run test:run -- src/features/academics/curriculum/pages/__tests__/CurriculumPageContent.test.tsx`

Expected: FAIL because `confirmDiscardChanges` still calls the browser API.

- [ ] **Step 3: Implement a single pending decision**

Store dialog visibility and a resolver ref:

```ts
const [showDiscardDialog, setShowDiscardDialog] = useState(false);
const discardDecisionRef = useRef<((confirmed: boolean) => void) | null>(null);

const requestDiscardConfirmation = useCallback(
  () => new Promise<boolean>((resolve) => {
    discardDecisionRef.current?.(false);
    discardDecisionRef.current = resolve;
    setShowDiscardDialog(true);
  }),
  [],
);

const settleDiscardConfirmation = useCallback((confirmed: boolean) => {
  const resolve = discardDecisionRef.current;
  discardDecisionRef.current = null;
  setShowDiscardDialog(false);
  resolve?.(confirmed);
}, []);
```

Pass `requestDiscardConfirmation` to `useGuardedAcademicContextChange`. Render `ConfirmDialog` with `severity="warning"`; close settles `false`, confirm settles `true`. Add an effect cleanup that resolves any remaining decision as `false`.

- [ ] **Step 4: Add scoped translations**

Expand `academics.curriculum.unsaved_changes` in both locale files with `title`, `message`, `discard`, and `cancel`. English values are “Discard unsaved changes?”, the existing message, “Discard changes”, and “Cancel”. Arabic values are “هل تريد تجاهل التغييرات غير المحفوظة؟”, the existing message, “تجاهل التغييرات”, and “إلغاء”.

- [ ] **Step 5: Run page tests and verify GREEN**

Run: `npm run test:run -- src/features/academics/curriculum/pages/__tests__/CurriculumPageContent.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the unsaved-change modal**

```bash
git add src/features/academics/curriculum/pages/CurriculumPageContent.tsx src/features/academics/curriculum/pages/__tests__/CurriculumPageContent.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "fix: confirm curriculum navigation with modal"
```

### Task 3: Replace unit and lesson deletion confirmation

**Files:**
- Modify: `src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`
- Modify: `src/features/academics/curriculum/components/CurriculumEditor.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing editor deletion tests**

Render an existing unit, click delete, and assert `deleteUnit` has not run. Click cancel and assert it remains uncalled. Repeat with confirm and assert one call with curriculum and unit IDs. Mock `ConfirmDialog` only at its UI boundary so tests interact through visible buttons.

- [ ] **Step 2: Run editor tests and verify RED**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`

Expected: FAIL because the component calls native `confirm` instead of rendering the dialog.

- [ ] **Step 3: Implement pending-node deletion**

Add `pendingDeleteNode` state with the same `{ type, id }` shape as `selectedNode`, plus `isDeleting`. The delete button copies `selectedNode` into pending state. Confirm uses that immutable target, performs the existing unit/lesson lookup and service call, then refreshes and clears selection. Close only clears pending state when not deleting.

Render:

```tsx
<ConfirmDialog
  isOpen={pendingDeleteNode !== null}
  onClose={closeDeleteConfirmation}
  onConfirm={() => void confirmDeleteNode()}
  title={t("delete")}
  description={t("confirm_delete")}
  confirmLabel={t("delete")}
  cancelLabel={t("cancel")}
  loading={isDeleting}
  severity="danger"
/>
```

- [ ] **Step 4: Add the missing editor cancel translation**

Add `academics.curriculum.editor.cancel` as “Cancel” in English and “إلغاء” in Arabic. Existing `delete` and `confirm_delete` strings remain unchanged.

- [ ] **Step 5: Run editor tests and verify GREEN**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit editor confirmation**

```bash
git add src/features/academics/curriculum/components/CurriculumEditor.tsx src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "fix: confirm curriculum node deletion with modal"
```

### Task 4: Replace lesson-content deletion confirmation

**Files:**
- Modify: `src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx`
- Modify: `src/features/academics/curriculum/components/LearningContentPanel.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing content deletion tests**

Return one real `LessonContentItem` fixture from `listLessonContent`. Click its delete control, assert no service call before confirmation, cancel and assert no call, then reopen and confirm. Assert `deleteLessonContent` is called once with all four hierarchy IDs.

- [ ] **Step 2: Run content tests and verify RED**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx`

Expected: FAIL because no `ConfirmDialog` is rendered.

- [ ] **Step 3: Implement pending-content deletion**

Store `pendingDeleteItem: LessonContentItem | null` and `isDeleting`. The trash control only assigns the item. Confirm performs the existing deletion and reset/refresh behavior against that stored item. Cancel clears the target when not deleting. Reset pending state when the panel context changes.

Render `ConfirmDialog` with `t("delete")`, `t("confirm_delete")`, `t("cancel")`, `loading={isDeleting}`, and danger severity.

- [ ] **Step 4: Add the missing content delete translation**

Add `academics.curriculum.learningContent.delete` as “Delete” in English and “حذف” in Arabic. Existing `cancel` and `confirm_delete` strings remain unchanged.

- [ ] **Step 5: Run content tests and verify GREEN**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit content confirmation**

```bash
git add src/features/academics/curriculum/components/LearningContentPanel.tsx src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "fix: confirm lesson content deletion with modal"
```

### Task 5: Verify no native confirmations remain

**Files:**
- Verify all files listed above.

- [ ] **Step 1: Search the curriculum feature**

Run: `rg -n "\b(window\.)?confirm\(" src/features/academics/curriculum`

Expected: no matches.

- [ ] **Step 2: Run affected and curriculum tests**

Run: `npm run test:run -- src/features/academics/hooks/__tests__/useGuardedAcademicContextChange.test.tsx src/features/academics/curriculum`

Expected: all tests PASS.

- [ ] **Step 3: Run static checks**

Run: `npm run typecheck && npm run lint -- src/features/academics/hooks/useGuardedAcademicContextChange.ts src/features/academics/hooks/__tests__/useGuardedAcademicContextChange.test.tsx src/features/academics/curriculum src/messages`

Expected: exit code 0.

- [ ] **Step 4: Inspect repository state**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and no unintended files.
