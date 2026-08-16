# Policy-Driven Daily Attendance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support backend `DAILY` and `PERIOD` attendance policies across the dashboard, with Roll Call deriving its mode exclusively from the effective policy.

**Architecture:** Keep `AttendancePolicy.mode` as the single decision point. Policy creation owns configuration and validation; Roll Call resolves either one daily session or a selected period session from the effective policy. Timetable access is limited to complete, Period-policy scopes.

**Tech Stack:** Next.js, React, TypeScript, next-intl, Vitest, existing attendance and timetable services.

## Global Constraints

- Backend contracts are the source of truth: `AttendanceMode` is `DAILY | PERIOD`.
- Daily must make no timetable-config request and submit empty `selectedPeriodIds`.
- Period must query only a completed target scope and require valid selected periods.
- Roll Call mode is derived from effective policy; users cannot override it.
- Preserve unrelated working-tree changes and stage only files owned by each task.

---

## File Structure

- `src/features/attendance/policies/utils/policyMode.ts`: canonical Daily/Period predicates.
- `src/features/attendance/policies/components/PolicyWizardDialog.tsx`: mode-aware policy form, period fetching, and validation.
- `src/features/attendance/policies/components/wizard/Step3ModeComputation.tsx`: Daily/Period selector and conditional period UI.
- `src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx`: effective-policy session selection and conditional timetable access.
- `src/features/attendance/roll-call/components/SessionPickerPanel.tsx`: Daily summary versus period picker.
- `src/features/attendance/excuses/components/ExcuseRequestModal.tsx` and `src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx`: no period/timetable behavior in Daily contexts.

### Task 1: Add policy-mode predicates

**Files:**
- Create: `src/features/attendance/policies/utils/policyMode.ts`
- Create: `src/features/attendance/policies/utils/policyMode.test.ts`

**Interfaces:**
- Produces `isDailyAttendancePolicy(policy: Pick<AttendancePolicy, "mode"> | null | undefined): boolean`.
- Produces `isPeriodAttendancePolicy(policy: Pick<AttendancePolicy, "mode"> | null | undefined): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isDailyAttendancePolicy, isPeriodAttendancePolicy } from "./policyMode";

describe("policy mode predicates", () => {
  it("recognizes both backend modes", () => {
    expect(isDailyAttendancePolicy({ mode: "DAILY" })).toBe(true);
    expect(isPeriodAttendancePolicy({ mode: "DAILY" })).toBe(false);
    expect(isPeriodAttendancePolicy({ mode: "PERIOD" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:run -- src/features/attendance/policies/utils/policyMode.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the predicates**

```ts
import type { AttendancePolicy } from "../types";

type PolicyModeSource = Pick<AttendancePolicy, "mode"> | null | undefined;

export const isDailyAttendancePolicy = (policy: PolicyModeSource) =>
  policy?.mode === "DAILY";

export const isPeriodAttendancePolicy = (policy: PolicyModeSource) =>
  policy?.mode === "PERIOD";
```

- [ ] **Step 4: Run the focused test**

Run: `npm run test:run -- src/features/attendance/policies/utils/policyMode.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/attendance/policies/utils/policyMode.ts src/features/attendance/policies/utils/policyMode.test.ts
git commit -m "feat: add attendance policy mode predicates"
```

### Task 2: Make policy creation mode-aware

**Files:**
- Modify: `src/features/attendance/policies/components/PolicyWizardDialog.tsx`
- Modify: `src/features/attendance/policies/components/wizard/Step3ModeComputation.tsx`
- Modify: `src/features/attendance/policies/components/__tests__/PolicyWizardDialog.test.tsx`

**Interfaces:**
- Consumes `isPeriodAttendancePolicy`.
- Daily submits `{ mode: "DAILY", dailyComputationStrategy: "MANUAL", selectedPeriodIds: [] }`.
- Period requires a complete target scope and configured selected periods.

- [ ] **Step 1: Write failing tests**

```ts
it("does not fetch timetable data for DAILY mode", async () => {
  renderWizard();
  await user.click(screen.getByRole("radio", { name: /daily attendance/i }));
  await waitFor(() =>
    expect(timetableMocks.fetchTimetableConfig).not.toHaveBeenCalled(),
  );
});

