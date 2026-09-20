# Timetable Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the School Dashboard timetable feature consume the current backend timetable contract exactly, especially for inherited schedules, permissions, error codes, config requests, and delete responses.

**Architecture:** Add one pure normalization service at the timetable dashboard response boundary. The timetable hook will consume its effective-config-only result, while permission, error, and request/response type corrections remain in their existing focused modules.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Axios, next-intl, Vitest, Testing Library, ESLint.

**Spec:** `docs/superpowers/specs/2026-09-17-timetable-contract-alignment-design.md`

## Global Constraints

- Keep the backend repository and API contract unchanged.
- Work only on branch `fix/timetable-contract-alignment` in the isolated timetable contract worktree.
- Use Node.js `v22.23.1` and npm `10.9.8`.
- Run `clean-code-guard` after every production-code change and before each task commit.
- Run `test-guard` after every test-code change and before each task commit.
- Do not run the full test suite without explicit owner approval.
- Do not modify the user's unrelated DateTimePicker worktree changes.
- Do not redesign timetable UI or introduce a runtime schema-validation dependency.
- Use one PowerShell execution gate (`& { ... }`) for every command group.

## File Structure

- Create `src/features/academics/timetable/services/timetableDashboardContract.ts`
  - Purely selects effective-config periods/entries and resolves dashboard scope IDs.
- Create `src/features/academics/timetable/services/__tests__/timetableDashboardContract.test.ts`
  - Covers mixed-config selection and every supported `scopeKey` form.
- Modify `src/features/academics/timetable/hooks/useTimetableData.ts`
  - Uses normalized inherited dashboard data.
- Modify `src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx`
  - Proves unrelated config records do not enter inherited state.
- Modify `src/features/academics/timetable/services/timetableApiTypes.ts`
  - Matches dashboard summary fields and delete response shapes.
- Modify `src/hooks/usePermissions.ts`
  - Aligns timetable navigation with backend dashboard permissions.
- Modify `src/hooks/__tests__/usePermissions.test.ts`
  - Locks the navigation permission contract.
- Modify `src/features/academics/timetable/services/timetableErrorHandling.ts`
  - Adds missing room scheduling error codes.
- Modify `src/features/academics/timetable/services/__tests__/timetableErrorHandling.test.ts`
  - Locks friendly fallback messages for both errors.
- Modify `src/messages/en.json` and `src/messages/ar.json`
  - Adds localized timetable room error copy.
- Create `src/messages/__tests__/timetableTranslations.test.ts`
  - Verifies both locale keys exist.
- Modify `src/features/academics/timetable/services/timetableConfigService.ts`
  - Requires `academicYearId` and removes request paths that can omit it.
- Modify `src/features/academics/timetable/services/timetableApiAdapter.ts`
  - Returns the backend delete response type.
- Modify `src/features/academics/timetable/services/timetablePeriodsService.ts`
  - Returns the backend period-delete response type.
- Modify timetable adapter, period service, and config service tests to document the corrected contracts.

---

### Task 1: Effective Dashboard Contract Normalization

**Files:**
- Create: `src/features/academics/timetable/services/timetableDashboardContract.ts`
- Create: `src/features/academics/timetable/services/__tests__/timetableDashboardContract.test.ts`

**Interfaces:**
- Consumes: `TimetableDashboardItemDto`, `TimetableDashboardConfigSummaryDto`, `BackendTimetablePeriodDto`, and `BackendTimetableEntryDto` from `timetableApiTypes.ts`.
- Produces:
  - `EffectiveDashboardTimetable`
  - `resolveEffectiveDashboardTimetable(item: TimetableDashboardItemDto): EffectiveDashboardTimetable | null`
  - `dashboardConfigScopeId(config: TimetableDashboardConfigSummaryDto): string | undefined`

- [ ] **Step 1: Install the isolated worktree dependencies and confirm the approved runtime**

Run:

```powershell
& {
  node --version
  npm --version
  npm ci
}
```

Expected: Node prints `v22.23.1`, npm prints `10.9.8`, and `npm ci` completes without changing tracked files.

