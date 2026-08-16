# Timetable Frontend Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make timetable save, publish, unpublish, and configuration workflows safe under the current backend contract.

**Architecture:** Preserve API response discriminators in typed adapter contracts, normalize each backend source separately, and keep mutation orchestration in useTimetableData. The view owns a stable publish-confirmation fingerprint; configuration dialogs ask the hook for complete config-entry safety data instead of relying on a filtered grid.

**Tech Stack:** Next.js/React, TypeScript, next-intl, Vitest, Testing Library.

## Global Constraints

- Frontend only; do not alter Moazez-Backend or invent API parameters.
- Never issue a bulk save or conflict-check request with zero or more than 1,000 mapped items.
- Never discard an unmappable non-empty draft entry.
- Never suppress a backend conflict unless all contributor entry IDs are present and pending deletion.
- Section scope must disable Unpublish; term, grade, and classroom scopes retain it.
- Treat /validate as advisory allocation/expected-hours data, not config-authoritative publication validation.
- Preserve unrelated dirty-worktree changes.

---

## File structure

- src/features/academics/timetable/services/timetableApiTypes.ts — exact DTOs and discriminated response types.
- src/features/academics/timetable/services/timetableApiAdapter.ts — typed HTTP returns.
- src/features/academics/timetable/services/timetableValidationSummary.ts — source-aware normalizers.
- src/features/academics/timetable/services/timetableSaveMapper.ts — complete draft diagnostics and mapped-payload bounds.
- src/features/academics/timetable/services/timetablePublishFingerprint.ts — deterministic validated-draft fingerprint.
- src/features/academics/timetable/hooks/useTimetableData.ts — complete config-entry loading, action guards, reconciliation, exact-config publish checks.
- src/features/academics/timetable/components/TimetableView.tsx — disabled section unpublish and fingerprint-bound confirmation.
- src/features/academics/timetable/components/TimetableConfigDialog.tsx — pre-mutation configuration safety UI.
- Existing timetable service/hook tests plus a new TimetableConfigDialog.test.tsx.

### Task 1: Type each response source and normalize it safely

**Files:**
- Modify: src/features/academics/timetable/services/timetableApiTypes.ts
- Modify: src/features/academics/timetable/services/timetableApiAdapter.ts
- Modify: src/features/academics/timetable/services/timetableValidationSummary.ts
- Modify: src/features/academics/timetable/types/timetable.ts
- Test: src/features/academics/timetable/services/__tests__/timetableValidationSummary.test.ts
- Test: src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts

**Interfaces:**
- Produces normalizeValidationResponse, normalizeConflictCheckResponse, normalizePersistedConflicts, and normalizePublicationReadiness.
- Produces UI conflict kinds CLASSROOM, TEACHER, ROOM, DUPLICATE, and UNKNOWN.
- Produces typed publish and unpublish adapter return values.

- [ ] **Step 1: Write failing tests**

~~~ts
expect(normalizeConflictCheckResponse({
  conflicts: [{ code: "classroom_conflict", message: "Taken" }],
}).conflicts[0]).toMatchObject({ type: "CLASSROOM" });

expect(normalizePersistedConflicts({
  conflicts: [{ type: "CLASSROOM_SLOT", message: "Taken" }],
}).conflicts[0]).toMatchObject({ type: "CLASSROOM" });

expect(normalizeConflictCheckResponse({
  conflicts: [{ code: "future_code", message: "Backend detail" }],
}).conflicts[0]).toMatchObject({ type: "UNKNOWN", code: "future_code" });
~~~

- [ ] **Step 2: Run the tests to verify failure**

Run: npx vitest run src/features/academics/timetable/services/__tests__/timetableValidationSummary.test.ts src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts

Expected: FAIL because the generic normalizer maps non-room conflicts to TEACHER.

- [ ] **Step 3: Implement exact DTOs and normalizers**

~~~ts
export type TimetableConflictKind =
  | "CLASSROOM" | "TEACHER" | "ROOM" | "DUPLICATE" | "UNKNOWN";

export function normalizeConflictCheckResponse(
  response: TimetableConflictCheckResponse,
): NormalizedConflicts { /* map documented codes only */ }
~~~

