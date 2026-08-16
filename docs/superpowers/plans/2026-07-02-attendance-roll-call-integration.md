# Attendance Roll-Call Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate roll call with the aligned service contract, require intentional session resolution, consume canonical mutation responses, and provide a consistent desktop/mobile attendance workspace.

**Architecture:** Keep policy, timetable, structure, filters, and presentation ownership in `AttendanceRollCallPage`. Move roster-preview and opened-session lifecycle into a focused hook that calls the existing aligned roll-call service and rejects stale responses. Extend the shared workspace only with layout/action composition, then adapt existing roll-call components for rail/drawer and responsive actions.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl, Tailwind CSS, MUI Drawer, Lucide React, Vitest, Testing Library

---

## Contract Audit

The existing service module uses the correct backend calls:

- `fetchEffectivePolicy()` reads aligned policy data through `fetchPolicies()` and resolves hierarchy precedence client-side.
- `fetchRoster()` calls `GET /attendance/roll-call/roster` with `academicYearId`, `termId`, date, mode, period key, scope type, and hierarchy IDs.
- `getOrCreateSession()` calls `POST /attendance/roll-call/session/resolve` with DTO-clean fields.
- `saveSession()` calls `PUT /attendance/roll-call/sessions/:id/entries`.
- `submitSession()` calls `POST /attendance/roll-call/sessions/:id/submit`.
- `unsubmitSession()` calls `POST /attendance/roll-call/sessions/:id/unsubmit`.

The page currently misuses otherwise-correct services in three ways:

1. It resolves or creates a session automatically after selection changes instead of showing the roster preview and waiting for an intentional Open action.
2. It ignores the canonical session and entries returned by `saveSession()`.
3. Its asynchronous selection loads have no stale-response guard.

No roll-call endpoint or serializer replacement is required for this pass.

## File Structure

- Create: `src/features/attendance/roll-call/hooks/useRollCallSessionWorkspace.ts`
  - Owns roster preview, explicit session resolution, entry reconciliation, mutation sequencing, and stale-response protection.
- Create: `src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx`
  - Verifies service orchestration and mutation failure semantics.
- Modify: `src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx`
  - Adds the desktop rail composition and optional state-panel action slot.
- Modify: `src/features/attendance/shared/components/AttendanceStatePanel.tsx`
  - Renders an optional retry/open action supplied by a workspace consumer.
- Modify: `src/features/attendance/roll-call/components/SessionPickerPanel.tsx`
  - Adds rail/drawer variants and applies its existing disabled contract.
- Create: `src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx`
  - Verifies drawer presentation and disabled controls through accessible behavior.
- Modify: `src/features/attendance/roll-call/components/RollCallHeaderBar.tsx`
  - Makes primary and secondary actions responsive and mutation-safe.
- Modify: `src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx`
  - Uses the hook, shared shell, explicit Open action, inline errors, and mobile drawers/actions.
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
  - Adds localized Open attendance, session drawer, preview, and retry/error strings.

---

### Task 1: Establish The Roll-Call Service Baseline

**Files:**
- Verify: `src/features/attendance/roll-call/services/attendanceRollCallService.ts`
- Test: `src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts`

- [ ] **Step 1: Run the existing service contract tests**

Run:

```bash
npm run test:run -- src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts
```

Expected: PASS. The output should cover roster, resolve, bulk save, submit, unsubmit, draft entry update, correction, session list, and session detail.

- [ ] **Step 2: Confirm the page imports only aligned roll-call services**

Run:

```bash
rg -n "fetchRoster|getOrCreateSession|saveSession|submitSession|unsubmitSession|upsertEntry" src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx
```

Expected: the page imports the five bulk-workflow functions and does not call `upsertEntry()` for routine marking.

- [ ] **Step 3: Preserve the verified service boundary**

Do not modify `attendanceRollCallService.ts` unless the focused test exposes a contract failure. The implementation work belongs in page orchestration.

