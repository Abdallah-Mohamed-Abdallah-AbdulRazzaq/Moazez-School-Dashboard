# Curriculum Backend Validation Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display backend curriculum validation errors beside matching fields while retaining unmatched and domain errors at form level.

**Architecture:** `curriculumErrors.ts` will remain the single boundary that understands `ApiError.errors` and `ApiError.details`. It will normalize field paths and provide a form projection helper; React forms will only store and render the projected state, clearing errors as users edit.

**Tech Stack:** TypeScript, React 19, Next.js 16, Vitest, Testing Library

---

## File map

- Modify `src/features/academics/curriculum/services/curriculumErrors.ts`: normalize `ApiError.errors`, preserve non-field details, and project errors onto a form's known fields.
- Modify `src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts`: define normalization and projection behavior.
- Modify `src/features/academics/curriculum/components/CreateCurriculumDialog.tsx`: render create-form field and summary errors.
- Create `src/features/academics/curriculum/components/__tests__/CreateCurriculumDialog.test.tsx`: verify rejected create requests remain actionable.
- Modify `src/features/academics/curriculum/components/CurriculumEditor.tsx`: render unit/lesson field and summary errors.
- Create `src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`: verify editor field mapping and clearing.
- Modify `src/features/academics/curriculum/components/LearningContentPanel.tsx`: render lesson-content field and summary errors.
- Create `src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx`: verify content field mapping and value preservation.

### Task 1: Normalize and project backend validation errors

**Files:**
- Modify: `src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts`
- Modify: `src/features/academics/curriculum/services/curriculumErrors.ts`

- [ ] **Step 1: Write failing service tests**

Add tests using the real `ApiError` constructor:

```ts
it("normalizes backend field errors", () => {
  const result = curriculumUiError(
    new ApiError("Validation failed", 422, "validation.failed", {
      title: ["Title is required"],
      "payload.estimatedMinutes": ["Must be positive"],
    }),
    "Fallback",
  );

  expect(result.fieldErrors).toEqual({
    title: ["Title is required"],
    "payload.estimatedMinutes": ["Must be positive"],
  });
});

it("projects exact and final-segment paths and retains unmatched errors", () => {
  const uiError = curriculumUiError(
    new ApiError(
      "Validation failed",
      422,
      "validation.failed",
      {
        title: ["Title is required"],
        "payload.estimatedMinutes": ["Must be positive"],
        sortOrder: ["Invalid order"],
      },
      ["Request could not be processed"],
    ),
    "Fallback",
  );

  expect(curriculumFormErrors(uiError, ["title", "estimatedMinutes"])).toEqual({
    fieldErrors: {
      title: "Title is required",
      estimatedMinutes: "Must be positive",
    },
    formMessages: ["Request could not be processed", "Invalid order"],
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts`

Expected: FAIL because `fieldErrors` and `curriculumFormErrors` do not exist.

- [ ] **Step 3: Implement minimal normalization and projection**

Update the public shape and add a typed helper:

```ts
export interface CurriculumUiError {
  message: string;
  traceId?: string;
  details: string[];
  fieldErrors: Record<string, string[]>;
}

export interface CurriculumFormErrors<Field extends string> {
  fieldErrors: Partial<Record<Field, string>>;
  formMessages: string[];
}

export function curriculumFormErrors<Field extends string>(
  error: CurriculumUiError,
  fields: readonly Field[],
): CurriculumFormErrors<Field> {
  const known = new Set<string>(fields);
  const fieldErrors: Partial<Record<Field, string>> = {};
  const formMessages = [...error.details];

  for (const [path, messages] of Object.entries(error.fieldErrors)) {
    const field = [path, ...path.split(".").reverse()].find((part) => known.has(part));
    if (field) fieldErrors[field as Field] ??= messages[0];
    else formMessages.push(...messages);
  }

  return { fieldErrors, formMessages };
}
```

Return `fieldErrors: error.errors ?? {}` for API errors and `{ fieldErrors: {}, details: [] }` for non-API errors. Keep the existing recursive `detailMessages` behavior for `error.details`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the service boundary**

```bash
git add src/features/academics/curriculum/services/curriculumErrors.ts src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts
git commit -m "fix: normalize curriculum backend validation errors"
```

### Task 2: Handle errors in curriculum creation

**Files:**
- Create: `src/features/academics/curriculum/components/__tests__/CreateCurriculumDialog.test.tsx`
- Modify: `src/features/academics/curriculum/components/CreateCurriculumDialog.tsx`

- [ ] **Step 1: Write a failing component test**

Mock `createCurriculum` to reject with an `ApiError` containing `title` and an unmatched `academicYearId` error. Render the open dialog, enter a title, submit, and assert:

```ts
expect(await screen.findByText("Title already exists")).toBeInTheDocument();
expect(screen.getByText("Academic year is closed")).toBeInTheDocument();
expect(screen.getByDisplayValue("My curriculum")).toBeInTheDocument();

await user.clear(screen.getByLabelText("name"));
await user.type(screen.getByLabelText("name"), "Replacement");
expect(screen.queryByText("Title already exists")).not.toBeInTheDocument();
```

