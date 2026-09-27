# Automatic Assessment Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add teacher-triggered frontend auto-correction for deterministic assessment answers, visible manual-correction warnings, and legacy-safe retirement of Matching, Fill-in-the-blank, and Media authoring.

**Architecture:** A pure submissions utility calculates review payloads from question definitions and submission details. Single-student and assessment-wide orchestrators send those payloads through the existing bulk-review endpoint; the bulk path uses a concurrency-limited client queue with per-student outcomes. Assessment authoring exposes only supported types and applies per-question read-only guards to legacy data.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl, Vitest, Testing Library, existing src/components/ui primitives.

**Spec:** docs/superpowers/specs/2026-09-27-automatic-assessment-correction-design.md

## Global Constraints

- Auto-grade only MCQ_SINGLE, MCQ_MULTI, and TRUE_FALSE.
- Use full-or-zero scoring; MCQ_MULTI requires exact set equality.
- Recalculate every objective answer on each run, overwriting existing objective scores.
- An objective question with no answerId remains pending because no backend change is allowed.
- Never finalize a submission or sync a grade item from Auto-correct.
- Require grades.submissions.review and grades.questions.view.
- Keep Matching, Fill-in-the-blank, and Media visible historically but read-only in assessment authoring.
- Reuse controls from src/components/ui and add English and Arabic copy.
- Use clean-code-guard after every production-code change.
- Use test-guard after every test-code change.
- Run focused tests during implementation; ask the owner before npm run test:run or any full-suite alias.
- Do not change the Backend repository or API contract.

---

## File Structure

### New files

- src/features/grades/submissions/utils/automaticCorrection.ts — pure eligibility, scoring, and summary construction.
- src/features/grades/submissions/utils/__tests__/automaticCorrection.test.ts — table-driven grading-engine tests.
- src/features/grades/submissions/services/automaticCorrectionBatch.ts — concurrency-limited multi-submission orchestration.
- src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts — batch continuation, progress, and retry tests.
- src/features/grades/submissions/components/AutomaticCorrectionDialog.tsx — Modal-based scope selection, progress, and results.
- src/features/grades/submissions/components/ManualCorrectionWarning.tsx — list/detail warning presentation.
- src/features/grades/assessments/utils/assessmentQuestionAvailability.ts — supported/retired authoring policy.
- src/features/grades/assessments/utils/__tests__/assessmentQuestionAvailability.test.ts — policy tests.

### Modified files

- src/features/grades/submissions/pages/GradeSubmissionPage.tsx
- src/features/grades/submissions/pages/AssessmentSubmissionsPage.tsx
- src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx
- src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx
- src/features/grades/assessments/pages/AssessmentQuestionsPage.tsx
- src/features/grades/assessments/services/gradesAssessmentsService.ts
- src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts
- src/features/grades/assessments/components/AssessmentQuestionDesktopLayout.tsx
- src/features/grades/assessments/components/AssessmentQuestionMobileLayout.tsx
- src/features/academics/curriculum/components/QuestionEditor.tsx
- src/features/academics/curriculum/components/QuestionsOutline.tsx
- src/features/academics/curriculum/components/QuestionOutlineItem.tsx
- src/features/grades/assessments/components/__tests__/AssessmentQuestionsBuilder.test.tsx
- src/messages/en.json
- src/messages/ar.json
- src/messages/__tests__/gradesTranslations.test.ts

---

### Task 1: Build the deterministic correction engine

**Files:**
- Create: src/features/grades/submissions/utils/automaticCorrection.ts
- Create: src/features/grades/submissions/utils/__tests__/automaticCorrection.test.ts
- Read: src/features/grades/shared/types.ts:213
- Read: src/features/grades/gradebook/types/api.types.ts:304

**Interfaces:**
- Consumes AssessmentQuestion, GradeSubmissionDetail, and GradeSubmissionAnswer.
- Produces:

~~~ts
export type AutomaticCorrectionSkipReason =
  | "manual_question"
  | "missing_answer_record"
  | "invalid_answer_key";

export interface AutomaticCorrectionReview {
  answerId: string;
  questionId: string;
  awardedPoints: number;
}

