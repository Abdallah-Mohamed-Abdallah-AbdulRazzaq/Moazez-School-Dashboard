# Reward Redemption Details Drawer Design

## Goal

Represent the complete reward-redemption response in the frontend and let administrators inspect a redemption from either an explicit View action or the table row, without interfering with workflow actions.

## Data Contract

The frontend `RewardRedemption` model includes the backend fields for actor IDs, lifecycle timestamps, bilingual notes, eligibility snapshot, catalog item, student, enrollment, academic year, and term. Nullable backend fields remain nullable instead of being converted to missing properties.

Nested structures use explicit types. The eligibility snapshot includes eligibility, XP threshold and earned XP, stock availability and remaining stock, unlimited-stock state, and catalog status. The student model includes names, code, and admission number. Enrollment includes academic hierarchy IDs. Academic year and term summaries include localized names and active state.

The existing `GET /reinforcement/rewards/redemptions/:id` service remains the authoritative detail source. Opening a redemption does not assume the list response is complete or current.

## Drawer Interaction

Each row exposes a View button. Clicking a non-interactive part of the row also opens the same drawer. Buttons, links, and other interactive controls inside the row do not trigger row opening; this follows the existing `DataTable` interactive-target behavior.

The drawer opens immediately with a loading state and requests the selected redemption by ID. A detail failure is contained inside the drawer, preserves the table, and provides a retry action. Closing the drawer clears the selected detail and its error state.

The drawer presents:

- Reward image, localized reward title, type, status, XP requirement, and stock state.
- Student identity and enrollment academic hierarchy.
- Academic year and term using localized names.
- Redemption status, request source, and all available actor IDs.
- Eligibility snapshot values.
- Request, review, fulfillment, and cancellation notes, showing only populated sections.
- Requested, reviewed, fulfilled, cancelled, created, and updated timestamps when available.

Missing nullable values use a localized not-available label. Unknown enum values remain visible through a readable fallback rather than disappearing.

## Actions and Permissions

The drawer includes the same workflow actions as the table and applies the backend permission contract:

- Approve and Reject require `reinforcement.rewards.redemptions.review` and status `requested`.
- Fulfill requires `reinforcement.rewards.fulfill` and status `approved`.
- Cancel requires `reinforcement.rewards.redemptions.request` and status `requested` or `approved`.

Drawer actions reuse `RewardRedemptionActionModal`; they do not introduce a second note form. After a successful action, the page refreshes the list and reloads the selected redemption. The drawer remains open and shows the authoritative updated status. A failed action preserves both the drawer and the entered action-modal values through the existing modal behavior.

## Page State

`RewardRedemptionsPage` owns the selected redemption ID, drawer visibility, detail loading/error/data, and detail refresh callback. The drawer remains a presentation component and receives permission flags and action callbacks from the page.

The permanent View action is independent of mutation permissions and is available whenever the user can view redemptions. Existing table mutation actions remain available; the drawer adds another context for the same commands rather than changing their permission rules.

## Verification

Focused tests cover:

- Mapping and typing the full detail response, including nullable fields and nested objects.
- Opening details from the View button and from a non-interactive row click.
- Action-button clicks not opening the drawer.
- Detail loading, failure, retry, and successful rendering.
- Localized student, reward, academic year, and term labels.
- Eligibility snapshot, notes, actor IDs, and lifecycle timestamps.
- Permission/status gating for approve, reject, fulfill, and cancel in the drawer.
- Refreshing both detail and list after a successful action while keeping the drawer open.
- Reward image rendering only when `imageFileId` exists and file-view permission allows it.
