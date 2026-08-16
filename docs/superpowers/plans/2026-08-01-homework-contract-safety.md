# Homework Contract Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Preserve backend Homework failures and reconcile authoritative state after partial question saves.

**Architecture:** The adapter classifies 404s by backend error code, not status alone. The builder owns mutation-session reconciliation and reloads all authoritative Homework data after a partial mutation failure.

**Tech Stack:** React, TypeScript, Vitest, next-intl.

## Global Constraints

- Frontend only; do not add or change backend routes.
- Never turn permission, ownership, invalid-ID, server, or network errors into an empty collection.
- Never display stale local question state after a started backend mutation fails.
- Preserve unrelated dirty-worktree changes.

---

### Task 1: Make optional-list fallback code-specific

**Files:**
- Modify: src/features/academics/homework/services/homeworkApiAdapter.ts
- Modify: src/features/academics/homework/services/homeworkErrors.ts
- Test: src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts

**Interfaces:**
- Produces isOptionalHomeworkCollectionAbsent(error): boolean.
- listQuestions and listAttachments return [] only for that explicit condition.

- [ ] **Step 1: Write failing adapter tests**

~~~ts
mockedApiGet.mockRejectedValue(
  new ApiError("Denied", 404, "homework.assignment.not_found"),
);
await expect(homeworkApiAdapter.listQuestions("id")).rejects.toThrow("Denied");

mockedApiGet.mockRejectedValue(
  new ApiError("Optional collection absent", 404, "homework.questions.not_found"),
);
await expect(homeworkApiAdapter.listQuestions("id")).resolves.toEqual([]);
~~~

- [ ] **Step 2: Verify failure**

Run: npx vitest run src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts

Expected: the first assertion fails because all 404s currently become [].

- [ ] **Step 3: Implement one shared classifier**

~~~ts
function isOptionalHomeworkCollectionAbsent(error: unknown): boolean {
  return isApiError(error) &&
    error.code === "homework.assignment.optional_collection_not_found";
}
~~~

Use the actual confirmed backend code rather than an invented string. Apply it to both question and attachment listing. Rethrow all other errors.

- [ ] **Step 4: Verify and commit**

Run: npx vitest run src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts && npm run typecheck

~~~bash
git add src/features/academics/homework/services/homeworkApiAdapter.ts src/features/academics/homework/services/homeworkErrors.ts src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts
git commit -m "fix: preserve homework list errors"
~~~

### Task 2: Reconcile the builder after a partial question save

**Files:**
- Modify: src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx
- Test: src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx

**Interfaces:**
- Produces reloadHomeworkBuilder(): Promise<void>, which reloads assignment, questions, and attachments.
- Produces partial-save feedback after a started question mutation fails.

- [ ] **Step 1: Write a failing builder test**

~~~tsx
mockedUpdateQuestion.mockRejectedValueOnce(new Error("option update failed"));
await user.click(screen.getByRole("button", { name: "Save" }));
await waitFor(() => expect(mockedFetchHomeworkAssignment).toHaveBeenCalledTimes(2));
expect(screen.getByText(/some changes may already have been saved/i)).toBeInTheDocument();
~~~

- [ ] **Step 2: Verify failure**

Run: npx vitest run src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx

Expected: FAIL because the builder retains stale local data after the adapter mutation fails.

- [ ] **Step 3: Implement mutation-aware reload**

~~~ts
let questionMutationStarted = false;
try {
  questionMutationStarted = dirtyQuestions.length > 0 || deletedQuestionIds.length > 0;
  // existing mutation sequence
} catch (error) {
  if (questionMutationStarted) await reloadHomeworkBuilder();
  throw error;
}
~~~

The reload must replace assignment, questions, attachments, saved snapshots, and selected-question state using backend data. Report a dedicated translated partial-save message after successful reconciliation; if reload fails, preserve the original mutation error and report that refresh also failed.

- [ ] **Step 4: Verify and commit**

Run: npx vitest run src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts

~~~bash
git add src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx
git commit -m "fix: reconcile partial homework question saves"
~~~

### Task 3: Add localized feedback and complete verification

**Files:**
- Modify: src/messages/en.json
- Modify: src/messages/ar.json
- Test: Homework feature suite.

- [ ] **Step 1: Add assertions for the partial-save message**

~~~ts
expect(t("errors.partialQuestionSave")).toContain("may already have been saved");
~~~

- [ ] **Step 2: Add English and Arabic message keys**

~~~json
{ "partialQuestionSave": "Some question changes may already have been saved. The homework was refreshed." }
~~~

- [ ] **Step 3: Run final checks**

Run: npx vitest run src/features/academics/homework && npm run typecheck && npx eslint src/features/academics/homework src/messages/en.json src/messages/ar.json && npm run build

Expected: all commands exit 0.

- [ ] **Step 4: Review and commit**

~~~bash
git diff --check
git diff -- src/features/academics/homework src/messages/en.json src/messages/ar.json
git add src/features/academics/homework src/messages/en.json src/messages/ar.json
git commit -m "fix: harden homework frontend workflow"
~~~

## Plan self-review

- Coverage: code-specific list failures, non-atomic question-save reconciliation, localized feedback, tests, static checks, and build are covered.
- Completeness: each task has a concrete implementation and verification command.
- Type flow: Task 1 provides the adapter contract consumed by builder loading; Task 2 provides reconciliation consumed by Task 3 feedback.

