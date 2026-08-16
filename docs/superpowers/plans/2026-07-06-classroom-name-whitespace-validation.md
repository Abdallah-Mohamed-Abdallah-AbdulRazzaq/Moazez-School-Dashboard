# Classroom Name Whitespace Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block classroom creation and editing when either localized classroom name contains whitespace.

**Architecture:** Put the classroom-only rule in a small pure validation helper so create and edit cannot drift. Both submission paths merge the helper's field errors into their existing bilingual errors before difference and uniqueness validation, using one localized message key.

**Tech Stack:** TypeScript, React 19, Next.js 16, next-intl, Vitest

---

## File Structure

- Create `src/features/academics/academic-structure-tree/utils/classroomNameValidation.ts`: pure whitespace validation shared by create and edit.
- Create `src/features/academics/academic-structure-tree/utils/__tests__/classroomNameValidation.test.ts`: focused rule and scope tests.
- Modify `src/features/academics/academic-structure-tree/hooks/useStructureCreateFlow.ts`: apply the helper before creating a classroom.
- Modify `src/features/academics/components/shared/DetailsPanel.tsx`: apply the helper before saving classroom edits.
- Modify `src/messages/en.json` and `src/messages/ar.json`: add the localized inline error.

### Task 1: Define and test the classroom-only validation contract

**Files:**
- Create: `src/features/academics/academic-structure-tree/utils/__tests__/classroomNameValidation.test.ts`
- Create: `src/features/academics/academic-structure-tree/utils/classroomNameValidation.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getClassroomNameWhitespaceErrors } from "../classroomNameValidation";

describe("getClassroomNameWhitespaceErrors", () => {
  const message = "Classroom names cannot contain whitespace";

  it.each([
    ["فصل أ", "Class-A", { ar: message }],
    ["فصل-أ", "Class A", { en: message }],
    ["فصل\tأ", "Class-A", { ar: message }],
    ["فصل-أ", "Class\nA", { en: message }],
  ])("rejects whitespace in either classroom name", (nameAr, nameEn, expected) => {
    expect(getClassroomNameWhitespaceErrors("classroom", nameAr, nameEn, message)).toEqual(expected);
  });

  it("allows classroom names without whitespace, including hyphens", () => {
    expect(getClassroomNameWhitespaceErrors("classroom", "فصل-أ", "Class-A", message)).toEqual({});
  });

  it.each(["stage", "grade", "section"] as const)("does not apply to %s names", (type) => {
    expect(getClassroomNameWhitespaceErrors(type, "اسم به مسافة", "Name With Space", message)).toEqual({});
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:run -- src/features/academics/academic-structure-tree/utils/__tests__/classroomNameValidation.test.ts`

Expected: FAIL because `../classroomNameValidation` does not exist.

- [ ] **Step 3: Implement the minimal helper**

```ts
export type StructureNameType = "stage" | "grade" | "section" | "classroom";

export interface BilingualNameErrors {
  ar?: string;
  en?: string;
}

export function getClassroomNameWhitespaceErrors(
  type: StructureNameType,
  nameAr: string | undefined,
  nameEn: string | undefined,
  errorMessage: string,
): BilingualNameErrors {
  if (type !== "classroom") return {};

  return {
    ...(nameAr && /\s/.test(nameAr) ? { ar: errorMessage } : {}),
    ...(nameEn && /\s/.test(nameEn) ? { en: errorMessage } : {}),
  };
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm run test:run -- src/features/academics/academic-structure-tree/utils/__tests__/classroomNameValidation.test.ts`

Expected: PASS for all whitespace, hyphen, and non-classroom cases.

- [ ] **Step 5: Commit the validation contract**

```bash
git add src/features/academics/academic-structure-tree/utils/classroomNameValidation.ts src/features/academics/academic-structure-tree/utils/__tests__/classroomNameValidation.test.ts
git commit -m "test: define classroom name whitespace validation"
```