export interface AutomaticCorrectionSummary {
  correctedCount: number;
  manualCount: number;
  missingAnswerCount: number;
  invalidKeyCount: number;
}

export interface AutomaticCorrectionPlan {
  reviews: AutomaticCorrectionReview[];
  skipped: Array<{ questionId: string; reason: AutomaticCorrectionSkipReason }>;
  summary: AutomaticCorrectionSummary;
}

export function buildAutomaticCorrectionPlan(
  submission: GradeSubmissionDetail,
  definitionsByQuestionId: Readonly<Record<string, AssessmentQuestion>>,
): AutomaticCorrectionPlan;

export function hasManualCorrectionWork(plan: AutomaticCorrectionPlan): boolean;
~~~

- [ ] **Step 1: Write failing supported-scoring tests**

Create table-driven fixtures for single choice, exact-set multiple choice, and true/false. Verify order independence and full-or-zero behavior:

~~~ts
it.each([
  { type: "MCQ_SINGLE", selected: ["correct"], expected: 4 },
  { type: "MCQ_SINGLE", selected: ["wrong"], expected: 0 },
  { type: "MCQ_MULTI", selected: ["b", "a"], expected: 4 },
  { type: "MCQ_MULTI", selected: ["a"], expected: 0 },
  { type: "MCQ_MULTI", selected: ["a", "b", "wrong"], expected: 0 },
])("scores $type deterministically", ({ type, selected, expected }) => {
  const plan = buildAutomaticCorrectionPlan(
    submissionWithChoiceAnswer(type, selected),
    definitionsForChoice(type),
  );
  expect(plan.reviews).toEqual([
    { answerId: "answer-1", questionId: "question-1", awardedPoints: expected },
  ]);
});
~~~

For true/false, use definition options with values "true" and "false", set correctAnswer, and assert both outcomes.

- [ ] **Step 2: Run the focused test and verify red**

~~~powershell
npx vitest run src/features/grades/submissions/utils/__tests__/automaticCorrection.test.ts
~~~

Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement normalization and scoring helpers**

~~~ts
const AUTO_CORRECTABLE_TYPES = new Set<AssessmentQuestion["questionType"]>([
  "MCQ_SINGLE",
  "MCQ_MULTI",
  "TRUE_FALSE",
]);

function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const expected = new Set(right);
  return left.every((id) => expected.has(id));
}

function isReviewed(answer: GradeSubmissionAnswer): boolean {
  return answer.reviewedAt !== null
    || answer.awardedPoints !== null
    || answer.correctionStatus.toLowerCase() === "corrected";
}

function parseBooleanOptionValue(value: string | undefined): boolean | null {
  if (value?.toLowerCase() === "true") return true;
  if (value?.toLowerCase() === "false") return false;
  return null;
}
~~~

Use answer.selectedOptions optionId values. For MCQ types, derive correct IDs from definition.options isCorrect. For true/false, resolve the selected option value and compare it with definition.correctAnswer. Invalid correct-option counts or missing values return invalid_answer_key.

- [ ] **Step 4: Add failing skip and repeat-run tests**

~~~ts
expect(planForManualType("ESSAY").summary.manualCount).toBe(1);
expect(planForManualType("MATCHING").summary.manualCount).toBe(1);
expect(planForReviewedObjective().reviews[0]?.awardedPoints).toBe(expectedPoints);
expect(planForMissingAnswerRecord().summary.missingAnswerCount).toBe(1);
expect(planForExistingBlankAnswer().reviews[0]?.awardedPoints).toBe(0);
expect(planForMalformedSingleChoiceKey().summary.invalidKeyCount).toBe(1);
~~~

Manual types are SHORT_ANSWER, ESSAY, FILL_IN_BLANK, MATCHING, and MEDIA.

- [ ] **Step 5: Complete plan construction**

Apply rules in this order:

~~~ts
if (!definition || !AUTO_CORRECTABLE_TYPES.has(definition.questionType)) {
  recordSkip(question.id, "manual_question");
} else if (!question.answer) {
  recordSkip(question.id, "missing_answer_record");
} else {
  const awardedPoints = scoreObjectiveAnswer(question, definition);
  if (awardedPoints === null) recordSkip(question.id, "invalid_answer_key");
  else reviews.push({ answerId: question.answer.id, questionId: question.id, awardedPoints });
}
~~~

