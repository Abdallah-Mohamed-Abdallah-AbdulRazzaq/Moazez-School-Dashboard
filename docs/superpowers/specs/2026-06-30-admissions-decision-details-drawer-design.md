# Admissions Decision Details Drawer Design

## Goal

Allow admissions staff to inspect a decision without leaving the Decisions list. Selecting a table row opens a drawer containing the latest decision data and a direct path to the related application.

## Interaction

- Every Decisions table row is keyboard- and pointer-selectable.
- Selecting a row opens a drawer from the logical end of the viewport (right in English, left in Arabic).
- The drawer closes through its close button, the Escape key, or the backdrop.
- On mobile, the drawer uses the available viewport width.
- Interactive controls inside a row must not trigger the row handler independently.

## Data Flow

1. The selected table record supplies the decision ID.
2. The drawer opens immediately in a loading state.
3. The client calls `GET /admissions/decisions/:id` through the existing `fetchDecisionById` service.
4. The normalized response replaces the loading state.
5. Closing the drawer clears the selected decision and any request error.

The drawer must not rely solely on list data because the detail endpoint is the canonical source for the selected record.

## Displayed Information

The drawer displays only user-facing values:

- Student name
- Decision (`accept`, `waitlist`, or `reject`) as a translated status badge
- Application status when supplied by the API
- Reason, with an empty-state marker when absent
- Decided by
- Decision date, formatted for the active locale

Decision, application, and user IDs remain hidden. The application ID is retained internally only to build the application-details route.

## Navigation

The primary action, **Open Application**, navigates to:

`/{lang}/admissions/applications/{applicationId}`

The action is unavailable until a valid detail response containing `applicationId` has loaded.

## Component Boundaries

- `DecisionsList` owns selected-row state, passes `onRowClick` to the existing `DataTable`, and renders the drawer.
- A focused `DecisionDetailsDrawer` owns detail fetching, presentation, loading/error states, and application navigation.
- `decisionsApiService.fetchDecisionById` remains the only API access point for decision details.

This avoids adding a dedicated decision-details route and keeps list concerns separate from detail rendering.

## Error Handling

- A failed detail request keeps the drawer open and shows a concise error with a retry action.
- A `404` explains that the decision is no longer available.
- A `403` explains that the user cannot view admission decisions.
- Other failures use the existing decision-friendly error mapping where applicable, with a generic fallback.
- Closing during a request must not update the closed drawer with stale results.

## Accessibility

- The drawer uses dialog semantics with an accessible title.
- Focus moves into the drawer when it opens and returns to the selected row when it closes.
- The close and navigation actions have visible labels.
- Status is communicated with translated text, not color alone.
- Loading and error changes are announced to assistive technology.

## Verification

Focused tests cover:

- Row selection opens the drawer and requests the selected decision.
- Loaded values render without exposing internal IDs.
- The application action builds the locale-aware route.
- Loading, retry, permission, not-found, and generic error states.
- Closing behavior and stale-request protection.
- Keyboard row activation through the existing `DataTable` behavior.

Type checking and targeted linting must pass after implementation.
