# Assignment and assessment Excel import

Date: 2026-10-12

Status: written specification approved by the user on 2026-10-12 after backend contract verification.

## Goal and accepted decisions

Add a frontend-only Excel template workflow that creates one assignment or one question-based assessment, including its questions, choices, correct answers, and marks.

- One workbook creates one item; this is not a bulk import of multiple items.
- Subject, class targeting, academic year, and term are selected in the dashboard.
- Workbook text fields follow each module's current editor and supported persistence contract.
- Use separate Details, Questions, and Choices sheets, with an Instructions sheet for guidance and examples.
- Validate and preview the complete workbook before any creation request.
- Create a draft through existing services, then open the normal editor. Import does not invoke publish, approve, or lock actions.
- Reuse components from `src/components/ui` and existing module permissions.
- Apply Clean Code Guard to production code changes and Test Guard to test changes. Ask the user before running the full test suite.

## Existing frontend boundaries

The assignment module for this feature is the active homework workflow, not the unsupported legacy curriculum assignment service.

Verified integration points:

- `src/features/academics/homework/pages/CreateHomeworkPage.tsx`: assignment creation, teacher/subject allocation, targeting, schedule, and contract validation.
- `src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx`: supported question editor, single-text input mode, draft editing, and lifecycle controls.
- `src/features/academics/homework/services/homeworkService.ts`: `createHomeworkAssignment` and `createHomeworkQuestion`.
- `src/features/academics/homework/services/homeworkMappers.ts`: homework prompt and choice text persistence, instructions, and short-answer expected answer.
- `src/features/academics/homework/utils/homeworkValidation.ts`: assignment and question validation.
- `src/features/grades/assessments/pages/CreateAssessmentPage.tsx`: assessment metadata and subject/scope eligibility.
- `src/features/grades/assessments/pages/AssessmentQuestionsPage.tsx`: question-based assessment drafts and partial-save recovery.
- `src/features/grades/assessments/services/gradesAssessmentsService.ts`: `createAssessmentWithQuestions` and `AssessmentQuestionsCreationError`.
- `src/features/grades/assessments/utils/assessmentQuestionAvailability.ts`: the five supported authoring question types.
- `src/features/academics/curriculum/components/QuestionEditor.tsx` and `QuestionOptionRow.tsx`: shared editors with single-text and bilingual modes.
- `src/features/academics/curriculum/utils/validation.ts`: bilingual assessment question validation.

Assignments persist a single title, prompt, and choice text. Assessments persist separate Arabic and English titles, prompts, and choice labels. Preserve these differences; do not translate or silently duplicate missing assessment translations.

### Backend contract verification

Audited against backend `main` commit `fe6b4b1b99478628c106b60f65370d08c10c3ceb`, resolved from GitHub on 2026-10-12. The local backend checkout was older; the audit read the pinned commit's files using Git objects without changing that checkout. The DTOs, question domain logic, creation use cases, and Prisma storage precision were checked in addition to the frontend mappers.

Backend source references are relative to [Moazez-Backend at the audited commit](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/tree/fe6b4b1b99478628c106b60f65370d08c10c3ceb):

- `src/modules/homework/dto/homework-assignment.dto.ts` and `homework-question.dto.ts`.
- `src/modules/homework/application/homework-assignments.use-cases.ts` and `homework-questions.use-cases.ts`.
- `src/modules/grades/assessments/dto/grade-assessment.dto.ts` and `grade-assessment-question.dto.ts`.
- `src/modules/grades/assessments/domain/grade-question-domain.ts` and `grade-assessment-domain.ts`.
- `src/modules/grades/assessments/application/create-question-based-grade-assessment.use-case.ts` and `grade-assessment-use-case.helpers.ts`.
- `src/modules/homework/controller/homework-questions.controller.ts` and `src/modules/grades/assessments/controller/grades-assessment-questions.controller.ts` for mutation permissions.
- `prisma/schema.prisma`.

Import validation must supplement the existing frontend validators wherever backend constraints are stricter. Current assessment question validation does not cover all backend text-length, choice-count, or decimal constraints. The backend accepts optional Arabic text and titles, but this feature intentionally retains the current bilingual editor's stricter required fields. Workbook format requirements, such as strict boolean strings and explicit-offset due-date text, are importer rules and are not claims that the backend accepts only those representations.

## Contract field mapping

Workbook fields first become existing frontend draft models. Existing service mappers then produce the wire fields below. Do not POST worksheet rows directly or invent endpoint-specific field names.

