# Sprint HW-B — Dashboard Homework Submissions Review Surface

**Commit:** `5feab2c3840a3380981f180566006ac8246b30b2`  
**Message:** `feat: add dashboard homework submissions review surface`  
**Baseline before fix:** `d04b871 fix: support question-based grade assessment contracts`  
**Status:** `DASHBOARD_HOMEWORK_SUBMISSIONS_REVIEW_SURFACE_COMPLETE`

---

## 1. Purpose of This Delta

This document covers only the HW-B delta added by commit `5feab2c3840a3380981f180566006ac8246b30b2`.

It does not re-document the full Homework feature. The goal is to document the new Dashboard / School Control Panel surface that closes the original gap: Dashboard could review submission answers and attachments only if it already had a `submissionId`, but it had no Core Homework route to list assignment submissions or inspect a single submission.

After this change, Dashboard can:

1. List submissions for a specific homework assignment.
2. Extract `HomeworkSubmission.id` from the list response.
3. Open one submission detail.
4. Use existing answer and attachment routes with the discovered `submissionId`.
5. Review the full submission from Dashboard.

---

## 2. Problem Before HW-B

Existing Core Homework routes already supported answer/attachment inspection and answer-level review:

```http
GET   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers
GET   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/:answerId
PATCH /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/:answerId/review
PUT   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/review
GET   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/attachments
```

However, Dashboard had no Core route equivalent to:

```http
GET /api/v1/homework/assignments/:homeworkId/submissions
```

Therefore, Dashboard could not discover `HomeworkSubmission.id` without relying on Teacher App or Student App routes.

---

## 3. New Routes Added

Base path:

```http
/api/v1/homework/assignments/:homeworkId/submissions
```

### 3.1 List Assignment Submissions

```http
GET /api/v1/homework/assignments/:homeworkId/submissions
```

**Permission:**

```text
homework.submissions.view
```

**Query parameters:**

| Parameter | Type | Required | Notes |
|---|---:|---:|---|
| `status` | string | No | One of `submitted`, `late`, `reviewed`, `pending_review`. |
| `search` | string | No | Max 200 chars; used by existing review-list logic. |
| `page` | number | No | Minimum `1`. |
| `limit` | number | No | Minimum `1`, maximum `100`. |

**Status filter mapping:**

| Dashboard value | Core status filter |
|---|---|
| `submitted` | `SUBMITTED` |
| `late` | `LATE` |
| `reviewed` | `REVIEWED` |
| `pending_review` | `SUBMITTED`, `LATE` |
| omitted | Existing review-visible default from the reused review use-case. |

**Example request:**

```http
GET /api/v1/homework/assignments/11111111-1111-1111-1111-111111111111/submissions?status=pending_review&page=1&limit=25
Authorization: Bearer <dashboard_token>
```

**Example response shape:**

```json
{
  "submissions": [
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "homeworkId": "11111111-1111-1111-1111-111111111111",
      "targetId": "33333333-3333-3333-3333-333333333333",
      "student": {
        "id": "44444444-4444-4444-4444-444444444444",
        "displayName": "Student Name",
        "studentNumber": null
      },
      "status": "submitted",
      "bodyText": "Student submitted body text",
      "submittedAt": "2026-06-24T10:00:00.000Z",
      "reviewedAt": null,
      "reviewNote": null,
      "awardedMarks": null,
      "totalMarks": 20,
      "isLate": false,
      "createdAt": "2026-06-24T09:59:00.000Z",
      "updatedAt": "2026-06-24T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1
  }
}
```

**How Dashboard gets `submissionId`:**

```ts
const submissionId = response.submissions[0].id;
```

---

### 3.2 Get One Assignment Submission

```http
GET /api/v1/homework/assignments/:homeworkId/submissions/:submissionId
```

**Permission:**

```text
homework.submissions.view
```

**Example request:**

```http
GET /api/v1/homework/assignments/11111111-1111-1111-1111-111111111111/submissions/22222222-2222-2222-2222-222222222222
Authorization: Bearer <dashboard_token>
```

**Example response shape:**