hasManualCorrectionWork returns true for manual, missing-answer, or invalid-key counts.

- [ ] **Step 6: Run focused verification**

~~~powershell
npx vitest run src/features/grades/submissions/utils/__tests__/automaticCorrection.test.ts
npm run typecheck
~~~

Expected: PASS.

- [ ] **Step 7: Apply required guards and commit**

Use clean-code-guard on production code and test-guard on the test. Fix blocking findings, rerun the test, then:

~~~powershell
git add src/features/grades/submissions/utils/automaticCorrection.ts src/features/grades/submissions/utils/__tests__/automaticCorrection.test.ts
git commit -m "feat(grades): add deterministic submission correction engine"
~~~

---

### Task 2: Add single-submission Auto-correct and manual warning

**Files:**
- Create: src/features/grades/submissions/components/ManualCorrectionWarning.tsx
- Modify: src/features/grades/submissions/pages/GradeSubmissionPage.tsx:77
- Modify: src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx

**Interfaces:**
- Consumes buildAutomaticCorrectionPlan, hasManualCorrectionWork, reviewSubmissionAnswers, and existing loadSubmission.
- Produces:

~~~ts
interface ManualCorrectionWarningProps {
  pendingCount: number;
  compact?: boolean;
}
~~~

- [ ] **Step 1: Write failing page tests**

Grant both required permissions in the default mock. Create an unreviewed objective answer and answer-key definition, click autoCorrection.detailAction, and assert:

~~~ts
expect(api.apiPut).toHaveBeenCalledWith(
  `/grades/submissions/${submissionId}/answers/review`,
  { reviews: [{ answerId, awardedPoints: 3 }] },
);
expect(api.apiPost).not.toHaveBeenCalledWith(
  `/grades/submissions/${submissionId}/review/finalize`,
);
expect(api.apiPost).not.toHaveBeenCalledWith(
  `/grades/submissions/${submissionId}/sync-grade-item`,
);
~~~

Also test permission denial, corrected/in-progress state, reload after success, repeat-run overwrite, and manual warning.

- [ ] **Step 2: Verify red**

~~~powershell
npx vitest run src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx
~~~

- [ ] **Step 3: Implement ManualCorrectionWarning**

~~~tsx
export default function ManualCorrectionWarning({
  pendingCount,
  compact = false,
}: ManualCorrectionWarningProps) {
  const t = useTranslations("academics.grades.submissions.autoCorrection");
  return (
    <div
      role="status"
      className={compact
        ? "inline-flex rounded-full bg-[var(--warning-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--warning-text)]"
        : "rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-sm text-[var(--warning-text)]"}
    >
      {compact ? t("needsManualBadge") : t("needsManual", { count: pendingCount })}
    </div>
  );
}
~~~

- [ ] **Step 4: Implement the detail action**

Define canAutoCorrect from submitted status and both permissions. Reuse questionDefinitions. Do not call the existing runAction unchanged because it catches failures internally; make the dedicated action set its result only after reviewSubmissionAnswers resolves successfully:

~~~ts
const runAutomaticCorrection = async () => {
  if (!submission || !canAutoCorrect || actionLockRef.current) return;
  const plan = buildAutomaticCorrectionPlan(submission, questionDefinitions);
  if (plan.reviews.length === 0) {
    setAutomaticCorrectionResult(plan.summary);
    return;
  }

  actionLockRef.current = true;
  setActiveAction("auto-correct");
  try {
    await reviewSubmissionAnswers(
      submission.id,
      plan.reviews.map(({ answerId, awardedPoints }) => ({ answerId, awardedPoints })),
    );
    await loadSubmission();
    setAutomaticCorrectionResult(plan.summary);
  } catch (error) {
    const descriptor = describeGradesApiError(error);
    setError({ message: errorT(descriptor.key), traceId: descriptor.traceId });
  } finally {
    setActiveAction(null);
    actionLockRef.current = false;
  }
};
~~~