- [ ] **Step 2: Write the failing normalization tests**

Create `timetableDashboardContract.test.ts` with complete DTO fixtures and these assertions:

```ts
import { describe, expect, it } from "vitest";
import {
  dashboardConfigScopeId,
  resolveEffectiveDashboardTimetable,
} from "@/features/academics/timetable/services/timetableDashboardContract";
import type {
  BackendTimetableEntryDto,
  BackendTimetablePeriodDto,
  TimetableDashboardConfigSummaryDto,
  TimetableDashboardItemDto,
} from "@/features/academics/timetable/services/timetableApiTypes";

const effectiveConfig: TimetableDashboardConfigSummaryDto = {
  id: "grade-config",
  name: "Grade timetable",
  scopeType: "grade",
  scopeKey: "grade:grade-1",
  stageId: "stage-1",
  status: "active",
  activeDays: [0, 1, 2, 3, 4],
};

const period = (
  id: string,
  timetableConfigId: string,
): BackendTimetablePeriodDto => ({
  id,
  timetableConfigId,
  index: 1,
  label: id,
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
});

const entry = (
  id: string,
  timetableConfigId: string,
): BackendTimetableEntryDto => ({
  id,
  timetableConfigId,
  periodId: `${id}-period`,
  dayOfWeek: 1,
  period: {
    id: `${id}-period`,
    index: 1,
    label: "Period 1",
    startTime: "08:00",
    endTime: "08:45",
  },
  classroom: { id: "classroom-1", nameAr: "فصل", nameEn: "Classroom" },
  subject: { id: "subject-1", nameAr: "مادة", nameEn: "Subject", code: null },
  teacher: { userId: "teacher-1", fullName: "Teacher One" },
  room: null,
  teacherSubjectAllocationId: "allocation-1",
  notes: null,
  status: "active",
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
});

const dashboardItem = (
  overrides: Partial<TimetableDashboardItemDto> = {},
): TimetableDashboardItemDto => ({
  classroomId: "classroom-1",
  classroom: { id: "classroom-1", nameAr: "فصل", nameEn: "Classroom" },
  gradeId: "grade-1",
  grade: { id: "grade-1", nameAr: "صف", nameEn: "Grade" },
  effectiveConfig,
  configs: [effectiveConfig],
  periods: [period("effective-period", "grade-config")],
  entries: [entry("effective-entry", "grade-config")],
  ...overrides,
});

describe("resolveEffectiveDashboardTimetable", () => {
  it("returns null when the backend has no effective config", () => {
    expect(
      resolveEffectiveDashboardTimetable(
        dashboardItem({ effectiveConfig: null }),
      ),
    ).toBeNull();
  });

  it("keeps only periods and entries owned by the effective config", () => {
    const resolved = resolveEffectiveDashboardTimetable(
      dashboardItem({
        periods: [
          period("effective-period", "grade-config"),
          period("draft-period", "classroom-draft"),
        ],
        entries: [
          entry("effective-entry", "grade-config"),
          entry("draft-entry", "classroom-draft"),
        ],
      }),
    );

    expect(resolved).toEqual({
      config: effectiveConfig,
      periods: [expect.objectContaining({ id: "effective-period" })],
      entries: [expect.objectContaining({ id: "effective-entry" })],
    });
  });
});

describe("dashboardConfigScopeId", () => {
  it.each([
    ["term", "term:term-1", undefined, "term-1"],
    ["stage", "stage:stage-1", "stage-1", "stage-1"],
    ["grade", "grade:grade-1", undefined, "grade-1"],
    ["section", "section:section-1", undefined, "section-1"],
    ["classroom", "classroom:classroom-1", undefined, "classroom-1"],
  ])(
    "resolves %s scope identity",
    (scopeType, scopeKey, stageId, expectedId) => {
      expect(
        dashboardConfigScopeId({
          ...effectiveConfig,
          scopeType,
          scopeKey,
          stageId: stageId ?? null,
        }),
      ).toBe(expectedId);
    },
  );

  it.each([
    ["grade", "section:grade-1"],
    ["grade", "grade:"],
    ["grade", "grade:grade-1:extra"],
    ["grade", "missing-separator"],
  ])("rejects malformed %s scope key %s", (scopeType, scopeKey) => {
    expect(
      dashboardConfigScopeId({ ...effectiveConfig, scopeType, scopeKey }),
    ).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the new test and verify the missing module failure**

Run:

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableDashboardContract.test.ts
}
```

