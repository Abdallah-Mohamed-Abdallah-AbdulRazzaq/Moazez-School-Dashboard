# Behavior Validation Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement validation and business rules for behavior categories, records, and reviews in the behavior module, along with unit tests.

**Architecture:** Centralize pure validation logic in the behavior utility file, then wire it to forms and page actions.

**Tech Stack:** React, Next.js, Vitest, tailwindcss

## Global Constraints
- Naming rules: follow existing CamelCase for variables/functions.
- Copies: use translations from `en.json` and `ar.json`.

---

### Task 1: Centralized Domain Rules in behaviorUiRules.ts

**Files:**
- Modify: `src/features/behavior/shared/utils/behaviorUiRules.ts`
- Modify: `src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts`

**Interfaces:**
- Consumes: `BehaviorCategory`, `BehaviorRecord`, `BehaviorType`, `BehaviorStatus` types
- Produces:
  - `normalizeCategoryCode(code: string): string`
  - `validateCategoryCode(code: string): boolean`
  - `validateCategoryName(nameEn?: string, nameAr?: string): boolean`
  - `validateCategoryPoints(type: BehaviorType, points: number | string): boolean`
  - `validateRecordContent(record: { titleEn?: string; titleAr?: string; noteEn?: string; noteAr?: string }): boolean`
  - `validateRecordPoints(type: BehaviorType, points: number | string): boolean`
  - `validateRecordCategory(category: { isActive: boolean; type: BehaviorType }, recordType: BehaviorType): boolean`
  - `validateRecordTermDate(occurredAt: string | Date, termRange?: { startDate: string; endDate: string }): boolean`
  - `validatePointsOverride(type: BehaviorType, points: number | string): boolean`
  - `shouldCreatePointLedger(status: BehaviorStatus): boolean`
  - `validateDateRange(from?: string | Date | null, to?: string | Date | null): boolean`

- [ ] **Step 1: Write the failing tests**
  Add test blocks to `src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts` covering:
  - normalization: collapsing repeated underscores, converting hyphens to underscores, stripping leading/trailing underscores, uppercasing, and replacing all non-alphanumeric characters (e.g. `"late/arrival!!!"` => `"LATE_ARRIVAL"`, `"bad.code name"` => `"BAD_CODE_NAME"`).
  - name validation: nameEn or nameAr required.
  - points sign and integer validation: accept numeric strings, reject decimals/NaN, reject empty strings `""` as invalid (using `validateCategoryPoints`, `validateRecordPoints`, and `validatePointsOverride`).
  - record category compatibility: active and type compatibility.
  - occurredAt term date range validation: inclusive of `startDate` and `endDate`, returns `false` on invalid date parsing, and returns `true` if `termRange` is missing/undefined.
  - points override check: integer and sign-compatible, rejects decimals/NaN and empty strings.
  - date range validator: From date not after To date.
  - `shouldCreatePointLedger` review status checks: `shouldCreatePointLedger("approved") === true`, `shouldCreatePointLedger("rejected") === false`.

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npm run test:run -- src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts`
  Expected: FAIL with undefined function errors or missing test coverage.

- [ ] **Step 3: Write minimal implementation in behaviorUiRules.ts**
  Add the validation and normalization functions to `src/features/behavior/shared/utils/behaviorUiRules.ts`. Ensure points validation trims string inputs first and rejects empty strings `""` (do not treat as valid 0):
  ```typescript
  const raw = typeof points === "string" ? points.trim() : points;
  if (raw === "") return false;
  const num = Number(raw);
  if (Number.isNaN(num) || !Number.isInteger(num)) return false;
  ```
  Implement the date parsing checks (returning false on invalid dates), make term date validation range checking inclusive of startDate and endDate, and return `true` if `termRange` is missing/undefined.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npm run test:run -- src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/features/behavior/shared/utils/behaviorUiRules.ts src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts
  git commit -m "feat(behavior): implement and test domain validation rules"
  ```

---

### Task 2: Wire Category Validation & Usage Checks in CategoryModal

