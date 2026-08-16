# Reward Redemption Dashboard Creation Design

## Goal

Add a dashboard UI for creating reward redemption requests through the existing `POST /reinforcement/rewards/redemptions` endpoint.

## Backend Contract

The backend already supports dashboard-side redemption creation. The endpoint is:

`POST /reinforcement/rewards/redemptions`

It is guarded by:

`reinforcement.rewards.redemptions.request`

Backend verification found the permission in the backend permission seed and on the rewards redemptions controller:

- `prisma/seeds/01-permissions.seed.ts` defines `reinforcement.rewards.redemptions.request`.
- `src/modules/reinforcement/rewards/controller/reward-redemptions.controller.ts` uses `@RequiredPermissions('reinforcement.rewards.redemptions.request')` on create and cancel redemption actions.

The frontend must not reuse review permission for creation, cancellation, or fulfillment. The page separates permissions as:

```ts
const canRequest = hasPermission("reinforcement.rewards.redemptions.request");
const canReview = hasPermission("reinforcement.rewards.redemptions.review");
const canFulfill = hasPermission("reinforcement.rewards.fulfill");
```

Action visibility follows the backend contract:

- Create request uses `canRequest`.
- Cancel uses `canRequest`.
- Approve and reject use `canReview`.
- Fulfill uses `canFulfill`.

## UI Behavior

The Reward Redemptions page shows a Create request action only when the signed-in user has `reinforcement.rewards.redemptions.request`.

Existing row actions are corrected while adding creation:

- requested redemptions show approve/reject only with review permission;
- approved redemptions show fulfill only with fulfill permission;
- requested and approved redemptions show cancel only with request permission.

The action opens a create modal. The modal collects:

- student selection;
- reward catalog item selection;
- optional English request note;
- optional Arabic request note.

The request payload includes:

```ts
{
  catalogItemId: string;
  studentId: string;
  enrollmentId?: string;
  academicYearId?: string;
  termId?: string;
  requestSource: "dashboard";
  requestNoteEn?: string;
  requestNoteAr?: string;
}
```

When the selected student source provides enrollment, academic year, or term identifiers, the modal includes them. Missing optional identifiers are omitted rather than sent as empty strings.

## Data Loading

Redemption list loading remains independent from modal lookup loading. Failing to load students or catalog items inside the modal does not fail or clear the redemptions page.

Student options are loaded from the backend reinforcement filter-options contract:

```ts
getReinforcementFilterOptions({ academicYearId, termId, search })
```

The modal uses the returned `students` options because the backend includes `studentId`, `enrollmentId`, and academic hierarchy context in those options. The selected student provides `studentId` and, when present, `enrollmentId`.

Catalog items are loaded from the existing rewards catalog service:

```ts
listRewardCatalog({
  status: "published",
  onlyAvailable: true,
  limit: 100,
})
```

The modal filters loaded catalog options locally for user search.

## Submission Flow

On submit, the modal validates that both `studentId` and `catalogItemId` are present. Notes are trimmed, and empty notes are omitted.

On success:

- the modal closes;
- a localized success toast is shown;
- the redemptions list refreshes;
- page filters and pagination state are preserved unless the existing page refresh behavior already resets them.

On failure:

- a localized error toast or modal error is shown;
- the modal remains open with the current selection so the user can correct or retry.

## Permission Behavior

Users with `reinforcement.rewards.redemptions.view` but without request permission can still inspect redemptions. Users with review permission can approve or reject only. Users with fulfillment permission can fulfill only. Users with request permission can create and cancel. None of these action permissions imply the others.

If a user lacks request permission, the create action is not rendered. Backend authorization remains the source of truth.

## Verification

Focused tests cover:

- the create action is shown only with `reinforcement.rewards.redemptions.request`;
- the create action is hidden for users who only have view/review permissions;
- cancel action is shown only with `reinforcement.rewards.redemptions.request`;
- approve and reject actions are hidden for users who only have request permission;
- fulfill action is shown only with `reinforcement.rewards.fulfill`;
- fulfill action is hidden for users who only have review permission;
- submitting sends `requestSource: "dashboard"` with required IDs;
- optional empty note fields are omitted;
- selected enrollment context is included when available;
- success closes the modal and refreshes the list;
- create modal lookup failure does not close the modal or clear the redemptions table;
- submit failure keeps the selected student, selected catalog item, and notes available for retry.