Expected: FAIL because `timetableDashboardContract.ts` does not exist.

- [ ] **Step 4: Implement the pure normalization service**

Create `timetableDashboardContract.ts`:

```ts
import type {
  BackendTimetableEntryDto,
  BackendTimetablePeriodDto,
  TimetableDashboardConfigSummaryDto,
  TimetableDashboardItemDto,
} from "@/features/academics/timetable/services/timetableApiTypes";

export interface EffectiveDashboardTimetable {
  config: TimetableDashboardConfigSummaryDto;
  periods: BackendTimetablePeriodDto[];
  entries: BackendTimetableEntryDto[];
}

export function resolveEffectiveDashboardTimetable(
  item: TimetableDashboardItemDto,
): EffectiveDashboardTimetable | null {
  const config = item.effectiveConfig;
  if (!config) return null;

  return {
    config,
    periods: item.periods.filter(
      (period) => period.timetableConfigId === config.id,
    ),
    entries: item.entries.filter(
      (entry) => entry.timetableConfigId === config.id,
    ),
  };
}

export function dashboardConfigScopeId(
  config: TimetableDashboardConfigSummaryDto,
): string | undefined {
  if (config.scopeType.toUpperCase() === "STAGE" && config.stageId) {
    return config.stageId;
  }

  const keyParts = config.scopeKey.split(":");
  if (keyParts.length !== 2) return undefined;

  const [scopePrefix, scopeId] = keyParts;
  if (
    scopePrefix.toUpperCase() !== config.scopeType.toUpperCase() ||
    !scopeId
  ) {
    return undefined;
  }

  return scopeId;
}
```

- [ ] **Step 5: Run the focused test**