| Workbook input | Assignment request | Assessment request |
| --- | --- | --- |
| Details title fields | `title` | `titleEn` and `titleAr`; frontend `titleEn` first maps to draft `title` |
| Due date / assessment date | `dueAt` | `date` |
| Marks | `totalMarks` | `maxScore` |
| Time estimate | `estimatedMinutes` | `expectedTimeMinutes` |
| Question text | `prompt` | `prompt` and `promptAr` |
| Question type | Existing mapper converts to homework enum | Existing assessment enum |
| Question points | `points` | `points` |
| Question order | `sortOrder` | `sortOrder` |
| Choice text | `options[].text` | `options[].label` and `options[].labelAr` |
| Choice order and answer | `options[].sortOrder` and `options[].isCorrect` | Same field names |
| TRUE_FALSE answer | Existing mapper generates two options with exactly one correct | `correctAnswer`; backend normalizes it to `answerKey` and generates two options |
| Short-answer expected answer | `expectedAnswer` | Not an assessment template column |
| Sample answers | Not assignment template columns | `sampleAnswerAr` / `sampleAnswerEn`; backend persists them in `metadata` |

Assignment question type mapping: MCQ_SINGLE becomes SINGLE_CHOICE, MCQ_MULTI becomes MULTIPLE_CHOICE, TRUE_FALSE stays TRUE_FALSE, SHORT_ANSWER becomes SHORT_TEXT, and ESSAY becomes LONG_TEXT. Assessment question types keep their existing uppercase names. No new backend enum values are introduced.

Use contiguous question and multiple-choice option orders starting at 1, matching the frontend editors and satisfying both contracts. Homework DTOs also permit zero-based orders, and the existing generated homework true/false options use 0 and 1; leave that mapper behavior intact. Assessment orders must be at least 1. Temporary assessment option IDs must start with `opt-`, so the existing mapper omits them rather than sending a non-UUID `options[].id`. Parent and question IDs are generated by the backend; no workbook-local number is sent as an entity ID.

Dashboard UUIDs supply the assignment academicYearId, termId, teacherSubjectAllocationId, targetMode, and any selected students or timetable context. The assignment backend derives its teacher, classroom, and subject from the selected allocation. Assessment UUIDs supply academicYearId, termId, subjectId, and the coherent scope hierarchy. Keep scopeId and any specific scope IDs consistent; preserve the current school-scope handling. Template module/version markers and question/choice numbers are never additional API fields.

## User flow

1. Add Download Excel Template and Import Excel actions near the header of each existing Create page.
2. Download the template for that module. Details contains one row with its version, module, and documented defaults already filled; its user-authored fields are empty. Questions and Choices contain headers only. Examples appear only in Instructions so they cannot accidentally create questions.
3. Choose an `.xlsx` file in a shared import modal. Display parsing progress and allow choosing another file after parsing completes or fails.
4. Display the imported metadata, question count, total points, and question/choice preview. Validation errors identify sheet, original Excel row, field, and a localized explanation.
5. With a valid workbook, Apply Import fills the Create page's metadata and retains its questions in page state. It does not create a server record. Applying a second file replaces the earlier imported content explicitly; cancellation leaves existing form values untouched.
6. The user completes the current dashboard targeting controls and may edit metadata. Show an imported-question summary with Review Import and Remove Import actions. Remove Import clears pending imported questions and leaves metadata available for manual editing. While an assessment import is pending, prevent switching to SCORE_ONLY; removing the import restores the usual delivery-mode controls.
7. The existing Create Draft action validates the current metadata, dashboard context, and imported questions again, then creates the record and its questions. Disable further submission while saving.
8. On complete success, show a success message and open the normal editor for that item. Manual creation without an import follows its existing behavior.

Pending imported data lives in page memory. It is not written to query strings, local storage, or a backend file-upload endpoint. Warn through a confirmation before navigation or reload discards pending imported questions, using the project's available navigation/unsaved-change pattern.

## Workbook format, version 1

Use stable English sheet names and column keys in both dashboard languages. Instructions, column descriptions, validation messages, preview labels, and download filenames are localized. Canonical keys are not translated, which lets the same workbook import in either dashboard language.

The Details header contains `templateVersion` and `module`; its sole data row must contain `1` and either `assignment` or `assessment`. Reject the wrong module or unsupported version. Required columns must be present, optional columns may be absent, columns may be reordered, and duplicate or unknown populated columns produce an error rather than silently discarding content. Ignore wholly empty rows. Questions and Choices each have a header row followed by data rows. Require all three data sheets; Choices may contain only its header when there are no multiple-choice questions. Instructions is not parsed as data.

