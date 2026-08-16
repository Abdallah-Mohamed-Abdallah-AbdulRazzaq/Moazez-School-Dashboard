# Classroom Name Whitespace Validation Design

## Goal

Prevent classroom names containing whitespace from being submitted during both classroom creation and editing.

## Behavior

- Apply the rule only to classroom names; stage, grade, and section names are unchanged.
- Validate both Arabic and English classroom name fields.
- Reject any whitespace character, including spaces, tabs, and line breaks.
- Continue allowing non-whitespace punctuation such as hyphens.
- Show a localized inline error on each invalid name field and block submission.
- Preserve the existing required, Arabic/English difference, capacity, order, and uniqueness validation.

## Implementation

Add a small reusable classroom-name whitespace predicate or validation helper. Use it in:

- `useStructureCreateFlow` before classroom creation.
- `DetailsPanel` before saving classroom edits.

Add matching English and Arabic validation messages to the existing validation translation namespace.

## Validation Order

Required-field validation runs first. For a non-empty classroom name, whitespace validation runs before bilingual-difference and uniqueness checks. This ensures the user sees the directly actionable formatting error and avoids unnecessary uniqueness work.

## Testing

Add focused tests proving that:

- Create validation rejects whitespace in either classroom name.
- Edit validation rejects whitespace in either classroom name.
- Classroom names without whitespace, including hyphenated names, remain valid under this rule.
- Non-classroom names are unaffected.