it("blocks PERIOD mode when the target has no config", async () => {
  timetableMocks.fetchTimetableConfig.mockResolvedValue(null);
  renderWizard({ policy: classroomPeriodPolicy });
  await user.click(screen.getByRole("button", { name: /next/i }));
  expect(await screen.findByText(/no periods configured/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm run test:run -- src/features/attendance/policies/components/__tests__/PolicyWizardDialog.test.tsx`

Expected: FAIL because the wizard forces Period mode.

- [ ] **Step 3: Implement mode-specific form behavior**

```ts
const isPeriodMode = formData.mode === "PERIOD";

useEffect(() => {
  if (!isOpen || !term || !isPeriodMode) {
    setAvailablePeriods([]);
    return;
  }
  void loadAvailablePeriods();
}, [isOpen, isPeriodMode, formData.scopeType, formData.scopeIds, term]);

const handleModeChange = (mode: AttendanceMode) => {
  handleFieldChange("mode", mode);
  if (mode === "DAILY") {
    handleFieldChange("selectedPeriodIds", []);
    handleFieldChange("dailyComputationStrategy", "MANUAL");
    handleFieldChange("absentIfMissedPeriodsCount", null);
  }
};
```

Render mode radio controls in Step 3. Render timetable loading, no-config copy, selected-period controls, and period thresholds only when `mode === "PERIOD"`.

- [ ] **Step 4: Make validation mode-specific**

```ts
if (step === 2 && formData.mode === "PERIOD") {
  if (availablePeriods.length === 0 || formData.selectedPeriodIds.length === 0) {
    newErrors.selectedPeriodIds = tValidation("periodsRequired");
  }
}

if (step === 3 && formData.mode === "PERIOD") {
  // retain threshold-required and threshold-out-of-range checks
}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm run test:run -- src/features/attendance/policies/components/__tests__/PolicyWizardDialog.test.tsx`

Expected: PASS.

```powershell
git add src/features/attendance/policies/components/PolicyWizardDialog.tsx src/features/attendance/policies/components/wizard/Step3ModeComputation.tsx src/features/attendance/policies/components/__tests__/PolicyWizardDialog.test.tsx
git commit -m "feat: support daily attendance policies"
```

### Task 3: Make Roll Call obey the effective policy

**Files:**
- Modify: `src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx`
- Modify: `src/features/attendance/roll-call/components/SessionPickerPanel.tsx`
- Create: `src/features/attendance/roll-call/pages/__tests__/AttendanceRollCallPage.test.tsx`

**Interfaces:**
- Consumes `isPeriodAttendancePolicy`.
- Produces a Daily `RollCallSelection` with no period id and a Period selection requiring a period id.

- [ ] **Step 1: Write the failing test**

```ts
it("opens a DAILY session without a timetable request or period id", async () => {
  policyMocks.fetchEffectivePolicy.mockResolvedValue({ ...dailyPolicy, mode: "DAILY" });
  render(<AttendanceRollCallPage />);
  await completeScopeSelection();
  await user.click(screen.getByRole("button", { name: /open session/i }));

  expect(timetableMocks.fetchTimetableConfig).not.toHaveBeenCalled();
  expect(rollCallMocks.getOrCreateSession).toHaveBeenCalledWith(
    expect.objectContaining({ mode: "DAILY", periodId: undefined }),
  );
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:run -- src/features/attendance/roll-call/pages/__tests__/AttendanceRollCallPage.test.tsx`

Expected: FAIL because Daily state still has period-dependent behavior.

- [ ] **Step 3: Implement policy-derived selection**

```ts
const isPeriodMode = isPeriodAttendancePolicy(policy);

const sessionSelection = useMemo(() => ({
  yearId: termContext.yearId,
  termId: termContext.termId,
  date,
  scopeType,
  scopeIds,
  mode: policy?.mode,
  periodId: isPeriodMode ? selectedPeriodId ?? undefined : undefined,
  enabled: Boolean(scopeComplete && policy && (!isPeriodMode || selectedPeriodId)),
}), [date, isPeriodMode, policy, scopeComplete, scopeIds, scopeType, selectedPeriodId, termContext.termId, termContext.yearId]);
```

For Daily, clear periods and selected period without calling `fetchTimetableConfig`. In `SessionPickerPanel`, render the Daily summary only for `DAILY`; retain period chips and navigation only for `PERIOD`.

- [ ] **Step 4: Run tests and commit**

Run: `npm run test:run -- src/features/attendance/roll-call/pages/__tests__/AttendanceRollCallPage.test.tsx src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx`

Expected: PASS.

```powershell
git add src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx src/features/attendance/roll-call/components/SessionPickerPanel.tsx src/features/attendance/roll-call/pages/__tests__/AttendanceRollCallPage.test.tsx
git commit -m "feat: derive roll call mode from attendance policy"
```

### Task 4: Make excuse and late/early paths Daily-aware

**Files:**
- Modify: `src/features/attendance/excuses/components/ExcuseRequestModal.tsx`
- Modify: `src/features/attendance/excuses/utils/excusePolicyState.ts`
- Modify: `src/features/attendance/excuses/utils/excusePolicyState.test.ts`
- Modify: `src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Daily absence excuses remain date-based and issue no timetable request.
- Period selection and Late/Early controls are available only in Period contexts.

- [ ] **Step 1: Write failing Daily-context tests**

```ts
it("does not load periods for a DAILY absence excuse", async () => {
  policyMocks.fetchPolicies.mockResolvedValue([{ ...dailyPolicy, mode: "DAILY" }]);
  renderExcuseModal({ type: "ABSENCE" });
  await waitFor(() =>
    expect(timetableMocks.fetchTimetableConfig).not.toHaveBeenCalled(),
  );
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:run -- src/features/attendance/excuses/utils/excusePolicyState.test.ts`

Expected: FAIL because period loading is not conditioned on policy mode.

- [ ] **Step 3: Implement conditional behavior**

```ts
const allowsPeriods = isPeriodAttendancePolicy(effectivePolicy);

if (!allowsPeriods) {
  setPeriods([]);
  setForm((current) => ({ ...current, selectedPeriodIds: [] }));
}
```

Only render period controls when `allowsPeriods`. For Daily policy contexts, show localized explanatory copy for unavailable Late/Early actions and skip timetable requests. Keep date-only absence requests available.

- [ ] **Step 4: Run focused tests and commit**

Run: `npm run test:run -- src/features/attendance/excuses src/features/attendance/late-early`

Expected: PASS.

```powershell
git add src/features/attendance/excuses src/features/attendance/late-early src/messages/en.json src/messages/ar.json
git commit -m "feat: make attendance exceptions daily-aware"
```

### Task 5: Full attendance verification

**Files:**
- Modify only files required by failing attendance tests.

- [ ] **Step 1: Run the attendance suite**

Run: `npm run test:run -- src/features/attendance`

Expected: PASS.

- [ ] **Step 2: Run static checks**

Run: `npm run typecheck; npx eslint src/features/attendance/policies src/features/attendance/roll-call src/features/attendance/excuses src/features/attendance/late-early; git diff --check`

Expected: Typecheck succeeds, scoped lint has no new errors, and diff check succeeds.

- [ ] **Step 3: Verify manually**

1. Create a Daily policy and confirm no timetable-config request occurs.
2. Open Roll Call for that scope and confirm one daily session opens without a period picker.
3. Create a Period policy and confirm exactly one completed-target timetable request occurs.
4. Return 404 for the target timetable and confirm Period policy completion is blocked.
5. Create a date-based absence excuse in Daily mode and confirm no timetable request occurs.

- [ ] **Step 4: Commit verification fixes**

```powershell
git add src/features/attendance
git commit -m "test: verify daily attendance policy flows"
```