Place the button with review actions. Never call finalize or sync. After success reload API state. Show the warning above answers when the plan has manual work or refreshed pendingCorrectionCount is nonzero.

- [ ] **Step 5: Run, guard, and commit**

~~~powershell
npx vitest run src/features/grades/submissions/utils/__tests__/automaticCorrection.test.ts src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx
npm run typecheck
~~~

Use clean-code-guard and test-guard, fix findings, then:

~~~powershell
git add src/features/grades/submissions/components/ManualCorrectionWarning.tsx src/features/grades/submissions/pages/GradeSubmissionPage.tsx src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx
git commit -m "feat(grades): auto-correct one assessment submission"
~~~

---

### Task 3: Build the bulk correction service

**Files:**
- Create: src/features/grades/submissions/services/automaticCorrectionBatch.ts
- Create: src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts

**Interfaces:**

~~~ts
export interface AutomaticCorrectionStudentResult {
  submissionId: string;
  status: "corrected" | "manual_only" | "skipped" | "failed";
  summary: AutomaticCorrectionSummary | null;
  error: unknown | null;
}

export interface AutomaticCorrectionBatchProgress {
  processed: number;
  total: number;
  currentSubmissionId: string;
}

export interface AutomaticCorrectionBatchResult {
  results: AutomaticCorrectionStudentResult[];
  failedSubmissionIds: string[];
  totals: AutomaticCorrectionSummary & {
    studentsProcessed: number;
    studentsFailed: number;
  };
}

export async function runAutomaticCorrectionBatch(args: {
  submissionIds: readonly string[];
  definitionsByQuestionId: Readonly<Record<string, AssessmentQuestion>>;
  concurrency?: number;
  onProgress?: (progress: AutomaticCorrectionBatchProgress) => void;
}): Promise<AutomaticCorrectionBatchResult>;
~~~

- [ ] **Step 1: Write failing batch tests**

Mock fetchGradeSubmission and reviewSubmissionAnswers. Assert concurrency never exceeds three, one failure does not stop later IDs, results preserve input order, manual-only sends no review request, progress reaches total, and failed-only retry fetches only failed IDs.

- [ ] **Step 2: Verify red**

~~~powershell
npx vitest run src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts
~~~

- [ ] **Step 3: Implement the fixed worker pool**

~~~ts
const workerCount = Math.min(
  Math.max(args.concurrency ?? 3, 1),
  args.submissionIds.length,
);
const results = new Array<AutomaticCorrectionStudentResult>(args.submissionIds.length);
let cursor = 0;
let processed = 0;

async function worker(): Promise<void> {
  while (cursor < args.submissionIds.length) {
    const index = cursor;
    cursor += 1;
    const submissionId = args.submissionIds[index];
    results[index] = await correctOneSubmission(
      submissionId,
      args.definitionsByQuestionId,
    );
    processed += 1;
    args.onProgress?.({
      processed,
      total: args.submissionIds.length,
      currentSubmissionId: submissionId,
    });
  }
}

await Promise.all(Array.from({ length: workerCount }, () => worker()));
~~~

correctOneSubmission catches its own errors. Send no request when reviews is empty. Aggregate summaries and failed IDs after all workers finish.

- [ ] **Step 4: Run, guard, and commit**

~~~powershell
npx vitest run src/features/grades/submissions/utils/__tests__/automaticCorrection.test.ts src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts
npm run typecheck
~~~

Use clean-code-guard and test-guard, then:

~~~powershell
git add src/features/grades/submissions/services/automaticCorrectionBatch.ts src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts
git commit -m "feat(grades): orchestrate bulk automatic correction"
~~~

---

### Task 4: Add bulk scope selection, progress, warnings, and retry

**Files:**
- Create: src/features/grades/submissions/components/AutomaticCorrectionDialog.tsx
- Modify: src/features/grades/submissions/pages/AssessmentSubmissionsPage.tsx:23
- Modify: src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx

**Interfaces:**

~~~ts
export type AutomaticCorrectionScope = "all" | "filtered";