---

### Task 2: Build A Tested Session Workspace Hook

**Files:**
- Create: `src/features/attendance/roll-call/hooks/useRollCallSessionWorkspace.ts`
- Create: `src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx`

- [ ] **Step 1: Write failing tests for preview and explicit open**

Mock the service module and use `renderHook`. Assert a valid selection automatically calls `fetchRoster()` but does not call `getOrCreateSession()` until `openSession()` is invoked:

```tsx
const selection = {
  yearId: "year-1",
  termId: "term-1",
  date: "2026-02-10",
  scopeType: "CLASSROOM" as const,
  scopeIds: { classroomId: "classroom-1" },
  mode: "PERIOD" as const,
  periodId: "period-1",
  periodIndex: 1,
  periodNameAr: "الحصة الأولى",
  periodNameEn: "Period 1",
  enabled: true,
};

mockedFetchRoster.mockResolvedValue([student]);
mockedGetOrCreateSession.mockResolvedValue({ session, entries: [] });

const { result } = renderHook(() => useRollCallSessionWorkspace(selection));
await waitFor(() => expect(result.current.roster).toEqual([student]));
expect(mockedGetOrCreateSession).not.toHaveBeenCalled();

await act(async () => result.current.openSession());
expect(mockedGetOrCreateSession).toHaveBeenCalledWith({
  yearId: "year-1",
  termId: "term-1",
  date: "2026-02-10",
  scopeType: "CLASSROOM",
  scopeIds: { classroomId: "classroom-1" },
  mode: "PERIOD",
  periodId: "period-1",
  periodIndex: 1,
  periodNameAr: "الحصة الأولى",
  periodNameEn: "Period 1",
});
```

Also assert that the opened entry list contains an `UNMARKED` local entry for roster students omitted from the server entry array.

- [ ] **Step 2: Write failing tests for stale previews**

Use deferred promises for two selections. Resolve the newer request first, then the older request. Assert that the hook retains the newer roster:

```tsx
rerender({ selection: newerSelection });
newer.resolve([newStudent]);
await waitFor(() => expect(result.current.roster).toEqual([newStudent]));

older.resolve([oldStudent]);
await waitFor(() => expect(result.current.roster).toEqual([newStudent]));
```

- [ ] **Step 3: Write failing tests for Save and Submit sequencing**

Cover canonical Save state:

```tsx
mockedSaveSession.mockResolvedValue({
  session: { ...session, updatedAt: "2026-02-10T09:00:00.000Z" },
  entries: [savedEntry],
});

await act(async () => result.current.saveDraft());
expect(result.current.entries).toEqual([savedEntry]);
expect(result.current.originalEntries).toEqual([savedEntry]);
expect(result.current.isDirty).toBe(false);
```

For Submit, assert `saveSession()` runs before `submitSession()`. If Save rejects, `submitSession()` must not run. If Save succeeds and Submit rejects, the hook must retain the saved entries, a clean baseline, and a draft session.

- [ ] **Step 4: Run the hook tests and verify failure**

Run:

```bash
npm run test:run -- src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 5: Implement the hook contract**

Use this public interface:

```ts
interface RollCallSelection {
  yearId?: string;
  termId?: string;
  date: string;
  scopeType: AttendanceScopeType;
  scopeIds: AttendanceScopeIds;
  mode?: AttendanceSessionMode;
  periodId?: string;
  periodIndex?: number;
  periodNameAr?: string;
  periodNameEn?: string;
  enabled: boolean;
}

