# Teacher Allocation Reassignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task with review checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the School Dashboard's destructive delete-and-create teacher replacement flow with the backend's preview-and-confirm atomic reassignment workflow.

**Architecture:** Keep new API DTOs and endpoint calls in the existing teacher-allocation adapter layer. Split saving into a prepare phase that classifies edits and previews every existing-allocation reassignment, and a commit phase that sends the preview fingerprint to the atomic backend endpoint; `AllocationMatrixView` owns the pending plan and presents a dedicated confirmation dialog built from existing `src/components/ui` primitives. New allocations and explicit removals continue to use the existing bulk-create and delete endpoints.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, next-intl, Vitest, Testing Library, existing `Modal` and `Button` UI primitives.

**Spec:** Backend contracts introduced by [3f95bd8](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/commit/3f95bd8a9a0fbf63aab7b49ee7390fd0e738e55a), hardened by [f48e286](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/commit/f48e2865390bcf36d96baf678f9ccb300fd8264c), and completed by [c69ee53](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/commit/c69ee5364f874bdc997c84b0c03a0b1e4da2d1bb).

## Global Constraints

- Backend source of truth: `Moazez-Backend/main` at `cd3fadb2fece36a782a7edc1cfbd5c18a669de5a`; the five reviewed commits are listed below.
- Frontend baseline inspected: `Moazez-School-Dashboard/main` at `d4e9e07`; start implementation from the latest `origin/main` on a new `feat/teacher-allocation-reassignment` branch.
- Preserve the user's existing uncommitted edit in `src/features/academics/components/shared/AllocationMatrixTable.tsx`; do not overwrite, stage, or reformat it.
- Reassignment endpoints require `academics.structure.manage`, an active school-management scope, and an open term; the existing page permission/read-only gates remain authoritative.
- Use existing primitives exported from `src/components/ui`, especially `Modal` and `Button`; do not add a second modal system.
- All new user-facing text must exist in both `src/messages/en.json` and `src/messages/ar.json`.
- Never send a guessed audit `reasonCode`; omit it until product supplies a defined reason taxonomy.
- On an execute failure, refresh authoritative allocation data because earlier independent operations may already have committed; do not leave the matrix implying an all-or-nothing batch result.
- Use `clean-code-guard` after every production-code task and `test-guard` after every test-code task.
- Targeted Vitest files may run during implementation. Ask the owner before running the full `npm run test:run` suite.
- Run every PowerShell command through the repository's required single execution gate: `& { <commands> }`.
- Do not modify the backend, deployment files, environment values, or production configuration.

---

## Reviewed Backend Commits

1. [`cd3fadb`](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/commit/cd3fadb2fece36a782a7edc1cfbd5c18a669de5a) — merge commit for PR #131; no contract beyond its second parent `c69ee53`.
2. [`c69ee53`](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/commit/c69ee5364f874bdc997c84b0c03a0b1e4da2d1bb) — adds atomic `POST /academics/allocations/:allocationId/reassign`; requires `newTeacherUserId` and the 64-character `impactFingerprint` returned by preview. It transfers current timetable, lesson-plan, and homework ownership while preserving historical records.
3. [`e8cc1ab`](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/commit/e8cc1abd2ca07460ab1defd15c2a97d223526291) — merge commit for PR #130; its effective contract is `3f95bd8` plus `f48e286`.
4. [`f48e286`](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/commit/f48e2865390bcf36d96baf678f9ccb300fd8264c) — hardens preview scoping/eligibility and makes preview explicitly return HTTP 200.
5. [`3f95bd8`](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/commit/3f95bd8a9a0fbf63aab7b49ee7390fd0e738e55a) — adds `POST /academics/allocations/:allocationId/reassignment-preview`, including impact counts, blockers, automatic handoffs, preserved-history counts, and the fingerprint required by execute.

Frontend impact is confined to teacher allocation. The communication, reinforcement, and teacher-app files changed by the backend are internal data/read-model support for the preview calculation; they add no separate frontend endpoints.

## File Map

**Create**

