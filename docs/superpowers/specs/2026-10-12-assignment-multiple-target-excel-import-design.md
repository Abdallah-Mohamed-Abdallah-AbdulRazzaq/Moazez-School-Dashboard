# Assignment Excel import across multiple targets

Date: 2026-10-12

Status: targeting and save behavior approved in chat on 2026-10-12. Contract, workflow, and UX audit completed after user review; the user authorized continuation on 2026-10-12.

## Scope and approved decisions

Extend the active assignment/homework Excel import so one workbook can create separate assignment drafts for multiple classes. This is a frontend-only extension to the existing import feature on `feat/assignment-assessment-excel-import` and draft PR #85. Assessment behavior is outside this extension.

The user approved:

- Reuse one workbook across multiple targets.
- Select one subject for the whole batch; each class uses its own assigned teacher allocation.
- Choose selected classes, a section, a grade, a stage, or the whole school.
- Show eligible classes and teachers in a preview, plus skipped classes and reasons. Proceed with eligible classes.
- Create one whole-class assignment draft per eligible class, with the same imported metadata and questions.
- Use the existing assignment Create page and UI components.
- Exclude timetable links from batch creation because the lessons belong to individual class/teacher allocations.
- Save sequentially, continue after individual failures, and show a result for every class.
- Open each fully saved assignment in a new editor tab while retaining the original batch page.
- Provide an Open assignment link when automatic tabs are blocked. Preserve partial draft IDs and recovery links, with no automatic retry or duplicate parent creation.

This follow-up supersedes the earlier design's one-workbook/one-assignment restriction for the new batch mode only. It does not change the Excel column contract or add a targets sheet.

## Verified integration and contract boundaries

Frontend baseline: `2a3f29fd70fbedabf605bf3f299d4e5507a9c392`. Backend main was checked on 2026-10-12 and remains `fe6b4b1b99478628c106b60f65370d08c10c3ceb`.

Existing sources used by the design:

- `src/features/academics/homework/pages/CreateHomeworkPage.tsx`: existing allocation, targeting, contract validation, eligibility, and import flow.
- `src/features/academics/academic-structure-tree/services/structureService.ts`: `fetchStructureTree` and classroom → section → grade → stage relationships in `StructureTree`.
- `src/features/academics/teacher-allocation/services/teacherAllocationService.ts`: `fetchTeacherAllocations`, `fetchTeachers`, and `TeacherAllocation`.
- `src/features/students-guardians/enrollments/services/enrollmentsApiService.ts`: `fetchEnrollments` for current-year active enrollment checks.
- `src/features/academics/homework/utils/homeworkExcelImport.ts`: `validateHomeworkImportDraft` and the existing workbook adapter.
- `src/features/academics/homework/services/homeworkExcelImportSave.ts`: `createHomeworkFromImport` and `HomeworkImportQuestionSaveError`.
- `src/features/academics/shared/excel-import/useImportNavigation.ts`: the existing dirty-navigation integration.
- Backend `CreateHomeworkAssignmentDto` and `CreateHomeworkAssignmentUseCase`: each parent requires one `teacherSubjectAllocationId`. The server derives classroom, subject, and teacher from that allocation and verifies year/term coherence.

No shared parent assignment spanning several classes exists in this contract. Batch creation makes independent calls through existing parent/question services. It cannot guarantee an atomic all-or-nothing batch.

Every batch payload uses the frozen academic year and term, the class's allocation ID, and `targetMode: "classroom"`. It does not send student IDs, a shared timetable entry, or a schedule date. A publication scheduling timestamp already entered in the form may be copied after the existing due-date validation; creation still creates drafts and invokes no publish action.

Construct each payload explicitly from the allowed request fields: `academicYearId`, `termId`, `teacherSubjectAllocationId`, `title`, `targetMode`, `dueAt`, and optional `description`, `mode`, `publishAt`, `estimatedMinutes`, `totalMarks`, and `isGraded`. Do not spread a preview/result row or the entire form into the request. Target type, group/class identifiers, teacher labels/IDs, student counts, statuses, and workbook source rows are UI state, not additional DTO fields.