**Files:**
- Modify: `src/features/behavior/shared/components/BehaviorActionModals.tsx`

**Interfaces:**
- Consumes: Domain validation functions from `behaviorUiRules.ts`

- [ ] **Step 1: Allow editing Category Code on creation and conditionally on edit**
  In `CategoryModal` within `BehaviorActionModals.tsx`, allow code editing on create. On edit, disable code only when category usage is known and category is in use, unless the product decision is to always lock code after creation.

- [ ] **Step 2: Implement validation & normalization on Save**
  In `handleSave` of `CategoryModal`, call `normalizeCategoryCode(form.code)` first. Then call `validateCategoryCode`, `validateCategoryName`, and `validateCategoryPoints` before calling `createBehaviorCategory` or `updateBehaviorCategory`. Show appropriate validation toasts.

- [ ] **Step 3: Enforce edit controls if category in-use is known**
  Disable both `code` and `type` inputs in edit mode if the category usage is known and the category is in use.

- [ ] **Step 4: Catch backend behavior.category.in_use error**
  Wrap saving inside try-catch, and in catch, map backend code `behavior.category.in_use` to `errors.categoryInUse`.
  *Note:* Use the existing API error shape/helper if available. If not available, add a small helper to safely read backend error codes from common response shapes such as `error.code`, `error.response.data.code`, or `error.response.data.error.code` to prevent implementation bugs.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/features/behavior/shared/components/BehaviorActionModals.tsx
  git commit -m "feat(behavior): integrate category form validations and usage constraints"
  ```

---

### Task 3: Category Deletion and Error Handling

**Files:**
- Modify: `src/features/behavior/categories/pages/BehaviorCategoriesPage.tsx`
- Modify: `src/features/behavior/services/behaviorApiService.ts`

**Interfaces:**
- Consumes: `deleteBehaviorCategory` from `behaviorApiService.ts`

- [ ] **Step 1: Check deleteBehaviorCategory existence**
  If `deleteBehaviorCategory` does not exist in `behaviorApiService.ts`, add it.

- [ ] **Step 2: Add Delete button to Category Table**
  Add a Delete action button next to Edit in the actions column of `BehaviorCategoriesPage.tsx`.

- [ ] **Step 3: Trigger deletion and handle conflict error**
  When Delete is clicked, show a confirm dialog. On confirm, invoke `deleteBehaviorCategory`. Catch any API error, check if error code matches `behavior.category.in_use`, and display `errors.categoryInUse` toast.
  *Note:* Use the existing API error shape/helper if available. If not available, add a small helper to safely read backend error codes from common response shapes such as `error.code`, `error.response.data.code`, or `error.response.data.error.code` to prevent implementation bugs.

- [ ] **Step 4: Run dev app to manually test**
  Verify clicking Delete on category in use shows the correct toast, and deleting unused category succeeds.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/features/behavior/categories/pages/BehaviorCategoriesPage.tsx src/features/behavior/services/behaviorApiService.ts
  git commit -m "feat(behavior): add category delete action with conflict error mapping"
  ```

---

### Task 4: Wire Record Validation and Date Range Filters

**Files:**
- Modify: `src/features/behavior/shared/components/BehaviorActionModals.tsx`
- Modify: `src/features/behavior/shared/components/BehaviorFiltersBar.tsx`
- Modify: `src/features/behavior/shared/components/BehaviorTable.tsx`
- Modify: `src/features/behavior/shared/components/BehaviorDetailDrawer.tsx`

**Interfaces:**
- Consumes: Domain rules from `behaviorUiRules.ts`

- [ ] **Step 1: Hide/disable record edit actions for non-draft records**
  Update `BehaviorTable.tsx` and `BehaviorDetailDrawer.tsx` to hide or disable record edit actions for records that are not in `draft` status. Keep the save-handler guard inside `RecordModal` as a backup.

