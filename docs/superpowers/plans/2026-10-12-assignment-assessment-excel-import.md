# Assignment and Assessment Excel Import Implementation Plan

Upload UI follow-up (2026-10-12): the historical FileUploadButton steps below are superseded by the existing shared DragDropUploadArea in ExcelImportDialog. The dialog still reads one workbook locally with the same `.xlsx`/5 MiB limits and explicit apply step. No server upload was added.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. In this repository, the available inline execution skill is `executing-plans`; use its installed SKILL.md. Do not dispatch subagents without the user's execution choice or other applicable explicit authorization.

**Goal:** Create one editable assignment or question-based assessment from a module-specific Excel template, using existing frontend services and the verified backend contract.

**Architecture:** A shared browser workbook reader, template generator, import preview, and validation primitives serve two module adapters. The adapters preserve the assignment's single-text model and assessment's bilingual model, while Create pages keep their existing targeting controls. Imported questions are saved through current services; partial creation retains the existing parent ID and offers recovery in its normal editor.

**Tech Stack:** Next.js 16.1.6, React 19.2.3, TypeScript, next-intl, existing `src/components/ui`, ExcelJS 4.4.0 (npm version checked during planning), Vitest, and Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-12-assignment-assessment-excel-import-design.md` (approved; read it together with this plan).

## Execution record — 2026-10-12

The user selected inline implementation in this chat. The record below tracks the delivered implementation; the original step checklist remains as the proposed execution approach. Implementation commits are consolidated around the complete feature rather than the proposed per-task commits.

| Task | Implementation outcome |
| --- | --- |
| 1 — Workbook I/O | ExcelJS 4.4.0, module templates, primitive-cell reader, structure/file/row limits, original row numbers, and real workbook tests implemented. |
| 2 — Contract adapters | Both module adapters and current-draft revalidation implemented against backend commit `fe6b4b1b99478628c106b60f65370d08c10c3ceb`; five question types, bilingual assessment fields, choice ordering, numeric/text/date bounds, and marks warnings covered. |
| 3 — Import UI | Shared localized dialog, preview, download/review/remove controls, and English/Arabic messages use existing UI components. Review displays only workbook metadata; Apply preserves dashboard targeting. |
| 4 — Assignment save | Existing parent/question services save sequentially; partial failure retains the parent ID and failed question index. |
| 5 — Assignment integration | Pending import, current allocation/student checks, submission lock, original creation context, recovery navigation, and existing dirty-navigation provider integrated. Existing manual-page regression tests retained. |
| 6 — Assessment integration | Both manage permissions, current subject/scope/term checks, QUESTION_BASED import, submission lock, and existing partial-save recovery integrated. Focused tests exercise bilingual wire data, a second-question failure, Stay/Leave/removal, and duplicate submission. |
| 7 — Verification | 71 focused tests in 11 files passed. Lint, typecheck, and production build passed. Clean Code Guard, Test Guard, and documentation review applied. |

The full unit/component suite was explicitly declined by the user: **“Keep focused checks only.”** No full suite or end-to-end suite was run.

Browser checks confirmed the Arabic assignment import dialog opens and cancels, and downloaded the actual template. Its workbook sheets/headers were checked with ExcelJS. Browser file selection could not complete because the extension's “Allow access to file URLs” permission is disabled; this permission was not changed. A fresh route redirected to onboarding, so authenticated assessment, mobile, spreadsheet-viewer, and live complete/partial-save visual checks were not run. Real-workbook component and HTTP-boundary integration tests cover parsing, preview, creation, and recovery without creating school data.

`npm ci --ignore-scripts --dry-run` passed after resolving the lockfile. The dependency audit reports 38 findings (2 low, 13 moderate, 19 high, 4 critical), including a moderate ExcelJS dependency path through `uuid`. The reported UUID advisory affects v3/v5/v6 with caller-supplied buffers; the installed ExcelJS source uses v4 without a buffer. The audit finding remains reported. No broad audit fix or unrelated dependency upgrade was attempted. Normal push, draft PR identity, final head SHA, and clean status are recorded in the final handoff; no merge or deployment is authorized.

## Global Constraints

- One workbook creates one item; this is not a bulk import of multiple items.
- Subject, class targeting, academic year, and term are selected in the dashboard.
- Workbook text fields follow each module's current editor and supported persistence contract.
- Use separate Details, Questions, and Choices sheets, with an Instructions sheet for guidance and examples.
- Validate and preview the complete workbook before any creation request.
- Create a draft through existing services, then open the normal editor. Import does not invoke publish, approve, or lock actions.
- Reuse components from `src/components/ui` and existing module permissions.
- Apply Clean Code Guard to production code changes and Test Guard to test changes. Ask the user before running the full test suite.
- Frontend changes only. Do not modify backend, deployment configuration, authentication, or unrelated modules.
- Contract baseline: backend commit `fe6b4b1b99478628c106b60f65370d08c10c3ceb`. Exact columns, defaults, enums, bounds, precision, and field mappings are defined in the spec.
- Workbook feature limits: 5 MiB, 500 questions, 25,000 choice rows; both modules allow at most 50 options per question.
- Keep all workbook content in page memory. Do not put it in query parameters or persistent storage, and do not upload the file to the backend.
- Work on existing branch `feat/assignment-assessment-excel-import`, based on main `0991373e2b1c475d9312e79326c52cc9584935fc`. Do not recreate the branch or discard the design commits.
- PowerShell commands run inside one `& { ... }` block. Node v22.23.1 and npm 10.9.8 are verified. No full tests without the user's permission.
- Each implementation commit must pass the relevant checks and guard reviews. Normal push and one draft PR only after appropriate final verification; never merge or deploy.

## File structure and responsibilities

New shared production files under `src/features/academics/shared/excel-import/`:

- `types.ts`: primitive workbook rows, source locations, module-specific imports, and result types consumed by UI/adapters.
- `templateSchemas.ts`: canonical sheet/column definitions, required columns, and module defaults from the approved spec.
- `workbookReader.ts`: lazy-load ExcelJS, read an actual XLSX, validate structure/cells, and retain original row numbers. No React or API imports.
- `templateDownload.ts`: generate localized workbook guidance around canonical empty data sheets and trigger a Blob download with cleanup.
- `workbookValidation.ts`: strict primitive conversion, decimal/date/text bounds, ordered question/choice references, and cents-based totals.
- `ExcelImportDialog.tsx`: file selection, progress, parse errors, review, cancellation, and explicit Apply Import.
- `ExcelImportPreview.tsx`: metadata, total points, warnings, and sheet/row/field errors using existing UI styling; `ExcelImportQuestionCards.tsx` renders paginated question cards following owner feedback on 2026-10-12. The historical DataTable implementation below is superseded for the Excel dialog preview.
- `ExcelImportActions.tsx`: reusable download/import controls plus pending import summary, review, and removal callbacks; no server creation.

New module production files:

- `src/features/academics/homework/utils/homeworkExcelImport.ts`: workbook-to-homework draft adaptation and contract validation.
- `src/features/academics/homework/services/homeworkExcelImportSave.ts`: parent creation followed by ordered question creation, with an explicit partial-creation error.
- `src/features/grades/assessments/utils/assessmentExcelImport.ts`: workbook-to-bilingual assessment draft adaptation and contract validation. Assessment saving reuses the existing service and error class directly.

Modify:

- `src/features/academics/homework/pages/CreateHomeworkPage.tsx`: import actions, pending questions, final validation, save/recovery, and dirty state.
- `src/features/grades/assessments/pages/CreateAssessmentPage.tsx`: import actions, dual manage permissions, QUESTION_BASED mode, final validation, save/recovery, and dirty state.
- `src/messages/en.json` and `src/messages/ar.json`: add a matching `academics.excelImport` namespace.
- `package.json` and `package-lock.json`: add the pinned workbook dependency.

New focused tests:

- Shared `__tests__/excelImportFixtures.ts`, `workbookReader.test.ts`, `templateDownload.test.ts`, `workbookValidation.test.ts`, and `ExcelImportDialog.test.tsx`.
- Homework `utils/__tests__/homeworkExcelImport.test.ts`, `services/__tests__/homeworkExcelImportSave.test.ts`, and `pages/__tests__/CreateHomeworkExcelImport.test.tsx`.
- Assessment `utils/__tests__/assessmentExcelImport.test.ts` and `pages/__tests__/CreateAssessmentExcelImport.test.tsx`.

Do not add one test file per trivial helper or mock parsers/adapters merely to isolate UI. The fixture file contains only test workbook builders; it is not production code.

## Cross-task interfaces

Task 1 defines these shared types in `types.ts`; type-only imports of current module draft types do not introduce runtime dependencies:

```ts
type ImportModule = "assignment" | "assessment";
type ImportLocale = "ar" | "en";
type ImportCell = string | number | boolean | null;
type ImportSheet = "Details" | "Questions" | "Choices";
interface ImportRow {
  rowNumber: number;
  cells: Record<string, ImportCell>;
}
interface ImportWorkbookRows {
  module: ImportModule;
  details: ImportRow;
  questions: ImportRow[];
  choices: ImportRow[];
}
interface ImportIssue {
  sheet: ImportSheet | "File";
  row: number;
  field: string;
  messageKey: string;
  values?: Record<string, string | number>;
}
type ImportValidation<T> =
  | { kind: "valid"; draft: T; warnings: ImportIssue[] }
  | { kind: "invalid"; issues: ImportIssue[] };
