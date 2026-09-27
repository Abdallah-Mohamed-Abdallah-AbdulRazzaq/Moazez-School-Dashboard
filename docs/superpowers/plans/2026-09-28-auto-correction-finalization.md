# Automatic Correction Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically finalize fully objective assessment submissions after automatic scores are saved, on both single-submission and batch workflows, while leaving unresolved manual work open.

**Architecture:** Introduce one small execution service that owns the ordered `review -> conditional finalize` sequence and returns whether finalization occurred. The detail page and batch worker both call this service, keeping completion rules and partial-failure behavior consistent. Existing grade synchronization remains separate.

**Tech Stack:** Next.js 15, React 19, TypeScript, next-intl, Vitest, Testing Library, existing grades submission services.

**Spec:** `docs/superpowers/specs/2026-09-28-auto-correction-finalization-design.md`

## Global Constraints

- Frontend-only; use the existing submission review and finalization endpoints.
- Finalize only when `manualCount`, `missingAnswerCount`, and `invalidKeyCount` are all zero.
- Never synchronize the gradebook from automatic correction.
- Preserve saved objective scores when finalization fails.
- Keep batch submissions independent and retry failed submission IDs only.
- Use existing UI components and bilingual message files.
- Apply clean-code-guard to every production-code change and test-guard to every test change.
- Ask the owner before running the full test suite.

---

### Task 1: Shared automatic-correction execution service

**Files:**
- Create: `src/features/grades/submissions/services/automaticCorrectionExecution.ts`
- Create: `src/features/grades/submissions/services/__tests__/automaticCorrectionExecution.test.ts`

**Interfaces:**
- Consumes: `AutomaticCorrectionPlan`, `hasManualCorrectionWork(plan)`, `reviewSubmissionAnswers(submissionId, reviews)`, and `finalizeSubmissionReview(submissionId)`.
- Produces: `executeAutomaticCorrectionPlan(submissionId: string, plan: AutomaticCorrectionPlan): Promise<{ finalized: boolean }>`.

- [ ] **Step 1: Write focused failing execution tests**

Create real `AutomaticCorrectionPlan` fixtures and mock only the HTTP boundary through `@/lib/api`:

```ts
const api = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

const submissionId = "123e4567-e89b-42d3-a456-426614174001";
const answerId = "123e4567-e89b-42d3-a456-426614174002";
const questionId = "123e4567-e89b-42d3-a456-426614174003";

const completePlan: AutomaticCorrectionPlan = {
  reviews: [{ answerId, questionId, awardedPoints: 4 }],
  skipped: [],
  summary: {
    correctedCount: 1,
    manualCount: 0,
    missingAnswerCount: 0,
    invalidKeyCount: 0,
  },
};
```

Cover these observable scenarios:

```ts
it("saves objective scores before finalizing a complete submission", async () => {
  await expect(executeAutomaticCorrectionPlan(submissionId, completePlan))
    .resolves.toEqual({ finalized: true });

  expect(api.apiPut).toHaveBeenCalledWith(
    `/grades/submissions/${submissionId}/answers/review`,
    { reviews: [{ answerId, awardedPoints: 4 }] },
  );
  expect(api.apiPost).toHaveBeenCalledWith(
    `/grades/submissions/${submissionId}/review/finalize`,
  );
  expect(api.apiPut.mock.invocationCallOrder[0])
    .toBeLessThan(api.apiPost.mock.invocationCallOrder[0]);
});

it.each([
  ["manual question", { manualCount: 1, missingAnswerCount: 0, invalidKeyCount: 0 }],
  ["missing answer", { manualCount: 0, missingAnswerCount: 1, invalidKeyCount: 0 }],
  ["invalid key", { manualCount: 0, missingAnswerCount: 0, invalidKeyCount: 1 }],
])("does not finalize when %s remains", async (_scenario, unresolved) => {
  const plan = {
    ...completePlan,
    summary: { correctedCount: 1, ...unresolved },
  };

  await expect(executeAutomaticCorrectionPlan(submissionId, plan))
    .resolves.toEqual({ finalized: false });
  expect(api.apiPost).not.toHaveBeenCalled();
});

it("keeps saved scores when finalization fails", async () => {
  api.apiPost.mockRejectedValueOnce(new Error("Finalize failed"));

  await expect(executeAutomaticCorrectionPlan(submissionId, completePlan))
    .rejects.toThrow("Finalize failed");
  expect(api.apiPut).toHaveBeenCalledTimes(1);
});
```

