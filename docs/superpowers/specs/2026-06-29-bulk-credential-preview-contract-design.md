# Bulk Credential Preview Contract Design

## Goal

Display the complete `POST /settings/users/credentials/bulk-preview` response in the credentials bulk-generation modal without losing skipped-user details or backend reason codes.

## Contract

The backend returns aggregate counts in `totalMatched`, `eligible`, and `skipped`, plus a `skippedReasons` count map. Eligible samples are credential user summaries. Skipped samples are objects containing a credential user summary in `user` and a machine-readable reason in `reason`.

The frontend transport DTO must model the response explicitly and keep the two sample shapes separate:

```ts
interface BulkCredentialPreviewSkippedItemDto {
  user: CredentialUserSummaryDto;
  reason: string;
}

interface BulkCredentialPreviewResponseDto {
  totalMatched: number;
  eligible: number;
  skipped: number;
  skippedReasons: Record<string, number>;
  sample: {
    eligible: CredentialUserSummaryDto[];
    skipped: BulkCredentialPreviewSkippedItemDto[];
  };
}
```

The service mapper flattens both shapes into the modal's view model, marks eligibility explicitly, reads each skipped user's fields from `skipped.user`, and copies `skipped.reason` into `skipReason`:

```ts
interface BulkCredentialPreviewRecipient {
  userId: string;
  fullName: string;
  username?: string | null;
  loginEmail: string;
  contactEmail?: string | null;
  eligible: boolean;
  skipReason?: string | null;
}
```

The frontend transport DTO must model `CredentialUserSummaryDto` with `loginEmail` as the primary login identity. The view model may expose `loginEmail`, but must not require or read a non-existent backend `email` field.

## Modal Presentation

The preview section shows total matched, eligible, and skipped counts. When skipped reasons exist, it shows a translated summary for each reason and its count. The sampled users remain visible in a scrollable list, and every skipped user shows a translated reason.

Known backend reasons include `already_has_password` and `disabled_user`. Unknown reasons must remain visible through a human-readable fallback instead of disappearing or displaying an untranslated empty value.

The Generate action remains disabled when no preview exists, generation is in progress, or the preview reports zero eligible users.

## State Changes

The modal computes a stable payload key from the effective preview request: scope, selected role keys, selected user IDs, selected user types, `includeUsersWithPassword`, and `includeDisabledUsers`. Arrays are sorted before key generation so equivalent payloads produce the same key.

After a successful preview, the page stores that key with the response. The Generate action is enabled only when the current payload key matches the stored preview payload key and the preview contains at least one eligible user. Changing the scope, selected role, or either inclusion checkbox therefore makes the preview stale immediately and disables generation until a new preview succeeds. Closing and reopening the modal clears the preview, its payload key, and any error.

## Alternatives Considered

Displaying aggregate counts only would avoid DTO changes but would hide the backend's actionable explanation for skipped users. Treating eligible and skipped samples as the same DTO is also rejected because it contradicts the backend response and caused the current data loss. Mapping the backend response at the service boundary keeps the modal independent of transport-specific nesting and is the selected approach.

## Verification

Focused tests cover:

- Mapping eligible samples from their direct user-summary shape.
- Mapping skipped samples from `{ user, reason }`, including `loginEmail` and `skipReason`.
- Rendering total matched, eligible, and skipped counts plus translated skipped-reason counts.
- Rendering skipped sample users with translated reasons.
- Preserving unknown reason codes through the fallback label.
- Disabling Generate when `eligible` is zero.
- Disabling Generate when the current selection payload differs from the successfully previewed payload.
