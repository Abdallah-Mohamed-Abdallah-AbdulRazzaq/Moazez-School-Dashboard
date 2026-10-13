# Manual homework questions across multiple classes

Date: 2026-10-14

Status: written spec approved, with the owner's additional request to show the multi-class choice from the first view. This task creates a plan only; application implementation is not authorized by the planning request.

## Goal and scope

Allow a user to write homework questions once on the School Dashboard Create page, then create separate drafts for selected classes, a section, grade, stage, school, or a teacher's classes. Reuse the existing subject/allocation contract, target planning, final preflight, ordered saves, and recovery workflow. This is frontend-only and assignments-only.

The selected approach is local question authoring before draft creation. Copying an already saved homework is a separate feature. Assessment batching, attachments copied across classes, automatic correction, publishing, durable draft storage, new APIs, and unrelated refactors are outside this plan.

Planning baseline: latest fetched `origin/main`, `3993d13e90b4046a21800738b3b71f2a393134d1`. Planning documents live in a managed worktree on `feat/manual-homework-multi-class-plan`; the user's main checkout remains available for other work.

## Familiar first view and optional expansion

The owner explicitly requires a change that does not surprise people who use the old flow. The existing first view, metadata/target fields, Excel actions, default single-class mode, and primary **Create draft** action remain familiar. Do not introduce a mandatory wizard, a full-page source selector, a welcome tour, or a default multi-class workflow.

Add one secondary **Write questions before creation** action near the current import area. Use existing UI Button/Disclosure/Card patterns and existing question editor fields, with a short explanation that writing questions now is optional and users can still add them after creating a draft. Opening this area does not create a parent, add a question automatically, or change the selected class or metadata.

Reveal the manual outline and editor only after the user chooses the action. Show the local question count and clarify that questions are saved when the homework is created, rather than displaying a per-question server Save button. Support collapsing the editor without losing questions.

Show **Assign to multiple classes** as an optional, initially unchecked choice on the first view, including before questions have been added. Explain briefly that questions can be written here or imported from Excel. Keep permission/context restrictions and show the existing missing-view-permission explanation when batching is unavailable. Checking the option without questions reveals the optional authoring area and target controls but adds no question and makes no creation requests; batch Create stays unavailable until there is at least one question, and final validation must pass before any write. Existing Excel imports can use the same visible option. Only opting in reveals multi-target controls/results. Use the current target preview and class-count Create action in batch mode, explaining that separate drafts will be created for each selected eligible class.

## Preserve old routes and behavior

- With no pending questions and no batch mode, Create draft retains the current parent-only create request and editor navigation. Users can add questions afterward exactly as they do today.
- Expanding an empty optional editor does not block the legacy action when multiple-class mode is off. Deleting every local manual question returns to the empty-question state; batch creation is unavailable until at least one question exists and final validation passes. If multiple-class mode is still on, do not silently fall back to creating a single parent. Turning it off restores the single-class path and retains local content/metadata.
- Once the user has local questions, single-class Create saves the parent and those questions using the same ordered-save and known-parent recovery behavior as import. Preserve existing whole-class/selected-student targeting and valid single-class timetable fields.
- Manual batching uses one subject, whole-class targeting, one draft per eligible class, and the existing allocation ownership rules. Its payload omits student IDs, timetable entry IDs, and schedule dates.
- The saved assignment editor, its attachment handling, question-editing workflow, and lifecycle actions retain their existing behavior. The new authoring area reuses editor components without changing global defaults for their other consumers.
- Excel upload, parsing, card preview, preview-language selection, Apply/Cancel, templates, row errors, and assessment import remain intact. No synthetic spreadsheet rows are created to make manual authoring look like Excel import.

## Local manual authoring

Reuse the existing `QuestionEditor` for MCQ_SINGLE, MCQ_MULTI, TRUE_FALSE, SHORT_ANSWER, and ESSAY with the same homework field configuration: single-text content, `requireBothLocalizedTexts=false`, `showHomeworkFields=true`, and the homework `isRequired` field. Use the existing question outline behavior, or a small responsive wrapper around its components, for add, select, edit, reorder, and delete.