Creation and question writes use `homework.assignments.manage`; viewing an editor and its questions uses `homework.assignments.view`. The permission hook does not infer view from manage. The new batch mode requires both permissions because reviewing and recovering created drafts is part of this workflow; this does not change existing manual/single-import gating. Existing lookup permissions remain enforced by their read endpoints. A denied or failed structure/allocation/enrollment lookup blocks a trustworthy preview and offers Retry loading, rather than marking every class skipped.

The backend's operational allocation gate locks the current allocation and derives its current teacher/class/subject at the write. The frontend cannot enforce a frozen teacher ID through the manager create DTO. Never substitute a different allocation ID after approval; revalidate the plan before the first write and let backend conflict checks remain authoritative. Use server-returned assignment details for final result labels when available; preview labels must not be presented as a server ownership guarantee. If allocation ownership changes during saving, the created draft remains the authority for its assigned teacher.

The workbook remains the existing assignment template: Details, Questions, Choices, and guidance in Instructions. Existing file/question/choice limits, single-text fields, supported question types, point precision, and other bounds continue to apply as described in the [original Excel import specification](2026-10-12-assignment-assessment-excel-import-design.md).

## User flow and target preview

The Create page exposes an explicit batch targeting mode while an assignment workbook is pending. Existing single-class import/manual creation remains available through its existing path. A batch may contain just one eligible class and still uses the batch results and new-tab behavior.

1. Select an open academic year/term and import/apply a valid assignment workbook.
2. Choose one subject and a target type: selected classes, section, grade, stage, or school. The corresponding selector uses the current structure; school selects the available classrooms in that school context.
3. Expand the target to unique classroom IDs. Class selection may contain multiple classrooms. Section/grade/stage traversal follows the structure hierarchy, not classroom names or allocation section fallbacks.
4. Match each classroom to its current-term allocation for the selected subject and its teacher. Deduplicate repeated records by allocation ID. If multiple distinct allocations remain for one class/subject, skip that class with an ambiguity reason rather than choosing arbitrarily.
5. Retain the current Create page's check for at least one active enrolled student. This is frontend preflight behavior; the backend's classroom-target creation contract does not itself require a non-empty roster. Use current-year active enrollment data, deduplicate student IDs for counts, and do not treat a failed data load as an empty roster.
6. Display a table with class hierarchy/name, subject, assigned teacher, eligible-student count, and eligibility or skip reason. Show counts of selected, eligible, and skipped classes. Missing allocation, missing assigned teacher, incompatible term/structure, ambiguous allocation, or no active students excludes that row.
7. Enable Create drafts only with a valid pending workbook, resolved context data, and at least one eligible class. The visible eligible rows define the proposed drafts. No creation request occurs during target selection, workbook review, or Apply.

Selection changes update the preview before creation. At submission, refresh/revalidate the required context and current imported metadata/questions. If refreshed target eligibility or allocation/teacher mapping differs from the displayed preview, show the updated preview and require another Create drafts action rather than silently changing the targets being created.

All eligible rows in that final preview are included. Per-row exclusion toggles, mixed subjects, and custom per-class workbook content are outside this version; the user can choose the selected-classes target type for an explicit subset.

## User-friendly UI and accessibility

Preserve the dashboard's existing colors, typography, hierarchy terminology, and components. The UX review used UI/UX Pro Max's form-label, progress-feedback, mobile-table, and recovery guidance; its generic landing-page/color/font suggestions do not override this application's UI.

