# Manual homework creation: implementation and verification

Date: 2026-10-14
Branch: `feat/manual-homework-multi-class-plan`
Baseline: `3993d13e90b4046a21800738b3b71f2a393134d1`
Draft review: [PR #93](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-School-Dashboard/pull/93)

The owner authorized implementation inline and later approved a UI refinement of the same feature. Initial verification was limited by disk space; the subsequent local environment repair enabled the normal production build, type check and responsive browser review below. This feature is on the review branch; it has not been merged or deployed.

## Using the feature

1. Open the homework Create page in an open academic term. **Create a draft** starts selected; the familiar details and single-class action remain the default, with no question editor or multiple-class targeting shown initially.
2. Enter the details, choose the existing teacher allocation and recipients, then Create draft. With no prepared questions, this retains the old parent-only workflow and opens the saved editor in the current tab for adding questions afterward.
3. Preparing questions for one class remains optional: use **Write questions before creation** or **Import Excel**. Creating with prepared questions saves them under that single draft. Opening manual authoring adds no question and makes no API writes.
4. For several classes, choose **Prepare questions for multiple classes** at the top, write questions or import Excel, then choose one subject and a scope: selected classes, section, grade, stage, whole school or a teacher's classes. Eligible teacher classes start selected and can be excluded.
5. Review eligible and skipped classes, then choose whether **Open each completed homework in a new tab** is enabled before Create. It starts enabled for each new batch, preserving the earlier behavior. Turn it off to stay on this page and use the result links. At least one question is required for a batch. Each eligible class receives a separate whole-class draft through the existing sequential save workflow. Only fully saved drafts can open automatically; result links and individual-failure recovery remain available either way. The choice locks during preflight/saving and after the run starts.
6. Switching back to **Create a draft** retains entered details and questions while collapsing the manual editor; **Show questions** reopens it. Returning without questions restores the short form. Choosing multiple classes reopens manual authoring. Workflow switches are locked once saving has started.
7. Switching between manual and Excel content requires confirmation before replacing existing questions. Cancellation preserves questions and metadata. Accepting an Excel replacement preserves the multiple-class choice.
8. If the first single-class save cannot be confirmed, creation and editing stay locked. Use **Check assignment list** to inspect the original year/term before creating another draft. If assignment-view permission is unavailable, the page explains that a school administrator must verify the save instead of offering an inaccessible list action. Prepared questions retain the navigation warning. A confirmed validation rejection still permits correction and retry.

Local questions are in memory until creation. Existing navigation protection warns before leaving with pending questions. Known-parent partial saves disable repeat creation and link to the existing draft. No new backend endpoint or request field was introduced.

## Measured checks

| Check | Outcome |
| --- | --- |
| Focused Vitest run | PASS: 172 tests in 17 files after the bug audit; PASS: 37 tests in 3 affected files for the subsequent optional-tab change. |
| Project lint | PASS: `npm run lint`; changed production/test files checked again after the recovery-permission refinement. |
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

Assignment details now appear before the question toolbar and editor, using the full page width. Two visible workflow choices replace the multiple-class checkbox: **Create a draft** is selected by default, and **Prepare questions for multiple classes** reveals local authoring and target selection. The choices use the shared Button with pressed-state semantics and keyboard focus; unavailable batching retains its permission explanation. The question toolbar groups manual authoring and Excel import, with template download as a secondary action. Manual questions have a numbered outline, a clear active-question heading and optional instructions in a disclosure using the shared TextArea. Untouched questions remain neutral until edited or submitted; validation rules and save contracts remain unchanged.

Eligible target classes and batch outcomes use cards showing hierarchy, assigned teacher, student count and status. Skipped targets have an expandable reasons section. Large lists initially show twelve cards and offer Show more; the save plan still includes every eligible target. A regression test creates all fourteen eligible drafts while the initial preview shows twelve. The persistent action bar reports questions, points and eligible classes, retaining creation locks, disabled reasons and guarded cancellation.

Existing UI-folder inputs, selectors, buttons and checkboxes are reused. Shared editor/import presentation extensions are opt-in; assessment and saved-editor defaults retain their prior behavior.

The optional-tab follow-up uses the shared Checkbox in the multiple-class panel for manual and Excel batches. Turning automatic opening off changes only browser behavior; it does not change creation payloads, targets, ordering or recovery links. Enabled mode preserves popup-blocker handling. The preference is kept for the current batch in memory and a new panel starts enabled. Focused cases cover both sources with opening disabled, re-enabling before Create, popup restrictions and the disabled preference while a request is held across an academic-context change.

`tab-choice-browser-results.json` and `tab-choice-en-375.png` / `tab-choice-ar-375.png` record the latest real-page browser check. With locally intercepted two-class saves, enabled mode attempted two tab opens and disabled mode attempted zero; both saved the questions and returned through the completed-batch action. Lint of the changed files, normal typecheck and production build passed for this follow-up.

Browser screenshots and fixture-only QA logs are local artifacts in `D:/Codex-Task-Cache/manual-homework-multi-class-plan/`. Workflow screenshots include `workflow-ar-default.png`, `workflow-ar-1440.png`, `workflow-ar-1440-targets.png`, `workflow-ar-375.png` and `workflow-en-375.png`. The final audit adds `audit-ar-recovery.png`, `audit-en-recovery.png` and `audit-browser-results.json`. It checks the default selection, hidden initial editor/targets, empty opt-out, retained question text through switching, responsive overflow and the persistent action bar. A simulated 503 initial save in each language confirms the persistent recovery warning and creation/workflow locks. A simulated successful two-class batch in each language saves its questions and returns directly to the list without the unsaved dialog. Automatic popups are blocked in this isolated QA browser; result links and popup restrictions are also covered by the focused tests. Every save request is intercepted locally, with no live assignment writes.

## Bug audit and recovery fix

The audit reproduced a save-recovery bug: after an unconfirmed initial single-class save, the warning did not disable Create, permitting a second request that could duplicate an assignment already created by the server. The regression failed against the previous implementation because Create remained enabled.

Unconfirmed saves now retain a persistent warning, lock creation, editing, source replacement and workflow switching, and offer a guarded assignment-list action using the captured creation year/term. Users without assignment-view permission receive verification guidance without an inaccessible action. Regression cases cover legacy draft-first, manual questions and Excel imports under network, server and lost-response errors, plus the missing-view-permission case. A separate confirmed validation-rejection case checks that fields remain editable and a corrected retry succeeds. Known-parent partial saves and batch per-class uncertainty handling retain their existing behavior.

The combined run also exposed a completion timing bug: a fully saved batch's Back action could open the unsaved-changes dialog before the parent page's completion effect cleared its dirty state. The batch panel now selects a dedicated completed-return callback from its own final outcomes. The page clears its dirty key and returns directly for fully saved batches; incomplete or mixed outcomes continue through guarded cancellation. The existing grade-batch regression checks a direct return without the dialog, while the partial-batch regression retains the warning.

The final focused run also covers all six manual scopes, contract validation, Excel/assessment regressions, source switching, selected students, duplicate clicks, changed preflight plans, frozen context, mixed outcomes, card pagination and partial-save recovery. No additional confirmed issue remained in these reviewed paths. This does not establish that every possible frontend or live-backend failure has been tested.

## Remaining review and local artifacts

The full test suite was not run, following the owner's focused-checks preference. Save verification uses HTTP fixtures; no claim of live-backend save verification is made. Owner review remains required before merge.

Earlier task-created incomplete dependencies and caches were preserved locally after removal was blocked by automatic approval review. The current managed worktree has physical local dependencies and completed production output. QA helpers, screenshots, build logs and earlier cache archives under `D:\Codex-Task-Cache\manual-homework-multi-class-plan` are local artifacts; none are application source or PR attachments. Environment files and dependencies remain ignored.