- `src/features/academics/teacher-allocation/components/ReassignmentPreviewDialog.tsx` — accessible, bilingual review/confirmation UI for one or more previews.
- `src/features/academics/teacher-allocation/components/__tests__/ReassignmentPreviewDialog.test.tsx` — ready, blocked, cancel, and loading-state coverage.
- `src/messages/__tests__/teacherAllocationReassignmentTranslations.test.ts` — en/ar key-parity contract.

**Modify**

- `src/features/academics/teacher-allocation/services/teacherAllocationApi.types.ts` — exact preview/execute request and response types.
- `src/features/academics/teacher-allocation/services/teacherAllocationApiAdapter.ts` — the two new POST calls.
- `src/features/academics/teacher-allocation/services/teacherAllocationService.ts` — prepare/commit workflow; remove destructive replacement behavior.
- `src/features/academics/teacher-allocation/services/teacherAllocationErrors.ts` — new backend codes and structured reassignment error inspection.
- `src/features/academics/teacher-allocation/components/AllocationMatrixView.tsx` — pending-plan state, preview-before-write behavior, confirmation, refresh-on-failure.
- `src/messages/en.json` and `src/messages/ar.json` — dialog, impact, blocker, policy, and error labels.
- Existing adapter, service, error, and matrix tests next to the modified files.

---

### Task 1: Model and call the backend contracts

**Files:**

- Modify: `src/features/academics/teacher-allocation/services/teacherAllocationApi.types.ts:46`
- Modify: `src/features/academics/teacher-allocation/services/teacherAllocationApiAdapter.ts:26`
- Test: `src/features/academics/teacher-allocation/services/__tests__/teacherAllocationApiAdapter.test.ts`

**Interfaces:**

- Consumes: Backend `POST /academics/allocations/:allocationId/reassignment-preview` and `POST /academics/allocations/:allocationId/reassign` contracts.
- Produces: `previewTeacherAllocationReassignment(allocationId, payload)` and `reassignTeacherAllocation(allocationId, payload)`.

- [ ] **Step 1: Add failing adapter tests for both endpoint paths and exact bodies**

```ts
const previewPayload = { newTeacherUserId: "teacher-user-2" };
const executePayload = {
  newTeacherUserId: "teacher-user-2",
  impactFingerprint: "a".repeat(64),
};

await previewTeacherAllocationReassignment("allocation-1", previewPayload);
await reassignTeacherAllocation("allocation-1", executePayload);

expect(mockedApiPost).toHaveBeenNthCalledWith(
  1,
  "/academics/allocations/allocation-1/reassignment-preview",
  previewPayload,
);
expect(mockedApiPost).toHaveBeenNthCalledWith(
  2,
  "/academics/allocations/allocation-1/reassign",
  executePayload,
);
```

- [ ] **Step 2: Run the focused adapter test and verify it fails because the functions/types do not exist**

Run: `& { npx vitest run src/features/academics/teacher-allocation/services/__tests__/teacherAllocationApiAdapter.test.ts }`

Expected: FAIL at import/type resolution for the two new adapter functions.

- [ ] **Step 3: Add exact request, impact, blocker, action, history, preview, and execute types**