interface ImportContext {
  now: Date;
  termStart: string;
  termEnd: string;
  publishAt?: string | null;
}
```

Task 2 additionally defines:

```ts
type HomeworkImportMetadata = Pick<CreateHomeworkAssignmentRequest,
  "title" | "description" | "mode" | "dueAt" | "isGraded" |
  "totalMarks" | "estimatedMinutes">;
type AssessmentImportMetadata = Pick<CreateAssessmentPayload,
  "title" | "titleAr" | "type" | "date" | "weight" |
  "maxScore" | "expectedTimeMinutes" | "deliveryMode">;
interface HomeworkImport {
  module: "assignment";
  metadata: HomeworkImportMetadata;
  questions: AssignmentQuestion[];
  source: ImportWorkbookRows;
}
interface AssessmentImport {
  module: "assessment";
  metadata: AssessmentImportMetadata;
  questions: AssessmentQuestion[];
  source: ImportWorkbookRows;
}
type ImportedDraft = HomeworkImport | AssessmentImport;
```

The source workbook maps model IDs/orders back to original rows. It is never sent to a service. Resolve original rows by questionNumber and choiceNumber rather than array index, because blank rows and reordered numbering are allowed.

### Task 1: Real browser templates and workbook structure reading

**Files:** shared types/schema/reader/download files, package manifests, shared fixtures and reader/download tests.

**Consumes:** approved workbook column lists and version/module markers.

**Produces:** `readImportBlob(blob: Blob): Promise<ArrayBuffer>`; `readImportWorkbook(file: File, module: ImportModule): Promise<ImportValidation<ImportWorkbookRows>>`; `createImportTemplate(request: { module: ImportModule; locale: ImportLocale; instructions: string[][] }): Promise<Blob>`; `downloadImportTemplate(request: { blob: Blob; filename: string }): void`; test fixture `assignmentWorkbookFile(): Promise<File>`.

- [ ] **Step 1: Add the actual dependency and verify its installed browser types.** Run `& { npm install --save-exact exceljs@4.4.0; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm ls exceljs }`. Read the installed workbook XLSX load/writeBuffer signatures and browser entry before using them. Do not change Vitest or webpack config just to hide an import error.
- [ ] **Step 2: Write a real-workbook fixture and reader/download regression tests.** The fixture uses the generator and the real ExcelJS document workbook, with headers looked up by name:

```ts
export async function assignmentWorkbookFile(): Promise<File> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const template = await createImportTemplate({
    module: "assignment", locale: "en", instructions: [],
  });
  await workbook.xlsx.load(await readImportBlob(template));
  const details = workbook.getWorksheet("Details")!;
  const headers = details.getRow(1).values as string[];
  const metadata = { title: "Practice", dueAt: "2099-01-02T12:00:00Z",
    isGraded: true, totalMarks: 2 };
  for (const [key, cellText] of Object.entries(metadata)) {
    details.getCell(2, headers.indexOf(key)).value = cellText;
  }
  workbook.getWorksheet("Questions")!.addRow([1, "TRUE_FALSE", "Is 2 even?", 2, "", false, ""]);
  const xlsxBytes = await workbook.xlsx.writeBuffer();
  const copiedBytes = new Uint8Array(xlsxBytes.byteLength);
  copiedBytes.set(new Uint8Array(xlsxBytes));
  return new File([copiedBytes.buffer], "assignment.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
```

```ts
it("keeps an explicit false answer and its original workbook row", async () => {
  const parsed = await readImportWorkbook(await assignmentWorkbookFile(), "assignment");
  expect(parsed.kind).toBe("valid");
  if (parsed.kind !== "valid") throw new Error("Valid workbook rejected");
  expect(parsed.draft.questions[0]).toMatchObject({
    rowNumber: 2, cells: { correctAnswer: false },
  });
});
```

Add data-driven file/structure scenarios: wrong extension, 5 MiB overflow, malformed XLSX, missing required sheets/headers, duplicate headers, second Details data row, module/version mismatch, formula/error cells, unknown populated columns, and excessive question/choice rows. A real output workbook must have no example question rows and one Details row containing only markers/defaults until filled. Verify reordered columns and original source rows, not ExcelJS internals.
- [ ] **Step 3: Run the focused tests expecting failures before reader/generator implementation.** `& { npx vitest run src/features/academics/shared/excel-import/__tests__/workbookReader.test.ts src/features/academics/shared/excel-import/__tests__/templateDownload.test.ts }`.
- [ ] **Step 4: Implement the canonical schemas and document-workbook I/O.** Follow these exact operations: validate File.size/extension; lazy-load ExcelJS; call workbook.xlsx.load on a FileReader-produced ArrayBuffer; resolve named sheets; read header names; reject duplicate/missing columns; read primitive cells and preserve rowNumber; reject formula/error/nonprimitive cells in data; ignore wholly empty rows; enforce one Details row and module/version; enforce row limits; return all actionable structure issues. The schema keys and defaults are the approved spec's exact tables, not localized labels. Use FileReader for `readImportBlob`, because the project's jsdom environment does not supply Blob.arrayBuffer and the browser API supports both uploaded Files and generated Blobs without global test polyfills.

```ts
const excelModule = await import("exceljs");
const workbook = new excelModule.Workbook();
await workbook.xlsx.load(await readImportBlob(file));
```

```ts
export function readImportBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new DOMException("Read aborted", "AbortError"));
    reader.readAsArrayBuffer(blob);
  });
}
```

Generate using the same schemas: headers in row 1; version/module/default metadata in Details row 2; Questions and Choices headers only; date columns formatted as text; frozen headers, readable widths, and enum/boolean guidance in Instructions. Copy sample rows only into Instructions. Catch a rejected workbook load at this input boundary and return `academics.excelImport.errors.unreadableWorkbook`; never pretend parsing succeeded. Blob downloads use URL.createObjectURL and revoke it after the click with anchor cleanup.
- [ ] **Step 5: Rerun the focused command and `& { npm run typecheck }`.** Fix browser/type errors without introducing a mock reader in production.
- [ ] **Step 6: Apply Clean Code Guard and Test Guard, inspect the scoped diff, and commit.** `& { git add -- package.json package-lock.json src/features/academics/shared/excel-import; git diff --cached --check; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m 'feat(excel-import): add workbook templates and reader' }`.

### Task 2: Module adapters and complete contract validation

**Files:** `types.ts`, `workbookValidation.ts`, `homeworkExcelImport.ts`, `assessmentExcelImport.ts`, and their focused validation tests.

**Consumes:** real `ImportWorkbookRows` and `ImportContext` from Task 1.

**Produces:** `homeworkImportFromWorkbook(workbook: ImportWorkbookRows, context: ImportContext): ImportValidation<HomeworkImport>`; `assessmentImportFromWorkbook(workbook: ImportWorkbookRows, context: ImportContext): ImportValidation<AssessmentImport>`; `validateHomeworkImportDraft(draft: HomeworkImport, context: ImportContext): ImportValidation<HomeworkImport>`; `validateAssessmentImportDraft(draft: AssessmentImport, context: ImportContext): ImportValidation<AssessmentImport>`. Revalidation functions are public because both initial import and Create submission consume them. Other conversion helpers remain private unless both adapters need them.

- [ ] **Step 1: Write workbook-to-draft tests using real XLSX fixtures.** Add `assessmentWorkbookFile()` next to the assignment fixture, filling Arabic/English metadata and a bilingual TRUE_FALSE question. Use supplied contexts rather than freezing every UI test's clock:

```ts
const context: ImportContext = {
  now: new Date("2099-01-01T00:00:00Z"),
  termStart: "2099-01-01", termEnd: "2099-12-31",
};
it("preserves a false homework answer through the real request mapper", async () => {
  const parsed = await readImportWorkbook(await assignmentWorkbookFile(), "assignment");
  if (parsed.kind !== "valid") throw new Error("Fixture unreadable");
  const imported = homeworkImportFromWorkbook(parsed.draft, context);
  if (imported.kind !== "valid") throw new Error("Fixture invalid");
  expect(mapBuilderQuestionToHomeworkCreatePayload(imported.draft.questions[0]))
    .toMatchObject({ type: "TRUE_FALSE", options: [
      { text: "True", isCorrect: false, sortOrder: 0 },
      { text: "False", isCorrect: true, sortOrder: 1 },
    ] });
});
```

Add table-driven scenarios for the five question types, matching/retired/media rejection, missing bilingual text, duplicate/unknown references, blank/duplicate choice numbers, MCQ answer counts, text-type forbidden choices, and type-inapplicable populated answer columns. Assert source sheet/row/field errors. Numeric cases include zero homework points, zero assessment points, 0.01 weight, third decimals, NaN/partially numeric strings, and overflow. Include 50/51 choices in both modules and the approved text/date boundaries.
- [ ] **Step 2: Run these three focused files red.** `& { npx vitest run src/features/academics/shared/excel-import/__tests__/workbookValidation.test.ts src/features/academics/homework/utils/__tests__/homeworkExcelImport.test.ts src/features/grades/assessments/utils/__tests__/assessmentExcelImport.test.ts }`.
- [ ] **Step 3: Implement strict conversion and the two adapters.** Use finite decimal syntax, precision/range checks, required trimmed text limits, exact native/text booleans, and strictly valid ISO date text. To reject impossible dates, round-trip year/month/day parts after parsing; a regex alone does not reject February 30. Do not coerce empty required fields into zero or unknown boolean text into true.

```ts
const questionPointsCents = questions.reduce(
  (total, question) => total + Math.round(question.points * 100), 0,
);
const maxScoreCents = Math.round(maxScore * 100);
const hasMarksMismatch = questionPointsCents !== maxScoreCents;
```

Implement two-decimal numeric checks before calculating cents; never round imported values into acceptance. Use the spec's separate homework/assessment maxima and text limits. Group choices by questionNumber, enforce references/uniqueness, sort by positive workbook numbers, and emit contiguous 1-based orders and `opt-` temporary option IDs. Assignments put the same single question/choice text into the builder's Arabic and English slots, matching the current single editor; assessments keep the two fields distinct.

Reuse `validateHomeworkAssignmentContract`, `validateHomeworkQuestion`, and assessment `validateQuestion` with translators returning namespaced validation keys; convert returned errors back to source locations. Supplement their missing backend limits. Metadata becomes exactly the current draft fields; assessment titleEn becomes draft title and deliveryMode is QUESTION_BASED. Preserve false answers using presence/type checks, not truthiness. Sample answers stay strings; homework expectedAnswer is retained only for SHORT_ANSWER. A marks mismatch returns a warning, not an invalid result.
- [ ] **Step 4: Implement current-draft revalidation.** It validates the import's current metadata and questions using the same module rules; it must not re-read stale metadata from the original file. The source rows are used solely to locate errors. Recheck assignment future due time/publication ordering, assessment selected-term date bounds, and current numeric/text values.
- [ ] **Step 5: Rerun the three focused tests and typecheck.** All five types must serialize with the real mapper; no validator/mapping mocks.
- [ ] **Step 6: Review with both guards and commit the shared primitives, adapters, and their tests.** Commit message: `feat(excel-import): validate assignment and assessment drafts`.

### Task 3: Shared import controls, localized preview, and cancellation

**Files:** the three shared UI components, translations, and `ExcelImportDialog.test.tsx`.

**Consumes:** Task 1 reader/download interfaces, Task 2 adapters/results, current UI components, and caller-provided ImportContext.

**Produces:** the following UI props:

```ts
interface ExcelImportDialogProps {
  isOpen: boolean;
  module: ImportModule;
  context: ImportContext;
  initialImport?: ImportedDraft;
  disabled: boolean;
  onClose: () => void;
  onApply: (draft: ImportedDraft) => void;
}
interface ExcelImportActionsProps {
  module: ImportModule;
  context: ImportContext;
  pendingImport: ImportedDraft | null;
  disabled: boolean;
  onApply: (draft: ImportedDraft) => void;
  onRemove: () => void;
}
```

- [ ] **Step 1: Write tests against the actual modal/parser/adapters.** The current vitest.setup.ts globally mocks next-intl and omits NextIntlClientProvider; use a file-local hoisted `vi.unmock("next-intl")` in the new UI test files before importing the real provider. Do not modify global test setup. Render with NextIntlClientProvider, real messages, UnsavedChangesProvider where needed, and stable next/navigation boundary mocks. Upload a valid File using Testing Library; assert question/answer preview, no apply until explicit click, and cancellation preserving the caller's import. Upload an invalid workbook; assert its source row/field error and disabled Apply. Test replacing a previously pending import through an explicit Apply step. Do not mock Modal, FileUploadButton, validators, or the parser.

```tsx
const onApply = vi.fn();
render(<NextIntlClientProvider locale="en" messages={en}>
  <ExcelImportDialog isOpen module="assignment" context={context}
    disabled={false} onClose={vi.fn()} onApply={onApply} />
</NextIntlClientProvider>);
const upload = screen.getByLabelText(en.academics.excelImport.actions.chooseFile);
fireEvent.change(upload, { target: { files: [await assignmentWorkbookFile()] } });
await screen.findByText("Is 2 even?");
expect(onApply).not.toHaveBeenCalled();
fireEvent.click(screen.getByRole("button", {
  name: en.academics.excelImport.actions.apply,
}));
expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ module: "assignment" }));
```

The callback is the UI's public output boundary, not an internal helper assertion. Add an Arabic provider case that checks visible translated guidance and the correct Arabic/English question text without asserting CSS classes.
- [ ] **Step 2: Run `& { npx vitest run src/features/academics/shared/excel-import/__tests__/ExcelImportDialog.test.tsx }` red.**
- [ ] **Step 3: Implement controls and preview using the current UI APIs.** Download builds translated Instructions and calls the generator; Import opens Modal. FileUploadButton uses `.xlsx`, `multiple={false}`, 5 MiB, localized size errors, and a disabled state during parse. On selection read and validate with the adapter selected by module. Keep only the latest parse attempt's result; ignore a late result after close or subsequent selection.

```tsx
<FileUploadButton
  accept=".xlsx"
  multiple={false}
  maxSizeBytes={5 * 1024 * 1024}
  buttonLabel={t("actions.chooseFile")}
  disabled={isParsing || disabled}
  onFilesSelected={selectWorkbook}
  formatSizeError={(name, megabytes) => t("errors.fileTooLarge", { name, megabytes })}