- [ ] **Step 2: Implement Record form validations**
  In `RecordModal` of `BehaviorActionModals.tsx`, validate:
  - at least one title/note is present.
  - points are integer and compatible with type.
  - category is active and compatible. If values are missing on the record form, default them from the selected category's `type`, `defaultSeverity`, and `defaultPoints`.
  - occurredAt term limit check.
  Only allow editing if record status is `draft`.
  In `ApproveModal`, if `pointsOverride` is provided and not empty, validate that it is an integer and compatible with type before calling `approveBehaviorRecord`. If empty/undefined, allow submit so backend uses the record/category points.

- [ ] **Step 3: Add Date Range pickers to filters**
  In `BehaviorFiltersBar.tsx`, add Date From and Date To inputs. Validate that From date is not after To date. Map Date From to query parameter `occurredFrom` and Date To to `occurredTo` when invoking backend list endpoints.

- [ ] **Step 4: Run Vitest behavior suite to ensure everything compiles and passes**
  Run: `npm run test:run -- src/features/behavior`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/features/behavior/shared/components/BehaviorActionModals.tsx src/features/behavior/shared/components/BehaviorFiltersBar.tsx src/features/behavior/shared/components/BehaviorTable.tsx src/features/behavior/shared/components/BehaviorDetailDrawer.tsx
  git commit -m "feat(behavior): enforce record save constraints, hide edit actions for non-draft, and date filter validations"
  ```

---

### Task 5: Add Translation Keys for Validation and Errors

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Add missing validation/error keys to en.json**
  Add or update keys under `"behavior"."errors"` in `src/messages/en.json`:
  - `"categoryInUse"`: `"This category is already used by behavior records or point ledger entries and cannot be changed or deleted."`
  - `"invalidCategoryCode"`: `"Category code is required, must contain only uppercase alphanumeric characters and underscores, and be under 100 characters."`
  - `"categoryNameRequired"`: `"At least English Name or Arabic Name is required."`
  - `"invalidPoints"`: `"Points must be a valid integer and sign-compatible with the category type."`
  - `"recordContentRequired"`: `"At least one of Title (English/Arabic) or Note (English/Arabic) is required."`
  - `"invalidDateRange"`: `"From date must not be after To date."`
  - `"occurredAtOutsideTerm"`: `"The record date must be inside the selected term range."`
  - `"categoryInactive"`: `"Selected category is inactive."`
  - `"categoryTypeMismatch"`: `"Selected category type does not match the behavior type."`

- [ ] **Step 2: Add Arabic translation keys to ar.json**
  Add or update keys under `"behavior"."errors"` in `src/messages/ar.json`:
  - `"categoryInUse"`: `"هذه الفئة مستخدمة بالفعل في سجلات السلوك أو سجل النقاط ولا يمكن تعديلها أو حذفها."`
  - `"invalidCategoryCode"`: `"رمز الفئة مطلوب، ويجب أن يحتوي فقط على أحرف إنجليزية كبيرة وأرقام وشرطات سفلية، وأن يكون أقل من 100 حرف."`
  - `"categoryNameRequired"`: `"الاسم باللغة الإنجليزية أو الاسم باللغة العربية مطلوب على الأقل."`
  - `"invalidPoints"`: `"يجب أن تكون النقاط عدداً صحيحاً ومتوافقة مع إشارة نوع الفئة."`
  - `"recordContentRequired"`: `"يجب إدخال عنوان واحد أو ملاحظة واحدة على الأقل بالإنجليزية أو العربية."`
  - `"invalidDateRange"`: `"يجب ألا يكون تاريخ البدء بعد تاريخ الانتهاء."`
  - `"occurredAtOutsideTerm"`: `"يجب أن يكون تاريخ السجل ضمن نطاق الفصل الدراسي المحدد."`
  - `"categoryInactive"`: `"الفئة المحددة غير مفعّلة."`
  - `"categoryTypeMismatch"`: `"نوع الفئة المحددة لا يتطابق مع نوع السلوك."`

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add src/messages/en.json src/messages/ar.json
  git commit -m "feat(behavior): add missing validation and error translation keys"
  ```
