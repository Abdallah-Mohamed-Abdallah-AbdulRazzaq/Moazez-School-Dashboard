# Grades Submissions Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard grades-submissions client exactly consume and validate the backend `/grades/submissions` contract.

**Architecture:** Keep backend wire values unchanged in frontend state, define submission-specific response types, and centralize request validation in a small contract module called by the service boundary. UI components consume lowercase statuses and existing uppercase translation keys through one explicit mapping.

**Tech Stack:** TypeScript 5, React 19, Next.js 16, Vitest 2, Testing Library, ESLint

## Global Constraints

- Backend contract source is `Moazez-Backend` commit `37a6fd9`.
- Do not change backend DTOs, presenters, routes, or permissions.
- Do not normalize response statuses to uppercase.
- Answer text is at most 10,000 characters.
- Selected option IDs contain at most 100 entries.
- Bulk answer and review requests contain 1 to 200 entries.
- Reviewer comments in either language are at most 2,000 characters.
- Awarded points must be finite and greater than or equal to zero.
- Identifiers sent by submission services must be UUIDs.

---

### Task 1: Exact submission response types

**Files:**
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/submissions/types.ts`
- Test: `src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`

**Interfaces:**
- Produces: `BackendSubmissionStatus`, `BackendSubmissionAssessmentResponse`, `BackendSubmissionQuestionResponse`, and corrected submission detail/list response interfaces.
- Consumes: Existing assessment delivery and approval-status types.

- [ ] **Step 1: Add failing compile-time contract assertions**

Add `expectTypeOf` assertions inside the service test using a representative backend detail fixture:

```ts
import { expectTypeOf } from "vitest";
import type {
  BackendSubmissionDetailResponse,
  BackendSubmissionStatus,
} from "../../../gradebook/types/api.types";

it("models lowercase and nullable submission response fields", () => {
  expectTypeOf<BackendSubmissionStatus>().toEqualTypeOf<
    "in_progress" | "submitted" | "corrected"
  >();
  expectTypeOf<BackendSubmissionDetailResponse["maxScore"]>()
    .toEqualTypeOf<number | null>();
  expectTypeOf<BackendSubmissionDetailResponse["assessment"]>()
    .toMatchTypeOf<{ id: string; maxScore: number | null } | null>();
  expectTypeOf<BackendSubmissionDetailResponse["questions"][number]>()
    .toMatchTypeOf<{ id: string; answer: unknown }>();
});
```

- [ ] **Step 2: Run typecheck to verify RED**

Run: `npm run typecheck`

Expected: FAIL because `BackendSubmissionStatus` does not exist and current nullability does not match.

- [ ] **Step 3: Define the exact response interfaces**

In `api.types.ts`, add the lowercase status union and dedicated summary/question types, then update list/detail types:

```ts
export type BackendSubmissionStatus =
  | "in_progress"
  | "submitted"
  | "corrected";

export interface BackendSubmissionAssessmentResponse {
  id: string;
  titleEn: string | null;
  titleAr: string | null;
  deliveryMode: string;
  approvalStatus: string;
  maxScore: number | null;
}