interface AutomaticCorrectionDialogProps {
  isOpen: boolean;
  scope: AutomaticCorrectionScope;
  eligibleCount: number;
  isPreviewLoading: boolean;
  progress: AutomaticCorrectionBatchProgress | null;
  result: AutomaticCorrectionBatchResult | null;
  onScopeChange: (scope: AutomaticCorrectionScope) => void;
  onConfirm: () => void;
  onRetryFailed: () => void;
  onClose: () => void;
}
~~~

- [ ] **Step 1: Write failing list-page tests**

Seed submitted, in-progress, and corrected rows. Test filtered scope carries search/status/cascade filters; all scope sends only status submitted. Assert non-submitted IDs never reach the batch. Test partial failure, failed-only retry, progress text, permissions, and a manual-warning row badge.

- [ ] **Step 2: Verify red**

~~~powershell
npx vitest run src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx
~~~

- [ ] **Step 3: Implement the dialog with UI primitives**

Use Modal and Button from src/components/ui. Scope buttons expose aria-pressed. Add:

~~~tsx
<div role="status" aria-live="polite">
  {progress
    ? t("progress", {
        processed: progress.processed,
        total: progress.total,
      })
    : null}
</div>
~~~

Disable confirm while the eligible-count preview is loading or zero. Disable close and scope changes while running. Render all summary counts. Show Retry only for nonempty failedSubmissionIds.

- [ ] **Step 4: Resolve scope targets explicitly**

~~~ts
const targetFilters = scope === "filtered"
  ? toSubmissionListFilters(scopeSelection, status, debouncedSearch)
  : { status: "submitted" as const };

const targetResponse = await listAssessmentSubmissions(assessmentId, targetFilters);
const submissionIds = targetResponse.items
  .filter((row) => row.status === "submitted")
  .map((row) => row.id);
~~~

When the dialog opens and whenever scope changes, issue the appropriate list request first and cache only submitted IDs. This produces the eligible count before confirmation. Confirm uses the cached IDs rather than issuing a different query, preventing a count/action mismatch. Fetch definitions once per run. Retry passes exactly result.failedSubmissionIds.

- [ ] **Step 5: Add warnings, refresh, and navigation protection**

Load assessment definitions when the page has term context and grades.questions.view permission so row warnings are available before the first correction run. Show compact warning for submitted rows when the assessment contains a manual type and pendingCorrectionCount is nonzero; otherwise keep the numeric count. Reload current rows after the batch. Disable filters/reset/row navigation during processing and install beforeunload until processing ends. Do not add cancellation.

- [ ] **Step 6: Run, guard, and commit**

~~~powershell
npx vitest run src/features/grades/submissions/utils/__tests__/automaticCorrection.test.ts src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx
npm run typecheck
~~~

Use clean-code-guard and test-guard, then:

~~~powershell
git add src/features/grades/submissions/components/AutomaticCorrectionDialog.tsx src/features/grades/submissions/pages/AssessmentSubmissionsPage.tsx src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx
git commit -m "feat(grades): auto-correct assessment submissions in bulk"
~~~

---

### Task 5: Retire unsupported assessment question authoring safely

**Files:**
- Create: src/features/grades/assessments/utils/assessmentQuestionAvailability.ts
- Create: src/features/grades/assessments/utils/__tests__/assessmentQuestionAvailability.test.ts
- Modify: src/features/grades/assessments/pages/AssessmentQuestionsPage.tsx:218
- Modify: src/features/grades/assessments/services/gradesAssessmentsService.ts:137
- Modify: src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts
- Modify: src/features/grades/assessments/components/AssessmentQuestionDesktopLayout.tsx
- Modify: src/features/grades/assessments/components/AssessmentQuestionMobileLayout.tsx
- Modify: src/features/academics/curriculum/components/QuestionEditor.tsx:25
- Modify: src/features/academics/curriculum/components/QuestionsOutline.tsx
- Modify: src/features/academics/curriculum/components/QuestionOutlineItem.tsx
- Test: src/features/grades/assessments/components/__tests__/AssessmentQuestionsBuilder.test.tsx

**Interfaces:**