Keep each source discriminator intact: proposed checks use code, persisted conflicts use type, completeness uses item status/issues, and publication uses reason code. Unknown values keep their backend code/message.

- [ ] **Step 4: Verify**

Run: npx vitest run src/features/academics/timetable/services/__tests__/timetableValidationSummary.test.ts src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts && npm run typecheck

Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add src/features/academics/timetable/services/timetableApiTypes.ts src/features/academics/timetable/services/timetableApiAdapter.ts src/features/academics/timetable/services/timetableValidationSummary.ts src/features/academics/timetable/types/timetable.ts src/features/academics/timetable/services/__tests__/timetableValidationSummary.test.ts src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts
git commit -m "fix: type timetable response contracts"
~~~

### Task 2: Make draft mapping total and bounded

**Files:**
- Modify: src/features/academics/timetable/services/timetableSaveMapper.ts
- Test: src/features/academics/timetable/services/__tests__/timetableSaveMapper.test.ts

**Interfaces:**
- Produces assertBulkPayloadSize(items, operation), where operation is save or conflict-check.
- Produces a diagnostic for every non-empty unmappable draft slot.

- [ ] **Step 1: Write failing tests**

~~~ts
expect(result.skippedSlots.map(({ reason }) => reason)).toEqual([
  "MISSING_CLASSROOM", "MISSING_PERIOD", "MISSING_TEACHER_ALLOCATION",
]);
expect(() => assertBulkPayloadSize([], "save")).toThrow("at least one");
expect(() => assertBulkPayloadSize(Array.from({ length: 1001 }, item), "conflict-check"))
  .toThrow("1,000");
~~~

- [ ] **Step 2: Run the test to verify failure**

Run: npx vitest run src/features/academics/timetable/services/__tests__/timetableSaveMapper.test.ts

Expected: FAIL because callers only block missing teacher allocation and no bound assertion exists.

- [ ] **Step 3: Implement the mapper guard**

~~~ts
export const BULK_TIMETABLE_ITEM_LIMIT = 1000;

export function assertBulkPayloadSize(
  items: BulkSaveTimetableRequest["items"],
  operation: "save" | "conflict-check",
): void {
  if (items.length < 1 || items.length > BULK_TIMETABLE_ITEM_LIMIT) {
    throw new Error("Timetable " + operation + " requires 1 to 1,000 mapped entries.");
  }
}
~~~

Intentional deletion-only flow remains in the hook; the mapper rejects every empty API payload.

- [ ] **Step 4: Verify and commit**

Run: npx vitest run src/features/academics/timetable/services/__tests__/timetableSaveMapper.test.ts && npx eslint src/features/academics/timetable/services/timetableSaveMapper.ts

~~~bash
git add src/features/academics/timetable/services/timetableSaveMapper.ts src/features/academics/timetable/services/__tests__/timetableSaveMapper.test.ts
git commit -m "fix: prevent partial timetable draft saves"
~~~

### Task 3: Make save and unpublish scope-safe and reconciled

**Files:**
- Modify: src/features/academics/timetable/hooks/useTimetableData.ts
- Modify: src/features/academics/timetable/components/TimetableView.tsx
- Test: src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx

**Interfaces:**
- Produces canUnpublishCurrentScope and unpublishBlockedReason.
- Produces SaveTimetableResult.partialMutation.
- Consumes normalizeConflictCheckResponse.

- [ ] **Step 1: Write failing hook tests**

~~~ts
expect(result.current.canUnpublishCurrentScope).toBe(false); // SECTION
await result.current.saveTimetable(entriesWithMissingPeriod);
expect(mockedCheckConflicts).not.toHaveBeenCalled();
expect(mockedBulkSave).not.toHaveBeenCalled();

mockedDeleteEntry.mockResolvedValueOnce(undefined);
mockedBulkSave.mockRejectedValueOnce(new Error("save failed"));
await result.current.saveTimetable(entries);
expect(mockedListEntries).toHaveBeenCalled();
expect(result.current.apiError).toContain("may already have been applied");
~~~

- [ ] **Step 2: Run the hook tests to verify failure**

Run: npx vitest run src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx

Expected: FAIL because section unpublish is allowed, incomplete mappings can be skipped, and partial failure does not force refresh.