export interface BackendSubmissionQuestionResponse {
  id: string;
  type: string;
  prompt: string;
  promptAr: string | null;
  points: number;
  sortOrder: number;
  required: boolean;
  answer: BackendSubmissionAnswerResponse | null;
}
```

Make `status` use `BackendSubmissionStatus`, make detail `termId`, `assessment`, and `questions` required, allow `assessment` and `maxScore` to be null, and remove the intersection with `BackendAssessmentQuestionResponse`.

In `submissions/types.ts`, replace the uppercase union with:

```ts
export type SubmissionStatus = BackendSubmissionStatus;
```

- [ ] **Step 4: Run focused tests and typecheck to verify GREEN**

Run: `npm run test:run -- src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts && npm run typecheck`

Expected: both commands exit 0.

- [ ] **Step 5: Commit the response contract types**

```bash
git add src/features/grades/gradebook/types/api.types.ts src/features/grades/submissions/types.ts src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts
git commit -m "fix(grades): align submission response types"
```

### Task 2: Submission request validation boundary

**Files:**
- Create: `src/features/grades/submissions/utils/submissionContract.ts`
- Create: `src/features/grades/submissions/utils/__tests__/submissionContract.test.ts`
- Modify: `src/features/grades/submissions/services/gradesSubmissionsService.ts`
- Modify: `src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`

**Interfaces:**
- Produces: `GradesSubmissionValidationError`, exported length/count constants, `assertUuid`, `validateSaveAnswer`, `validateBulkSaveAnswers`, `validateReviewAnswer`, and `validateBulkReviews`.
- Consumes: `SaveSubmissionAnswerPayload`, `BulkSaveSubmissionAnswerPayload`, and `ReviewSubmissionAnswerPayload`.

- [ ] **Step 1: Write failing boundary tests**

Create table-driven Vitest coverage for empty, maximum, and excessive inputs:

```ts
it.each([
  ["answer text", () => validateSaveAnswer({ answerText: "x".repeat(10_001) })],
  ["selected options", () => validateSaveAnswer({ selectedOptionIds: Array(101).fill(UUID) })],
  ["empty bulk answers", () => validateBulkSaveAnswers([])],
  ["oversized bulk answers", () => validateBulkSaveAnswers(Array(201).fill(validAnswer))],
  ["negative points", () => validateReviewAnswer({ awardedPoints: -1 })],
  ["infinite points", () => validateReviewAnswer({ awardedPoints: Infinity })],
  ["review comment", () => validateReviewAnswer({ awardedPoints: 0, reviewerComment: "x".repeat(2_001) })],
  ["empty bulk reviews", () => validateBulkReviews([])],
])("rejects invalid %s", (_name, validate) => {
  expect(validate).toThrow(GradesSubmissionValidationError);
});
```

Add passing boundary cases for exactly 10,000 text characters, 100 option IDs, 200 answers, 2,000 comment characters, and 200 reviews. Add UUID cases for route and payload identifiers.

- [ ] **Step 2: Run the new test to verify RED**

Run: `npm run test:run -- src/features/grades/submissions/utils/__tests__/submissionContract.test.ts`

Expected: FAIL because `submissionContract.ts` does not exist.

- [ ] **Step 3: Implement minimal validators**

Create `submissionContract.ts` with exact constants and explicit assertions:

```ts
export const MAX_ANSWER_TEXT_LENGTH = 10_000;
export const MAX_SELECTED_OPTIONS = 100;
export const MAX_BULK_ANSWERS = 200;
export const MAX_REVIEWER_COMMENT_LENGTH = 2_000;
export const MAX_BULK_REVIEWS = 200;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class GradesSubmissionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GradesSubmissionValidationError";
  }
}
```

Implement the exported assertions without mutation. Validate every ID used by the corresponding request, both reviewer-comment languages, finite/non-negative points, and collection sizes.

- [ ] **Step 4: Run validator tests to verify GREEN**

Run: `npm run test:run -- src/features/grades/submissions/utils/__tests__/submissionContract.test.ts`

Expected: all boundary cases pass.

- [ ] **Step 5: Add failing service-boundary tests**

Update service tests to use stable valid UUID fixtures. Add cases asserting invalid payloads reject and the HTTP mocks remain uncalled:

```ts
await expect(saveSubmissionAnswers(SUBMISSION_ID, [])).rejects
  .toBeInstanceOf(GradesSubmissionValidationError);