Also cover a complete plan with `reviews: []` to prove it proceeds directly to finalization.

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```powershell
& { npm run test:run -- src/features/grades/submissions/services/__tests__/automaticCorrectionExecution.test.ts }
```

Expected: FAIL because `automaticCorrectionExecution.ts` does not exist.

- [ ] **Step 3: Implement the minimal shared executor**

Create `automaticCorrectionExecution.ts`:

```ts
import {
  hasManualCorrectionWork,
  type AutomaticCorrectionPlan,
} from "../utils/automaticCorrection";
import {
  finalizeSubmissionReview,
  reviewSubmissionAnswers,
} from "./gradesSubmissionsService";

export interface AutomaticCorrectionExecutionResult {
  finalized: boolean;
}

export async function executeAutomaticCorrectionPlan(
  submissionId: string,
  plan: AutomaticCorrectionPlan,
): Promise<AutomaticCorrectionExecutionResult> {
  if (plan.reviews.length > 0) {
    await reviewSubmissionAnswers(
      submissionId,
      plan.reviews.map(({ answerId, awardedPoints }) => ({ answerId, awardedPoints })),
    );
  }

  const finalized = !hasManualCorrectionWork(plan);
  if (finalized) await finalizeSubmissionReview(submissionId);
  return { finalized };
}
```

- [ ] **Step 4: Run the focused test and quality guards**

Run:

```powershell
& {
  npm run test:run -- src/features/grades/submissions/services/__tests__/automaticCorrectionExecution.test.ts
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npx eslint 'src/features/grades/submissions/services/automaticCorrectionExecution.ts' 'src/features/grades/submissions/services/__tests__/automaticCorrectionExecution.test.ts'
}
```

Expected: all execution tests PASS and ESLint exits with code 0. Apply clean-code-guard to the service diff and test-guard to the test diff before committing.

- [ ] **Step 5: Commit the shared execution service**

```powershell
& {
  git add -- 'src/features/grades/submissions/services/automaticCorrectionExecution.ts' 'src/features/grades/submissions/services/__tests__/automaticCorrectionExecution.test.ts'
  git commit -m 'feat(grades): finalize complete automatic corrections'
}
```

---

### Task 2: Finalize from the single-submission workflow

**Files:**
- Modify: `src/features/grades/submissions/pages/GradeSubmissionPage.tsx:224-244`
- Modify: `src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx:178-243`
- Modify: `src/messages/en.json` under `academics.grades.submissions.autoCorrection`
- Modify: `src/messages/ar.json` under `academics.grades.submissions.autoCorrection`
- Modify: `src/messages/__tests__/gradesTranslations.test.ts`

**Interfaces:**
- Consumes: `executeAutomaticCorrectionPlan(submissionId, plan)` from Task 1.
- Produces: detail-page automatic correction that reloads once and reports whether the submission was finalized.

- [ ] **Step 1: Update the page tests to require finalization**

Change the existing first automatic-correction test to require the ordered review and finalize calls while still excluding grade synchronization:

```ts
it("auto-corrects and finalizes a complete objective submission without syncing", async () => {
  const user = userEvent.setup();
  mockSubmissionRequests(objectiveSubmissionDetail(), assessmentQuestions("mcq_single"));

  render(<GradeSubmissionPage submissionId={submissionId} />);
  await user.click(await screen.findByRole("button", {
    name: "autoCorrection.detailAction",
  }));

  await waitFor(() => expect(api.apiPut).toHaveBeenCalledWith(
    `/grades/submissions/${submissionId}/answers/review`,
    { reviews: [{ answerId, awardedPoints: 3 }] },
  ));
  expect(api.apiPost).toHaveBeenCalledWith(
    `/grades/submissions/${submissionId}/review/finalize`,
  );
  expect(api.apiPost).not.toHaveBeenCalledWith(
    `/grades/submissions/${submissionId}/sync-grade-item`,
  );
  expect(toast.showSuccess).toHaveBeenCalledWith("autoCorrection.savedAndFinalized");
});
```

Extend the existing manual-work test so clicking automatic correction does not call finalization. Add a finalization-failure test using `new ApiError("Finalize failed", 409, "grades.review.pending_answers")`; assert the review PUT happened, the page reloaded, the mapped `review_pending_answers` error is visible, and the success toast was not shown.

- [ ] **Step 2: Run the page test and verify the new expectations fail**

Run:

```powershell
& { npm run test:run -- src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx }
```

Expected: FAIL because automatic correction does not call the finalization endpoint.

- [ ] **Step 3: Replace page-local review orchestration with the shared executor**

