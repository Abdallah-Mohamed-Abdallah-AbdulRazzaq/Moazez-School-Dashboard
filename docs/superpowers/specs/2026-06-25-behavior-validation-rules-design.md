# Behavior Validation and Business Rules Spec

This document specifies the validation and business rules for behavior categories, records, and reviews within the behavior module.

## 1. Domain Validation Rules

The following functions will be implemented in `src/features/behavior/shared/utils/behaviorUiRules.ts`:

### Category Rules
- **Category Code Normalization:**
  - `normalizeCategoryCode(code: string): string`: Converts input to uppercase, replaces non-alphanumeric sequences with `_`, collapses repeated underscores, and trims any leading or trailing underscores.
- **Category Code Validation:**
  - `validateCategoryCode(code: string): boolean`: Ensures code is required, matches regex `^[A-Z0-9]+(?:_[A-Z0-9]+)*$`, and is at most 100 characters long.
- **Category Name Validation:**
  - `validateCategoryName(nameEn?: string, nameAr?: string): boolean`: Checks that at least one of `nameEn` or `nameAr` is present and contains non-whitespace characters.
- **Category Points Validation:**
  - `validateCategoryPoints(type: BehaviorType, points: number | string): boolean`:
    - Points must be an integer (accept numeric strings, reject decimals/NaN, reject empty strings `""`).
    - For `positive` behavior, points must be `>= 0`.
    - For `negative` behavior, points must be `<= 0`.

### Record Rules
- **Record Content Validation:**
  - `validateRecordContent(record: { titleEn?: string; titleAr?: string; noteEn?: string; noteAr?: string }): boolean`: Ensures at least one of `titleEn`, `titleAr`, `noteEn`, or `noteAr` contains non-whitespace characters.
- **Record Points Validation:**
  - `validateRecordPoints(type: BehaviorType, points: number | string): boolean`:
    - Points must be an integer (accept numeric strings, reject decimals/NaN, reject empty strings `""`).
    - For `positive` behavior, points must be `>= 0`.
    - For `negative` behavior, points must be `<= 0`.
- **Record Category Compatibility:**
  - `validateRecordCategory(category: { isActive: boolean; type: BehaviorType }, recordType: BehaviorType): boolean`: Category must be active and type-compatible (matching record type).
- **Record Term Date Validation:**
  - `validateRecordTermDate(occurredAt: string | Date, termRange?: { startDate: string; endDate: string }): boolean`: Checks if `occurredAt` date falls inside the selected term's date range. If `termRange` is missing/undefined, returns `true` because the UI cannot validate the term boundary locally. Returns `false` for invalid dates or dates outside the provided term range (inclusive of startDate and endDate).
- **Record Editable Validation:**
  - `canEditBehaviorRecord(record: { status: BehaviorStatus }): boolean`: Only returns `true` if record status is `draft`.

### Review Rules
- **Review Authorization:**
  - `canApproveOrRejectBehaviorRecord(record: { status: BehaviorStatus }): boolean`: Only returns `true` if record status is `submitted`.
- **Review Points Override Validation:**
  - `validatePointsOverride(type: BehaviorType, points: number | string): boolean`: Checks that the overridden points are an integer (accept numeric strings, reject decimals/NaN, reject empty strings `""`) and sign-compatible with the record type.
- **Review Approval Ledger Creation:**
  - `shouldCreatePointLedger(status: BehaviorStatus): boolean`: Returns `true` only for approved status (which creates a point ledger, e.g. `shouldCreatePointLedger("approved") === true`). Returns `false` for rejected status (which does not create a point ledger, e.g. `shouldCreatePointLedger("rejected") === false`).

---

## 2. Component Integration

### Category Creation & Modification (`CategoryModal`)
- **Code Field Normalization:** On save or on input change, normalize the Category Code.
- **Name Validation:** Requires at least one of `nameEn` or `nameAr`.
- **Points Validation:** Ensures `defaultPoints` is an integer and sign-compatible.
- **On Edit Constraint:** Allow Category Code editing on creation. On edit, disable code only when category usage is known and category is in use, unless the product decision is to always lock code after creation.
- **Disable Fields:** Disable both `code` and `type` if the category is in use.
- **In-Use Backend Fallback:** If category usage is not known beforehand, allow submitting changes and handle backend `behavior.category.in_use` error, mapping it to `errors.categoryInUse`.
  - *Error Extraction:* Safely read backend error codes using standard helpers or check paths: `error.code`, `error.response.data.code`, or `error.response.data.error.code`.

### Category Delete (`BehaviorCategoriesPage.tsx`)
- **API Existence Check:** If `deleteBehaviorCategory` does not exist in `behaviorApiService.ts`, add it.
- **Delete Button:** Display a Delete button for each category.
- **Delete Execution:** Directly trigger the DELETE API endpoint and handle backend conflicts. If the backend returns `behavior.category.in_use`, display toast error `errors.categoryInUse`. Do not rely solely on frontend pre-checks unless usage counts are explicitly provided.
  - *Error Extraction:* Safely read backend error codes using standard helpers or check paths: `error.code`, `error.response.data.code`, or `error.response.data.error.code`.

### Record Creation & Modification (`RecordModal`)
- **Action Visibility:** Hide/disable record edit actions for non-draft records in `BehaviorTable.tsx` and `BehaviorDetailDrawer.tsx`. Keep the save-handler guard inside `RecordModal` as a backup.
- **Validation on Save:**
  - Ensure at least one of title/note fields is provided.
  - Validate points are an integer and sign-compatible.
  - If a category is selected:
    - Validate the category is active.
    - Validate category type matches record type.
    - Default the type, severity, and points from the selected category's type, defaultSeverity, and defaultPoints if they are missing on the record.
  - Check that `occurredAt` is inside the selected term range when term data is available.
- **Enrollment Matching:** Use frontend enrollment matching only as helper/default logic. The backend remains the source of truth for scope validation.
- **Status Edit Guard:** Block editing if record status is not `draft`.

### Review Flow (`BehaviorReviewsPage.tsx` & `ApproveModal`/`RejectModal`)
- **Actions Visibility:** Show approve/reject action buttons only for records with `submitted` status.
- **Review Validation:** If `pointsOverride` is provided and not empty, verify that it is an integer and sign-compatible before calling API. If empty/undefined, allow submit so backend uses the record/category points.

---

## 3. Verification Plan

### Unit Tests
We will add comprehensive unit tests in `src/features/behavior/shared/utils/__tests__/behaviorUiRules.test.ts` verifying all rules with both valid and invalid data, including point sign validation and code normalization.

### Manual Verification
- Test creating a category with a messy code (e.g. `cat--test-code  123`) and verify it normalizes to `CAT_TEST_CODE_123`.
- Try deleting a category that has records and verify it handles the backend `behavior.category.in_use` error gracefully.
- Try approving a record with decimal points and verify it is blocked.