interface RollCallSessionWorkspace {
  roster: RosterStudent[];
  session: AttendanceSession | null;
  entries: AttendanceEntry[];
  originalEntries: AttendanceEntry[];
  isDirty: boolean;
  isPreviewLoading: boolean;
  isOpening: boolean;
  isSaving: boolean;
  loadError: Error | null;
  setEntries: Dispatch<SetStateAction<AttendanceEntry[]>>;
  retryPreview: () => void;
  openSession: () => Promise<void>;
  saveDraft: () => Promise<SessionWithEntries>;
  submitDraft: () => Promise<AttendanceSession>;
  unsubmit: () => Promise<AttendanceSession>;
  resetDraft: () => void;
}
```

Build deterministic local entries:

```ts
function reconcileEntries(
  sessionId: string,
  roster: RosterStudent[],
  serverEntries: AttendanceEntry[],
): AttendanceEntry[] {
  const byStudentId = new Map(serverEntries.map((entry) => [entry.studentId, entry]));
  return roster.map((student) =>
    byStudentId.get(student.id) ?? {
      id: `${sessionId}:${student.id}`,
      sessionId,
      studentId: student.id,
      status: "UNMARKED",
      updatedAt: "",
    },
  );
}
```

Use an incrementing request generation in the preview effect:

```ts
const previewGeneration = useRef(0);
const [retryToken, setRetryToken] = useState(0);
const selectionKey = JSON.stringify({
  yearId: selection.yearId,
  termId: selection.termId,
  date: selection.date,
  scopeType: selection.scopeType,
  scopeIds: selection.scopeIds,
  mode: selection.mode,
  periodId: selection.periodId,
});

useEffect(() => {
  const generation = ++previewGeneration.current;
  setSession(null);
  setEntries([]);
  setOriginalEntries([]);

  if (!selection.enabled || !selection.yearId || !selection.termId || !selection.mode) {
    setRoster([]);
    setLoadError(null);
    setIsPreviewLoading(false);
    return;
  }

  setIsPreviewLoading(true);
  setLoadError(null);
  fetchRoster(selection.scopeType, selection.scopeIds, {
    yearId: selection.yearId,
    termId: selection.termId,
    date: selection.date,
    mode: selection.mode,
    periodKey: selection.periodId,
  })
    .then((nextRoster) => {
      if (generation === previewGeneration.current) setRoster(nextRoster);
    })
    .catch((error: unknown) => {
      if (generation === previewGeneration.current) {
        setRoster([]);
        setLoadError(error instanceof Error ? error : new Error("roll-call-preview-failed"));
      }
    })
    .finally(() => {
      if (generation === previewGeneration.current) setIsPreviewLoading(false);
    });
}, [selectionKey, retryToken]);

const retryPreview = useCallback(() => setRetryToken((value) => value + 1), []);
```

`openSession()` calls `getOrCreateSession()` only after validating required selection fields, reconciles entries, and sets the baseline. `saveDraft()` applies the server response; if a compatibility response has no entries while the roster is non-empty, reconcile the entries sent in the request instead. `submitDraft()` awaits `saveDraft()` before calling `submitSession()` so failed submission leaves the saved clean draft in state.

- [ ] **Step 6: Run the hook tests and verify pass**

Run:

```bash
npm run test:run -- src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the tested orchestration**

```bash
git add src/features/attendance/roll-call/hooks/useRollCallSessionWorkspace.ts src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx
git commit -m "feat: add roll-call session workspace state"
```

---

### Task 3: Extend The Shared Workspace For A Roll-Call Rail

**Files:**
- Modify: `src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx`
- Modify: `src/features/attendance/shared/components/AttendanceStatePanel.tsx`

- [ ] **Step 1: Add the rail composition**

```tsx
interface AttendanceWorkspaceRailProps {
  rail: ReactNode;
  main: ReactNode;
  className?: string;
}

export function AttendanceWorkspaceRail({ rail, main, className = "" }: AttendanceWorkspaceRailProps) {
  return (
    <div className={`flex min-h-0 flex-1 gap-4 ${className}`.trim()}>
      <aside className="hidden w-80 shrink-0 lg:flex">{rail}</aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{main}</div>
    </div>
  );
}
```

- [ ] **Step 2: Add an optional state action slot**

Extend `AttendanceStatePanel` and `AttendanceWorkspaceState` with `action?: ReactNode`, forward it, and render:

```tsx
{action ? <div className="flex justify-center pt-1">{action}</div> : null}
```

- [ ] **Step 3: Run scoped checks**

```bash
npx eslint src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx src/features/attendance/shared/components/AttendanceStatePanel.tsx
npm run typecheck
```

Expected: both commands pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx src/features/attendance/shared/components/AttendanceStatePanel.tsx
git commit -m "feat: add attendance workspace rail"
```

---

### Task 4: Make Session Selection Work In A Drawer

**Files:**
- Modify: `src/features/attendance/roll-call/components/SessionPickerPanel.tsx`
- Create: `src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx`

- [ ] **Step 1: Write failing behavior tests**

Render with `variant="drawer"` and `disabled`. Assert ScopePicker and DatePicker receive `disabled`, previous/next buttons are disabled, and period buttons are disabled. Mock child pickers through public props:

```tsx
vi.mock("@/features/attendance/policies/components/ScopePicker", () => ({
  default: ({ disabled }: { disabled?: boolean }) => (
    <button type="button" disabled={disabled}>Scope control</button>
  ),
}));

vi.mock("@/components/ui/input/DatePicker", () => ({
  default: ({ disabled }: { disabled?: boolean }) => (
    <button type="button" disabled={disabled}>Date control</button>
  ),
}));
```

- [ ] **Step 2: Run the test and verify failure**

```bash
npm run test:run -- src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx
```

Expected: FAIL because `variant` is not supported and `disabled` is not applied.

- [ ] **Step 3: Implement variants and disabled behavior**

Add `variant?: "rail" | "drawer"`, default it to `"rail"`, and use:

```tsx
const frameClassName = variant === "rail"
  ? "flex h-full w-full flex-col rounded-lg border bg-[var(--background)]"
  : "flex h-full w-full flex-col bg-[var(--background)]";
```

Pass `disabled` to `ScopePicker` and `DatePicker`. Disable period navigation when `disabled` or bounds prevent movement. Add `disabled={disabled}` and `aria-pressed={isSelected}` to each period button. Remove manual side-border styles.

- [ ] **Step 4: Run the test and verify pass**

```bash
npm run test:run -- src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/attendance/roll-call/components/SessionPickerPanel.tsx src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx
git commit -m "feat: support mobile roll-call session selection"
```

---

### Task 5: Integrate The Page With Preview, Open, And Canonical Saves

**Files:**
- Modify: `src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx`
- Modify: `src/features/attendance/roll-call/components/RollCallHeaderBar.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Add translations**

Add matching `attendance.rollCall.workspace` keys in both locales:

```json
"workspace": {
  "openSession": "Open attendance",
  "openSessionDescription": "Review the roster, then open attendance to start marking.",
  "chooseSession": "Choose a session",
  "chooseSessionDescription": "Select a complete scope, date, and period to preview the roster.",
  "sessionAction": "Session",
  "retry": "Retry",
  "previewError": "The roster could not be loaded.",
  "openError": "Attendance could not be opened.",
  "submitError": "Attendance was saved, but submission failed. Try submitting again."
}
```

Use these values in `ar.json` and preserve its existing UTF-8 content:

```json
"workspace": {
  "openSession": "فتح سجل الحضور",
  "openSessionDescription": "راجع قائمة الطلاب، ثم افتح سجل الحضور لبدء التسجيل.",
  "chooseSession": "اختر جلسة حضور",
  "chooseSessionDescription": "اختر النطاق والتاريخ والحصة بالكامل لمعاينة قائمة الطلاب.",
  "sessionAction": "الجلسة",
  "retry": "إعادة المحاولة",
  "previewError": "تعذر تحميل قائمة الطلاب.",
  "openError": "تعذر فتح سجل الحضور.",
  "submitError": "تم حفظ الحضور، لكن تعذر الإرسال. حاول الإرسال مرة أخرى."
}
```