Run:

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableDashboardContract.test.ts
}
```

Expected: PASS.

- [ ] **Step 6: Apply the test and clean-code guards**

Run `test-guard` against the new test file and `clean-code-guard` against the new service. Address every substantive finding, then rerun the focused test.

- [ ] **Step 7: Commit the normalization boundary**

```powershell
& {
  git add -- src/features/academics/timetable/services/timetableDashboardContract.ts src/features/academics/timetable/services/__tests__/timetableDashboardContract.test.ts
  git commit -m "fix(timetable): normalize effective dashboard data"
}
```

---

### Task 2: Use Normalized Data in Inherited Timetable State

**Files:**
- Modify: `src/features/academics/timetable/hooks/useTimetableData.ts:199-220,515-550`
- Modify: `src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx:450-500`
- Modify: `src/features/academics/timetable/services/timetableApiTypes.ts:92-103`

**Interfaces:**
- Consumes: `resolveEffectiveDashboardTimetable` and `dashboardConfigScopeId` from Task 1.
- Produces: inherited hook state whose `periods`, `timetableEntries`, `allTermEntries`, and `resolvedConfig.source.id` all describe only the backend-selected effective config.

- [ ] **Step 1: Strengthen the inherited hook test with unrelated dashboard records**

Update the existing inherited timetable test so its backend response uses a grade effective config with only the fields actually returned by the backend summary:

```ts
effectiveConfig: {
  id: "grade-config",
  name: "Grade timetable",
  scopeType: "grade",
  scopeKey: "grade:grade-1",
  stageId: "stage-1",
  status: "active",
  activeDays: [0, 1, 2, 3, 4],
},
periods: [
  { ...backendPeriod, id: "grade-period", timetableConfigId: "grade-config" },
  {
    ...backendPeriod,
    id: "unrelated-period",
    timetableConfigId: "classroom-draft",
  },
],
entries: [
  {
    ...backendEntry,
    id: "grade-entry",
    timetableConfigId: "grade-config",
  },
  {
    ...backendEntry,
    id: "unrelated-entry",
    timetableConfigId: "classroom-draft",
  },
],
```

Assert the effective-only state:

```ts
expect(result.current.workspaceState).toMatchObject({
  mode: "inherited",
  displayConfigId: "grade-config",
  isInherited: true,
  canEdit: false,
});
expect(result.current.resolvedConfig?.source).toEqual({
  scope: "GRADE",
  id: "grade-1",
});
expect(result.current.periods.map((period) => period.id)).toEqual([
  "grade-period",
]);
expect(result.current.timetableEntries.map((entry) => entry.id)).toEqual([
  "grade-entry",
]);
expect(result.current.allTermEntries.map((entry) => entry.id)).toEqual([
  "grade-entry",
]);
```

- [ ] **Step 2: Run the inherited hook test and verify the contract failure**

Run:

```powershell
& {
  npm run test:run -- src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx
}
```

Expected: FAIL because the hook keeps the unrelated period/entry and cannot derive the grade source ID from the backend summary.

- [ ] **Step 3: Narrow the dashboard summary type to the backend response**

In `TimetableDashboardConfigSummaryDto`, keep:

```ts
export interface TimetableDashboardConfigSummaryDto {
  id: string;
  name: string;
  scopeType: string;
  scopeKey: string;
  stageId: string | null;
  status: string;
  activeDays: number[];
}
```

Remove the speculative `gradeId`, `sectionId`, and `classroomId` properties.

- [ ] **Step 4: Integrate normalized inherited data into the hook**

Import Task 1's functions. Update `dashboardConfigToResolvedConfig` to use:

```ts
source: {
  scope: config.scopeType.toUpperCase() as TimetableScopeType,
  id: dashboardConfigScopeId(config),
},
```

Replace the raw inherited branch with this data flow:

```ts
const inheritedTimetable = dashboardItem
  ? resolveEffectiveDashboardTimetable(dashboardItem)
  : null;

if (nextWorkspaceState.isInherited && inheritedTimetable) {
  const publicationResponse = await getPublication(
    nextWorkspaceState.displayConfigId,
  );
  if (requestId !== timetableRequestIdRef.current) return false;

  const mappedEntries = mapBackendEntriesToUi(inheritedTimetable.entries);
  setConfig(null);
  setWorkspaceState(nextWorkspaceState);
  setPeriods(inheritedTimetable.periods);
  setPublication(publicationResponse);
  setConflicts([]);
  setValidationSummary(emptyValidationSummary());
  setTimetableEntries(mappedEntries.entries);
  setAllTermEntries(mappedEntries.entries);
  setConfigs([]);
  setResolvedConfig(
    dashboardConfigToResolvedConfig(
      inheritedTimetable.config,
      inheritedTimetable.periods,
    ),
  );
  return true;
}
```

Do not change the exact-config branch.

- [ ] **Step 5: Run normalization, hook, and attendance timetable tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableDashboardContract.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx src/features/attendance/shared/services/__tests__/effectiveAttendanceTimetable.test.ts
}
```

Expected: PASS.

- [ ] **Step 6: Apply test and clean-code guards**

Run `test-guard` on the changed hook test and `clean-code-guard` on the hook, API type, and normalization changes. Confirm that the new helper remains pure and that no raw inherited collections remain in the hook branch.

- [ ] **Step 7: Commit inherited timetable alignment**

```powershell
& {
  git add -- src/features/academics/timetable/hooks/useTimetableData.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx src/features/academics/timetable/services/timetableApiTypes.ts
  git commit -m "fix(timetable): isolate inherited config records"
}
```

---

### Task 3: Align Timetable Navigation Permission

**Files:**
- Modify: `src/hooks/usePermissions.ts:265`
- Modify: `src/hooks/__tests__/usePermissions.test.ts`

**Interfaces:**
- Consumes: backend controller permission `academics.structure.view`.
- Produces: `navigationPermissionByKey["academics-timetable"] === "academics.structure.view"`.