- Keep three clear areas on the existing page: assignment content, where to assign it, and review/results. Batch mode is a labeled control, such as Assign to multiple classes, available after applying a workbook. When enabled, hide single-class student/timetable controls and explain that every included class receives a whole-class draft. Disabling it before saving restores the existing single-class controls without silently rewriting their selections.
- Default the target type to Selected classes, never Whole school. Reuse the currently selected class/subject when valid; otherwise require selection. Use existing searchable Select components for subject and group selection. Selected classes uses existing Input/Checkbox components for search and multiple selection; Select itself is single-value. Keep selected items when search changes and label select-all precisely as Select all matching classes.
- Display names and hierarchy breadcrumbs so similarly named classes are distinguishable. Use allocation teacher names/localized directory labels, not UUIDs or internal field names. Missing display labels are not proof of missing allocation/teacher eligibility.
- Show a compact summary beside the creation action: for example 8 classes will receive this assignment; 2 classes will be skipped. Show question count, common due date, and total marks. Label the action Create 8 drafts, with the count drawn from the complete eligible plan, not the current table page/search.
- Place skip reasons on their class rows and keep the skipped count visible. Use text such as No teacher assigned for this subject or No enrolled students, rather than a large repeated-error list. A failed lookup shows one contextual load error and a read-only reload action. Disabled creation controls have nearby text explaining the missing prerequisite.
- During saving show processed classes out of the total, the current class, and per-class status. Do not claim a percentage for individual question/network work or show one toast for every class. Keep one overall result summary, with a Needs attention filter for partial/failed/unconfirmed rows.
- Give partial results a clear Open created draft action and unconfirmed results a Check assignment list action. Say what the user should inspect before retrying; never label a mixed batch as complete success.
- Use the existing DataTable for desktop previews/results, with pagination/search in local state. At narrow widths use a contained scroll region or stacked summaries using the existing UI controls; avoid page-wide overflow, clipped names, or tiny controls. Verify 375, 768, 1024, and 1440 pixel layouts, Arabic RTL and English, and the existing theme behavior.
- Provide associated labels, visible keyboard focus, approximately 44-pixel touch targets for new primary controls, and text/icons in addition to status colors. Announce class progress politely without moving focus on every update. Explain before Create that successful drafts open in new tabs; accessible link labels identify the class and new-tab behavior.

No new global design system, stepper dependency, font download, or unrelated UI refactor is required.

## Batch execution and result states

Freeze the workbook questions, current assignment metadata, year/term, subject, and eligible class/allocation rows at batch start. Lock workbook replacement/removal, targeting, metadata edits, and repeated Create actions during saving. Subsequent layout-context changes must not alter an active batch's payloads or editor URLs.

For each class, call `createHomeworkFromImport` with that class's parent payload and the imported questions. Classes run sequentially; the helper already saves each parent's questions sequentially. Update progress and the current class as requests complete. Continue to the next class after an individual failure, with no automatic retry or rollback.

| Result | Meaning and action |
| --- | --- |
| Queued | Eligible class has not started. |
| Creating | Parent/question requests for this class are in progress. |
| Created | Parent and every imported question save were acknowledged. Retain the ID, open its editor in a new tab, and show Open assignment. |
| Partially saved | `HomeworkImportQuestionSaveError` identifies the existing parent and failed question index. Show acknowledged progress and Open created draft. The last failed request may have reached the server. |
| Failed | Parent request returned a definite rejection. Show the class-specific mapped error. |
| Creation unconfirmed | Parent response was lost or otherwise ambiguous without a usable ID. Show check-the-list guidance before any manual retry. |
| Skipped | Class was excluded during preflight. No creation calls were made for it. |

The completed batch stays on the original page and shows totals plus the per-class table. Do not navigate the original page into the first successful editor. A result must never become failed merely because opening its browser tab was blocked or threw an error.

Once a batch starts, that batch's Create action cannot submit the same set again. Retain successful and partial IDs/results in page memory. No Retry all or retry-one-parent action is included; recovery uses existing drafts or the assignment list. Starting a deliberately new batch is an explicit reset that acknowledges the prior results and can create new drafts. No server idempotency guarantee is claimed.

## New tabs and navigation

Attempt a new editor tab only after a class reaches Created, not after parent creation alone. Use the existing editor route `/{locale}/academics/homework/{homeworkId}?year={academicYearId}&term={termId}` with the frozen creation context. New browsing contexts must not receive opener access. Every successful row has a direct Open assignment link using a new tab and appropriate opener isolation, regardless of whether automatic opening succeeded.

