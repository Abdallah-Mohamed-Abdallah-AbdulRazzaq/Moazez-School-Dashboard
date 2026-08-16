# Curriculum Backend Validation Errors Design

## Scope

Handle backend validation failures for the supported curriculum API forms:

- curriculum creation;
- unit and lesson creation and editing;
- lesson-content creation and editing.

Assignment screens are excluded because `curriculumService.ts` currently rejects assignment operations as unsupported by the backend contract.

## Error normalization

Extend `curriculumUiError` in `src/features/academics/curriculum/services/curriculumErrors.ts` so callers receive:

- a user-facing summary message;
- the optional backend trace ID;
- field errors keyed by the backend field path;
- unmatched detail messages for form-level display.

The normalizer will read field validation from `ApiError.errors` and accept the detail shapes already supported by the application: strings, arrays, and nested objects. Nested object keys will be retained as dot-separated paths so forms can match either an exact field path or its final field segment. It will not infer errors from arbitrary exception messages.

## Form behavior

Each supported form will keep its existing client-side validation. When a mutation fails, it will normalize the error once and:

1. assign recognized field messages to the corresponding input;
2. show the summary and unmatched messages in a form-level error block;
3. preserve entered values and keep dialogs or panels open;
4. clear a field's backend error when that field changes;
5. clear stale form-level errors when a new submission begins or the form context changes.

Non-validation domain errors, permission errors, and unknown API errors will use the existing curriculum error-code messages at form level. Delete, activate, archive, reorder, and load failures have no editable field target and will remain form-level errors.

## UI boundaries

Error rendering remains owned by each form because each form knows its editable field names. Backend-shape traversal and message normalization remain centralized in `curriculumErrors.ts`. This prevents duplicated parsing logic without coupling the service layer to React components.

Existing input error props will be used where available. A small accessible form-level error block will be added only where a supported form does not already expose one.

## Testing

Implementation will follow test-driven development:

- service tests will first define field-path normalization for flat, array, and nested validation details;
- component tests will first demonstrate inline rendering, form-level fallback behavior, value preservation, and clearing errors after edits;
- focused tests will be run after each change, followed by the relevant curriculum test suite and project type checking.

The implementation will not change backend request payloads or introduce client-side copies of backend validation rules.
