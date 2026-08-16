# Student Behavior Table Records Design

## Problem

The student behavior tab builds its table from the summary endpoint's `timeline` and `ledger` arrays. Those arrays are summary projections, but the UI treats them as complete `BehaviorRecord` objects. Consequently, table columns such as title, note, category, severity, and recorded-by are frequently empty.

## Design

Keep the student summary request as the source for KPI cards, chart data, and aggregate counts. Load the table rows independently from `GET /behavior/records`, filtered by the current `studentId`. This endpoint is the established source of complete behavior records and matches the table's `BehaviorRecord` contract.

The tab will maintain separate record state and loading state. Summary failures continue to affect summary content, while record failures affect the table; neither request will replace valid data from the other with incorrectly shaped objects. After a new behavior record is created and submitted, both summary and record data will be refreshed.

## Data Flow

1. When the student changes or the tab mounts, request the student summary and filtered behavior records.
2. Store the summary response for aggregate UI only.
3. Store `BehaviorRecord[]` from the records endpoint for table mapping, positive/negative filtering, and row details.
4. Map localized display fields from the complete records using the existing table mapper.
5. Refresh both sources after record creation.

## Error Handling

The existing summary error remains responsible for the summary request. A records request failure must not populate the table from summary projections; the table will display its empty state while the error remains available to the tab's existing error presentation pattern.

## Verification

- Confirm the records request includes the active student's ID.
- Confirm title, note, category, severity, and creator render when provided by a complete record.
- Confirm positive and negative records remain separated correctly.
- Confirm creating a record refreshes both the aggregate summary and table.
- Run focused tests, TypeScript checking, and linting available for the touched files.

## Scope

This change does not alter backend contracts, table layout, behavior approval rules, or unrelated student profile tabs.