### Task 2: Apply validation to classroom creation and editing

**Files:**
- Modify: `src/features/academics/academic-structure-tree/hooks/useStructureCreateFlow.ts:15,124-162`
- Modify: `src/features/academics/components/shared/DetailsPanel.tsx:16,141-188`
- Modify: `src/messages/en.json` in the root `validation` object
- Modify: `src/messages/ar.json` in the root `validation` object

- [ ] **Step 1: Add the localized validation messages**

Add this property to the root `validation` object in `src/messages/en.json`:

```json
"classroom_name_no_whitespace": "Classroom names cannot contain spaces"
```

Add the matching property to the root `validation` object in `src/messages/ar.json`:

```json
"classroom_name_no_whitespace": "لا يمكن أن تحتوي أسماء الفصول على مسافات"
```

- [ ] **Step 2: Integrate the helper into classroom creation**

Import the helper in `useStructureCreateFlow.ts`:

```ts
import { getClassroomNameWhitespaceErrors } from "@/features/academics/academic-structure-tree/utils/classroomNameValidation";
```

After required-name checks and before bilingual-difference validation, merge classroom errors without overwriting required errors:

```ts
const whitespaceErrors = getClassroomNameWhitespaceErrors(
  addModalType,
  newItemNameAr,
  newItemNameEn,
  tValidation("classroom_name_no_whitespace"),
);
if (!nextErrors.ar && whitespaceErrors.ar) nextErrors.ar = whitespaceErrors.ar;
if (!nextErrors.en && whitespaceErrors.en) nextErrors.en = whitespaceErrors.en;
```

Guard the existing bilingual-difference check so it does not replace whitespace errors:

```ts
if (
  newItemNameAr.trim() &&
  newItemNameEn.trim() &&
  !nextErrors.ar &&
  !nextErrors.en
) {
  const arEnErrors = validateArEnDifferent(newItemNameAr, newItemNameEn);
  if (arEnErrors.arError) nextErrors.ar = tValidation("arEnMustDiffer");
  if (arEnErrors.enError) nextErrors.en = tValidation("arEnMustDiffer");
}
```

- [ ] **Step 3: Integrate the helper into classroom editing**

Import the same helper in `DetailsPanel.tsx`, then add this after required-name checks:

```ts
const whitespaceErrors = getClassroomNameWhitespaceErrors(
  selectedNode?.type ?? "stage",
  nameAr,
  nameEn,
  tValidation("classroom_name_no_whitespace"),
);
if (!nextBilingualErrors.ar && whitespaceErrors.ar) nextBilingualErrors.ar = whitespaceErrors.ar;
if (!nextBilingualErrors.en && whitespaceErrors.en) nextBilingualErrors.en = whitespaceErrors.en;
```

Guard the existing bilingual-difference check with `Object.keys(nextBilingualErrors).length === 0`. The existing uniqueness block already has this guard, so invalid names will not be checked for uniqueness or submitted.

- [ ] **Step 4: Run focused tests and static verification**

Run:

```bash
npm run test:run -- src/features/academics/academic-structure-tree/utils/__tests__/classroomNameValidation.test.ts
npm run typecheck
npm run lint -- src/features/academics/academic-structure-tree/utils/classroomNameValidation.ts src/features/academics/academic-structure-tree/utils/__tests__/classroomNameValidation.test.ts src/features/academics/academic-structure-tree/hooks/useStructureCreateFlow.ts src/features/academics/components/shared/DetailsPanel.tsx
```

Expected: focused tests PASS; typecheck and targeted lint exit with code 0.

- [ ] **Step 5: Run the full unit test suite**

Run: `npm run test:run`

Expected: all Vitest tests PASS with no new warnings or errors.

- [ ] **Step 6: Commit the integration**

```bash
git add src/features/academics/academic-structure-tree/hooks/useStructureCreateFlow.ts src/features/academics/components/shared/DetailsPanel.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: reject whitespace in classroom names"
```