```ts
export interface PreviewTeacherAllocationReassignmentRequest {
  newTeacherUserId: string;
}

export interface ReassignTeacherAllocationRequest
  extends PreviewTeacherAllocationReassignmentRequest {
  impactFingerprint: string;
  reasonCode?: string;
}

export interface TeacherAllocationReassignmentBlocker {
  domain: "allocation" | "timetable" | "reinforcement" | "announcements";
  code:
    | "target_is_current_teacher"
    | "target_already_allocated"
    | "target_teacher_conflict"
    | "active_reinforcement_tasks"
    | "mutable_teacher_announcements";
  count: number;
  statuses?: Record<string, number>;
}

export interface TeacherAllocationReassignmentPreviewResponse {
  allocation: { id: string; subjectId: string; classroomId: string; termId: string };
  currentTeacher: { userId: string; fullName: string };
  targetTeacher: { userId: string; fullName: string };
  decision: "ready" | "blocked";
  canReassign: boolean;
  impactFingerprint: string;
  impact: {
    timetable: { draft: number; active: number; cancelled: number; targetTeacherConflicts: number };
    lessonPlans: { draft: number; active: number; archived: number };
    homework: { draft: number; published: number; closed: number; cancelled: number; archived: number };
    reinforcement: { notCompleted: number; inProgress: number; underReview: number; completed: number; cancelled: number };
    announcements: { draft: number; scheduled: number; published: number; archived: number; cancelled: number };
    assessments: { policy: "contextual_access_no_rewrite" };
    curriculum: { policy: "no_mutation" };
    attendance: { policy: "historical_preserve" };
    messages: { policy: "no_history_rewrite" };
  };
  blockers: TeacherAllocationReassignmentBlocker[];
  automaticActions: Array<{
    domain: "timetable" | "lesson_plans" | "homework";
    action: "handoff_current_responsibility";
    count: number;
  }>;
  historicalRecords: Array<{
    domain: "timetable" | "lesson_plans" | "homework" | "reinforcement" | "announcements";
    action: "preserve_historical_authorship";
    count: number;
  }>;
}

export interface TeacherAllocationReassignmentResponse {
  allocation: { id: string; teacherUserId: string };
  previousTeacherUserId: string;
  newTeacherUserId: string;
  transferred: { timetableEntries: number; lessonPlans: number; homeworkAssignments: number };
  preservedHistorical: {
    cancelledTimetableEntries: number;
    archivedLessonPlans: number;
    cancelledOrArchivedHomeworkAssignments: number;
    completedOrCancelledReinforcementTasks: number;
    publishedArchivedOrCancelledAnnouncements: number;
  };
}
```

- [ ] **Step 4: Implement the two typed adapter functions with `apiPost`**

```ts
export function previewTeacherAllocationReassignment(
  allocationId: string,
  payload: PreviewTeacherAllocationReassignmentRequest,
) {
  return apiPost<TeacherAllocationReassignmentPreviewResponse>(
    `${BASE}/${allocationId}/reassignment-preview`,
    payload,
  );
}

export function reassignTeacherAllocation(
  allocationId: string,
  payload: ReassignTeacherAllocationRequest,
) {
  return apiPost<TeacherAllocationReassignmentResponse>(
    `${BASE}/${allocationId}/reassign`,
    payload,
  );
}
```

- [ ] **Step 5: Run the focused adapter test, then apply `test-guard` and `clean-code-guard`**

Run: `& { npx vitest run src/features/academics/teacher-allocation/services/__tests__/teacherAllocationApiAdapter.test.ts }`

Expected: PASS.

- [ ] **Step 6: Commit the contract slice**

```powershell
& {
  git add src/features/academics/teacher-allocation/services/teacherAllocationApi.types.ts src/features/academics/teacher-allocation/services/teacherAllocationApiAdapter.ts src/features/academics/teacher-allocation/services/__tests__/teacherAllocationApiAdapter.test.ts
  git commit -m "feat(academics): add allocation reassignment api contracts"
}
```

---

### Task 2: Replace destructive swaps with a two-phase save service

**Files:**

- Modify: `src/features/academics/teacher-allocation/services/teacherAllocationService.ts:72-324`
- Test: `src/features/academics/teacher-allocation/services/__tests__/teacherAllocationService.test.ts:154-305`

**Interfaces:**

- Consumes: Task 1 adapter functions and the existing `SaveTeacherAllocationChangesInput`.
- Produces: `prepareTeacherAllocationSave(input): Promise<TeacherAllocationSavePlan>` and `commitTeacherAllocationSave(plan): Promise<void>`.

- [ ] **Step 1: Replace the old changed-assignment test with failing prepare/commit tests**

Cover these exact cases:

```ts
it("previews every existing allocation whose teacher changes", async () => {
  const plan = await prepareTeacherAllocationSave(replacementInput);
  expect(mockedPreviewTeacherAllocationReassignment).toHaveBeenCalledWith(
    "allocation-1",
    { newTeacherUserId: "teacher-user-2" },
  );
  expect(plan.reassignments[0].preview.impactFingerprint).toBe("a".repeat(64));
});

it("commits a replacement atomically without delete or create", async () => {
  const plan = await prepareTeacherAllocationSave(replacementInput);
  await commitTeacherAllocationSave(plan);
  expect(mockedReassignTeacherAllocation).toHaveBeenCalledWith("allocation-1", {
    newTeacherUserId: "teacher-user-2",
    impactFingerprint: "a".repeat(64),
  });
  expect(mockedDeleteTeacherAllocation).not.toHaveBeenCalled();
  expect(mockedBulkSaveTeacherAllocations).not.toHaveBeenCalled();
});

it("does not write anything during prepare", async () => {
  await prepareTeacherAllocationSave(replacementInput);
  expect(mockedReassignTeacherAllocation).not.toHaveBeenCalled();
  expect(mockedDeleteTeacherAllocation).not.toHaveBeenCalled();
  expect(mockedBulkSaveTeacherAllocations).not.toHaveBeenCalled();
});
```

Retain coverage proving a null teacher uses delete and a `temp-` allocation uses bulk create.

- [ ] **Step 2: Run the focused service test and verify it fails on missing workflow functions**

Run: `& { npx vitest run src/features/academics/teacher-allocation/services/__tests__/teacherAllocationService.test.ts }`

Expected: FAIL because prepare/commit are not implemented.

- [ ] **Step 3: Introduce an explicit save-plan model**

```ts
export interface PreparedTeacherAllocationReassignment {
  originalAllocation: TeacherAllocation;
  nextAllocation: TeacherAllocation;
  preview: TeacherAllocationReassignmentPreviewResponse;
}

export interface TeacherAllocationSavePlan {
  termId: string;
  creations: TeacherAllocation[];
  removals: TeacherAllocation[];
  reassignments: PreparedTeacherAllocationReassignment[];
}
```

Keep `replacementTeacherAssignments` as the single classifier for persisted rows whose `teacherId` changed. Exclude those rows from both `creations` and `removals`.

- [ ] **Step 4: Implement the prepare phase and ensure it has no writes**

```ts
export async function prepareTeacherAllocationSave(
  input: SaveTeacherAllocationChangesInput,
): Promise<TeacherAllocationSavePlan> {
  const replacements = replacementTeacherAssignments(input);
  const previews = await Promise.all(
    replacements.map(async ({ originalAllocation, nextAllocation }) => ({
      originalAllocation,
      nextAllocation,
      preview: await previewTeacherAllocationReassignment(originalAllocation.id, {
        newTeacherUserId: nextAllocation.teacherId as string,
      }),
    })),
  );

  return {
    termId: input.termId,
    creations: newTeacherAssignments(input.localAllocations),
    removals: removedTeacherAssignments(input),
    reassignments: previews,
  };
}
```

- [ ] **Step 5: Implement the commit phase using each preview's exact fingerprint**

```ts
export async function commitTeacherAllocationSave(
  plan: TeacherAllocationSavePlan,
): Promise<void> {
  if (plan.reassignments.some(({ preview }) => !preview.canReassign)) {
    throw new Error("Blocked teacher reassignments must not be committed");
  }

  for (const reassignment of plan.reassignments) {
    await reassignTeacherAllocation(reassignment.originalAllocation.id, {
      newTeacherUserId: reassignment.nextAllocation.teacherId as string,
      impactFingerprint: reassignment.preview.impactFingerprint,
    });
  }
  for (const removal of plan.removals) {
    await deleteTeacherAllocationRequest(removal.id);
  }
  await bulkCreateTeacherAllocations(plan.termId, plan.creations);
}
```

Delete `replaceTeacherAllocation` if repository-wide search confirms it has no caller. Replace `saveTeacherAllocationChanges` rather than keeping a second code path that can still delete-and-create replacements.

- [ ] **Step 6: Run the service test, then apply `test-guard` and `clean-code-guard`**

Run: `& { npx vitest run src/features/academics/teacher-allocation/services/__tests__/teacherAllocationService.test.ts }`

