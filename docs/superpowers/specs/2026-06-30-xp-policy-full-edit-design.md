# XP Policy Full Edit Design

## Goal

Allow administrators to update XP policies with the same editable data used when creating a policy, matching the backend policy response contract.

## Contract

The backend policy response contains `academicYearId`, `termId`, `scopeType`, `scopeKey`, `dailyCap`, `weeklyCap`, `cooldownMinutes`, `allowedReasons`, `startsAt`, `endsAt`, `isActive`, `isDefault`, timestamps, and ID fields. Frontend editing must preserve that model and submit all backend-supported mutable fields instead of only cap fields.

`PatchXpPolicyPayload` supports the same editable policy fields as create: academic context, scope, caps, cooldown, allowed reasons, effective dates, and active state. Undefined fields are omitted; explicit null values clear nullable fields.

## UI

`XpPolicyForm` is reused for both create and edit. In edit mode it receives the selected policy, pre-fills the current values, changes button copy to update, and submits a patch payload. Default policies remain read-only.

`XpPolicyTable` replaces inline cap patch controls with an Edit action for non-default policies. The page owns the edit modal, calls `patchXpPolicy`, refreshes the list, and keeps create behavior unchanged.

## Verification

Tests cover full patch serialization, edit prefill, full edit submission, default policies hiding edit, and unchanged create behavior.