Import `executeAutomaticCorrectionPlan`. Remove the early return that prevents a zero-review complete plan from finalizing. Keep the unresolved zero-review summary behavior by returning only when there are no reviews and `hasManualCorrectionWork(plan)` is true.

The action should follow this shape:

```ts
const execution = await runAction(
  "auto-correct",
  () => executeAutomaticCorrectionPlan(submission.id, automaticCorrectionPlan),
);
if (!execution) return;
setAutomaticCorrectionSummary(automaticCorrectionPlan.summary);
showSuccess(t(
  execution.finalized
    ? "autoCorrection.savedAndFinalized"
    : "autoCorrection.saved",
));
```

Update `runAction` to preserve the action result rather than collapsing every success to `true`:

```ts
const runAction = async <ActionResult,>(
  key: string,
  action: () => Promise<ActionResult>,
): Promise<ActionResult | null> => {
  if (actionLockRef.current) return null;
  // existing lock, loading, error mapping, reload, and finally behavior
  const actionResult = await action();
  await loadSubmission();
  if (key === "sync") showSuccess(t("messages.synced"));
  return actionResult;
};
```

Return `null` from both failure paths. Existing callers only test truthiness or ignore the returned promise, so their behavior remains unchanged.

In the catch block, reload server state for every `auto-correct` failure as well as the existing stale-state errors:

```ts
const shouldReload = key === "auto-correct" || stale;
if (shouldReload) await loadSubmission({ preserveReviews: true, error: mappedError });
else setError(mappedError);
```

This ensures a finalization failure reveals the objective scores that were already saved.

- [ ] **Step 4: Add bilingual completion feedback**

Add these message keys:

```json
// en.json
"savedAndFinalized": "Objective scores were saved and the submission was finalized."

// ar.json
"savedAndFinalized": "تم حفظ درجات الأسئلة الموضوعية وإنهاء تصحيح التسليم."
```

Add `savedAndFinalized` to the automatic-correction key list in `gradesTranslations.test.ts`.

- [ ] **Step 5: Run focused page and translation verification**

Run:

```powershell
& {
  npm run test:run -- src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx src/messages/__tests__/gradesTranslations.test.ts
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npx eslint 'src/features/grades/submissions/pages/GradeSubmissionPage.tsx' 'src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx' 'src/messages/__tests__/gradesTranslations.test.ts'
}
```

Expected: all focused tests PASS and ESLint exits with code 0. Apply clean-code-guard to the page diff and test-guard to the test diffs.

- [ ] **Step 6: Commit the detail-page workflow**

```powershell
& {
  git add -- 'src/features/grades/submissions/pages/GradeSubmissionPage.tsx' 'src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx' 'src/messages/en.json' 'src/messages/ar.json' 'src/messages/__tests__/gradesTranslations.test.ts'
  git commit -m 'feat(grades): finalize detail auto-correction'
}
```

---

### Task 3: Finalize and report batch automatic corrections

**Files:**
- Modify: `src/features/grades/submissions/services/automaticCorrectionBatch.ts`
- Modify: `src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts`
- Modify: `src/features/grades/submissions/components/AutomaticCorrectionDialog.tsx`
- Create: `src/features/grades/submissions/components/__tests__/AutomaticCorrectionDialog.test.tsx`
- Modify: `src/messages/en.json` under `academics.grades.submissions.autoCorrection.result`
- Modify: `src/messages/ar.json` under `academics.grades.submissions.autoCorrection.result`
- Modify: `src/messages/__tests__/gradesTranslations.test.ts`

**Interfaces:**
- Consumes: `executeAutomaticCorrectionPlan(submissionId, plan)` from Task 1.
- Produces: `AutomaticCorrectionBatchResult.totals.studentsFinalized: number` and a visible finalized-student result count.

- [ ] **Step 1: Update batch tests for finalization and partial failure**

Replace the review-only expectations with observable review-plus-finalize behavior:

```ts
expect(api.apiPut).toHaveBeenCalledTimes(2);
expect(api.apiPost).toHaveBeenCalledTimes(2);
expect(api.apiPost).toHaveBeenCalledWith(
  `/grades/submissions/${submissionIds[0]}/review/finalize`,
);
expect(api.apiPost).not.toHaveBeenCalledWith(
  `/grades/submissions/${submissionIds[1]}/review/finalize`,
);
expect(batch.totals.studentsFinalized).toBe(2);
```

Add a scenario where `apiPut` succeeds and the finalize `apiPost` rejects for one submission. Assert that:

- the failed submission appears in `failedSubmissionIds`;
- its saved review PUT remains recorded;
- another submission still reaches finalization;
- `studentsFailed` and `studentsFinalized` report the independent outcomes correctly.

Update the retry test so the failed ID triggers one review PUT followed by one finalize POST.

- [ ] **Step 2: Update the dialog test for the finalized count**

Extend the result fixture with `studentsFinalized: 2` and assert:

```ts
expect(screen.getByText("result.finalized 2")).toBeInTheDocument();
```

- [ ] **Step 3: Run batch and dialog tests and verify they fail**

Run:

```powershell
& {
  npm run test:run -- src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts src/features/grades/submissions/components/__tests__/AutomaticCorrectionDialog.test.tsx
}
```

Expected: FAIL because batch workers do not finalize and totals do not contain `studentsFinalized`.

- [ ] **Step 4: Use the shared executor in each batch worker**

Replace direct `reviewSubmissionAnswers` usage with:

```ts
const execution = await executeAutomaticCorrectionPlan(submissionId, plan);
return successfulStudentResult(submissionId, plan, execution.finalized);
```

Change the result builder signature and status decision:

```ts
function successfulStudentResult(
  submissionId: string,
  plan: AutomaticCorrectionPlan,
  finalized: boolean,
): AutomaticCorrectionStudentResult {
  const status = finalized
    ? "corrected"
    : hasManualCorrectionWork(plan) ? "manual_only" : "skipped";
  return { submissionId, status, summary: plan.summary, error: null };
}
```

Add `studentsFinalized` to the totals interface and initialize it from successful finalized results:

```ts
studentsFinalized: results.filter(({ status }) => status === "corrected").length,
```

The existing `catch` continues to convert review or finalization failures into retryable failed results and allows other workers to continue.

- [ ] **Step 5: Display and translate the finalized-student total**

Add to `AutomaticCorrectionDialog.tsx`:

```tsx
<span>{t("result.finalized", {
  count: result.totals.studentsFinalized,
})}</span>
```

Add translations:

```json
// en.json
"finalized": "Submissions finalized: {count}"

// ar.json
"finalized": "التسليمات التي تم إنهاء تصحيحها: {count}"
```

Add `result.finalized` coverage through the existing dialog test and include `finalized` in the nested result translation assertions.

- [ ] **Step 6: Run focused verification and guards**

Run:

```powershell
& {
  npm run test:run -- src/features/grades/submissions/services/__tests__/automaticCorrectionExecution.test.ts src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts src/features/grades/submissions/components/__tests__/AutomaticCorrectionDialog.test.tsx src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx src/messages/__tests__/gradesTranslations.test.ts
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npx eslint 'src/features/grades/submissions/services/automaticCorrectionExecution.ts' 'src/features/grades/submissions/services/automaticCorrectionBatch.ts' 'src/features/grades/submissions/services/__tests__/automaticCorrectionExecution.test.ts' 'src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts' 'src/features/grades/submissions/components/AutomaticCorrectionDialog.tsx' 'src/features/grades/submissions/components/__tests__/AutomaticCorrectionDialog.test.tsx' 'src/features/grades/submissions/pages/GradeSubmissionPage.tsx' 'src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx' 'src/messages/__tests__/gradesTranslations.test.ts'
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm run typecheck
}
```

Expected: focused tests and ESLint PASS. Typecheck must introduce no new errors; document any unrelated baseline errors separately. Do not run the full test suite without owner approval.

- [ ] **Step 7: Commit the batch workflow**

```powershell
& {
  git add -- 'src/features/grades/submissions/services/automaticCorrectionBatch.ts' 'src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts' 'src/features/grades/submissions/components/AutomaticCorrectionDialog.tsx' 'src/features/grades/submissions/components/__tests__/AutomaticCorrectionDialog.test.tsx' 'src/messages/en.json' 'src/messages/ar.json' 'src/messages/__tests__/gradesTranslations.test.ts'
  git commit -m 'feat(grades): finalize batch auto-correction'
}
```

---

## Completion Checklist

- [ ] Single-submission correction saves scores, conditionally finalizes, reloads once, and never syncs.
- [ ] Batch correction conditionally finalizes each student independently.
- [ ] Manual, missing-answer, and invalid-key work prevents finalization.
- [ ] Finalization failures preserve saved scores and remain retryable.
- [ ] The dialog reports finalized-student totals in Arabic and English.
- [ ] Focused tests and ESLint pass.
- [ ] Typecheck introduces no task-related errors.
- [ ] Full tests are run only after explicit owner approval.