~~~ts
export const ASSESSMENT_AUTHORING_QUESTION_TYPES = [
  "MCQ_SINGLE",
  "MCQ_MULTI",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
] as const satisfies readonly AssessmentQuestion["questionType"][];

export function isRetiredAssessmentQuestionType(
  type: AssessmentQuestion["questionType"],
): boolean;
~~~

QuestionsOutline gains isQuestionReadOnly?: (question: AssignmentQuestion) => boolean. QuestionOutlineItem gains isLegacyReadOnly?: boolean.

- [ ] **Step 1: Write and run failing policy tests**

~~~ts
expect(ASSESSMENT_AUTHORING_QUESTION_TYPES).toEqual([
  "MCQ_SINGLE",
  "MCQ_MULTI",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
]);
expect(isRetiredAssessmentQuestionType("MATCHING")).toBe(true);
expect(isRetiredAssessmentQuestionType("FILL_IN_BLANK")).toBe(true);
expect(isRetiredAssessmentQuestionType("MEDIA")).toBe(true);
expect(isRetiredAssessmentQuestionType("ESSAY")).toBe(false);
~~~

Run:

~~~powershell
npx vitest run src/features/grades/assessments/utils/__tests__/assessmentQuestionAvailability.test.ts
~~~

Expected: FAIL, then implement membership-based policy and rerun to PASS.

- [ ] **Step 2: Write failing builder behavior tests**

Assert retired options are absent for new/supported questions, historical retired questions show legacyReadOnly, and move/delete/save API calls are blocked. Confirm the retired question content remains visible.

- [ ] **Step 3: Restrict both assessment layouts**

Pass ASSESSMENT_AUTHORING_QUESTION_TYPES to QuestionEditor.allowedQuestionTypes. Existing retired questions receive isReadOnly true. If their value is excluded from options, QuestionEditor renders the translated current type as read-only text rather than an empty Select.

- [ ] **Step 4: Apply per-question read-only controls**

~~~tsx
const legacyReadOnly = isQuestionReadOnly?.(question) ?? false;
<QuestionOutlineItem
  isReadOnly={isReadOnly || legacyReadOnly}
  isLegacyReadOnly={legacyReadOnly}
/>
~~~

Show legacyReadOnly beside the type badge and hide move/delete buttons for legacy items. Apply the same logic in the mobile drawer.

- [ ] **Step 5: Add defense-in-depth page guards**

~~~ts
const isRetiredQuestion = (questionId: string): boolean => {
  const question = questionDraft?.id === questionId
    ? questionDraft
    : questions.find((candidate) => candidate.id === questionId);
  return Boolean(
    question && isRetiredAssessmentQuestionType(question.questionType),
  );
};
~~~

Guard update, save, delete, and move handlers. A move is also rejected when its destination neighbor is retired, because swapping a supported question across that neighbor would change the legacy question's order. Disable Auto-distribute points whenever any retired question exists so it cannot mutate legacy points. Show retiredQuestionReadOnly and issue no API request. Do not remove mapping/render support.

Add the same mutation assertion at the assessment service boundary:

~~~ts
function assertSupportedAssessmentQuestionMutation(
  question: AssessmentQuestion,
): void {
  if (isRetiredAssessmentQuestionType(question.questionType)) {
    throw new Error("Retired assessment question types are read-only");
  }
}
~~~

Call it before apiPost in createAssessmentQuestion and before apiPatch in updateAssessmentQuestion. Add service tests proving the API mock is not called for MATCHING, FILL_IN_BLANK, or MEDIA. Keep fetch mapping unchanged for historical records.

- [ ] **Step 6: Run, guard, and commit**

~~~powershell
npx vitest run src/features/grades/assessments/utils/__tests__/assessmentQuestionAvailability.test.ts src/features/grades/assessments/components/__tests__/AssessmentQuestionsBuilder.test.tsx
npm run typecheck
~~~

Use clean-code-guard and test-guard, then:

~~~powershell
git add src/features/grades/assessments/utils/assessmentQuestionAvailability.ts src/features/grades/assessments/utils/__tests__/assessmentQuestionAvailability.test.ts src/features/grades/assessments/pages/AssessmentQuestionsPage.tsx src/features/grades/assessments/services/gradesAssessmentsService.ts src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts src/features/grades/assessments/components/AssessmentQuestionDesktopLayout.tsx src/features/grades/assessments/components/AssessmentQuestionMobileLayout.tsx src/features/academics/curriculum/components/QuestionEditor.tsx src/features/academics/curriculum/components/QuestionsOutline.tsx src/features/academics/curriculum/components/QuestionOutlineItem.tsx src/features/grades/assessments/components/__tests__/AssessmentQuestionsBuilder.test.tsx
git commit -m "feat(grades): retire unsupported assessment question types"
~~~

---

### Task 6: Add bilingual copy and verify the feature

**Files:**
- Modify: src/messages/en.json:7416
- Modify: src/messages/ar.json at academics.grades.submissions
- Modify: src/messages/__tests__/gradesTranslations.test.ts
- Review all files changed by Tasks 1-5.

**Interfaces:**
- Produces academics.grades.submissions.autoCorrection plus academics.grades.questions.legacyReadOnly and retiredQuestionReadOnly in both locales.

- [ ] **Step 1: Write a failing translation parity test**

Require these dotted keys in both languages:

~~~ts
const automaticCorrectionKeys = [
  "open",
  "detailAction",
  "title",
  "scope.all",
  "scope.filtered",
  "confirm",
  "progress",
  "needsManual",
  "needsManualBadge",
  "result.corrected",
  "result.manual",
  "result.missingAnswers",
  "result.invalidKeys",
  "result.failed",
  "retryFailed",
] as const;
~~~

Also require both legacy read-only keys.

- [ ] **Step 2: Verify red and add messages**

~~~powershell
npx vitest run src/messages/__tests__/gradesTranslations.test.ts
~~~

English must include:

~~~json
{
  "open": "Auto-correct",
  "detailAction": "Auto-correct objective questions",
  "title": "Auto-correct submissions",
  "confirm": "Start correction",
  "progress": "Processed {processed} of {total} submissions",
  "needsManual": "{count, plural, one {# question needs manual correction} other {# questions need manual correction}}",
  "needsManualBadge": "Needs manual correction",
  "retryFailed": "Retry failed students"
}
~~~

Add equivalent natural Arabic copy and result labels for every count.

- [ ] **Step 3: Run all focused feature tests**

~~~powershell
npx vitest run src/messages/__tests__/gradesTranslations.test.ts src/features/grades/submissions/utils/__tests__/automaticCorrection.test.ts src/features/grades/submissions/services/__tests__/automaticCorrectionBatch.test.ts src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx src/features/grades/assessments/utils/__tests__/assessmentQuestionAvailability.test.ts src/features/grades/assessments/components/__tests__/AssessmentQuestionsBuilder.test.tsx
npm run typecheck
~~~

Expected: PASS.

- [ ] **Step 4: Apply guards and commit translations**

Use test-guard on translation tests and clean-code-guard on any production fixes made during integration.

~~~powershell
git add src/messages/en.json src/messages/ar.json src/messages/__tests__/gradesTranslations.test.ts
git commit -m "feat(grades): localize automatic correction workflow"
~~~

- [ ] **Step 5: Inspect task-only changes**

~~~powershell
git status --short
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
~~~

Expected: only this feature, spec, and plan; diff check prints nothing.

- [ ] **Step 6: Run static verification**

~~~powershell
npm run lint
npm run typecheck
npm run build
~~~

Expected: PASS with no new task-caused warnings.

- [ ] **Step 7: Run final quality reviews**

Use clean-code-guard over the complete production diff and test-guard over the complete test diff. Fix every blocking finding and rerun affected focused tests, lint, and typecheck.

- [ ] **Step 8: Ask before the full suite**

Ask the owner before:

~~~powershell
npm run test:run
~~~

If not approved, report TESTS=FOCUSED_PASS and FULL_SUITE=NOT_RUN_OWNER_APPROVAL_REQUIRED.

- [ ] **Step 9: Prepare delivery without merging**

Follow Must Read Before Push.txt: normal push only, one Draft PR against main, no merge, and the required MOAZEZ handoff report with exact SHAs, changed files, and verification results.
