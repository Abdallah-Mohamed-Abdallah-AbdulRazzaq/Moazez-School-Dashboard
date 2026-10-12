# Assignment Excel import for a teacher's classes

Date: 2026-10-12

Status: conversational design approved; written spec awaiting owner review. Implementation has not started.

## Scope and approved behavior

Extend the existing assignment Excel batch target chooser with **Teacher's classes**. The user chooses one teacher and one subject, reviews that teacher's classes, and creates separate whole-class drafts using the imported workbook. Select all eligible classes by default and allow deselection. This is an assignments-only, frontend-only continuation of the import feature on `feat/assignment-assessment-excel-import` and draft PR #85.

Use the current academic year and term. Keep the existing workbook schema, metadata validation, permissions, sequential creation, per-class results, partial recovery, and automatic new-tab attempts for completed assignments. Do not restore the reverted `window.focus()` behavior. Manual creation, other batch scopes, and assessments retain their current behavior.

## Approach

Add a scope to the current Create page rather than a separate teacher-specific page. This reuses the existing import, target preview, save coordinator, and result components. A separate page would duplicate those steps without changing the underlying allocation contract.

## Selection and user experience

- In teacher mode, show a searchable shared UI Select for the teacher and another for the subject. Derive teacher options from current-term allocations with a non-null teacher ID; use IDs for identity and available teacher names for display. Identical names must not collapse separate teachers.
- Limit subject options to subjects allocated to the selected teacher in the current term and present in the loaded subject catalog. Retain the current subject only when it is valid for the teacher; otherwise require a new selection. Do not automatically choose an unrelated subject.
- Once both choices are valid, show the matching classes with their hierarchy and student count. Select all eligible classes initially. Provide search, individual checkboxes, and Select all/Clear selection controls for eligible classes. Searching must not change selection, and clearing all must disable creation.
- Explain ineligible matching classes in the preview with the existing skip reasons. They cannot be selected for creation. Classes that the user deliberately deselects are excluded from the batch, rather than reported as failed or skipped saves.
- Changing the teacher or subject establishes a new class selection, selecting its eligible classes by default. A loading retry or preflight refresh must preserve exclusions and must not silently add newly allocated classes to a previously reviewed selection.
- Provide loading, lookup failure/retry, no teachers with allocations, no subjects for the teacher, and no matching/eligible classes states. No creation requests are allowed without an eligible selection.
- Reuse existing UI components and scoped width protections. Supply English/Arabic labels, keyboard-accessible controls, RTL layout, visible focus, and the existing responsive preview/results layout.

## Allocation and request contract

The existing `TeacherAllocation.teacherId` is mapped from the API's `teacherUserId`; it is the identity used to match the chosen teacher. The existing allocation context already includes term, subject, classroom, and teacher IDs, so this design does not require a teacher-directory endpoint or a new backend API.

Candidate classes must have an explicit classroom allocation matching the selected term, subject, and teacher user ID. Do not expand a section-only allocation into assumed class allocations. Deduplicate identical allocation records by allocation ID and candidate classes by classroom ID.

Preserve existing classroom eligibility checks: valid hierarchy, active students in the selected year, and exactly one distinct allocation for the class/subject/term. Multiple distinct allocations remain ambiguous and are skipped, including cases involving another teacher. The eligible allocation must belong to the selected teacher; never substitute another teacher's allocation. Deleted classes or removed/reassigned selected allocations remain visible as ineligible during renewed review rather than silently switching targets.

Each parent request continues to send the existing `CreateHomeworkAssignmentRequest` fields through `homeworkBatchPayload`: academic year, term, the eligible `teacherSubjectAllocationId`, whole-class target mode, and supported metadata. Do not send a new teacher selector field, classroom/subject ID, student IDs, timetable entry, or schedule date. The selected allocation determines ownership; backend validation remains authoritative.

## State, preflight, and saving

Extend the existing selection model to retain teacher identity and the user's class selection. Keep teacher filtering and class eligibility in the target-planning layer, rather than relying only on UI filtering. A forged or stale class selection must not create homework under another teacher's allocation.

Before saving, reuse the existing context reload and signature comparison. A removed allocation, changed owner/allocation, student eligibility change, or changed selected target plan requires renewed review and makes no creation calls on that attempt. New teacher allocations may appear as available choices after refresh but must not be automatically added to the selected batch. Renamed or translated labels alone do not invalidate the reviewed plan.

Freeze the reviewed teacher/subject/classes, context, metadata, and questions once creation starts. Lock targeting and duplicate submissions. Continue sequentially after an individual save failure. Preserve created, partial, failed, unconfirmed, and skipped outcomes and the existing recovery links. Open new tabs only for fully saved drafts; tab-opening restrictions do not alter saved outcomes. Use the current navigation and reset behavior.

## Integration points verified in the current frontend

- `src/features/academics/homework/components/HomeworkImportBatchTargets.tsx`: current scope chooser, shared Select/Input/Checkbox controls, and class selection.
- `src/features/academics/homework/hooks/useHomeworkImportBatch.ts`: selection state, context reload, reviewed-plan comparison, locking, and completed-draft tab opening.
- `src/features/academics/homework/utils/homeworkImportBatch.types.ts`: selection, plan, eligible/skipped rows, and result types.
- `src/features/academics/homework/utils/homeworkImportBatchTargets.ts`: scope expansion, eligibility checks, signature, and explicit parent payload.
- `src/features/academics/homework/services/homeworkImportBatchContext.ts`: existing structure, subject, allocation, and enrollment reads.
- `src/features/academics/teacher-allocation/services/teacherAllocationMappers.ts`: allocation teacher user identity mapping.
- `src/features/academics/homework/services/homeworkApi.types.ts`: existing parent request type.

These are proposed extension points, not claims that teacher targeting is already implemented. The previous batch design records its backend audit at commit `fe6b4b1b99478628c106b60f65370d08c10c3ceb`; the current design review checked frontend contract types and mappers without fetching a new backend revision.

## Verification and acceptance

Focused planner tests must cover teacher/subject/term isolation, identical teacher names with different IDs, duplicate records, ambiguous allocations, section-only allocations, missing/deleted classes, empty students, and stale or forged selections. Payload assertions must prove that every created draft uses the selected teacher's accepted allocation and only allowed parent fields.

Focused component/Create tests must cover default eligible selection, deselection/search/clear selection, teacher/subject changes, empty and lookup-error states, renewed review after reassignment, no silent additions on refresh, locked selections during saving, and existing mixed-save recovery. Keep real planner/service logic under test and mock external boundaries. Apply Clean Code Guard to production changes and Test Guard to test changes.

Run relevant focused tests, lint, typecheck, and production build. The user requested focused checks only; do not run the full suite without new authorization. Check English and Arabic at mobile/tablet/desktop widths for usable selectors, unclipped labels, selection feedback, and unchanged results behavior. Do not claim live backend saves or browser activation verification unless actually performed.

Delivery stays on the existing feature branch and draft PR. Use normal commits/pushes, report actual verification and changed files, and leave merging/deployment to the owner.