Question numbers are workbook-local positive integers, not backend IDs. They must be unique and determine question order. Choice numbers are positive integers unique within a question and determine choice order. They need not be contiguous. The parser normalizes both to the editors' existing order conventions and generates temporary IDs using the conventions accepted by the existing service mappers.

### Assignment template

Details columns:

| Column | Required | Meaning |
| --- | --- | --- |
| templateVersion | Yes | `1` |
| module | Yes | `assignment` |
| title | Yes | Current assignment title field |
| description | No | Current assignment description field |
| mode | No | Existing mode; defaults to `homework` |
| dueAt | Yes | ISO date-time text with explicit UTC offset or `Z` |
| isGraded | No | Boolean; defaults to `true` |
| totalMarks | When graded | Current total marks field |
| estimatedMinutes | No | Positive whole number |

Allowed modes: `homework`, `worksheet`, `writing_task`, `quiz`, `reading`, and `project`.

Questions columns: `questionNumber`, `questionType`, `questionText`, `points`, `instructions`, `correctAnswer`, and `expectedAnswer`.

Choices columns: `questionNumber`, `choiceNumber`, `choiceText`, and `isCorrect`.

Required question columns: `questionNumber`, `questionType`, `questionText`, and `points`. All choice columns are required for populated choice rows. Preserve the current required-question default (`true`). Instructions are optional for all five supported question types. `expectedAnswer` is optional and allowed only for SHORT_ANSWER. It maps to the existing homework expected-answer field; it does not introduce automatic grading behavior. Do not import essay sample-answer fields that the current homework mapper does not persist.

Teacher/subject allocation, targeting mode, selected students, timetable entry, schedule date, and publication scheduling remain dashboard controls and are not spreadsheet columns.

### Assessment template

Details columns:

| Column | Required | Meaning |
| --- | --- | --- |
| templateVersion | Yes | `1` |
| module | Yes | `assessment` |
| titleAr | Yes | Current Arabic title field |
| titleEn | Yes | Current English title field |
| type | Yes | Existing assessment type |
| date | Yes | Date-only text in `YYYY-MM-DD` format |
| weight | Yes | Current assessment weight field |
| maxScore | Yes | Current maximum score field |
| expectedTimeMinutes | No | Positive whole number |

Allowed assessment types: `QUIZ`, `MONTH_EXAM`, `MIDTERM`, `TERM_EXAM`, `ASSIGNMENT`, `FINAL`, and `PRACTICAL`. Imported assessments always use `QUESTION_BASED` delivery; the preview states that explicitly, and applying an import sets that mode in the Create form.

Questions columns: `questionNumber`, `questionType`, `questionTextAr`, `questionTextEn`, `points`, `correctAnswer`, `sampleAnswerAr`, and `sampleAnswerEn`.

Choices columns: `questionNumber`, `choiceNumber`, `choiceTextAr`, `choiceTextEn`, and `isCorrect`.

Required question columns: `questionNumber`, `questionType`, `questionTextAr`, `questionTextEn`, and `points`. All choice columns are required for populated choice rows. Sample answers are optional and allowed only for SHORT_ANSWER and ESSAY, matching the existing editor. Preserve current required-question defaults rather than adding a new template control absent from the editor.

### Answers and choices

Both templates accept `MCQ_SINGLE`, `MCQ_MULTI`, `TRUE_FALSE`, `SHORT_ANSWER`, and `ESSAY`.

- MCQ_SINGLE requires at least two choices and exactly one `isCorrect=true` choice.
- MCQ_MULTI requires at least two choices and at least one correct choice.
- TRUE_FALSE requires an explicit boolean `correctAnswer` in Questions and no Choices rows. Assignment mapping uses its existing generated true/false options.
- SHORT_ANSWER and ESSAY do not accept Choices rows or `correctAnswer`; their supported text answer fields are described above.
- Reject choices referencing a missing question, duplicate question/choice numbers, unsupported question types, and populated fields that do not apply to their question type.
- Boolean fields accept native Excel booleans or case-insensitive text `true`/`false`; empty optional booleans use their stated defaults. Do not interpret unknown strings or numbers as true.

## Parsing and validation

