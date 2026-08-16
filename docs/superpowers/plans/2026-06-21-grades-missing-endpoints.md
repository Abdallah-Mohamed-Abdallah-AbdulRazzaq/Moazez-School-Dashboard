# Grades Missing Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete, backend-aligned UI workflows for Grades overview, submission listing, answer entry, submission, and single-answer review.

**Architecture:** Exact backend DTOs remain in the Grades API type boundary and are converted to focused UI models by pure mappers. Existing Grades routes and workspace components remain the entry points; new submission roster and detail pages are nested beneath assessments. Services own HTTP details, while containers own loading, permissions, state transitions, and errors.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, existing `@/lib/api` client and UI components, Vitest, Testing Library.

---

### Task 1: Overview Contract And Mapper

**Files:**
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/overview/services/gradesOverviewService.ts`
- Modify: `src/features/grades/shared/types.ts`
- Modify: `src/features/grades/shared/pages/GradesWorkspace.tsx`
- Test: `src/features/grades/overview/services/__tests__/gradesOverviewService.test.ts`

- [ ] Write a failing service test asserting `fetchGradesOverview()` calls `/grades/overview` with `academicYearId`, `termId`, `subjectId`, `scopeType`, and `scopeId`, then maps backend totals, performance, completion, assessments, rule, and empty state.
- [ ] Run `npm test -- src/features/grades/overview/services/__tests__/gradesOverviewService.test.ts` and verify failure because `fetchGradesOverview` does not exist.
- [ ] Add exact `BackendGradesOverviewResponse` DTO types and implement:

```ts
export async function fetchGradesOverview(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters,
): Promise<GradesOverviewReport> {
  const response = await apiGet<BackendGradesOverviewResponse>("/grades/overview", {
    params: { academicYearId, termId, subjectId: filters.subjectId, scopeType: filters.scopeType, scopeId: filters.scopeId },
  });
  return mapBackendGradesOverview(response);
}
```

- [ ] Update `GradesWorkspace` overview loading to use this report as the aggregate source while bootstrap continues to supply selectors.
- [ ] Run the focused test and verify PASS.

### Task 2: Submission API Contracts

**Files:**
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Create: `src/features/grades/submissions/types.ts`
- Create: `src/features/grades/submissions/services/gradesSubmissionsService.ts`
- Create: `src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`

- [ ] Write failing tests for list, detail, single answer save, bulk answer save, submit, single review, bulk review, finalize, and sync paths and payloads.
- [ ] Run `npm test -- src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts` and verify failures because the service is absent.
- [ ] Add exact backend response types and these service operations:

```ts
listAssessmentSubmissions(assessmentId, filters)
fetchGradeSubmission(submissionId)
saveSubmissionAnswer(submissionId, questionId, answer)
saveSubmissionAnswers(submissionId, answers)
submitGradeSubmission(submissionId)
reviewSubmissionAnswer(submissionId, answerId, review)
reviewSubmissionAnswers(submissionId, reviews)
finalizeSubmissionReview(submissionId)
syncSubmissionGradeItem(submissionId)
```

- [ ] Preserve backend enum casing and omit undefined query/body properties through the API client’s existing serialization behavior.
- [ ] Run the focused service tests and verify PASS.

### Task 3: Submission Roster

**Files:**
- Create: `src/features/grades/submissions/pages/AssessmentSubmissionsPage.tsx`
- Create: `src/features/grades/submissions/components/AssessmentSubmissionsTable.tsx`
- Create: `src/app/[lang]/(dashboard)/grades/assessments/[assessmentId]/submissions/page.tsx`
- Modify: `src/features/grades/assessments/components/GradesAssessmentsSection.tsx`
- Modify: `src/hooks/usePermissions.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/features/grades/submissions/components/__tests__/AssessmentSubmissionsTable.test.tsx`

- [ ] Write failing component tests for the empty state, progress rendering, status filtering, and opening a submission.
- [ ] Run the focused component test and verify failure because the component is absent.
- [ ] Extend `PermissionKey` with `grades.submissions.view`, `grades.submissions.submit`, and `grades.submissions.review`.
- [ ] Build a roster page with search, backend status filter, student/class columns, answered progress, pending correction count, submitted timestamp, retry state, and permission-aware row action.
- [ ] Add a submissions action only for question-based assessments and route it to `/${locale}/grades/assessments/${assessmentId}/submissions`.
- [ ] Add English and Arabic messages and run the focused test until PASS.

### Task 4: Answer Entry And Submit

**Files:**
- Create: `src/features/grades/submissions/pages/GradeSubmissionPage.tsx`
- Create: `src/features/grades/submissions/components/SubmissionAnswerEditor.tsx`
- Create: `src/app/[lang]/(dashboard)/grades/submissions/[submissionId]/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/features/grades/submissions/components/__tests__/SubmissionAnswerEditor.test.tsx`

- [ ] Write failing tests proving text, single-choice, multi-choice, and JSON-backed answers map to `{ answerText, selectedOptionIds, answerJson }` without inline casing conversions.
- [ ] Run the focused test and verify failure because the editor is absent.
- [ ] Render questions in backend sort order, track dirty answers by question ID, expose per-answer save and bulk save, preserve edits after errors, and disable entry outside editable backend states.
- [ ] Add a confirmation-gated submit action enabled only when `requiredAnsweredCount === requiredQuestionCount`; refresh detail after successful submission.
- [ ] Add translated loading, save, validation, confirmation, submitted, and error states.
- [ ] Run the focused component test until PASS.

### Task 5: Single And Bulk Review Workflow

**Files:**
- Modify: `src/features/grades/submissions/pages/GradeSubmissionPage.tsx`
- Create: `src/features/grades/submissions/components/SubmissionReviewEditor.tsx`
- Modify: `src/features/grades/gradebook/components/ReviewAssessmentSubmissionDialog.tsx`
- Test: `src/features/grades/submissions/components/__tests__/SubmissionReviewEditor.test.tsx`

- [ ] Write failing tests for score bounds, single review payload, dirty bulk review payload, finalize availability, and sync availability.
- [ ] Run the focused test and verify failure because the review editor is absent.
- [ ] Add per-answer PATCH save and dirty-answer bulk PUT save using `awardedPoints`, `reviewerComment`, and `reviewerCommentAr` exactly.
- [ ] Enable finalize only for a submitted reviewable submission with no unresolved correction; enable sync only after correction is finalized.
- [ ] Refresh submission state after finalize and show sync response state without fabricating grade-item values.
- [ ] Reuse the new review operations from the existing gradebook review dialog to avoid duplicate HTTP workflows.
- [ ] Run the focused component test until PASS.

### Task 6: Quality Gates

**Files:**
- Review all files changed in Tasks 1-5.

- [ ] Run all focused Grades tests and fix failures without weakening assertions.
- [ ] Run `npm run lint` and resolve new errors.
- [ ] Run `npm run typecheck` and resolve all type errors.
- [ ] Run `npm run build` and verify the overview, submission roster, and submission detail routes compile.
- [ ] Run the clean-code guard against the final diff, remove dead exports and duplicated workflows, and verify no mock fallback was introduced.