- [ ] **Step 1: Add the failing navigation permission contract test**

Append:

```ts
describe("timetable navigation permissions", () => {
  it("uses the dashboard timetable read permission required by the backend", () => {
    expect(navigationPermissionByKey["academics-timetable"]).toBe(
      "academics.structure.view",
    );
  });
});
```

- [ ] **Step 2: Run the permission test and verify failure**

```powershell
& {
  npm run test:run -- src/hooks/__tests__/usePermissions.test.ts
}
```

Expected: FAIL because the current value is `academics.timetable.view`.

- [ ] **Step 3: Change only the timetable navigation mapping**

Set:

```ts
"academics-timetable": "academics.structure.view",
```

Do not remove `academics.timetable.view` from the general permission type because app-facing schedule features still use it.

- [ ] **Step 4: Run permission and academics guard tests**

```powershell
& {
  npm run test:run -- src/hooks/__tests__/usePermissions.test.ts src/features/academics/components/__tests__/AcademicsPermissionGuard.test.tsx
}
```

Expected: PASS.

- [ ] **Step 5: Apply test and clean-code guards**

Run `test-guard` on `usePermissions.test.ts` and `clean-code-guard` on `usePermissions.ts`. Confirm no unrelated navigation permissions changed.

- [ ] **Step 6: Commit permission alignment**

```powershell
& {
  git add -- src/hooks/usePermissions.ts src/hooks/__tests__/usePermissions.test.ts
  git commit -m "fix(timetable): align navigation permission"
}
```

---

### Task 4: Complete Timetable Room Error Handling and Translations

**Files:**
- Modify: `src/features/academics/timetable/services/timetableErrorHandling.ts:9-79`
- Modify: `src/features/academics/timetable/services/__tests__/timetableErrorHandling.test.ts:12-33`
- Modify: `src/messages/en.json:6914-6939`
- Modify: `src/messages/ar.json:6665-6690`
- Create: `src/messages/__tests__/timetableTranslations.test.ts`

**Interfaces:**
- Consumes: backend error codes `academics.timetable.room_inactive` and `academics.timetable.room_capacity_insufficient`.
- Produces: typed error-code support, English fallback messages, and `academics.timetable.errors` translations in English and Arabic.

- [ ] **Step 1: Add failing service and translation tests**

Extend the existing `it.each` table with:

```ts
[
  "academics.timetable.room_inactive",
  "The selected room is not available for timetable scheduling.",
],
[
  "academics.timetable.room_capacity_insufficient",
  "The selected room does not have enough capacity for this classroom.",
],
```

Create `timetableTranslations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

describe("timetable translations", () => {
  it.each(["room_inactive", "room_capacity_insufficient"] as const)(
    "defines %s in both locales",
    (errorKey) => {
      expect(en.academics.timetable.errors[errorKey]).toEqual(
        expect.any(String),
      );
      expect(ar.academics.timetable.errors[errorKey]).toEqual(
        expect.any(String),
      );
    },
  );
});
```

- [ ] **Step 2: Run both tests and verify failure**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableErrorHandling.test.ts src/messages/__tests__/timetableTranslations.test.ts
}
```

Expected: FAIL because both codes and locale keys are missing.

- [ ] **Step 3: Add the codes and English fallback messages**

Add both codes to `TimetableErrorCode` and these entries to `timetableErrorMessages`:

```ts
"academics.timetable.room_inactive":
  "The selected room is not available for timetable scheduling.",
"academics.timetable.room_capacity_insufficient":
  "The selected room does not have enough capacity for this classroom.",
```

- [ ] **Step 4: Add matching next-intl messages**

Under `academics.timetable.errors`, add:

English values:

```json
"room_inactive": "The selected room is not available for timetable scheduling.",
"room_capacity_insufficient": "The selected room does not have enough capacity for this classroom."
```

Arabic values:

```json
"room_inactive": "الغرفة المحددة غير متاحة للجدول الدراسي.",
"room_capacity_insufficient": "سعة الغرفة المحددة غير كافية لهذا الفصل."
```

Insert valid JSON properties without adding comments to the JSON files.

- [ ] **Step 5: Run the focused error and translation tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableErrorHandling.test.ts src/messages/__tests__/timetableTranslations.test.ts
}
```

