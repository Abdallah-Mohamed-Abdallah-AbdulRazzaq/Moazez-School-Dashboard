# Manual homework creation: implementation and verification

Date: 2026-10-14
Branch: `feat/manual-homework-multi-class-plan`
Baseline: `3993d13e90b4046a21800738b3b71f2a393134d1`
Draft review: [PR #93](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-School-Dashboard/pull/93)

The owner authorized implementation inline and later approved a UI refinement of the same feature. Initial verification was limited by disk space; the subsequent local environment repair enabled the normal production build, type check and responsive browser review below. This feature is on the review branch; it has not been merged or deployed.

## Using the feature

1. Open the homework Create page in an open academic term. The familiar fields and single-class Create draft action remain the default.
2. Choose **Write questions before creation** to open the optional editor. Add questions and enter prompts, choices and answers. Opening the editor adds no question and makes no API writes. Hide/show retains content.
3. For one class, keep **Assign to multiple classes** unchecked and choose the existing teacher allocation and recipients. Create draft saves the questions under that draft and opens its editor in the current tab. Creating without questions retains the old parent-only workflow.
4. For several classes, check the visible **Assign to multiple classes** choice, choose one subject and a scope: selected classes, section, grade, stage, whole school or a teacher's classes. Eligible teacher classes start selected and can be excluded.
5. Review eligible and skipped classes, then Create. At least one question is required for a batch. Each eligible class receives a separate whole-class draft through the existing sequential save workflow. Successful drafts attempt to open in new tabs and retain links in the results. Individual failures retain recovery guidance.
6. Switching between manual and Excel content requires confirmation before replacing existing questions. Cancellation preserves questions and metadata. Accepting an Excel replacement preserves the multiple-class choice.

Local questions are in memory until creation. Existing navigation protection warns before leaving with pending questions. Known-parent partial saves disable repeat creation and link to the existing draft. No new backend endpoint or request field was introduced.

## Measured checks

| Check | Outcome |
| --- | --- |
| Focused Vitest run | PASS: 167 tests, 17 files, final UI refinement run |
| Project lint | PASS: `npm run lint` |
| Normal project type check | PASS: `npm run typecheck`; production build also completed its TypeScript check. |
| Default production build | PASS: `npm run build` with physical local dependencies. Earlier external-junction and ENOSPC failures were environment issues. |
| Actual-page browser review | PASS: real Next.js page in headless Chrome, Arabic and English at 375, 768, 1024 and 1440 pixels. No horizontal overflow or client-side errors; creation bar stays visible during editing and target review. Isolated synthetic authentication and API fixtures; no live school writes. |
| Full test suite | NOT RUN: the owner requested focused checks only. |
| Clean Code Guard / Test Guard | Applied to changed production/test code; reviewed local state ownership, contract mapping, immutable ordering, boundary mocks, recovery and compatibility. |
| Docs Guard / diff whitespace check | Reviewed source references and measured claims; diff check passed before delivery. |

Focused files:

- Homework utils: `homeworkQuestionDraftValidation.test.ts`, `homeworkExcelImport.test.ts`, `homeworkImportBatchTargets.test.ts`.
- Homework hooks: `useHomeworkCreateQuestions.test.ts`.
- Homework components: `HomeworkQuestionAuthoringPanel.test.tsx`, `HomeworkImportBatchPanel.test.tsx`.
- Homework pages: `CreateHomeworkManualQuestions.test.tsx`, `CreateHomeworkPage.test.tsx`, `CreateHomeworkExcelImport.test.tsx`, `CreateHomeworkBatchImport.test.tsx`, `HomeworkAssignmentBuilderPage.test.tsx`.
- Homework services: `homeworkImportBatchSave.test.ts`, `homeworkExcelImportSave.test.ts`.
- Shared Excel: `workbookValidation.test.ts`, `ExcelImportDialog.test.tsx`.
- Assessments: `CreateAssessmentExcelImport.test.tsx`.
- Shared question editor: `QuestionEditor.test.tsx`.

The tests use real editors, source state, validators, planners, API mappers and ordered save services. HTTP, authentication context, router and window boundaries are fixtures; no real school assignments were created. Covered scenarios include all six manual scopes, 500/501 local questions, false/optional values, last-edit persistence, source cancellation/acceptance, selected students, duplicate clicks, changed plans, blocked lookups, frozen context, mixed outcomes and existing Excel/assessment behavior.

## Approved UI refinement

Assignment details now appear before the question toolbar and editor, using the full page width. The multiple-class choice remains visible and unchecked by default. The question toolbar groups manual authoring and Excel import, with template download as a secondary action. Manual questions have a numbered outline, a clear active-question heading and optional instructions in a disclosure using the shared TextArea. Untouched questions remain neutral until edited or submitted; validation rules and save contracts remain unchanged.

Eligible target classes and batch outcomes use cards showing hierarchy, assigned teacher, student count and status. Skipped targets have an expandable reasons section. Large lists initially show twelve cards and offer Show more; the save plan still includes every eligible target. A regression test creates all fourteen eligible drafts while the initial preview shows twelve. The persistent action bar reports questions, points and eligible classes, retaining creation locks, disabled reasons and guarded cancellation.

Existing UI-folder inputs, selectors, buttons and checkboxes are reused. Shared editor/import presentation extensions are opt-in; assessment and saved-editor defaults retain their prior behavior.

Browser screenshots and fixture-only QA logs are local artifacts in `D:/Codex-Task-Cache/manual-homework-multi-class-plan/`, including `ui-ar-1440.png`, `ui-ar-1440-targets.png`, `ui-ar-375.png`, `ui-en-375.png` and `ui-browser-results.json`.

## Remaining review and local artifacts

The full test suite was not run, following the owner's focused-checks preference. Save verification uses HTTP fixtures; no claim of live-backend save verification is made. Owner review remains required before merge.

Earlier task-created incomplete dependencies and caches were preserved locally after removal was blocked by automatic approval review. The current managed worktree has physical local dependencies and completed production output. QA helpers, screenshots, build logs and earlier cache archives under `D:\Codex-Task-Cache\manual-homework-multi-class-plan` are local artifacts; none are application source or PR attachments. Environment files and dependencies remain ignored.
