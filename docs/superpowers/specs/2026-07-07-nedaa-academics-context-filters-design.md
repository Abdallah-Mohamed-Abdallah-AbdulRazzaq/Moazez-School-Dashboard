# Nedaa Academics Context Filters Design

## Goal

Add the shared academic year and term context to the Nedaa route and source staff-assignment academic filters from the selected term's academics structure tree.

## Layout Context

`src/app/[lang]/(dashboard)/nedaa/layout.tsx` will wrap all Nedaa pages with the existing `AcademicsContextLayout`. This reuses `AcademicYearTermLayoutProvider`, the shared `ContextBar`, URL-backed year and term selection, loading states, closed-term state, and missing academic-context empty states already used by the academics, teachers, dashboard, reinforcement, and hero-journey routes.

Nedaa will use the default context query keys: `year`, `term`, and `status`. The layout will not introduce a second year/term provider or a Nedaa-specific academic context implementation.

## Structure Tree Source

`NedaaStaffAssignmentsPage` will consume `useAcademicYearTermLayoutContext`. When both `academicYearId` and `termId` are available, it will call the existing `fetchStructureTree(academicYearId, termId)` service.

The returned `stages`, `grades`, `sections`, and `classrooms` arrays become the authoritative option source for:

- stage, grade, section, and classroom list filters;
- stage, grade, section, and classroom create/edit assignment fields.

Academic options will no longer be harvested from the current dismissal staff-assignment response. This ensures empty and paginated result sets still expose the complete selected term structure.

## Hierarchical Selection

Dropdown options follow the structure relationships already defined by the academics tree:

- all stages are available;
- grades are limited to the selected stage when one is selected;
- sections are limited to the selected grade when one is selected;
- classrooms are limited to the selected section when one is selected.

Changing or clearing a parent selection clears descendants that are no longer valid. This behavior applies independently to list filters and assignment forms. Each list-filter change resets server pagination to page one and sends the selected IDs through the existing dismissal staff-assignment query parameters.

The edit form may display an assigned node that is no longer present in the selected term by retaining a fallback option based on the assignment response. The fallback exists only for the current edit value and does not become a general filter option.

## Loading And Errors

Academic dropdowns remain disabled while the academic context initializes or the structure tree loads. Assignment list loading remains independent and continues to use the table skeleton for filter refetches.

If structure loading fails, the page shows a localized academic-options error with a retry action. Existing assignment rows remain visible, and non-academic filters remain usable. A context change clears the previous tree before loading the newly selected term so IDs from different terms cannot be submitted together.

When no year or term exists, `AcademicsContextLayout` owns the established missing-context empty state. The Nedaa page does not duplicate it.

## Data Flow

1. `AcademicsContextLayout` resolves year and term from URL context.
2. `NedaaStaffAssignmentsPage` receives `academicYearId`, `termId`, and initialization state from `useAcademicYearTermLayoutContext`.
3. The page fetches the selected term's structure tree.
4. Pure selectors derive hierarchical options for filters and the form.
5. Filter selections continue through `buildDismissalStaffAssignmentsListParams` to the dismissal endpoint.
6. Form selections continue through the existing create/update dismissal assignment payloads.

The academic year and term identify the option source only. They are not added to dismissal list or mutation payloads because those contracts do not define year or term fields.

## Localization

Reuse existing shared academic context-bar translations. Add Nedaa English and Arabic messages only for structure loading failure and retry if equivalent common messages do not already exist.

## Testing

Tests will verify:

- the Nedaa layout renders `AcademicsContextLayout` around route content;
- the staff-assignment page fetches the tree with the selected year and term;
- options come from the tree even when assignment results are empty;
- grade, section, and classroom options cascade from parent selections;
- changing a parent clears invalid descendants in filters and forms;
- academic filter IDs still reach the server-side dismissal query;
- a context change discards stale tree results;
- tree load failure preserves assignment content and exposes retry;
- English and Arabic message keys remain aligned.

Focused tests, the full Vitest suite, type checking, ESLint, formatting, and diff checks must pass before completion.

## Out Of Scope

- Changing academics structure APIs.
- Adding academic year or term fields to dismissal API requests.
- Editing academic structure from Nedaa beyond the existing shared missing-context actions.
- Changing dismissal assignment authorization or backend validation.