Expected: PASS.

- [ ] **Step 6: Apply test and clean-code guards**

Run `test-guard` on both test files and `clean-code-guard` on the error handler. Validate both JSON files parse through the focused translation test.

- [ ] **Step 7: Commit complete room error handling**

```powershell
& {
  git add -- src/features/academics/timetable/services/timetableErrorHandling.ts src/features/academics/timetable/services/__tests__/timetableErrorHandling.test.ts src/messages/en.json src/messages/ar.json src/messages/__tests__/timetableTranslations.test.ts
  git commit -m "fix(timetable): handle room scheduling errors"
}
```

---

### Task 5: Align Config Request and Delete Response Types

**Files:**
- Modify: `src/features/academics/timetable/services/timetableApiTypes.ts:291-343`
- Modify: `src/features/academics/timetable/services/timetableApiAdapter.ts:149-188`
- Modify: `src/features/academics/timetable/services/timetablePeriodsService.ts:80-82`
- Modify: `src/features/academics/timetable/services/timetableConfigService.ts:27-44,156-276`
- Modify: `src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts:145-261`
- Modify: `src/features/academics/timetable/services/__tests__/timetablePeriodsService.test.ts`
- Verify: `src/features/academics/timetable/services/__tests__/timetableConfigService.test.ts`

**Interfaces:**
- Produces:
  - `TimetableDeleteResponse { ok: boolean }`
  - `deletePeriod(periodId: string): Promise<TimetableDeleteResponse>`
  - `deleteEntry(entryId: string): Promise<TimetableDeleteResponse>`
  - `deleteTimetablePeriod(periodId: string): Promise<TimetableDeleteResponse>`
  - `FetchTimetableConfigParams.academicYearId: string`
  - `FetchTimetableConfigsParams.academicYearId: string`

- [ ] **Step 1: Update delete contract tests to assert backend responses**

In adapter and periods-service tests, mock:

```ts
mockedApiDelete.mockResolvedValueOnce({ ok: true });
```

Capture and assert each result:

```ts
await expect(deletePeriod("period-1")).resolves.toEqual({ ok: true });
await expect(deleteEntry("entry-1")).resolves.toEqual({ ok: true });
await expect(deleteTimetablePeriod("period-1")).resolves.toEqual({ ok: true });
```

These assertions document the runtime response. The production signature correction is verified by the repository typecheck in Step 5 because the current runtime already forwards the Axios value.

- [ ] **Step 2: Add the shared delete response type and update adapters**

In `timetableApiTypes.ts` add:

```ts
export interface TimetableDeleteResponse {
  ok: boolean;
}
```

Use it in both services:

```ts
export const deletePeriod = (
  periodId: string,
): Promise<TimetableDeleteResponse> =>
  apiDelete<TimetableDeleteResponse>(`${BASE}/periods/${periodId}`);

export const deleteEntry = (
  entryId: string,
): Promise<TimetableDeleteResponse> =>
  apiDelete<TimetableDeleteResponse>(`${BASE}/entries/${entryId}`);
```

```ts
export function deleteTimetablePeriod(
  periodId: string,
): Promise<TimetableDeleteResponse> {
  return apiDelete<TimetableDeleteResponse>(`${BASE}/periods/${periodId}`);
}
```

- [ ] **Step 3: Make academic year identity mandatory and remove invalid legacy paths**

Change both request interfaces to:

```ts
export interface FetchTimetableConfigParams {
  academicYearId: string;
  termId: string;
  scopeType?: TimetableScopeType;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export interface FetchTimetableConfigsParams {
  academicYearId: string;
  termId: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}
```

Replace the overload implementation with the single valid signature:

```ts
export async function fetchTimetableConfig(
  params: FetchTimetableConfigParams,
): Promise<TimetableConfig | null> {
  try {
    const configResponse = await apiGet<
      BackendTimetableConfigDto | TimetableConfigEnvelopeDto
    >(
      `${BASE}/config`,
      requestConfig({
        academicYearId: params.academicYearId,
        termId: params.termId,
        scopeType: params.scopeType,
        stageId: params.stageId,
        gradeId: params.gradeId,
        sectionId: params.sectionId,
        classroomId: params.classroomId,
      }),
    );
    const config = unwrapConfig(configResponse);
    const periods = await listTimetablePeriods(config.id);
    return mapBackendConfigToUi(config, periods);
  } catch (error) {
    if (isTimetableConfigNotFound(error)) return null;
    throw error;
  }
}
```

Use the same single-parameter pattern for `fetchTimetableConfigs(params)`. Delete `legacyConfigParams` and both string overloads. Do not change the five existing scoped config requests inside `fetchTimetableConfigs`.

- [ ] **Step 4: Run focused adapter, period, and config service tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts src/features/academics/timetable/services/__tests__/timetablePeriodsService.test.ts src/features/academics/timetable/services/__tests__/timetableConfigService.test.ts
}
```

Expected: PASS.

- [ ] **Step 5: Run typecheck to verify all production callers supply academicYearId and delete signatures compile**

```powershell
& {
  npm run typecheck
}
```

Expected: PASS. Any caller still using a string overload or omitting `academicYearId` must be migrated to the object request with its real academic year ID; do not restore optionality.

- [ ] **Step 6: Apply test and clean-code guards**

Run `test-guard` on the modified adapter and period service tests. Run `clean-code-guard` on all four production service/type files, paying special attention to dead overloads and duplicate API shapes.

- [ ] **Step 7: Commit type contract alignment**

```powershell
& {
  git add -- src/features/academics/timetable/services/timetableApiTypes.ts src/features/academics/timetable/services/timetableApiAdapter.ts src/features/academics/timetable/services/timetablePeriodsService.ts src/features/academics/timetable/services/timetableConfigService.ts src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts src/features/academics/timetable/services/__tests__/timetablePeriodsService.test.ts
  git commit -m "fix(timetable): align API request and delete types"
}
```

---

### Task 6: Final Contract Verification

**Files:**
- Review: every file changed by Tasks 1-5
- Do not modify unrelated files.

**Interfaces:**
- Consumes: all task deliverables.
- Produces: verified, review-ready timetable contract alignment branch.

- [ ] **Step 1: Run the complete affected test set**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableDashboardContract.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx src/features/attendance/shared/services/__tests__/effectiveAttendanceTimetable.test.ts src/hooks/__tests__/usePermissions.test.ts src/features/academics/components/__tests__/AcademicsPermissionGuard.test.tsx src/features/academics/timetable/services/__tests__/timetableErrorHandling.test.ts src/messages/__tests__/timetableTranslations.test.ts src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts src/features/academics/timetable/services/__tests__/timetablePeriodsService.test.ts src/features/academics/timetable/services/__tests__/timetableConfigService.test.ts
}
```

Expected: all selected test files pass.

- [ ] **Step 2: Run lint**

```powershell
& {
  npm run lint
}
```

Expected: PASS with no new warning caused by this task.

- [ ] **Step 3: Run typecheck**

```powershell
& {
  npm run typecheck
}
```

Expected: PASS.

- [ ] **Step 4: Run the production build**

```powershell
& {
  npm run build
}
```

Expected: PASS.

- [ ] **Step 5: Request approval before the full test suite**

Ask the owner whether to run:

```powershell
& {
  npm run test:run
}
```

Do not execute this command until the owner explicitly approves it.

- [ ] **Step 6: Run final clean-code and test guards**

Run `clean-code-guard` across the complete production diff and `test-guard` across the complete test diff. Fix any blocking finding, rerun the affected checks, and keep fixes within the approved contract-alignment scope.

- [ ] **Step 7: Verify the final branch state**

```powershell
& {
  git diff --check origin/main...HEAD
  git status --short --branch
  git log --oneline origin/main..HEAD
}
```

Expected: no whitespace errors, only expected task files changed, and no force push or direct main mutation.
