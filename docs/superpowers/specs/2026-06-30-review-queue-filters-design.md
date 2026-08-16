# Reinforcement Review Queue Filters Design

Allow administrators to filter the review queue dashboard by academic context, student, status, search, and submitted date range using simplified direct selectors.

## Goal

Apply the same filtering design strategy to the Reinforcement Review Queue page by replacing the layout context filter component with standard Select dropdowns for Academic Year, Term, and Student populated directly from `getReinforcementFilterOptions`. This unifies the UX and eliminates extra layout-related API requests.

## User Interface

A new consolidated filters section will be displayed below the page-level action bar, taking the form of a responsive grid:
1. **Academic Year selector**: A searchable `Select` component populated from `academicYears` options.
2. **Term selector**: A searchable `Select` component populated from `terms` options (disabled until a Year is selected).
3. **Student selector**: A searchable `Select` component populated from `students` options.
4. **Status selector**: A standard `Select` component with review queue status values (Submitted, Approved, Rejected).
5. **Submitted From Picker**: A date input field for the start submission date (`submittedFrom`).
6. **Submitted To Picker**: A date input field for the end submission date (`submittedTo`).
7. **Search Input**: A text input field for fuzzy searching.
8. **Clear Filters Button**: A button that resets the local selections (student, status, search, date range) without resetting the core academic context (Year/Term).

## Data Fetching & Integration

1. **State Management**:
   The page integrates `useReinforcementUrlFilters` to synchronize selection params across:
   - `academicYearId`
   - `termId`
   - `studentId`
   - `status`
   - `search`
   - `submittedFrom`
   - `submittedTo`
2. **Filter Options Query**:
   The page calls `getReinforcementFilterOptions({ academicYearId, termId })` on mount and when Year/Term filters change. The returned options are mapped to `Select` formats and set in state.
3. **Queue Fetching**:
   The page fetches queue submissions using `listReinforcementReviewQueue({ academicYearId, termId, studentId, status, search, submittedFrom, submittedTo, limit, offset })`.
   - Any change to URL filters (including context changes, student selection, or dates) triggers a refetch.
4. **Date Validation**:
   When both `submittedFrom` and `submittedTo` are provided, the page validates that `submittedFrom <= submittedTo`. If invalid, fetching is skipped, and a localized validation error is displayed.

## Verification Plan

### Automated Tests
- **Filter Component Rendering**: Verify that custom `Select` dropdowns for Year, Term, Student, and Status are rendered.
- **URL Synchronization**: Verify that changes to the selectors update the URL parameters.
- **Data Fetching with Filters**: Verify that `listReinforcementReviewQueue` is called with the selected IDs and date ranges.
- **Date Range Validation**: Verify that an error message is displayed and API calls are blocked if `submittedFrom` is after `submittedTo`.
- **Clear Filters**: Verify that resetting optional filters does not clear Year/Term context.