The new Create-page question collection lives only in frontend state. Stable local question/option IDs are for editing and keys; they are never posted as server UUIDs. Reuse the current editor's question type/points/choice structure defaults, but initialize authored prompt and option text to blank so default example text cannot accidentally become homework for multiple classes. Do not change the saved editor's global defaults. Keep edits in the parent draft immediately through the editor's existing change callback so final Create includes the last field edit, even if the user has not changed the selected question first.

The new authoring area accepts up to 500 questions, matching the existing Excel import ceiling; show the limit when Add is unavailable. This limit applies to the new pre-creation collection and does not impose a new limit on the existing saved-question editor. Preserve ordering when deleting or moving questions, then normalize question/choice sortOrder before saving.

Validate all pending questions, not just the selected question. Reuse the homework contract checks for prompt, points, instructions, answers and choice structure, and share the additional import-bound constraints at the domain level rather than synthesizing workbook cells. The new collection requires nonblank prompt <=8000 characters, instructions <=4000, short expected answer <=8000, option text <=1000, at most 50 options, points from 0 to 99999.99 with at most two decimals, and supported question types. Preserve `isRequired=false` explicitly. TRUE_FALSE needs a boolean correct answer, including false; MCQ_SINGLE has at least two choices and exactly one correct; MCQ_MULTI has at least two choices and at least one correct. Text questions have no choices and type-inappropriate answer fields must not be submitted.

Show validation on the relevant question/field with accessible feedback and focus/selection of the first affected question when the user attempts Create. Question-points versus graded total marks uses the same warning policy as Excel import; it does not silently modify metadata or block creation solely for a mismatch. Revalidate edited metadata and questions at final Create using current time and context.

## Active content and replacement

Keep exactly one active question source: none, manual, or Excel. Do not concatenate a workbook into existing manual questions, create two independently saved question collections, or leave a hidden source driving the batch.

Opening the file picker, downloading a template, or previewing another workbook must not discard manual questions. Applying an Excel import that replaces manual questions requires an explicit replacement confirmation; until confirmed, preserve current questions and metadata. Declining replacement or cancelling the import preserves the current draft.

Switching from Excel questions to fresh manual authoring is also an explicit replacement action with confirmation when questions would be lost. Retain current metadata unless the accepted Excel Apply operation intentionally updates it using the existing behavior. Starting with no questions does not need a confirmation. Keep source replacement unavailable during a save or after a frozen batch starts.

## Shared batch draft and validation boundaries

Introduce a source-neutral homework question draft consisting of supported metadata and `AssignmentQuestion[]`. Treat Excel workbook source/row coordinates as separate provenance used only for spreadsheet diagnostics. General validation returns metadata and question-ID/field errors; the Excel adapter translates those errors to worksheet locations, and the manual editor presents question/field messages.

Extract the smallest common validation and ordered-save boundaries needed by both sources. Do not make shared validators require an Excel workbook or duplicate the six-scope planner for manual questions. Keep existing public Excel helper exports and error compatibility where existing callers depend on them; preserve the exact existing parent/question API mapping and uncertainty classification. New symbol/file names in the implementation plan are proposed interfaces, not existing capabilities.

The batch panel receives the source-neutral draft and a validation capability for the active source while target planning remains independent of source. Successful results, partial draft IDs, frozen editor URLs, selected class exclusions, and context/permission checks continue to use the existing coordinator and plan.

## Scope planning and save behavior

Use existing classes/section/grade/stage/school/teacher targeting and the one-subject rule. For teacher mode, default-select eligible classes for that teacher/subject, allow exclusions, preserve exclusions through search and reload, and do not silently add newly allocated classes to the reviewed snapshot. Match IDs, never display names.

Preserve all eligibility checks: valid class hierarchy, active distinct students in the year, a unique class/subject/term allocation, a teacher owner, and a matching selected teacher for teacher scope. Retain skipped rows with reasons and proceed only with eligible rows.

At final Create, validate the active question draft and reload required context before any writes. A changed plan signature requires renewed review and no POSTs on that attempt. A lookup failure blocks writes and offers the existing read-only retry. Permission loss or year/term changes must not silently redirect an active run into another context.