Expected: PASS, including an assertion that a replacement never invokes delete or bulk create.

- [ ] **Step 7: Commit the safe workflow**

```powershell
& {
  git add src/features/academics/teacher-allocation/services/teacherAllocationService.ts src/features/academics/teacher-allocation/services/__tests__/teacherAllocationService.test.ts
  git commit -m "refactor(academics): prepare and commit allocation reassignments"
}
```

---

### Task 3: Normalize reassignment errors without flattening structured details

**Files:**

- Modify: `src/features/academics/teacher-allocation/services/teacherAllocationErrors.ts:3-98`
- Test: `src/features/academics/teacher-allocation/services/__tests__/teacherAllocationErrors.test.ts`

**Interfaces:**

- Consumes: `ApiError.code` and `ApiError.details`.
- Produces: `teacherAllocationReassignmentFailure(error)` with stable `kind`, optional ineligibility reason, blocker list, and trace id.

- [ ] **Step 1: Add failing tests for every new backend error code**

```ts
expect(teacherAllocationReassignmentFailure(staleError)).toMatchObject({
  kind: "stale_preview",
  traceId: "trace-1",
});
expect(teacherAllocationReassignmentFailure(blockedError)).toMatchObject({
  kind: "blocked",
  blockers: [{ domain: "timetable", code: "target_teacher_conflict", count: 2 }],
});
expect(teacherAllocationReassignmentFailure(ineligibleError)).toMatchObject({
  kind: "target_ineligible",
  reasonCode: "employment_inactive",
});
```

Cover `target_not_found`, `target_ineligible`, `blocked`, `stale_preview`, and `concurrent_change`; unknown errors return `kind: "unknown"`.

- [ ] **Step 2: Run the focused error test and verify it fails**

Run: `& { npx vitest run src/features/academics/teacher-allocation/services/__tests__/teacherAllocationErrors.test.ts }`

Expected: FAIL because the structured helper does not exist.

- [ ] **Step 3: Extend the code union and implement defensive detail parsing**

```ts
export type TeacherAllocationReassignmentFailureKind =
  | "target_not_found"
  | "target_ineligible"
  | "blocked"
  | "stale_preview"
  | "concurrent_change"
  | "unknown";

export interface TeacherAllocationReassignmentFailure {
  kind: TeacherAllocationReassignmentFailureKind;
  reasonCode?: string;
  blockers: TeacherAllocationReassignmentBlocker[];
  traceId?: string;
}
```

Do not assume `details` is trustworthy JSON. Check objects, arrays, string keys, numeric counts, and optional status maps before returning blocker data.

- [ ] **Step 4: Keep fallback error mapping compatible with the existing page banner**

Add the five backend codes to `TeacherAllocationErrorCode` and `errorMessagesByCode`, but use the structured helper in the reassignment dialog so Arabic/English copy comes from next-intl rather than these English fallbacks.

- [ ] **Step 5: Run the focused error test, then apply `test-guard` and `clean-code-guard`**

Run: `& { npx vitest run src/features/academics/teacher-allocation/services/__tests__/teacherAllocationErrors.test.ts }`

Expected: PASS.

- [ ] **Step 6: Commit error support**

```powershell
& {
  git add src/features/academics/teacher-allocation/services/teacherAllocationErrors.ts src/features/academics/teacher-allocation/services/__tests__/teacherAllocationErrors.test.ts
  git commit -m "feat(academics): map allocation reassignment failures"
}
```

---

### Task 4: Build the reassignment review dialog from UI primitives

**Files:**

- Create: `src/features/academics/teacher-allocation/components/ReassignmentPreviewDialog.tsx`
- Test: `src/features/academics/teacher-allocation/components/__tests__/ReassignmentPreviewDialog.test.tsx`

**Interfaces:**

- Consumes: `PreparedTeacherAllocationReassignment[]`, `isSubmitting`, `error`, `onCancel`, and `onConfirm`.
- Produces: A review UI whose confirm action is enabled only when every preview is ready.