Use the repository's standard `next-intl` identity translator mock and mock `Modal` only if its portal prevents stable queries.

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/CreateCurriculumDialog.test.tsx`

Expected: FAIL because the rejection is only logged.

- [ ] **Step 3: Add form error state and rendering**

Import `curriculumUiError` and `curriculumFormErrors`. Store:

```ts
type CreateField = "title" | "description";
const [fieldErrors, setFieldErrors] = useState<Partial<Record<CreateField, string>>>({});
const [formMessages, setFormMessages] = useState<string[]>([]);
```

At submission start clear both states. In `catch`, project known fields, store its `fieldErrors`, and store a de-duplicated array of `[mapped.message, ...projected.formMessages]`. Bind `error={fieldErrors.title}` and `error={fieldErrors.description}` to inputs, clearing the corresponding property inside each `onChange`. Render `formMessages` in an `aria-live="polite"` error block without closing the modal or clearing values.

- [ ] **Step 4: Run the component test and verify GREEN**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/CreateCurriculumDialog.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit curriculum creation handling**

```bash
git add src/features/academics/curriculum/components/CreateCurriculumDialog.tsx src/features/academics/curriculum/components/__tests__/CreateCurriculumDialog.test.tsx
git commit -m "fix: show curriculum creation validation errors"
```

### Task 3: Handle errors in unit and lesson editing

**Files:**
- Create: `src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`
- Modify: `src/features/academics/curriculum/components/CurriculumEditor.tsx`

- [ ] **Step 1: Write failing editor tests**

Mock `createUnit` and `createLesson` separately. For a new unit, reject with `title` and `estimatedLessons`; for a new lesson, reject with `objectives.0` and `estimatedMinutes`. Assert visible messages, retained values, and that editing each affected control clears only its own error. Also assert an unmatched `sortOrder` error appears in the form-level block.

- [ ] **Step 2: Run editor tests and verify RED**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`

Expected: FAIL because save failures are only logged.

- [ ] **Step 3: Implement typed editor error state**

Use this field union:

```ts
type CurriculumEditorField = keyof CurriculumEditorForm;
const editorFields = [
  "title",
  "description",
  "objectives",
  "estimatedLessons",
  "estimatedMinutes",
] as const satisfies readonly CurriculumEditorField[];
```

Replace the single `validationError` with per-field errors and a form summary. Project caught errors with `curriculumFormErrors(curriculumUiError(error, tValidation("invalid")), editorFields)`. The Task 1 segment matching maps indexed keys such as `objectives.0` to `objectives`. Clear all server errors when `selectedNode` changes and clear individual errors in each input handler. Keep delete errors form-level.

- [ ] **Step 4: Run editor tests and verify GREEN**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit editor handling**

```bash
git add src/features/academics/curriculum/components/CurriculumEditor.tsx src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx
git commit -m "fix: show unit and lesson validation errors"
```

### Task 4: Handle errors in lesson-content editing

**Files:**
- Create: `src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx`
- Modify: `src/features/academics/curriculum/components/LearningContentPanel.tsx`

- [ ] **Step 1: Write a failing lesson-content test**

Mock MUI layout hooks, permissions, `listLessonContent`, and `createLessonContent`. Reject save with field errors for `title`, `bodyText`, and an unmatched `sortOrder`. Assert inline messages, form-level unmatched text, retained values, and individual error clearing after edits.

- [ ] **Step 2: Run the lesson-content test and verify RED**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx`

Expected: FAIL because save errors currently collapse to one summary.

- [ ] **Step 3: Implement content form projection**

Define `type ContentField = keyof ContentForm` and a stable field list for `type`, `title`, `bodyText`, `url`, `estimatedMinutes`, and `isRequired`. Store field errors independently from the existing operation-level `error`. On save rejection, project the error; use `Input`/`TextArea` error props for applicable controls and render type/file/checkbox messages adjacent to those native controls. Clear backend errors when a field changes, when editing another item, and in `resetFormToCreate`. Leave load/delete/reorder/download failures in the existing operation-level block.

- [ ] **Step 4: Run the lesson-content test and verify GREEN**

Run: `npm run test:run -- src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit lesson-content handling**

```bash
git add src/features/academics/curriculum/components/LearningContentPanel.tsx src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx
git commit -m "fix: show lesson content validation errors"
```

### Task 5: Verify the integrated change

**Files:**
- Verify all files listed above.

- [ ] **Step 1: Run the curriculum tests**

Run: `npm run test:run -- src/features/academics/curriculum`

Expected: all curriculum tests PASS with no unhandled rejection warnings.

- [ ] **Step 2: Run type checking**

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 3: Run lint on changed production and test files**

Run: `npm run lint -- src/features/academics/curriculum/services/curriculumErrors.ts src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts src/features/academics/curriculum/components/CreateCurriculumDialog.tsx src/features/academics/curriculum/components/CurriculumEditor.tsx src/features/academics/curriculum/components/LearningContentPanel.tsx src/features/academics/curriculum/components/__tests__`

Expected: exit code 0.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only intended curriculum files remain uncommitted.