Freeze metadata, questions, subject/year/term and reviewed allocation rows once saving starts. Run eligible classes sequentially; for each, create the parent once and then its questions sequentially. Keep per-class queued/creating/created/partial/failed/unconfirmed/skipped outcomes and continue after an individual failure. Retain known parent IDs; do not automatically retry, recreate, delete partial parents, or roll back completed classes.

Batch results remain on the original Create page. Keep the current completed-assignment new-tab attempts, manual editor links, popup restriction handling, and absence of `window.focus()` requests. Single-class completion follows the existing editor navigation behavior.

## Navigation and editing locks

Protect pending local questions from Cancel, back navigation, source replacement and reset. Reuse existing dirty/navigation providers, with wording appropriate to manual questions rather than Excel rows. Collapsing the editor or searching/selecting a question is not a destructive action and needs no confirmation.

Lock all question editing, metadata, target selection, source changes and duplicate Create actions while submitting or after a batch has frozen. Capture a completed run's recovery context before later layout changes. Clear the dirty warning when all eligible batch assignments are fully saved; retain recovery guidance for partial/unconfirmed/failed outcomes. An explicit new batch clears local outcomes only after acknowledging the previous results.

## Source references verified during design

- `src/features/academics/homework/pages/CreateHomeworkPage.tsx`: current single-parent/Excel creation, metadata, source and batch integration.
- `src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx`: existing local question drafts and saved-question persistence/lifecycle.
- `src/features/academics/curriculum/components/QuestionEditor.tsx`: configurable editor fields and change callbacks.
- `src/features/academics/curriculum/components/QuestionsOutline.tsx`: selection/add/move/delete outline.
- `src/features/academics/curriculum/hooks/useQuestionFormState.ts`: current normalization/change delivery used by the editor.
- `src/features/academics/homework/utils/homeworkValidation.ts`: existing homework contract/question rules.
- `src/features/academics/homework/utils/homeworkImportBatchTargets.ts`: target planning, signature, allowed parent payload.
- `src/features/academics/homework/hooks/useHomeworkImportBatch.ts`: final validation/preflight, freezing and result updates.
- `src/features/academics/homework/services/homeworkExcelImportSave.ts`: parent/question ordering and known-parent failures.
- `src/features/academics/homework/services/homeworkImportBatchSave.ts`: sequential per-class outcomes.
- `src/features/academics/shared/excel-import/useImportNavigation.ts`: pending-question dirty guard integration.
- `src/features/academics/shared/excel-import/ExcelImportActions.tsx`: accepted import callback and existing preview controls.

## Acceptance and verification in the implementation plan

Add focused tests proving the visible multi-class choice is initially unchecked and the default page's legacy parent-only wire request/navigation remain unchanged unless the user opts in. Opening/closing the optional editor makes no writes and changes no targeting. Selecting multiple-class mode before questions exist reveals its prerequisites and prevents creation; accepting Excel questions later preserves that intent. The last edit is included at Create; local IDs/order and false boolean values map correctly; invalid questions cannot create a parent. Single-class manually authored questions, selected students, and partial recovery use the existing contracts.

Cover all six scopes with manual source, teacher ownership/exclusions, changed-preflight review, failed lookup retry, locked/frozen state, duplicate clicks, mixed-save recovery, unsaved navigation, accepted/cancelled source replacement, and preservation of complete question sets across responsive authoring UI. Reuse Excel/assessment regression coverage to detect changes to existing import and saved editor behavior, including the recently added preview-language behavior.

Check Arabic RTL/English at mobile, tablet and desktop widths for a familiar first view, secondary optional entry action, readable editors and validation, manageable touch targets and results. Apply Clean Code Guard on production changes, Test Guard on test changes, and Docs Guard on documentation.

The current task stops after an implementation plan is delivered. Do not implement application changes or run tests as part of planning. During subsequent authorized implementation, run relevant focused tests, lint, typecheck and production build. Full tests remain subject to the user's explicit preference and must not run without new authorization. Use the normal branch/PR workflow and leave merging/deployment to the owner.