expect(apiMocks.apiPut).not.toHaveBeenCalled();
```

Cover one route UUID, one option UUID, bulk save, single review, and bulk review failure to prove each service method invokes its validator.

- [ ] **Step 6: Run service tests to verify RED**

Run: `npm run test:run -- src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`

Expected: FAIL because invalid requests still reach mocked HTTP functions.

- [ ] **Step 7: Wire validators into service methods**

At the start of each public submission service method, validate route IDs and payloads before calling `apiGet`, `apiPut`, `apiPatch`, or `apiPost`. Keep route strings, verbs, bodies, and response types unchanged.

- [ ] **Step 8: Run contract and service tests to verify GREEN**

Run: `npm run test:run -- src/features/grades/submissions/utils/__tests__/submissionContract.test.ts src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`

Expected: all tests pass and invalid inputs make no HTTP calls.

- [ ] **Step 9: Review test quality and commit**

Apply the test-guard checklist: boundary mocks are limited to HTTP, scenarios are data-driven, and every case catches a distinct backend-contract regression.

```bash
git add src/features/grades/submissions/utils/submissionContract.ts src/features/grades/submissions/utils/__tests__/submissionContract.test.ts src/features/grades/submissions/services/gradesSubmissionsService.ts src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts
git commit -m "fix(grades): validate submission requests"
```

### Task 3: Lowercase status UI and input limits

**Files:**
- Modify: `src/features/grades/submissions/pages/AssessmentSubmissionsPage.tsx`
- Modify: `src/features/grades/submissions/pages/GradeSubmissionPage.tsx`
- Create: `src/features/grades/submissions/utils/submissionStatus.ts`
- Create: `src/features/grades/submissions/utils/__tests__/submissionStatus.test.ts`

**Interfaces:**
- Produces: `submissionStatusMessageKey(status: SubmissionStatus)` returning `"IN_PROGRESS" | "SUBMITTED" | "CORRECTED"`.
- Consumes: Validation length constants from `submissionContract.ts` and lowercase `SubmissionStatus`.

- [ ] **Step 1: Write the failing status-key test**

```ts
it.each([
  ["in_progress", "IN_PROGRESS"],
  ["submitted", "SUBMITTED"],
  ["corrected", "CORRECTED"],
] as const)("maps %s to the existing %s translation", (status, key) => {
  expect(submissionStatusMessageKey(status)).toBe(key);
});
```

- [ ] **Step 2: Run status test to verify RED**

Run: `npm run test:run -- src/features/grades/submissions/utils/__tests__/submissionStatus.test.ts`

Expected: FAIL because `submissionStatus.ts` does not exist.

- [ ] **Step 3: Implement the explicit status map**

```ts
const MESSAGE_KEYS = {
  in_progress: "IN_PROGRESS",
  submitted: "SUBMITTED",
  corrected: "CORRECTED",
} as const satisfies Record<SubmissionStatus, string>;

export function submissionStatusMessageKey(status: SubmissionStatus) {
  return MESSAGE_KEYS[status];
}
```

- [ ] **Step 4: Run status test to verify GREEN**

Run: `npm run test:run -- src/features/grades/submissions/utils/__tests__/submissionStatus.test.ts`

Expected: all three mappings pass.

- [ ] **Step 5: Update list and detail UI**

Use lowercase filter option values and lowercase action comparisons. Wrap every status translation with `submissionStatusMessageKey`. Apply `maxLength={MAX_ANSWER_TEXT_LENGTH}` to answer textareas and `maxLength={MAX_REVIEWER_COMMENT_LENGTH}` to reviewer-comment inputs. Preserve the separate assessment-question fetch for choice options.

Use these exact gates:

```ts
const canEnter = hasPermission("grades.submissions.submit") && submission?.status === "in_progress";
const canReview = hasPermission("grades.submissions.review") && submission?.status === "submitted";
const canSync = hasPermission("grades.submissions.review") && submission.status === "corrected";
```

- [ ] **Step 6: Run focused tests and typecheck**

Run: `npm run test:run -- src/features/grades/submissions && npm run typecheck`

Expected: tests pass and TypeScript reports no uppercase-status comparisons or inaccurate question fields.

- [ ] **Step 7: Commit the UI contract behavior**

```bash
git add src/features/grades/submissions/pages/AssessmentSubmissionsPage.tsx src/features/grades/submissions/pages/GradeSubmissionPage.tsx src/features/grades/submissions/utils/submissionStatus.ts src/features/grades/submissions/utils/__tests__/submissionStatus.test.ts
git commit -m "fix(grades): consume lowercase submission statuses"
```

### Task 4: Full verification and quality review

**Files:**
- Review: all files changed in Tasks 1-3

**Interfaces:**
- Consumes: all preceding task outputs.
- Produces: a verified, clean contract-alignment change set.

- [ ] **Step 1: Run the complete submissions test scope**

Run: `npm run test:run -- src/features/grades/submissions`

Expected: exit 0 with no failed tests.

- [ ] **Step 2: Run the grades regression scope**

Run: `npm run test:run -- src/features/grades`

Expected: exit 0 with no failed tests.

- [ ] **Step 3: Run static verification**

Run: `npm run typecheck && npx eslint src/features/grades/submissions src/features/grades/gradebook/types/api.types.ts`

Expected: both commands exit 0.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: Next.js build exits 0.

- [ ] **Step 5: Review changed code and tests**

Apply clean-code-guard to production changes and test-guard to test changes. Confirm there are no unused exports, duplicated validation rules, broad error catches, mock-only assertions, or tests of framework behavior.

- [ ] **Step 6: Inspect the final diff**

Run: `git diff --check HEAD~3..HEAD && git status --short`

Expected: no whitespace errors and only intentional uncommitted changes, if any.