Browsers may block tabs opened after asynchronous requests. Creation must still succeed, and the UI explains that automatic tabs can require allowing pop-ups for the dashboard. Manual row links provide a user-triggered fallback. Do not change browser settings, repeatedly attempt blocked tabs, or open blank tabs for failed/queued classes. Partially saved rows offer recovery links and do not open automatically.

A `window.open` call using `noopener` may return null even when opening succeeds. Do not treat that return value alone as proof that a tab was blocked. Always provide the manual links and a brief conditional hint: If a tab did not open, use Open assignment or allow pop-ups for this dashboard. This behavior was checked against [MDN's Window.open reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/open).

Use the existing dirty-navigation provider for pending imports and unresolved partial/unconfirmed/failed results. Before creation, Cancel retains the current Stay/Leave behavior. While requests are active, disable the page's Cancel action and guard other navigation. After all eligible classes are fully saved, clear this feature's dirty state; skipped classes alone do not count as unsaved work. No automatic server cleanup or refresh persistence is added. If a user leaves after acknowledging unresolved results, the drafts already created remain in the backend.

## Implementation responsibilities and scope control

Keep new batch logic outside the already-large Create page where practical:

- Target expansion/preflight: derive unique classes and eligibility from structure, allocations, and enrollments. Return a reviewable plan and explicit skip reasons; perform no writes.
- Target/result UI: existing UI selects, buttons, tables, and status messages, with English and Arabic labels.
- Batch coordinator: consume the frozen plan, call existing services sequentially, and emit class-specific progress/results. It must not control page navigation or reinterpret a successful save as a browser failure.
- Editor-tab integration: isolate browser effects from saving, construct existing routes, and expose manual fallback links.
- Create page integration: manage pending import, current context, selection, submission lock, and dirty state; retain the existing manual path.

The assignment-specific batch units belong under the homework feature. Shared workbook parsing and assessment code do not gain batch behavior. No backend endpoint, auth change, deployment change, or broad module refactor is required.

## Verification and acceptance

Apply Clean Code Guard to every production change and Test Guard to every test change. Use the existing project's HTTP/framework/browser boundaries for mocks; target derivation, workbook parsing, validation, payload mappers, and save orchestration remain real.

Focused tests cover all target types, subject/term filtering, missing/ambiguous allocations, zero eligible classes, enrollment/load failures, deduplication, refreshed-preview changes, and the one-parent-per-class contract. Test a mix of complete success, a second-question failure with a retained parent, a definite parent rejection, and an ambiguous parent response while later classes continue. Verify no duplicate submission, no automatic retry, isolated result IDs, and correct frozen context on every editor link.

Component tests exercise target selection and previews, skipped rows, locking, progress, results, successful-only tab attempts, popup fallback links, and dirty-navigation behavior. Verify English/Arabic messages and preserve existing single-class assignment and assessment import regression tests.

Include regression checks for manage-without-view batch gating, lookup failure versus genuinely empty rosters, exact parent payload keys, preserving selected classes across search/page changes, and a null `window.open` return that must not mark a successful save as failed or cause a retry.

Run relevant focused tests, lint, typecheck, and build during implementation. Keep the user's existing instruction to use focused checks only; do not run the full test suite without new permission. Record actual desktop/mobile and browser tab checks, with any unavailable checks stated explicitly. No real school records are created merely for automated QA.

Acceptance: one valid assignment workbook can be reused across the chosen eligible classes for one subject, each with the correct teacher allocation. The preview exposes omissions before creation. Every class has an accurate result, successful assignments open their own editor tabs when permitted, known partial drafts can be recovered without duplicate parents, and assessment behavior remains outside the extension.

## Design self-review

- Current API references and route were checked against source; planned batch units are described as responsibilities rather than existing exported APIs.
- The approved behavior is consistent with independent per-class parent creation and continuing after failures. Browser tab errors do not affect save status.
- No new workbook fields, mixed-subject behavior, retry/rollback mechanism, backend changes, or publication actions are implied.
- Popup restrictions and ambiguous server outcomes are explicit; local preflight is not presented as a guarantee of server acceptance.