/>
```

`selectWorkbook` is a private dialog callback accepting File[] and performing the reader/adapter sequence; catch read failures at the file-input boundary and show an invalid-file state. Never call a creation service from these components. Preview errors use full message keys through an unscoped translator. DataTable rows are display records extending Record<string, unknown>, with original question numbers as keys. Use DataTable props `columns`, `data`, `getRowKey`, and `itemsPerPage`; metadata and warning text use the existing tokens. Show expandable/readable choice contents, correct-answer indicators, and text-answer values, rather than only a question count. Modal supplies its focus trap and focus restoration. Loading/error changes have live regions. Prevent Apply while parsing, invalid, or disabled.
- [ ] **Step 4: Add matching English/Arabic copy.** Names include actions.download/import/chooseFile/apply/review/remove/openDraft, labels for module/sheets/fields/preview totals/QUESTION_BASED, progress and partial-save messages, warnings.marksMismatch, and errors for each validator/reader key. Instructions contain examples for all five types, date/boolean formats, limits, and fields that belong in dashboard selectors. Do not translate sheet names/header keys. Do not expose source-code symbols in product copy.
- [ ] **Step 5: Run the focused UI test plus existing FileUploadButton tests, and typecheck.** `& { npx vitest run src/features/academics/shared/excel-import/__tests__/ExcelImportDialog.test.tsx src/components/ui/file-upload/__tests__/FileUploadButton.test.tsx; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run typecheck }`.
- [ ] **Step 6: Review UI code/tests with the guards and commit.** Commit message: `feat(excel-import): add localized workbook preview`.

### Task 4: Ordered assignment creation and recoverable partial saves

**Files:** homework save helper and `homeworkExcelImportSave.test.ts`.

**Consumes:** current `createHomeworkAssignment`, `createHomeworkQuestion`, CreateHomeworkAssignmentRequest, and imported AssignmentQuestion[].

**Produces:** `createHomeworkFromImport(request: { assignment: CreateHomeworkAssignmentRequest; questions: AssignmentQuestion[] }): Promise<{ id: string }>` and `HomeworkImportQuestionSaveError` with `homeworkId`, `failedQuestionIndex`, and `cause`.

- [ ] **Step 1: Write behavior tests mocking only `@/lib/api`.** Execute the real homework service/adapter/mappers with a parent response and real BackendHomeworkQuestionDetailResponse fixtures. Capture outgoing HTTP requests and return round-trip responses. Verify the returned parent ID after complete success; fail the second question and verify that the error retains the same parent ID, failed index 1, and API cause. Assert that later question requests and a second parent request do not occur. Do not mock the save helper, mapper, or homeworkService module.

```ts
await expect(createHomeworkFromImport({ assignment, questions }))
  .rejects.toMatchObject({ homeworkId: parentId, failedQuestionIndex: 1 });