- [ ] **Step 1: Write failing component tests for ready, blocked, cancel, and submitting states**

```tsx
render(
  <ReassignmentPreviewDialog
    open
    reassignments={[readyReassignment]}
    isSubmitting={false}
    error={null}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />,
);
expect(screen.getByText(/Teacher One/)).toBeInTheDocument();
expect(screen.getByText(/Teacher Two/)).toBeInTheDocument();
expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled();
```

For a blocked preview, assert the blocker label/count is visible and confirm is disabled. For submitting, assert both dismissal routes are disabled to avoid closing during writes.

- [ ] **Step 2: Run the new component test and verify it fails because the component does not exist**

Run: `& { npx vitest run src/features/academics/teacher-allocation/components/__tests__/ReassignmentPreviewDialog.test.tsx }`

Expected: FAIL at module resolution.

- [ ] **Step 3: Implement the dialog with existing `Modal` and `Button` exports**

```tsx
<Modal
  isOpen={open}
  onClose={onCancel}
  title={t("reassignment.title")}
  description={t("reassignment.description")}
  size="xl"
  closeOnOverlayClick={!isSubmitting}
  closeOnEscape={!isSubmitting}
  showCloseButton={!isSubmitting}
  footer={
    <>
      <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
        {t("reassignment.actions.cancel")}
      </Button>
      <Button
        onClick={onConfirm}
        loading={isSubmitting}
        disabled={!allReady}
      >
        {t("reassignment.actions.confirm")}
      </Button>
    </>
  }
>
  {/* current → target, blockers, automatic handoffs, preserved history, policies */}
</Modal>
```

Render only non-zero counts. Keep backend domain codes as data and map them to translation keys for display. Clearly separate:

- current responsibilities that will transfer: draft/active timetable entries, draft/active lesson plans, and draft/published/closed homework;
- historical records that remain attributed to the old teacher;
- blockers that prevent confirmation;
- unchanged-policy domains: assessments, curriculum, attendance, and messages.

- [ ] **Step 4: Preserve accessible semantics**

Use headings for each reassignment, unordered lists for impacts/blockers, `aria-live="polite"` for preview/execute errors, and rely on the shared modal's focus trap and focus restoration. Do not introduce raw `<button>` elements.

- [ ] **Step 5: Run the component test, then apply `test-guard` and `clean-code-guard`**

Run: `& { npx vitest run src/features/academics/teacher-allocation/components/__tests__/ReassignmentPreviewDialog.test.tsx }`

Expected: PASS.

- [ ] **Step 6: Commit the dialog**

```powershell
& {
  git add src/features/academics/teacher-allocation/components/ReassignmentPreviewDialog.tsx src/features/academics/teacher-allocation/components/__tests__/ReassignmentPreviewDialog.test.tsx
  git commit -m "feat(academics): add allocation reassignment review dialog"
}
```

---

### Task 5: Wire preview, confirmation, and recovery into the matrix save flow

**Files:**

- Modify: `src/features/academics/teacher-allocation/components/AllocationMatrixView.tsx:505-529,1162`
- Test: `src/features/academics/teacher-allocation/components/__tests__/AllocationMatrixView.test.tsx`

**Interfaces:**

- Consumes: Tasks 2–4.
- Produces: Preview-before-write behavior for replacements, direct save for create/delete-only edits, and authoritative refresh after any commit failure.

- [ ] **Step 1: Expand the matrix test fixture so it can replace an existing teacher**

Add `teacher-user-2`, allow `renderMatrix` to accept initial allocations, and mock `prepareTeacherAllocationSave` plus `commitTeacherAllocationSave`.

- [ ] **Step 2: Add failing interaction tests for the three save paths**

```ts
it("previews a changed persisted allocation before any write", async () => {
  renderMatrix({ teacherAllocations: [existingAllocation] });
  fireEvent.change(screen.getByLabelText("teacher-select"), {
    target: { value: "teacher-user-2" },
  });
  fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  expect(mockedPrepareTeacherAllocationSave).toHaveBeenCalledTimes(1);
  expect(mockedCommitTeacherAllocationSave).not.toHaveBeenCalled();
});

it("commits only after the user confirms a ready preview", async () => {
  // Open preview, click confirm, then assert commit and refresh.
});

it("does not commit a blocked preview", async () => {
  // Assert blocker text, disabled confirm, and no commit call.
});
```