```json
{
  "submission": {
    "id": "22222222-2222-2222-2222-222222222222",
    "homeworkId": "11111111-1111-1111-1111-111111111111",
    "targetId": "33333333-3333-3333-3333-333333333333",
    "student": {
      "id": "44444444-4444-4444-4444-444444444444",
      "displayName": "Student Name",
      "studentNumber": null
    },
    "status": "submitted",
    "bodyText": "Student submitted body text",
    "submittedAt": "2026-06-24T10:00:00.000Z",
    "reviewedAt": null,
    "reviewNote": null,
    "awardedMarks": null,
    "totalMarks": 20,
    "isLate": false,
    "createdAt": "2026-06-24T09:59:00.000Z",
    "updatedAt": "2026-06-24T10:00:00.000Z"
  }
}
```

---

### 3.3 Review Full Submission — POST

```http
POST /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/review
```

**Permission:**

```text
homework.assignments.manage
```

**Request body:**

```json
{
  "reviewNote": "Good work. Please improve the explanation next time.",
  "awardedMarks": 18
}
```

**Rules:**

- `reviewNote` is optional, but if provided it must not be empty after trimming.
- `reviewNote` max length is `2000`.
- `awardedMarks` is optional.
- `awardedMarks` must be numeric, finite, non-negative, and max 2 decimal places.
- `reviewedByUserId` is not accepted from the request body. It is resolved server-side from the current dashboard actor via `requireHomeworkScope().actorId`.

**Response:** same as `GET one submission`, but with reviewed fields updated.

---

### 3.4 Review Full Submission — PATCH Alias

```http
PATCH /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/review
```

**Permission:**

```text
homework.assignments.manage
```

This is an alias of the POST review behavior. It calls the same controller method internally and returns the same response shape.

---

## 4. Updated Dashboard Flow

Recommended Dashboard flow after HW-B:

```text
1. GET /api/v1/homework/assignments/:homeworkId/submissions
   - Dashboard gets submissions[].id.

2. GET /api/v1/homework/assignments/:homeworkId/submissions/:submissionId
   - Dashboard opens a specific submission summary.

3. GET /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers
   - Dashboard loads answer rows.

4. Optional answer-level review:
   PATCH /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/:answerId/review
   PUT   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/review

5. GET /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/attachments
   - Dashboard loads submitted attachment metadata.

6. POST or PATCH /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/review
   - Dashboard reviews the whole submission.
```

---

## 5. Existing Routes That Become Practical From Dashboard

The following routes already existed before HW-B, but they were not fully practical from Dashboard because the Dashboard had no Core route to discover `submissionId`:

```http
GET   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers
GET   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/:answerId
PATCH /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/:answerId/review
PUT   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/review
GET   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/attachments
```

HW-B closes that usability gap by adding list/detail submission routes.

---

## 6. Implementation Structure

### Controller

```text
src/modules/homework/controller/homework-submissions.controller.ts
```

Defines:

```text
HomeworkSubmissionsController
```

Routes:

```http
GET   /homework/assignments/:homeworkId/submissions
GET   /homework/assignments/:homeworkId/submissions/:submissionId
POST  /homework/assignments/:homeworkId/submissions/:submissionId/review
PATCH /homework/assignments/:homeworkId/submissions/:submissionId/review
```

### Use-case wrappers

```text
src/modules/homework/application/homework-submission-review-surface.use-cases.ts
```

Adds:

```text
ListHomeworkAssignmentSubmissionsUseCase
GetHomeworkAssignmentSubmissionUseCase
ReviewHomeworkAssignmentSubmissionUseCase
```

These wrappers reuse the existing Core Homework review use-cases:

```text
ListHomeworkSubmissionsForReviewUseCase
GetHomeworkSubmissionForReviewUseCase
ReviewHomeworkSubmissionUseCase
```

No duplicate review business logic was introduced.

### DTOs

```text
src/modules/homework/dto/homework-submission.dto.ts
src/modules/homework/dto/homework-submission-response.dto.ts
```

Adds request DTOs:

```text
ListHomeworkSubmissionsQueryDto
HomeworkSubmissionReviewDto
```

Adds response DTOs:

```text
HomeworkSubmissionDto
HomeworkSubmissionStudentDto
HomeworkSubmissionsPaginationDto
HomeworkSubmissionsListResponseDto
HomeworkSubmissionResponseDto
```

### Presenter

```text
src/modules/homework/presenters/homework-submission.presenter.ts
```

Converts review submission records into Dashboard-safe output.

### Module wiring

```text
src/modules/homework/homework.module.ts
```

Registers:

- `HomeworkSubmissionsController`
- `ListHomeworkAssignmentSubmissionsUseCase`
- `GetHomeworkAssignmentSubmissionUseCase`
- `ReviewHomeworkAssignmentSubmissionUseCase`

and exports the new use-cases.

---

## 7. Security and No-Leak Behavior

The new response shape includes:

- `submission.id`
- `homeworkId`
- `targetId`
- `student.id`
- `student.displayName`
- `student.studentNumber`
- `status`
- `bodyText`
- `submittedAt`
- `reviewedAt`
- `reviewNote`
- `awardedMarks`
- `totalMarks`
- `isLate`
- `createdAt`
- `updatedAt`

It does not include:

- `schoolId`
- `organizationId`
- `enrollmentId`
- `reviewedByUserId`
- `createdByUserId`
- `actorId`
- raw tenant context
- answer keys
- correctness flags
- file object keys
- buckets
- signed URLs
- raw metadata
- deleted state

Mismatched `homeworkId + submissionId` is rejected through the reused existing review/detail use-cases.

---

## 8. Impact Analysis

### Dashboard / School Control Panel

Directly affected and improved.

Dashboard now has a complete review flow:

1. List submissions.
2. Get `submissionId`.
3. Inspect submission summary.
4. Inspect answers and attachments through existing routes.
5. Review answers or whole submission.

### Teacher App

No breaking change.

Teacher App already had its own assignment submissions surface. HW-B adds Core/Dashboard coverage and reuses existing core review logic.

### Student App

No breaking change.

Student App submission creation, draft saving, answer saving, attachments, and submit behavior are unchanged.

### Parent App

No breaking change.

Parent App remains read-only for homework. Parent submission mutation routes remain deferred.

### Grades / Grade Sync

No schema or package changes. Existing grade-sync routes remain unchanged. HW-B only makes Dashboard submission review practical by exposing the missing submission list/detail surface.

---

## 9. Deferred / Non-Goals

Still deferred by this delta:

```http
GET  /api/v1/homework/submissions
POST /api/v1/homework/submissions
POST /api/v1/homework/assignments/:homeworkId/submissions
```

Also deferred:

- Parent homework submission mutations.
- Student submission history route.
- New proof/upload/file APIs outside existing attachment contracts.
- Homework-specific XP/reward/notification routes.
- Teacher `sync-grade-item` alias.

---

## 10. Verification Summary From Closeout

Reported verification in the repository closeout includes:

- `npx prisma validate` — PASS
- `npx prisma generate` — PASS
- `npm run build` — PASS after rerun with longer timeout
- `npm run test -- homework-submissions --runInBand` — PASS
- `npm run test -- homework-answers --runInBand` — PASS
- `npm run test -- homework --runInBand` — PASS
- `npm run test -- teacher-app --runInBand` — PASS
- `test/e2e/homework-final-closeout.e2e-spec.ts` — PASS
- `test/e2e/homework-submissions-final-closeout.e2e-spec.ts` — PASS
- `test/security/tenancy.homework.spec.ts` and `test/security/tenancy.homework-questions-attachments.spec.ts` — PASS
- Full security run — PASS

Two command attempts failed only because the named spec files did not exist in the checkout; fallback tests were run and passed.

---

## 11. Practical Frontend Notes

### Get submissionId

```ts
const list = await api.get(`/homework/assignments/${homeworkId}/submissions`);
const submissionId = list.data.submissions[0].id;
```

### Open answers

```ts
await api.get(
  `/homework/assignments/${homeworkId}/submissions/${submissionId}/answers`,
);
```

### Open attachments

```ts
await api.get(
  `/homework/assignments/${homeworkId}/submissions/${submissionId}/attachments`,
);
```

### Review full submission

```ts
await api.post(
  `/homework/assignments/${homeworkId}/submissions/${submissionId}/review`,
  {
    reviewNote: 'Reviewed from dashboard.',
    awardedMarks: 18,
  },
);
```

---

## 12. Final Verdict

Sprint HW-B correctly closes the original Dashboard gap.

The Dashboard / School Control Panel no longer needs to rely on Teacher App or Student App to discover `HomeworkSubmission.id`. The new Core Homework surface is permission-gated, uses existing review business logic, derives reviewer identity from server-side auth context, and returns a Dashboard-safe response shape.

**Final status:** `CLOSED`.