expect(parentRequests).toHaveLength(1);
expect(questionRequests).toHaveLength(2);
```

`assignment`, `questions`, `parentId`, `parentRequests`, and `questionRequests` are actual test inputs/captured HTTP boundary records configured in this test; fixture IDs are UUIDs where the contract calls for UUIDs. Include a first-parent failure scenario, which must propagate without inventing a known parent ID.
- [ ] **Step 2: Run `& { npx vitest run src/features/academics/homework/services/__tests__/homeworkExcelImportSave.test.ts }` red.**
- [ ] **Step 3: Implement one parent creation and sequential questions.** Catch at the question API boundary because preserving creation progress is the recovery action; wrap the cause in the explicit error and stop. A parent failure propagates unchanged. No retry, parent deletion, or lifecycle call.

```ts
export class HomeworkImportQuestionSaveError extends Error {
  constructor(
    public readonly homeworkId: string,
    public readonly failedQuestionIndex: number,
    cause: unknown,
  ) {
    super("Assignment created; an imported question could not be saved", { cause });
    this.name = "HomeworkImportQuestionSaveError";
  }
}
export async function createHomeworkFromImport(request: {
  assignment: CreateHomeworkAssignmentRequest;
  questions: AssignmentQuestion[];
}): Promise<{ id: string }> {
  const createdAssignment = await createHomeworkAssignment(request.assignment);
  for (const [questionIndex, question] of request.questions.entries()) {
    try {
      await createHomeworkQuestion(createdAssignment.id, question);
    } catch (cause) {
      throw new HomeworkImportQuestionSaveError(createdAssignment.id, questionIndex, cause);
    }
  }
  return { id: createdAssignment.id };
}
```

- [ ] **Step 4: Rerun the test and typecheck, review both guards, and commit.** Commit message: `feat(homework): save imported questions with draft recovery`.

### Task 5: Assignment Create page integration

**Files:** CreateHomeworkPage.tsx and CreateHomeworkExcelImport.test.tsx; reuse existing CreateHomeworkPage.test.tsx for manual-flow regression.

**Consumes:** shared UI, HomeworkImport, module adapter/revalidation, homework save helper, useDirtyKey, current targeting and API errors.

**Produces:** a complete assignment import workflow that retains existing manual creation.

- [ ] **Step 1: Add integrated page tests with real import UI/adapters and only HTTP/framework/clock boundaries mocked.** Use actual messages/providers and imported XLSX. Existing page tests mock many internal UI/services; do not copy those mocks into the new import tests. Supply real academic year/term, allocation, structure, and students from HTTP responses and a provider-supported context. Test metadata application without mutation, preservation of allocation/target selection, creation with ordered questions, a partial save with Open Created Draft, and disabled resubmission after a known parent exists. Validate a due date that became stale after preview at submission. Use one deferred API promise to test double clicking while saving.

```tsx
fireEvent.change(allocationSelect, { target: { value: allocationId } });
fireEvent.change(fileInput, { target: { files: [await assignmentWorkbookFile()] } });
fireEvent.click(await screen.findByRole("button", { name: applyLabel }));
expect(assignmentCreateRequests).toHaveLength(0);
expect(allocationSelect).toHaveValue(allocationId);
fireEvent.click(screen.getByRole("button", { name: createDraftLabel }));
await waitFor(() => expect(routerReplace).toHaveBeenCalledWith(
  expect.stringContaining(`/academics/homework/${createdHomeworkId}`),
));
```

All query variables in this scenario refer to controls selected by role/label and HTTP/router boundary records from the test setup; reuse Task 1's real workbook fixture. Test removal/replacement/cancel separately only when their setup or observable results differ.
- [ ] **Step 2: Run `& { npx vitest run src/features/academics/homework/pages/__tests__/CreateHomeworkExcelImport.test.tsx }` red.**
- [ ] **Step 3: Add narrow page state/integration.** Store pending HomeworkImport and a known partial-creation error. On Apply narrow draft.module, merge only metadata into the existing form state, and retain imported questions. Do not overwrite academicYearId, termId, allocation, studentIds, timetable context, or publication scheduling. Import context includes the current selected term and publication date. Review uses current metadata merged with pending questions. Remove clears questions but keeps editable metadata. Replacing a file explicitly clears the earlier import before it has a known created parent.

```ts
function applyHomeworkImport(importedDraft: ImportedDraft) {
  if (importedDraft.module !== "assignment") return;
  setPendingImport(importedDraft);
  setDraft((current) => ({ ...current, ...importedDraft.metadata }));
}
```

The module branch is justified because the shared UI's public type is a two-module union. Use the existing permission/term restrictions and a ref-based submission lock at the beginning of the callback in addition to visible loading, so same-event-loop double clicks cannot issue two parent requests.
- [ ] **Step 4: Extend the existing Create Draft branch only for a pending import.** Keep current manual validation and eligible-student checks; add 1-500 distinct selected IDs, latest imported metadata/question contract checks, and any current time-sensitive failures. Call createHomeworkFromImport only after all checks pass. On full success clear pending dirty state, toast success, and use the existing editor URL. On HomeworkImportQuestionSaveError retain its parent ID/content, display acknowledged progress and unknown last-request outcome, and offer that parent's editor. Disable Create/Apply/Remove for that known partial parent. No automatic retry. Preserve existing field-error mapping for a parent validation response and show check-the-list guidance for a parent network outcome without an ID.
- [ ] **Step 5: Reuse dirty-navigation infrastructure without refactoring it.** Register `useDirtyKey("homework-excel-import")` when pending questions exist. Clear it on removal or complete save. `src/providers/NavigationGuardProvider.tsx` already handles sidebar guarded navigation, beforeunload, and browser history; do not add duplicate page listeners or modify that provider. For the page's own Cancel button call its existing `useNavigationGuard().guardedNavigate` API with the existing router action. Keep successful save navigation on the raw router after clearing this feature's dirty state, so it does not raise a stale unsaved-change confirmation. Tests render the real NavigationGuardProvider with UnsavedChangesProvider and exercise Stay/Leave plus removal/success cleanup.

```ts
const { guardedNavigate } = useNavigationGuard();
const { markDirty, clearDirty } = useDirtyKey("homework-excel-import");
useEffect(() => {
  if (pendingImport) markDirty();
  else clearDirty();
}, [pendingImport, markDirty, clearDirty]);
const cancelCreation = () => guardedNavigate(() => router.push(listUrl));
```

- [ ] **Step 6: Run focused new and existing page/save/adapter tests, then typecheck.** `& { npx vitest run src/features/academics/homework/pages/__tests__/CreateHomeworkExcelImport.test.tsx src/features/academics/homework/pages/__tests__/CreateHomeworkPage.test.tsx src/features/academics/homework/services/__tests__/homeworkExcelImportSave.test.ts src/features/academics/homework/utils/__tests__/homeworkExcelImport.test.ts }`.
- [ ] **Step 7: Guard-review the diff and commit.** Commit message: `feat(homework): create assignments from Excel templates`.

### Task 6: Assessment Create page integration and permission-safe recovery

**Files:** CreateAssessmentPage.tsx and CreateAssessmentExcelImport.test.tsx; existing gradesAssessmentsService.test.ts is a regression target, not automatically changed.

**Consumes:** shared UI, AssessmentImport, module adapter/revalidation, existing createAssessmentWithQuestions/AssessmentQuestionsCreationError, assessmentQuestionRecovery constants, current subject eligibility, and useDirtyKey.

**Produces:** a complete bilingual assessment import workflow preserving score-only/manual question-builder routes.

- [ ] **Step 1: Write integrated page tests at HTTP/framework boundaries.** Import actual bilingual workbooks; verify distinct texts/choice labels and sample-answer fields in outgoing requests using the real service. Confirm imported questions set QUESTION_BASED and remain absent from query strings. Parent/quizzes scope and subject come from current dashboard selections. With grades.assessments.manage=true and grades.questions.manage=false, import is disabled and sends no parent request; authorized manual SCORE_ONLY creation still works. A second-question failure retains the returned parent and failedQuestionNumber=2 for recovery; neither subsequent saves nor a replacement import create a second parent.

```tsx
fireEvent.click(screen.getByRole("button", { name: createDraftLabel }));
await screen.findByText(partialSaveLabel);
fireEvent.click(screen.getByRole("button", { name: openDraftLabel }));
await waitFor(() => expect(routerPush).toHaveBeenCalledWith(
  expect.stringContaining(`/${createdAssessmentId}/questions?`),
));
expect(assessmentCreateRequests).toHaveLength(1);
```

Use actual translation output for the labels; only the router and HTTP calls are mocked/captured. Tests supply at least two question rows to distinguish creation progress from the first-question failure.
- [ ] **Step 2: Run `& { npx vitest run src/features/grades/assessments/pages/__tests__/CreateAssessmentExcelImport.test.tsx }` red.**
- [ ] **Step 3: Add assessment import state and gates.** Import requires both manage permissions and a writable current term. Apply merges only imported assessment metadata into the current draft; it preserves term/subject/scope. Disable the delivery-mode selector while pending questions exist, and replace the imported flow's Continue to Builder label with Create Draft. Removal clears pending questions and restores the normal selector/manual routing. Use weight/maxScore min=0.01, step=0.01 and backend storage bounds in affected controls; time estimates remain integers.

```ts
const canImportAssessment = canManageAssessments && hasPermission("grades.questions.manage");
function applyAssessmentImport(importedDraft: ImportedDraft) {
  if (importedDraft.module !== "assessment") return;
  setPendingImport(importedDraft);
  setDraft((current) => current ? { ...current, ...importedDraft.metadata } : current);
}
```

- [ ] **Step 4: Add the imported submission branch before existing manual routes.** Revalidate current metadata/questions with now/current term and currently eligible subject/scope. Require QUESTION_BASED and both permissions at submission, not only when opening the modal. Use a ref submission lock. Call the real createAssessmentWithQuestions with academicYearId and `{assessment: draft, questions: pendingImport.questions}`. On success clear dirty state and open the returned editor, preserving year/term context. On AssessmentQuestionsCreationError retain its assessmentId and failedQuestionIndex; show Open Created Draft using PARTIAL_QUESTION_CREATION_RECOVERY plus failedQuestionNumber=index+1. Disable repeat Create/Apply/Remove once a parent is known. Preserve existing mapGradesApiError handling for a parent failure and cautious check-the-list guidance for an ambiguous network outcome.

```ts
const createdAssessment = await createAssessmentWithQuestions(academicYearId, {
  assessment: draft,
  questions: pendingImport.questions,
});
const editorParams = new URLSearchParams({ year: academicYearId, term: termId });
router.push(`/${locale}/grades/assessments/${createdAssessment.id}/questions?${editorParams}`);
```

The route was verified at `src/app/[lang]/(dashboard)/grades/assessments/[assessmentId]/questions/page.tsx`; the existing AssessmentQuestionsPage is the destination. Do not delete or recreate a partially saved assessment. Register `useDirtyKey("assessment-excel-import")` while questions are pending and use NavigationGuardProvider's existing guardedNavigate for Cancel; its current beforeunload and history handling supply the discard warning. Clear this dirty key before raw router navigation after full success. No new global navigation abstraction or duplicate event listener.
- [ ] **Step 5: Run the new page test, module adapter test, and existing real-service regression test.** `& { npx vitest run src/features/grades/assessments/pages/__tests__/CreateAssessmentExcelImport.test.tsx src/features/grades/assessments/utils/__tests__/assessmentExcelImport.test.ts src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run typecheck }`.
- [ ] **Step 6: Guard-review and commit.** Commit message: `feat(assessments): create bilingual drafts from Excel templates`.

### Task 7: Final verification, visual checks, and owner handoff

**Files:** scope review of all changed files; record actual verification and PR handoff according to Must Read Before Push.txt.

**Consumes:** implemented workflows and all focused tests from Tasks 1-6.

**Produces:** verified feature branch and a single draft PR ready for owner review, or an explicit report of missing checks/blockers without claiming completion.

- [ ] **Step 1: Review production and test diffs with Clean Code Guard and Test Guard.** Remove duplicated contract knowledge, long mixed-purpose routines, swallowed failures, fake production fallbacks, unused exports/imports, and redundant/mock-heavy tests. Check every dependency/API against installed code and every translation against the implementation. Apply Docs Guard to keep the approved spec and plan accurate; record any required owner-visible deviation rather than silently expanding scope.
- [ ] **Step 2: Run the complete feature-focused set once and mechanical checks.** `& { npx vitest run src/features/academics/shared/excel-import/__tests__ src/features/academics/homework/utils/__tests__/homeworkExcelImport.test.ts src/features/academics/homework/services/__tests__/homeworkExcelImportSave.test.ts src/features/academics/homework/pages/__tests__/CreateHomeworkExcelImport.test.tsx src/features/academics/homework/pages/__tests__/CreateHomeworkPage.test.tsx src/features/grades/assessments/utils/__tests__/assessmentExcelImport.test.ts src/features/grades/assessments/pages/__tests__/CreateAssessmentExcelImport.test.tsx src/features/grades/assessments/services/__tests__/gradesAssessmentsService.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run build }`. Stop and fix new failures. Rerun only what the fix affects before final verification.
- [ ] **Step 3: Verify UI and real downloadable workbooks.** Use the available browser tool and computer-use skill for authenticated local UI when possible. Inspect Arabic/English and desktop/mobile flows, actual XLSX contents in a spreadsheet viewer, invalid rows, a complete editable draft in each module, and a simulated partial-question failure. Do not perform real external creation with live production data merely to test a UI; use the existing local/test API boundary. Record any unavailable authenticated/visual check as not run.
- [ ] **Step 4: Ask the user before full tests.** Explain that `npm run test:run` runs the full unit/component suite required by the repository handoff agreement. Keep this request pending if permission is required; elapsed time does not authorize it. If granted, run `& { npm run test:run }`. Do not run `test:all`, end-to-end suites, or full coverage without their requested scope. Continue independent diff/document review while awaiting the reply.
- [ ] **Step 5: Confirm clean scope and normal commit/push.** Compare against base SHA, check git diff --check/status, include only feature files, and normally push the existing feature branch after required checks. Never force-push, merge main, or deploy. Locate an available GitHub tool or CLI before PR creation; `gh` was not on PATH during the contract audit, so do not assume that command exists. Create/update one draft PR with Summary, Scope, Changed Files, Verification, and Notes; attach its URL to the chat using attach_artifact after success. If no authenticated creation route is available, preserve the completed work and state the limitation.
- [ ] **Step 6: Deliver the repository's MOAZEZ FRONTEND DEVELOPER HANDOFF fields.** Report actual base/head SHAs, branch, changed files, PR state, lint/typecheck/tests/build results, clean status, normal push, no force push/main merge, known warnings/limitations, and owner-review status. Do not mark unfinished or unrun verification as PASS.

## Plan self-review

- Spec coverage: workbook generation/structure in Task 1; exact contract adaptation in Task 2; localized preview/cancellation in Task 3; ordered assignment save/recovery in Task 4; dashboard assignment creation and pending navigation in Task 5; assessment permissions/QUESTION_BASED/recovery in Task 6; guards, actual verification, and delivery in Task 7.
- Type consistency: public functions and UI props are defined above before their consumers. The file reader returns raw rows; module adapters return the two discriminated draft models; existing mappers retain responsibility for wire serialization.
- Scope: both modules share this one import feature and one PR. No backend implementation, score-only template, media import, automatic publication, storage persistence, or unrelated builder refactor.
- Testing boundaries: actual ExcelJS, import UI, adapters, validators, and service mappers; mocks only at HTTP, browser/framework context, clock, and download/navigation boundaries. Parameterize equivalent cases; preserve existing production regression tests.

## Shared upload area follow-up — 2026-10-12

- ExcelImportDialog now reuses the existing DragDropUploadArea with translated instructions, one-file selection, `.xlsx` acceptance, and the existing 5 MiB limit. Parsing disables the picker and still uses the original local workbook reader, module adapters, preview, and explicit apply behavior.
- The shared area exposes an optional rejection callback so an invalid replacement clears the prior Excel preview and disables Apply. Its input receives a label from the existing button/title props. Existing callers without the callback retain their behavior.
- Verification passed: 22 focused tests across five files covering the real dialog, rejected drops, assignment import/batch Create, assessment import Create, and the shared attachment uploader. Scoped lint, typecheck, production build, and whitespace checks passed. Full tests remain unrun by user preference. Clean Code Guard, Test Guard, and documentation checks completed.
- Synthetic Chrome checks passed for English/Arabic at 375/768/1024/1440: actual Create page file-input selection, import application, and two eligible draft saves retained two editor links with no runtime errors or page/dropdown overflow. Arabic mobile/desktop upload dialogs were visually inspected. Valid and rejected drag/drop behavior was exercised in component tests. Browser saves used fixture HTTP/auth/context/router/window boundaries; no live backend saves or tab activation verification was performed.

## Card preview redesign — 2026-10-12

- Removed DataTable from the Excel import preview. Question cards show original workbook question numbers, type, points, full prompts/instructions, choices, text-labelled correct choices, and answer/sample-answer content. Assessment cards retain both languages. Ten cards per page use shared UI Buttons for previous/next navigation; applying from any page retains every question.
- Metadata and total points have separate readable surfaces. The shared upload area remains available inside a native disclosure: open while selecting/validating a file and collapsed after a valid preview loads, with a translated replacement hint. Existing modal and Apply/Cancel behavior remain.
- Final verification passed: 16 focused tests across the shared dialog and assignment/assessment import Create files, scoped lint, typecheck, production build, and whitespace checks. Tests cover twelve-question pagination/full apply, absence of a table, bilingual assessment cards, false answers, rejected drops, save recovery, and existing navigation/permission behavior. Clean Code Guard, Test Guard, UI/UX, and documentation checks completed; no full suite was run.
- Synthetic Chrome checks exercised a real five-question workbook through the actual Create page in English/Arabic at 375/768/1024/1440. Every preview contained five articles and no table; applying the import and completing two eligible fixture drafts retained two editor links. No runtime errors or page overflow were observed. Arabic desktop and English mobile screenshots were inspected. HTTP/auth/context/router/window boundaries used fixtures; live backend saves and browser tab activation were not verified.