Also retain/create a no-reassignment test proving a new allocation prepares, commits immediately, and never opens the dialog.

- [ ] **Step 3: Run the focused matrix test and verify the new behavior fails**

Run: `& { npx vitest run src/features/academics/teacher-allocation/components/__tests__/AllocationMatrixView.test.tsx }`

Expected: FAIL because the current save handler writes immediately through `saveTeacherAllocationChanges`.

- [ ] **Step 4: Replace `handleSave` with prepare-first logic**

```ts
const plan = await prepareTeacherAllocationSave({
  termId,
  localAllocations,
  originalAllocations,
});

if (plan.reassignments.length > 0) {
  setPendingSavePlan(plan);
  setReassignmentDialogOpen(true);
  return;
}

await commitPreparedPlan(plan);
```

`commitPreparedPlan` must call `commitTeacherAllocationSave`, then `onRefresh`, clear the failed-cell set, and show success. It must not set `originalAllocations` to pre-refresh local state; refreshed props are the authority.

- [ ] **Step 5: Implement confirmation and failure recovery**

On confirm, commit the exact pending plan. If execute returns stale preview, concurrent change, target eligibility, blocked, or any unknown failure:

1. map the error for localized display/technical trace details;
2. close or invalidate the pending plan so the same fingerprint cannot be resubmitted;
3. call `onRefresh()` to reconcile any already-committed operations;
4. mark the save as failed and require the user to reapply/review changes.

Do not silently re-preview and auto-execute; a changed fingerprint requires fresh user confirmation.

- [ ] **Step 6: Render `ReassignmentPreviewDialog` beside the existing `BulkActionDialog`**

Pass the pending plan's reassignments, submission state, localized structured error, and cancel/confirm callbacks. Cancel clears the pending plan and performs no API writes.

- [ ] **Step 7: Run the focused matrix and service tests, then apply `test-guard` and `clean-code-guard`**

Run: `& { npx vitest run src/features/academics/teacher-allocation/components/__tests__/AllocationMatrixView.test.tsx src/features/academics/teacher-allocation/services/__tests__/teacherAllocationService.test.ts }`

Expected: PASS.

- [ ] **Step 8: Commit the integrated flow**

```powershell
& {
  git add src/features/academics/teacher-allocation/components/AllocationMatrixView.tsx src/features/academics/teacher-allocation/components/__tests__/AllocationMatrixView.test.tsx
  git commit -m "feat(academics): confirm atomic teacher reassignments"
}
```

---

### Task 6: Add complete English and Arabic reassignment copy

**Files:**

- Modify: `src/messages/en.json:6169`
- Modify: `src/messages/ar.json:6705`
- Create: `src/messages/__tests__/teacherAllocationReassignmentTranslations.test.ts`

**Interfaces:**

- Consumes: Translation keys used by Tasks 3–5.
- Produces: Matching `academics.teacherAllocation.reassignment` trees in both locales.

- [ ] **Step 1: Write a failing locale parity test**

```ts
const requiredKeys = [
  "title",
  "description",
  "status.ready",
  "status.blocked",
  "actions.cancel",
  "actions.confirm",
  "errors.stalePreview",
  "errors.concurrentChange",
  "errors.targetNotFound",
  "errors.targetIneligible",
  "errors.unknown",
  "blockers.targetTeacherConflict",
  "policies.contextualAccessNoRewrite",
];

for (const key of requiredKeys) {
  expect(readPath(en.academics.teacherAllocation.reassignment, key)).toBeTypeOf("string");
  expect(readPath(ar.academics.teacherAllocation.reassignment, key)).toBeTypeOf("string");
}
```

Include every key used by the dialog and error renderer, not only the sample above.

- [ ] **Step 2: Run the translation test and verify it fails**