Use ExcelJS as a browser-only, dynamically imported workbook dependency. Its document workbook supports buffered XLSX input/output; see the [upstream README](https://raw.githubusercontent.com/exceljs/exceljs/master/README.md). Add the dependency and lockfile change during implementation, and verify the selected release and actual Next.js client build before delivery. Do not use filesystem or streaming APIs in the frontend.

The shared parser reads workbook structure, primitive cell values, and original row numbers. Module adapters convert the result to existing draft types and apply existing validators. The parser must not depend on React, dashboard selectors, or API calls; adapters must not duplicate service payload serialization.

Import constraints are frontend feature limits: `.xlsx` only, maximum 5 MiB input, at most 500 questions, and at most 25,000 choice rows. Both backend question DTOs enforce a maximum of 50 options per question; enforce it for both templates. Display these limits in Instructions and the modal. Reject unreadable, encrypted, renamed non-workbook, or malformed files with a readable error. Row limits are not presented as protection against every possible decompression workload. The assessment backend's 200-item limit applies to its bulk points/reorder DTOs, not to this sequential question-creation flow; do not use those bulk mutations as part of import.

Trim surrounding whitespace while preserving Arabic text, embedded newlines, and meaningful internal spaces. Numeric fields accept finite native numbers or strict decimal text; reject nonnumeric or partially numeric strings. Reject formula/error cells in data sheets instead of using cached formula results. Render imported text as text rather than HTML.

Date columns are text-formatted in generated templates. Require explicit-offset ISO text for assignment dueAt and strict date-only text for assessment date; reject invalid dates and unsupported Excel numeric date serials with formatting guidance. Preserve existing form date semantics when displaying imported dates. Validate assignment due dates as future dates and later than any dashboard publication schedule. Assessment dates must fall within the selected term. Recheck time-sensitive rules at submission.

Reuse current required-field, question-type, and answer validators, supplemented by these verified limits:

| Field | Assignment limit | Assessment limit |
| --- | --- | --- |
| Title | 1-180 characters after trimming | Each title required by the current editor, at most 255 characters |
| Description | At most 4,000 characters | Not a template field |
| Question prompt | 1-8,000 characters | Each language required by the current editor, at most 5,000 characters |
| Choice text | 1-1,000 characters | Each language required by the current editor, at most 1,000 characters |
| Instructions | At most 4,000 characters | Not a template field |
| Expected answer | At most 8,000 characters, SHORT_ANSWER only in this importer | Not a template field |
| Choices per MCQ | 2-50 | 2-50 |
| Question points | 0-99,999.99, at most two decimals | 0.01-999,999.99, at most two decimals |
| Total marks / maximum score | 0.01-99,999.99 when provided; required when graded | 0.01-99,999.99 |
| Weight | Not a template field | 0.01-100, at most two decimals |
| Time estimate | Integer 1-2,147,483,647 when provided | Same |

The maximum mark/point values and time-estimate bound come from the pinned Prisma Decimal and Int storage types; check them before saving to avoid storage overflow or silent decimal rounding. Homework's question DTO permits nonnegative points but does not enforce decimal precision; its database stores two decimals, so the importer must reject additional precision rather than round it. Assessment points, maxScore, and weight have two-decimal DTO validation as well as decimal storage. Do not silently round any spreadsheet value. Use scaled cents for total-point calculations so binary floating-point differences do not produce false warnings.

The backend accepts fractional assessment weights down to 0.01. The current Create form's min=1 attribute is not the backend contract; pending imports must accept contract-valid weights and use the contract-aligned minimum in the affected import/create controls. Assessment sample answers are optional textual metadata, with no explicit length decorator in the current DTO; accept strings and do not invent a numeric/object representation or assert an unverified backend text cap.

Assessments require both language fields for consistency with manual editing. Assignment single-text values map through the same single-text editor model. When selected_students targeting is used, retain the backend's 1-500 distinct student UUID constraint in dashboard-context validation. Backend checks for term ownership, subject/allocation eligibility, matching scope parents, writable status, and the cumulative assessment weight budget (at most 100 for the term/subject/scope) remain authoritative; surface their existing API errors rather than claiming local parsing guarantees acceptance.

The preview displays question-point totals and any mismatch with graded assignment totalMarks or assessment maxScore. A mismatch is a visible warning during draft creation, following the current ability to edit or distribute points before publishing; it does not silently alter imported marks. Ungraded assignments may omit totalMarks. At least one valid question is required for either import.

Validation errors block Apply Import and creation with pending imported questions. The user corrects the workbook and uploads it again for question-content errors; metadata and dashboard-context errors can be corrected in the Create form. No partial row import or silent skipping is allowed.

## Saving and recovery

Assignments: use `createHomeworkAssignment` once, retain the returned ID, and call `createHomeworkQuestion` sequentially in normalized question order. Use current service mapping for choices and answers. Assessments: reuse `createAssessmentWithQuestions`, including its existing `AssessmentQuestionsCreationError` carrying the created assessment ID and failed question index.

Creation is not a transaction: existing APIs create the parent and questions in separate requests. After a question-save error, retain the known parent ID, pending imported content, and acknowledged successful-question count. Show a partial-save message with Open Created Draft. Disable a fresh Create Draft for this import once its parent exists; do not delete the parent, restart the import, or automatically retry a failed request. The user recovers by opening that same draft and completing it in the existing editor. Assessment navigation reuses the existing partial-question recovery convention. Treat a failed request as possibly committed when its response is ambiguous; do not claim that only the acknowledged count is necessarily stored.

If parent creation fails without returning an ID, show the existing localized API error and preserve the preview. For network failures with an uncertain creation outcome, instruct the user to check the module list before deliberately trying again; do not claim frontend-only exactly-once guarantees.

Cancellation before submission sends no mutations. During submission, closing and repeat submission are disabled. A full success message appears only when all question requests have completed successfully. All lifecycle and grading behavior remains in the existing editors.

## UI and code organization

Build one shared import modal and workbook parser/template generator with two explicit module adapters. Keep shared infrastructure focused on workbook mechanics, preview, and row/field errors; keep module-specific metadata, validation, and save handling near the existing modules. Avoid a generic form engine or unrelated builder refactor.

Reuse `Modal`, `Button`, `Input`, `DatePicker`/`DateTimePicker`, `Select`, `DataTable`, toast components, and the existing file-upload components when their APIs fit this workflow. Support Arabic and English labels, RTL, keyboard navigation, accessible loading/error announcements, and readable mobile previews. Use existing design tokens and styling patterns.

Assignment import requires `homework.assignments.manage`, which covers both parent and question creation in the backend. Assessment import requires both `grades.assessments.manage` and `grades.questions.manage`; check both before applying or submitting an import so missing question permission cannot leave a newly created empty parent. Users who can create score-only assessments but cannot manage questions retain their manual score-only creation flow. Recovery navigation follows the existing editor's view permissions. Module context eligibility and existing backend authorization remain authoritative. Revalidate subject and targeting when the academic year, term, allocation, or scope changes. A closed/read-only term follows the corresponding module's existing restrictions.

Expected change surfaces: the two Create pages, a shared Excel import area under the existing academics shared feature boundary, module adapters/save helpers, English and Arabic translations, package manifests, and focused tests. Existing question editors are destinations for created drafts; changes to their behavior are not required by this design.

## Verification and acceptance criteria

Focused tests must exercise real generated XLSX buffers and parsing, not only mocked parsed objects. Cover valid assignment and bilingual assessment workbooks, all five question types, canonical headers with reordered columns, blank rows, invalid answers and references, version/module mismatch, malformed files, size/row limits, formula cells, strict dates, and marks warnings. Add meaningful boundary cases for 50 versus 51 choices in both modules, backend text limits, zero homework points versus invalid zero assessment points, fractional assessment weight, third-decimal rejection, and storage overflow. Verify module-specific wire names, enum conversion, temporary option ID omission, 1-based assessment ordering, explicit false true/false answers, and sample-answer persistence mappings through real existing mappers.

Component/integration tests cover download and upload, preview/errors, cancellation without mutation, applying data without mutation, preservation of dashboard targeting, question-based assessment mode, ordered saves, disabled repeat submission, and partial-save recovery using the returned parent ID. Verify that missing `grades.questions.manage` blocks assessment import before parent creation and preserves authorized manual score-only creation. Preserve other manual creation and existing permissions behavior. Assert observable user results and service inputs, not private parser structure or styling classes.

Manually verify the downloaded files in a spreadsheet viewer, Arabic/English and desktop/mobile UI, a successful draft in each module, and recovery after a simulated question-save failure. Run relevant tests, lint, typecheck, and a production build during implementation. Ask before the full tests; do not report unrun checks as passing. No tests are needed merely to validate this design document.

Acceptance: a user can download a module-specific template, fill one item with supported questions, import and inspect it, choose targeting in the dashboard, and create an editable draft with the same question/choice/answer values accepted by manual creation. Invalid content causes no creation calls. Known partial creation opens the existing draft instead of creating another parent. Backend changes, new upload endpoints, score-only imports, multi-item imports, media attachments, unsupported question types, automatic publication, and unrelated refactors are outside this feature.