- [ ] **Step 3: Implement guards and reconciliation**

~~~ts
const pendingDeleteEntryIds = new Set(entriesToDelete.map(({ id }) => id));
const suppressible = conflict.entryIds.length > 0 &&
  conflict.entryIds.every((id) => pendingDeleteEntryIds.has(id));

if (deletionStarted) {
  await loadTimetableForScope();
}
~~~

Reject every skipped slot before a mutation. Suppress only fully identified, deletion-only persisted conflicts. Preserve mixed, unknown-contributor, and duplicate-proposed conflicts. Skip both conflict check and bulk save only for deletion-only mutations. After the first successful delete, refresh state on both success and failure and never synthesize rollback.

- [ ] **Step 4: Disable section Unpublish in the view**

~~~tsx
<Button disabled={!canUnpublishCurrentScope} title={unpublishBlockedReason}>
  {t("actions.unpublish")}
</Button>
~~~

Do not alter the term/grade/classroom request shape.

- [ ] **Step 5: Verify and commit**

Run: npx vitest run src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx

~~~bash
git add src/features/academics/timetable/hooks/useTimetableData.ts src/features/academics/timetable/components/TimetableView.tsx src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx
git commit -m "fix: guard timetable mutations by scope and draft state"
~~~

### Task 4: Bind publish to exact config entries and an immutable snapshot

**Files:**
- Create: src/features/academics/timetable/services/timetablePublishFingerprint.ts
- Test: src/features/academics/timetable/services/__tests__/timetablePublishFingerprint.test.ts
- Modify: src/features/academics/timetable/hooks/useTimetableData.ts
- Modify: src/features/academics/timetable/components/TimetableView.tsx
- Test: src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx

**Interfaces:**
- Produces createTimetablePublishFingerprint(input): string.
- Produces unfiltered loadConfigEntries(configId).
- Produces exact-config scheduled-hour checks using advisory expected-hour data.

- [ ] **Step 1: Write failing tests**

~~~ts
expect(createTimetablePublishFingerprint(first)).toBe(
  createTimetablePublishFingerprint(sameDataDifferentOrder),
);
expect(createTimetablePublishFingerprint(first)).not.toBe(
  createTimetablePublishFingerprint({ ...first, activeDays: [0, 1] }),
);
openPublishConfirmation();
editTimetableEntry();
expect(screen.queryByText("Confirm publish")).not.toBeInTheDocument();
~~~

- [ ] **Step 2: Run tests to verify failure**

Run: npx vitest run src/features/academics/timetable/services/__tests__/timetablePublishFingerprint.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx

Expected: FAIL because no snapshot exists and publish treats scope-wide validation as config authorization.

- [ ] **Step 3: Implement snapshot and exact-config preflight**

~~~ts
export function createTimetablePublishFingerprint(input: PublishFingerprintInput) {
  return JSON.stringify({
    configId: input.configId,
    scope: input.scope,
    activeDays: [...input.activeDays].sort(),
    periods: instructionalPeriods(input.periods),
    entries: normalizeEntries(input.entries),
    pendingDeletes: [...input.pendingDeleteIds].sort(),
  });
}
~~~

Load all entries for the selected timetableConfigId, exclude cancelled entries, and calculate scheduled hours from that exact set. Use /validate only for expected hours; for sections restrict rows to its classrooms. Close/invalidate confirmation when the live fingerprint differs and require a new preflight.

- [ ] **Step 4: Verify and commit**

Run: npx vitest run src/features/academics/timetable/services/__tests__/timetablePublishFingerprint.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx

~~~bash
git add src/features/academics/timetable/services/timetablePublishFingerprint.ts src/features/academics/timetable/services/__tests__/timetablePublishFingerprint.test.ts src/features/academics/timetable/hooks/useTimetableData.ts src/features/academics/timetable/components/TimetableView.tsx src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx
git commit -m "fix: bind timetable publish to validated config drafts"
~~~

### Task 5: Guard configuration and period changes with complete config data

**Files:**
- Modify: src/features/academics/timetable/hooks/useTimetableData.ts
- Modify: src/features/academics/timetable/components/TimetableView.tsx
- Modify: src/features/academics/timetable/components/TimetableConfigDialog.tsx
- Create: src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx

**Interfaces:**
- Produces getConfigMutationSafety() from unfiltered config entries merged with local drafts and pending deletions.
- Consumes async onBeforeConfigSave(nextActiveDays) and onBeforePeriodSave(periodId, isInstructional) callbacks that return a localized error or null.

- [ ] **Step 1: Write failing dialog tests**

~~~tsx
await user.click(screen.getByLabelText("Friday"));
await user.click(screen.getByRole("button", { name: "Save configuration" }));
expect(mockedUpsertConfig).not.toHaveBeenCalled();
expect(screen.getByText("Move or delete timetable entries on Friday first.")).toBeInTheDocument();

await user.click(screen.getByRole("button", { name: "Update period" }));
expect(mockedUpdatePeriod).not.toHaveBeenCalled();
expect(screen.getByText("This period is used by timetable entries.")).toBeInTheDocument();
~~~

Include an entry in a non-visible classroom to prove the guard does not rely on the filtered grid.

- [ ] **Step 2: Run the tests to verify failure**

Run: npx vitest run src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx

Expected: FAIL because the dialog currently receives only visible entries and mutates directly.

- [ ] **Step 3: Implement complete-data guards**

~~~ts
const persistedEntries = await listEntries({ timetableConfigId: config.id });
const effectiveEntries = mergePersistedEntriesWithDrafts(
  persistedEntries,
  timetableEntries,
  pendingDeleteIds,
).filter((entry) => entry.status !== "CANCELLED");
~~~

Block an active-day removal with any effective entry on that day. Block instructional-to-non-instructional period changes with any effective entry resolving to that period ID. Preserve existing delete-period-in-use handling.

- [ ] **Step 4: Verify and commit**

Run: npx vitest run src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx

~~~bash
git add src/features/academics/timetable/hooks/useTimetableData.ts src/features/academics/timetable/components/TimetableView.tsx src/features/academics/timetable/components/TimetableConfigDialog.tsx src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx
git commit -m "fix: protect timetable configuration changes"
~~~

### Task 6: Integrate feedback and run full verification

**Files:**
- Modify: src/messages/en.json
- Modify: src/messages/ar.json
- Modify: touched timetable files only to consume the new keys.

**Interfaces:**
- Produces localized errors for unsupported section unpublish, unmappable slots, invalid payload bounds, invalidated confirmation, and partial mutation reconciliation.

- [ ] **Step 1: Write failing feedback assertions**

~~~tsx
expect(screen.getByText("Unpublish is unavailable for section timetables.")).toBeInTheDocument();
expect(screen.getByText("Some deletions may already have been applied.")).toBeInTheDocument();
~~~

- [ ] **Step 2: Run affected tests to verify failure**

Run: npx vitest run src/features/academics/timetable

Expected: FAIL until the added message keys are used.

- [ ] **Step 3: Add translations and connect each guarded path**

~~~json
{
  "unpublishSectionUnsupported": "Unpublish is unavailable for section timetables.",
  "partialSaveApplied": "Some deletions may already have been applied. The timetable was refreshed."
}
~~~

Add Arabic equivalents under the existing timetable namespace. Do not edit unrelated translations.

- [ ] **Step 4: Verify all production checks**

Run: npx vitest run src/features/academics/timetable && npm run typecheck && npx eslint src/features/academics/timetable src/messages/en.json src/messages/ar.json && npm run build

Expected: every command exits 0.

- [ ] **Step 5: Inspect and commit**

~~~bash
git diff --check
git diff -- src/features/academics/timetable src/messages/en.json src/messages/ar.json
git add src/features/academics/timetable src/messages/en.json src/messages/ar.json
git commit -m "fix: harden timetable frontend workflow"
~~~

## Plan self-review

- Spec coverage: the six tasks cover scope-safe unpublish, total mapping, deletion-aware conflicts, exact-config validation, immutable confirmations, configuration guards, contract fidelity, payload bounds, reconciliation, translations, and verification.
- Completeness scan: every step specifies its concrete action and verification.
- Type consistency: Task 1's typed normalizers are used by Task 3; Task 2's payload guard is consumed by Tasks 3 and 4; Task 4's fingerprint is consumed by the view; Task 5's callbacks are consumed by the configuration dialog.