Run: `& { npx vitest run src/messages/__tests__/teacherAllocationReassignmentTranslations.test.ts }`

Expected: FAIL because the new translation subtree does not exist.

- [ ] **Step 3: Add mirrored translation trees**

Include labels for:

- current and target teacher;
- ready/blocked decisions;
- all five blocker codes;
- all impact domains and their statuses;
- automatic handoff and preserved-history summaries with ICU plural counts;
- the four unchanged-policy values;
- all five backend error outcomes plus unknown/network fallback;
- cancel, confirm, and confirming actions.

Use natural Arabic copy and keep backend codes out of visible text.

- [ ] **Step 4: Run the translation and dialog tests, then apply `test-guard`**

Run: `& { npx vitest run src/messages/__tests__/teacherAllocationReassignmentTranslations.test.ts src/features/academics/teacher-allocation/components/__tests__/ReassignmentPreviewDialog.test.tsx }`

Expected: PASS.

- [ ] **Step 5: Commit localization**

```powershell
& {
  git add src/messages/en.json src/messages/ar.json src/messages/__tests__/teacherAllocationReassignmentTranslations.test.ts
  git commit -m "feat(i18n): localize teacher reassignment review"
}
```

---

### Task 7: Focused verification and owner-gated full verification

**Files:**

- Verify only; no planned source changes.

**Interfaces:**

- Consumes: All previous tasks.
- Produces: Evidence that contract, workflow, UI, localization, types, and lint pass without touching unrelated work.

- [ ] **Step 1: Confirm only intended files changed**

Run: `& { git status --short }`

Expected: task files only, plus the pre-existing unstaged `src/features/academics/components/shared/AllocationMatrixTable.tsx` edit that remains untouched.

- [ ] **Step 2: Run all focused teacher-allocation tests**

Run: `& { npx vitest run src/features/academics/teacher-allocation/services/__tests__/teacherAllocationApiAdapter.test.ts src/features/academics/teacher-allocation/services/__tests__/teacherAllocationService.test.ts src/features/academics/teacher-allocation/services/__tests__/teacherAllocationErrors.test.ts src/features/academics/teacher-allocation/components/__tests__/ReassignmentPreviewDialog.test.tsx src/features/academics/teacher-allocation/components/__tests__/AllocationMatrixView.test.tsx src/messages/__tests__/teacherAllocationReassignmentTranslations.test.ts }`

Expected: PASS.

- [ ] **Step 3: Run static verification**

Run: `& { npm run typecheck }`

Expected: PASS.

Run: `& { npx eslint src/features/academics/teacher-allocation src/messages/__tests__/teacherAllocationReassignmentTranslations.test.ts }`

Expected: PASS with no new warnings.

- [ ] **Step 4: Perform final guards**

Run `clean-code-guard` over all production diffs, `test-guard` over all test diffs, and `docs-guard` if any explanatory docs changed during implementation. Resolve findings before handoff.

- [ ] **Step 5: Ask the owner before full-suite verification**

Request approval before running `& { npm run test:run }`. Independently run `& { npm run lint; npm run build }` as the remaining School Dashboard handoff checks. Record actual results; never report PASS for a command that was not run.

- [ ] **Step 6: Review the final diff without staging the user's unrelated file**

Run: `& { git diff --check }`

Run: `& { git diff --stat }`

Expected: no whitespace errors and no accidental changes outside the task scope. Use explicit `git add <task files>` paths; never use `git add .` while the unrelated allocation-table edit is present.

## Acceptance Criteria

- Changing the teacher on a persisted allocation never calls the old delete-then-create sequence.
- Save previews all persisted teacher changes before the first write.
- Blocked previews show their reasons and cannot be confirmed.
- Confirmation sends the exact fingerprint that the user reviewed.
- Stale/concurrent/partial failures invalidate the pending plan and refresh backend state.
- New assignments still bulk-create; explicit unassignments still delete.
- The dialog uses shared UI primitives, is keyboard accessible, and works in English, Arabic, LTR, and RTL.
- Focused tests, typecheck, and scoped lint pass; the full test suite runs only after owner approval.