- [ ] **Step 2: Replace page-owned session lifecycle state with the hook**

```tsx
const periodData = periods.find((period) => period.id === selectedPeriodId);
const sessionSelection = useMemo(() => ({
  yearId: termContext.yearId ?? undefined,
  termId: termContext.termId ?? undefined,
  date,
  scopeType,
  scopeIds,
  mode: policy?.mode,
  periodId: selectedPeriodId ?? undefined,
  periodIndex: periodData?.index,
  periodNameAr: periodData?.nameAr,
  periodNameEn: periodData?.nameEn,
  enabled: Boolean(policy) && isScopeSelectionComplete(scopeType, scopeIds) &&
    (policy?.mode !== "PERIOD" || Boolean(selectedPeriodId)),
}), [date, periodData, policy, scopeIds, scopeType, selectedPeriodId, termContext.termId, termContext.yearId]);

const rollCall = useRollCallSessionWorkspace(sessionSelection);
```

Remove the effect that currently calls both `fetchRoster()` and `getOrCreateSession()`. Replace page-owned roster/session/entry/loading/saving state references with hook fields.

- [ ] **Step 3: Wire explicit mutations**

```tsx
const handleOpenSession = useCallback(async () => {
  try {
    await rollCall.openSession();
    setShowSessionDrawer(false);
  } catch (error) {
    console.error("Failed to open roll-call session:", error);
    showError(t("workspace.openError"));
  }
}, [rollCall, showError, t]);
```

Save calls `rollCall.saveDraft()`. Submit keeps existing validation, then calls `rollCall.submitDraft()`. If submission fails after Save, show `workspace.submitError`. Unsubmit calls `rollCall.unsubmit()`. Reset calls `rollCall.resetDraft()`.

- [ ] **Step 4: Preserve unsaved-selection guards**

Keep existing `checkUnsavedChanges()` wrappers around scope, date, and period changes. Use `rollCall.isDirty` as the source of truth. Do not clear the current draft until discard is confirmed.

- [ ] **Step 5: Make header actions responsive**

Group Save and Submit/Unsubmit as primary actions and make bulk/reset/export actions a wrapping secondary group. Use `min-w-0`, `flex-wrap`, and stable button dimensions. Do not hide Save or Submit in overflow menus.

```tsx
<RollCallHeaderBar
  isDirty={rollCall.isDirty}
  isReadOnly={isReadOnly}
  isSubmitted={isSubmitted}
  canSubmit={Boolean(rollCall.session) && !isReadOnly && !isSubmitted}
  isSaving={rollCall.isSaving}
  termStatus={termContext.termStatus || "open"}
  onSave={handleSave}
  onSubmit={handleSubmit}
  onUnsubmit={() => setShowUnsubmitConfirm(true)}
  onReset={handleReset}
  onExport={() => setShowExportModal(true)}
  onMarkAllPresent={handleMarkAllPresent}
  onClearAll={handleClearAll}
/>
```

- [ ] **Step 6: Run focused verification**

```bash
npm run test:run -- src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx
npm run typecheck
```

Expected: all tests and typecheck pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx src/features/attendance/roll-call/components/RollCallHeaderBar.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: integrate roll-call workspace services"
```

---

### Task 6: Adopt The Shared Shell And Mobile Actions

**Files:**
- Modify: `src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx`

- [ ] **Step 1: Compose the desktop workspace**

```tsx
<AttendanceWorkspaceShell
  readOnlyBanner={isReadOnly ? <AttendanceReadOnlyBanner message={t("readonly_banner")} /> : null}
>
  <AttendanceWorkspaceRail
    rail={<SessionPickerPanel variant="rail" {...sessionPickerProps} />}
    main={mainContent}
  />
