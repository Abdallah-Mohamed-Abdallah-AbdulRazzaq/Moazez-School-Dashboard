# Rewards Overview Filters Design (Refined)

Allow administrators to filter the rewards overview dashboard page by academic context, student, and date range using direct selectors and a single endpoint query.

## Goal

Provide a local filter bar on the Rewards Overview page that renders Academic Year, Term, and Student selectors using standard dropdown lists populated directly from `getReinforcementFilterOptions`. This avoids loading unnecessary layout filters (Stage, Grade, Section, Classroom) and removes extra query requests.

## User Interface

A new filters section will be displayed below the page-level action bar and navigation:
1. **Academic Year selector**: A searchable `Select` component populated from `academicYears` options.
2. **Term selector**: A searchable `Select` component populated from `terms` options (disabled until a Year is selected).
3. **Student selector**: A searchable `Select` component populated from `students` options.
4. **Date From Picker**: A date input field for the start date (`dateFrom`).
5. **Date To Picker**: A date input field for the end date (`dateTo`).
6. **Clear Filters Button**: A button that resets the local selections (student, dateFrom, dateTo) without resetting the core academic context (Year/Term).

## Data Fetching & Integration

1. **State Management**:
   The page integrates `useReinforcementUrlFilters` to synchronize selection params across:
   - `academicYearId`
   - `termId`
   - `studentId`
   - `dateFrom`
   - `dateTo`
2. **Filter Options Query**:
   The page calls `getReinforcementFilterOptions({ academicYearId, termId })` on mount and when Year/Term filters change. The returned options are mapped to `Select` formats and set in state.
3. **Overview Fetching**:
   The page fetches overview dashboard data using `getRewardsOverview({ academicYearId, termId, studentId, dateFrom, dateTo })`.
   - Any change to URL filters (including context changes, student selection, or dates) triggers a refetch of `getRewardsOverview`.
   - The catalog summary stats fetched via `getRewardCatalogSummary` are updated based on context (`academicYearId` and `termId`) only, as the backend endpoint does not support student or date filtering.
4. **Date Validation**:
   When both `dateFrom` and `dateTo` are provided, the page validates that `dateFrom <= dateTo`. If invalid, fetching is skipped, and a localized validation error is displayed.

## Verification Plan

### Automated Tests
- **Filter Component Rendering**: Verify that custom `Select` dropdowns for Year, Term, and Student are rendered.
- **URL Synchronization**: Verify that changes to the selectors update the URL parameters.
- **Data Fetching with Filters**: Verify that `getRewardsOverview` is called with the selected IDs and date ranges.
- **Date Range Validation**: Verify that an error message is displayed and API calls are blocked if `dateFrom` is after `dateTo`.
- **Clear Filters**: Verify that resetting optional filters does not clear Year/Term context.
