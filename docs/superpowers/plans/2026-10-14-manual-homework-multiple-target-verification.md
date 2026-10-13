# Manual homework creation: implementation and verification

Date: 2026-10-14
Branch: `feat/manual-homework-multi-class-plan`
Baseline: `3993d13e90b4046a21800738b3b71f2a393134d1`
Draft review: [PR #93](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-School-Dashboard/pull/93)

The owner authorized implementation inline, then explicitly selected **Finish with verification limits documented** after the verification environment ran out of disk space. This feature is on the review branch; it has not been merged or deployed.

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
| Focused Vitest run | PASS: 161 tests, 16 files, final combined run |
| Project lint | PASS: `npm run lint` |
| Source type check | PASS: `node node_modules/typescript/bin/tsc --noEmit --pretty false --incremental false --types next,next/types/global,next/image-types/global` |
| Normal project type check | Initial fresh-worktree run lacked generated Next.js CSS declarations; later normal invocation was blocked by ENOSPC. The explicit-declaration source check above passed. |
| Default production build | Unverified: Turbopack rejected the external dependency junction. |
| Webpack production build | Unverified: `npm run build -- --webpack` failed with ENOSPC while writing its cache. |
| Actual-page browser review | NOT RUN: environment/storage limit; mobile/tablet/desktop Arabic and English review remains outstanding. |
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

The tests use real editors, source state, validators, planners, API mappers and ordered save services. HTTP, authentication context, router and window boundaries are fixtures; no real school assignments were created. Covered scenarios include all six manual scopes, 500/501 local questions, false/optional values, last-edit persistence, source cancellation/acceptance, selected students, duplicate clicks, changed plans, blocked lookups, frozen context, mixed outcomes and existing Excel/assessment behavior.

## Remaining review and local artifacts

Before merge, complete the normal production build and actual-browser responsive review in an environment with sufficient storage. No claim of live-backend save verification is made.

Automatic approval review rejected removal of the task-created dependency directory with `blocked by policy`. Generated files were preserved through reversible moves instead. Local verification artifacts are under `E:\Moazzez\School-Dashboard\.worktrees\manual-homework-verification`: the incomplete dependency installation, logs and one incomplete webpack cache pack. They are ignored local artifacts and are not source changes or PR attachments. The remaining ignored `.next` directory in the managed worktree is an incomplete build. No unrelated files were removed.