</AttendanceWorkspaceShell>
```

Keep breadcrumb, KPIs, filters, and roster table in the main region. Use `AttendanceWorkspaceContentPanel` for preview/session loading and roster content.

- [ ] **Step 2: Add mobile Session and Filter actions**

```tsx
<AttendanceWorkspaceMobileActions columns={2}>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowSessionDrawer(true)}
    leftIcon={<CalendarDays className="h-4 w-4" />}
  >
    {t("workspace.sessionAction")}
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowFiltersDrawer(true)}
    leftIcon={<Filter className="h-4 w-4" />}
    disabled={!rollCall.session}
  >
    {t("filters.openFilters")}
  </Button>
</AttendanceWorkspaceMobileActions>
```

Render the picker in the existing drawer:

```tsx
<AttendanceBottomDrawer isOpen={showSessionDrawer} onClose={() => setShowSessionDrawer(false)}>
  <SessionPickerPanel variant="drawer" {...sessionPickerProps} />
</AttendanceBottomDrawer>
```

- [ ] **Step 3: Standardize workspace states**

Render these mutually exclusive states inside `AttendanceWorkspaceContentPanel`:

- incomplete selection: choose-session state
- preview loading: content-level loader
- preview failure: Retry action calling `rollCall.retryPreview`
- empty roster: existing no-students state
- roster preview without session: Open attendance action calling `handleOpenSession`
- opened session: roster table

Structure, policy, and timetable failures must set page-owned error state and provide a retry callback. Remove console-only failure handling.

- [ ] **Step 4: Run scoped verification**

```bash
npx eslint src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx src/features/attendance/shared/components/AttendanceStatePanel.tsx src/features/attendance/roll-call/hooks/useRollCallSessionWorkspace.ts src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx src/features/attendance/roll-call/components/SessionPickerPanel.tsx src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx src/features/attendance/roll-call/components/RollCallHeaderBar.tsx src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx
npm run test:run -- src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx
```

Expected: scoped lint and focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx
git commit -m "refactor: use attendance shell for roll call"
```

---

### Task 7: Verify Responsive And Failure Behavior

**Files:**
- Verify all changed files

- [ ] **Step 1: Run final automated verification**

```bash
npm run test:run -- src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx
npm run typecheck
npx eslint src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx src/features/attendance/shared/components/AttendanceStatePanel.tsx src/features/attendance/roll-call/hooks/useRollCallSessionWorkspace.ts src/features/attendance/roll-call/hooks/__tests__/useRollCallSessionWorkspace.test.tsx src/features/attendance/roll-call/components/SessionPickerPanel.tsx src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx src/features/attendance/roll-call/components/RollCallHeaderBar.tsx src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx
```

Expected: all commands pass.

- [ ] **Step 2: Start the development server**

```bash
npm run dev
```

Expected: Next.js reports a local URL. If port 3000 is occupied, use the next available port.

- [ ] **Step 3: Verify responsive layouts in Playwright**

Check `375x812`, `768x1024`, `1024x768`, and `1440x900`:

- desktop rail appears only at the intended breakpoint
- mobile Session opens the complete picker
- mobile Filter opens only after a session is open
- no horizontal page overflow exists
- Save and Submit remain visible and do not overlap roster content
- focus outlines are visible
- English and Arabic layouts remain coherent

- [ ] **Step 4: Verify service behavior through the UI**

Using browser network inspection or mocked E2E routes, verify:

1. A valid selection calls roster preview only.
2. Open attendance calls session resolve once.
3. Save sends bulk entries and adopts returned data.
4. Submit sends Save before Submit.
5. Failed Save prevents Submit.
6. Failed Submit leaves a clean draft and displays the specific message.

- [ ] **Step 5: Inspect the final diff and commit verification fixes**

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. The user-owned `docs/moazez_attendance_frontend_contract.md` may remain untracked and must not be staged.

If verification required fixes, stage only roll-call files and commit:

```bash
git add src/features/attendance/roll-call src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx src/features/attendance/shared/components/AttendanceStatePanel.tsx src/messages/en.json src/messages/ar.json
git commit -m "fix: polish roll-call responsive workflow"
```
