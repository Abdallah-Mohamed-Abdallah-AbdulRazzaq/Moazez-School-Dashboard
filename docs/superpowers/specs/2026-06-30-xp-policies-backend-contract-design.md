# XP Policies Backend Contract Design

## Goal

Align the XP Policies frontend with the backend create, update, list, and effective-policy contracts while removing duplicated scope inputs from the create modal.

## Response Contract

The backend policy presenter returns the following shape:

```ts
interface XpPolicyResponseDto {
  id: string | null;
  academicYearId: string;
  termId: string;
  scopeType: XpPolicyScopeType;
  scopeKey: string;
  dailyCap: number | null;
  weeklyCap: number | null;
  cooldownMinutes: number | null;
  allowedReasons: unknown;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}
```

The frontend response model must not expose `yearId` or `scopeId`, because the presenter does not return them. `scopeKey` is the persisted scope identifier and is used for policy display. A default effective policy has `id: null`, `isDefault: true`, null caps, null dates, and null timestamps.

The transport mapper normalizes `allowedReasons` into `string[]`: it keeps trimmed non-empty strings from an array and uses an empty array for null or any unsupported JSON shape. This keeps the UI safe while preserving the backend transport type as `unknown`.

## Request Contracts

Create and update remain separate contracts. Create accepts:

- `academicYearId`
- `termId`
- `scopeType`
- `scopeId`
- `dailyCap`
- `weeklyCap`
- `cooldownMinutes`
- `allowedReasons`
- `startsAt`
- `endsAt`
- `isActive`

The frontend standardizes on `academicYearId` and does not send the backend compatibility alias `yearId`. The selected target supplies `scopeType` and `scopeId`; `scopeKey` is response-only.

Update accepts only caps, allowed reasons, validity dates, and active state. It cannot change academic context or scope. Blank cap inputs in the inline patch row submit `null`, allowing an existing cap to be cleared. Unchanged fields are omitted.

## Create Form

The create form keeps every backend-supported policy input. It shows only academic year and term in its academic context section. Stage, grade, section, and classroom inputs are hidden there because the separate target selector is the single source of truth for scope selection.

The existing academic selector receives a focused `showStructure` option. XP Policy creation sets it to false while other consumers retain their current behavior by default.

The form requires an academic year, term, and one target. When both validity dates exist, `startsAt` must not be after `endsAt`. Failed submissions keep all entered state available for retry.

## Policy Presentation

Each policy card displays:

- localized scope type and `scopeKey`
- default or custom policy state
- active or inactive state
- daily cap, weekly cap, and cooldown, with a localized unlimited/not-set label for null values
- allowed reasons when present
- start and end dates when present

Default policies are read-only because they have no persisted ID. Persisted policies continue to expose the inline cap patch action to authorized users. The effective-policy summary uses `scopeKey` and identifies default fallback policies explicitly.

## Service Boundary

The XP service maps raw policy responses at the API boundary for list, effective, create, and patch operations. Components consume the normalized `XpPolicy` view model and do not inspect unknown transport JSON directly.

Create serialization includes only Create DTO fields. Patch serialization includes only Update DTO fields and preserves explicit null values used to clear caps, reasons, or dates.

## Error Handling

- Invalid create-form dates produce a localized inline validation error without sending a request.
- Create and patch failures retain form or row state for retry.
- Unsupported `allowedReasons` JSON renders as no reasons rather than throwing.
- A default policy never invokes the patch endpoint because its ID is null.

## Verification

Focused tests cover:

- Mapping `scopeKey`, `isDefault`, and every nullable response field.
- Normalizing array, null, and unsupported `allowedReasons` values.
- Removing `yearId` and response-side `scopeId` assumptions.
- Create payload serialization containing only backend Create DTO fields.
- Patch payload serialization containing only backend Update DTO fields and preserving null clears.
- Hiding duplicated structure selectors while keeping academic year, term, and target selection.
- Rejecting an inverted validity date range.
- Rendering custom and default policies with scope keys, nullable caps, reasons, dates, and status.
- Preventing patch actions for default policies.
