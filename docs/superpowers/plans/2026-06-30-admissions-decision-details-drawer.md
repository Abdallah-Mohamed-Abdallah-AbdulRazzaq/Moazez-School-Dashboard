# Admissions Decision Details Drawer Implementation Plan

Design: `docs/superpowers/specs/2026-06-30-admissions-decision-details-drawer-design.md`

## 1. Add drawer translations

Update:

- `src/messages/en.json`
- `src/messages/ar.json`

Add a scoped Decisions details namespace for the drawer title, field labels, status labels, loading state, empty reason, close, retry, open-application action, and permission/not-found/generic errors. Keep identifiers out of user-facing copy.

Verification:

- Confirm both locale files contain the same translation keys.
- Parse both JSON files through the project type check or a direct JSON parse.

## 2. Implement the details drawer

Create:

- `src/features/admissions/decisions/components/DecisionDetailsDrawer.tsx`

Responsibilities:

- Accept the selected decision ID, open state, and close callback.
- Fetch the canonical record with `fetchDecisionById` when opened.
- Render loading, loaded, retryable error, and unavailable states.
- Present student name, translated decision badge, application status, reason, decided-by name, and locale-formatted decision date.
- Hide all internal IDs.
- Navigate with `useRouter` to `buildLocalePath(locale, "admissions", "applications", applicationId)` when **Open Application** is selected.
- Use dialog semantics, focus management, Escape/backdrop closing, logical RTL/LTR placement, and a mobile-width layout.
- Ignore stale request completion after closing or changing the selected decision.

Reuse the repository's established drawer behavior where practical, while keeping this component scoped to Decisions.

## 3. Connect table rows to the drawer

Update:

- `src/features/admissions/decisions/pages/DecisionsList.tsx`

Changes:

- Store the selected decision ID.
- Pass a row handler to the existing `DataTable.onRowClick` API.
- Render `DecisionDetailsDrawer` with the selected ID.
- Clear the selection when the drawer closes.

Do not add a separate decision-details route or expose an ID column.

## 4. Add focused tests

Create:

- `src/features/admissions/decisions/components/__tests__/DecisionDetailsDrawer.test.tsx`

Update or create the focused Decisions list test only if needed to cover integration.

Test behavior:

- Opening fetches `GET /admissions/decisions/:id` through `fetchDecisionById`.
- Loaded user-facing fields render and internal IDs do not.
- **Open Application** uses the active locale and related application ID.
- Empty reason, loading, retry, `403`, `404`, and generic failures render correctly.
- Close button, backdrop, and Escape close the drawer.
- A stale response cannot repopulate a closed drawer.
- Selecting a Decisions table row opens the drawer for that record.

Mock at service and router boundaries; do not reproduce implementation logic in tests.

## 5. Quality gates

Run:

```text
npm run test:run -- src/features/admissions/decisions
npm run typecheck
npm run lint -- src/features/admissions/decisions
git diff --check
```

Review production changes with `clean-code-guard` and test changes with `test-guard`. Fix any correctness, accessibility, duplication, or brittle-test findings before handoff.
