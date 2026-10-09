# Timetable Term Setup Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-run term timetable setup page and keep the term draft as the editable configuration while stage, grade, section, and classroom selections act only as grid filters.

**Architecture:** A pure setup-status resolver and a focused query hook determine whether the current term is missing a config, missing instructional periods, ready, read-only, or failed to load. A route gate sends management users to a reusable three-step setup wizard, while the timetable data hook always loads the exact `TERM` config in its primary mode and leaves academic selectors responsible only for filtering entries and structure.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, next-intl, Tailwind CSS, existing `src/components/ui` primitives, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-02-timetable-term-setup-flow-design.md`

## Global Constraints

- The default configuration identity is exactly `School + Academic Year + Term` with `scopeType: TERM`.
- A valid `TERM DRAFT` with at least one instructional period is sufficient to enter the timetable workspace.
- Stage, grade, section, and classroom selections are filters and must not change the default editable config.
- Existing scope overrides must remain intact and accessible only through an explicit override action.
- No backend endpoint, database, authentication, deployment, or environment change is authorized.
- Reuse components from `src/components/ui`; do not introduce a parallel component system.
- Preserve Arabic RTL, English LTR, keyboard access, visible labels, focus management, and responsive layout.
- Use the `clean-code-guard` skill after every production-code change and address its findings before committing.
- Use the `test-guard` skill after every test-code change and address its findings before committing.
- Run focused tests, lint, typecheck, and build. Ask the owner before running the full test suite.
- Never push directly to `main`, force push, merge, or deploy.

## File structure

**Create**

- `src/features/academics/timetable/services/timetableSetupStatus.ts` — pure setup-state resolver and discriminated-union types.
- `src/features/academics/timetable/services/__tests__/timetableSetupStatus.test.ts` — resolver transition coverage.
- `src/features/academics/timetable/hooks/useTimetableSetupStatus.ts` — exact term config/period loading, retry, and stale-request protection.
- `src/features/academics/timetable/hooks/__tests__/useTimetableSetupStatus.test.tsx` — hook request and recovery coverage.
- `src/features/academics/timetable/components/TimetableConfigEditor.tsx` — reusable active-day/config editor.
- `src/features/academics/timetable/components/TimetablePeriodsEditor.tsx` — reusable rapid period editor.
- `src/features/academics/timetable/components/TimetableSetupGate.tsx` — loading, redirect, retry, and read-only gate UI.
- `src/features/academics/timetable/components/__tests__/TimetableSetupGate.test.tsx` — gate behavior coverage.
- `src/features/academics/timetable/components/TimetableSetupWizard.tsx` — three-step setup composition and focus management.
- `src/features/academics/timetable/components/__tests__/TimetableSetupWizard.test.tsx` — setup progression and review coverage.
- `src/features/academics/timetable/pages/TimetableSetupPage.tsx` — academic-context and permission integration for setup.
- `src/features/academics/timetable/pages/__tests__/TimetableSetupPage.test.tsx` — page-level context coverage.
- `src/app/[lang]/(dashboard)/academics/(with-context)/timetable/setup/page.tsx` — protected App Router entry point.

**Modify**

- `src/features/academics/timetable/components/TimetableConfigDialog.tsx` — compose the extracted editors instead of owning duplicate forms.
- `src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx` — protect dialog behavior after extraction.
- `src/features/academics/timetable/pages/TimetablePageContent.tsx` — mount the setup gate and preserve query-string filters.
- `src/features/academics/timetable/pages/__tests__/TimetablePageContent.test.tsx` — gate redirect and error behavior.
- `src/features/academics/timetable/hooks/useTimetableData.ts` — always load exact term config in primary workspace mode.
- `src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx` — prove filter changes retain the term config ID.
- `src/features/academics/timetable/components/FilterBar.tsx` — remove implicit scope selection from the normal filter row.
- `src/features/academics/timetable/components/__tests__/FilterBar.test.tsx` — assert filters emit only academic IDs.
- `src/features/academics/timetable/components/TimetableView.tsx` — use the term config, expose settings navigation, and open overrides explicitly.
- `src/features/academics/timetable/components/TimetableSourceBanner.tsx` — describe term-default editing and explicit override behavior.
- `src/features/academics/timetable/components/__tests__/TimetableSourceBanner.test.tsx` — banner semantics.
- `src/messages/ar.json` — Arabic setup, gate, banner, and action copy.
- `src/messages/en.json` — English setup, gate, banner, and action copy.

---

### Task 1: Define the setup status model

**Files:**

- Create: `src/features/academics/timetable/services/timetableSetupStatus.ts`
- Create: `src/features/academics/timetable/services/__tests__/timetableSetupStatus.test.ts`

**Interfaces:**

- Consumes: `BackendTimetableConfigDto` and `BackendTimetablePeriodDto` from `timetableApiTypes.ts`.
- Produces: `resolveTimetableSetupStatus(input: TimetableSetupStatusInput): TimetableSetupStatus`, `isTimetableSetupReady(status): boolean`, and the discriminated union used by the hook and gate.

- [ ] **Step 1: Write the failing resolver tests**

Cover missing config, config with only a non-instructional break, ready draft, ready published config, closed term, missing permission, and load error.

```ts
const config: BackendTimetableConfigDto = {
  id: "term-config",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Term timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "term",
  scopeKey: "term:term-1",
  stageId: null,
  gradeId: null,
  sectionId: null,
  classroomId: null,
  status: "draft",
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

const period: BackendTimetablePeriodDto = {
  id: "period-1",
  timetableConfigId: config.id,
  index: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

const baseInput = (
  overrides: Partial<TimetableSetupStatusInput> = {},
): TimetableSetupStatusInput => ({
  config,
  periods: [period],
  canManage: true,
  termStatus: "open",
  ...overrides,
});

it("requires setup when the exact term config is absent", () => {
  expect(resolveTimetableSetupStatus(baseInput({ config: null }))).toEqual({
    kind: "missing_config",
    config: null,
    periods: [],
  });
});

it("requires an instructional period", () => {
  expect(
    resolveTimetableSetupStatus(
      baseInput({ periods: [{ ...period, isInstructional: false }] }),
    ).kind,
  ).toBe("missing_periods");
});

it("keeps a draft with an instructional period ready", () => {
  expect(resolveTimetableSetupStatus(baseInput()).kind).toBe("ready");
});

it("does not convert a failed read into first-run setup", () => {
  expect(
    resolveTimetableSetupStatus(baseInput({ error: new Error("offline") })).kind,
  ).toBe("error");
});
```

- [ ] **Step 2: Run the resolver test and verify it fails**

Run:

```powershell
& { npm run test:run -- src/features/academics/timetable/services/__tests__/timetableSetupStatus.test.ts }
```

Expected: FAIL because `timetableSetupStatus.ts` does not exist.

- [ ] **Step 3: Implement the discriminated union and pure resolver**

Use this public shape so routing code never infers missing data from a generic null:

```ts
export type TimetableSetupStatus =
  | { kind: "missing_config"; config: null; periods: [] }
  | {
      kind: "missing_periods";
      config: BackendTimetableConfigDto;
      periods: BackendTimetablePeriodDto[];
    }
  | {
      kind: "ready";
      config: BackendTimetableConfigDto;
      periods: BackendTimetablePeriodDto[];
      readOnly: boolean;
    }
  | {
      kind: "read_only";
      readiness: "missing_config" | "missing_periods";
      reason: "closed_term" | "missing_permission";
      config: BackendTimetableConfigDto | null;
      periods: BackendTimetablePeriodDto[];
    }
  | { kind: "error"; error: unknown };

export interface TimetableSetupStatusInput {
  config: BackendTimetableConfigDto | null;
  periods: BackendTimetablePeriodDto[];
  canManage: boolean;
  termStatus: "open" | "closed";
  error?: unknown;
}
```

Resolve `error` first, then readiness, then convert incomplete setup to `read_only` when the term is closed or permission is absent. A ready active/published config returns `kind: "ready"` with `readOnly: true`; a ready draft returns `readOnly` based on term and permission.

- [ ] **Step 4: Apply required quality guards**

Invoke `test-guard` for the new resolver tests, then `clean-code-guard` for the resolver. Apply findings that preserve the approved state model.

- [ ] **Step 5: Run the resolver test and verify it passes**

```powershell
& { npm run test:run -- src/features/academics/timetable/services/__tests__/timetableSetupStatus.test.ts }
```

Expected: PASS.

- [ ] **Step 6: Commit the status model**

```powershell
& {
  git add -- 'src/features/academics/timetable/services/timetableSetupStatus.ts' 'src/features/academics/timetable/services/__tests__/timetableSetupStatus.test.ts'
  git commit -m 'feat(timetable): model term setup readiness'
}
```

---

### Task 2: Load exact term setup status safely

**Files:**

- Create: `src/features/academics/timetable/hooks/useTimetableSetupStatus.ts`
- Create: `src/features/academics/timetable/hooks/__tests__/useTimetableSetupStatus.test.tsx`

**Interfaces:**

- Consumes: `getConfig({ academicYearId, termId, scopeType: "TERM" })`, `listPeriods(configId)`, and `resolveTimetableSetupStatus` from Task 1.
- Produces:

```ts
interface UseTimetableSetupStatusResult {
  status: TimetableSetupStatus | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}
```

- [ ] **Step 1: Write failing hook tests**

```tsx
const termOneConfig = {
  id: "term-config-1",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Term 1 timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "term",
  scopeKey: "term:term-1",
  stageId: null,
  gradeId: null,
  sectionId: null,
  classroomId: null,
  status: "draft",
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
} satisfies BackendTimetableConfigDto;

const params = {
  academicYearId: "year-1",
  termId: "term-1",
  termStatus: "open" as const,
  canManage: true,
  enabled: true,
};

it("always requests the exact term config", async () => {
  const { result } = renderHook(() => useTimetableSetupStatus(params));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(mockedGetConfig).toHaveBeenCalledWith({
    academicYearId: "year-1",
    termId: "term-1",
    scopeType: "TERM",
  });
});

it("ignores a stale response after the term changes", async () => {
  let resolveFirst!: (config: BackendTimetableConfigDto) => void;
  const firstPromise = new Promise<BackendTimetableConfigDto>((resolve) => {
    resolveFirst = resolve;
  });
  mockedGetConfig.mockReturnValueOnce(firstPromise);
  const { rerender, result } = renderHook(
    ({ termId }) => useTimetableSetupStatus({ ...params, termId }),
    { initialProps: { termId: "term-1" } },
  );
  rerender({ termId: "term-2" });
  resolveFirst(termOneConfig);
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.status).not.toMatchObject({ config: termOneConfig });
});
```

Also assert that `academics.timetable.config_not_found` becomes `missing_config`, while unrelated 404/500 errors become `error`, and `reload()` reissues both requests.

- [ ] **Step 2: Run the hook test and verify it fails**

```powershell
& { npm run test:run -- src/features/academics/timetable/hooks/__tests__/useTimetableSetupStatus.test.tsx }
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the hook**

Use a monotonically increasing request ID, matching `useTimetableData`, and avoid calling `listPeriods` when no config exists.

```ts
const requestIdRef = useRef(0);

const reload = useCallback(async () => {
  const requestId = ++requestIdRef.current;
  setIsLoading(true);
  try {
    const config = await exactTermConfig({ academicYearId, termId });
    const periods = config ? await listPeriods(config.id) : [];
    if (requestId !== requestIdRef.current) return;
    setStatus(
      resolveTimetableSetupStatus({
        config,
        periods: listResponseItems(periods),
        canManage,
        termStatus,
      }),
    );
  } catch (error) {
    if (requestId !== requestIdRef.current) return;
    setStatus(
      resolveTimetableSetupStatus({
        config: null,
        periods: [],
        canManage,
        termStatus,
        error,
      }),
    );
  } finally {
    if (requestId === requestIdRef.current) setIsLoading(false);
  }
}, [academicYearId, termId, canManage, termStatus]);
```

Invalidate the active request when inputs become unavailable, and expose no setup status until academic context is ready.

- [ ] **Step 4: Apply required quality guards**

Invoke `test-guard` for the hook tests, then `clean-code-guard` for the hook. Fix race, dependency-array, and accidental fallback findings.

- [ ] **Step 5: Run Tasks 1-2 focused tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableSetupStatus.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableSetupStatus.test.tsx
}
```

Expected: PASS.

- [ ] **Step 6: Commit the setup query hook**

```powershell
& {
  git add -- 'src/features/academics/timetable/hooks/useTimetableSetupStatus.ts' 'src/features/academics/timetable/hooks/__tests__/useTimetableSetupStatus.test.tsx'
  git commit -m 'feat(timetable): load exact term setup status'
}
```

---

### Task 3: Extract reusable config and period editors

**Files:**

- Create: `src/features/academics/timetable/components/TimetableConfigEditor.tsx`
- Create: `src/features/academics/timetable/components/TimetablePeriodsEditor.tsx`
- Modify: `src/features/academics/timetable/components/TimetableConfigDialog.tsx`
- Modify: `src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx`

**Interfaces:**

- Consumes: existing config and period services, validation helpers, `Button`, `Select`, inputs, and backend DTOs.
- Produces two embedded editors used by both the dialog and setup wizard:

```ts
interface TimetableConfigEditorProps {
  academicYearId: string;
  termId: string;
  config: BackendTimetableConfigDto | null;
  entries: TimetableEntry[];
  scope: TimetableScopeSelection;
  allowScopeSelection: boolean;
  fixedName?: string;
  readOnly: boolean;
  locale: string;
  submitLabel: string;
  onSaved: (config: BackendTimetableConfigDto) => Promise<void> | void;
}

interface TimetablePeriodsEditorProps {
  config: BackendTimetableConfigDto;
  periods: BackendTimetablePeriodDto[];
  entries: TimetableEntry[];
  readOnly: boolean;
  locale: string;
  onSaved: () => Promise<void> | void;
}
```

- [ ] **Step 1: Extend dialog tests before extraction**

Add assertions that protect the shared behaviors the extraction must retain:

```tsx
it("locks setup mode to TERM scope", async () => {
  renderDialog({
    mode: "config",
    config: null,
    selectedStageId: "stage-1",
    allowScopeSelection: false,
    fixedName: "First term timetable",
  });
  await userEvent.click(screen.getByRole("button", { name: "config.saveConfig" }));
  expect(upsertBackendTimetableConfig).toHaveBeenCalledWith(
    expect.objectContaining({
      scopeType: "TERM",
      name: "First term timetable",
    }),
  );
  expect(screen.queryByLabelText("config.name")).not.toBeInTheDocument();
});

it("keeps saved-period controls and rapid entry after editor extraction", async () => {
  renderDialog();
  expect(screen.getByText("First period")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "config.addNextPeriod" })).toBeEnabled();
});
```

Add optional `allowScopeSelection` and `fixedName` props to the test helper and dialog, defaulting `allowScopeSelection` to `true` and `fixedName` to undefined for the existing advanced override dialog.

- [ ] **Step 2: Run the dialog test and verify the new setup-mode test fails**

```powershell
& { npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx }
```

Expected: FAIL because `allowScopeSelection` and the reusable editors are not implemented.

- [ ] **Step 3: Extract `TimetableConfigEditor`**

Move config form state, validation, and `upsertBackendTimetableConfig` into the new component. When `fixedName` is provided, do not render a technical name input and submit the localized fixed name. When `allowScopeSelection` is false, do not render the scope selector and always build this payload:

```ts
const payload: UpsertConfigRequest = {
  academicYearId,
  termId,
  scopeType: "TERM",
  name: fixedName ?? name.trim(),
  weekStartDay,
  activeDays,
  status: "DRAFT",
};
```

Preserve entry-in-use active-day validation, localized backend errors, loading disablement, and existing scope selection when `allowScopeSelection` is true.

- [ ] **Step 4: Extract `TimetablePeriodsEditor`**

Move rapid add, edit/cancel, delete protection, status live region, next-index calculation, and period validation into the new component. Keep this successful-add behavior:

```ts
const createdPeriod = await createTimetablePeriodDto({
  timetableConfigId: config.id,
  ...periodPayload,
});
await onSaved();
setPeriodForm((current) => ({
  ...current,
  index: createdPeriod.index + 1,
  label: "",
}));
periodLabelInputRef.current?.focus();
```

- [ ] **Step 5: Reduce `TimetableConfigDialog` to modal composition**

Keep modal open/close behavior and render exactly one extracted editor based on `mode`. Config mode passes the resolved selected scope with `allowScopeSelection`; periods mode requires a non-null config and renders the save-config-first message otherwise.

- [ ] **Step 6: Apply required quality guards**

Invoke `test-guard` for the changed dialog tests, then `clean-code-guard` for both editors and the reduced dialog. Resolve duplicated validation, oversized component, stale-state, and inaccessible label findings.

- [ ] **Step 7: Run dialog and period validation tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx src/features/academics/timetable/services/__tests__/timetablePeriodValidation.test.ts
}
```

Expected: PASS.

- [ ] **Step 8: Commit the reusable editors**

```powershell
& {
  git add -- 'src/features/academics/timetable/components/TimetableConfigEditor.tsx' 'src/features/academics/timetable/components/TimetablePeriodsEditor.tsx' 'src/features/academics/timetable/components/TimetableConfigDialog.tsx' 'src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx'
  git commit -m 'refactor(timetable): share setup editors'
}
```

---

### Task 4: Build the three-step setup wizard

**Files:**

- Create: `src/features/academics/timetable/components/TimetableSetupWizard.tsx`
- Create: `src/features/academics/timetable/components/__tests__/TimetableSetupWizard.test.tsx`
- Modify: `src/features/academics/timetable/components/WizardStepper.tsx`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`

**Interfaces:**

- Consumes: Task 2 hook result, Task 3 editors, `WizardStepper`, `Button`, `Panel`, router navigation, and timetable translations.
- Produces:

```ts
interface TimetableSetupWizardProps {
  academicYearId: string;
  termId: string;
  academicYearName: string;
  termName: string;
  status: TimetableSetupStatus;
  onReload: () => Promise<void>;
  onComplete: () => void;
}
```

- [ ] **Step 1: Write failing wizard tests**

```tsx
const config = {
  id: "term-config",
  academicYearId: "year-1",
  termId: "term-1",
  name: "First term timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "term",
  scopeKey: "term:term-1",
  stageId: null,
  gradeId: null,
  sectionId: null,
  classroomId: null,
  status: "draft",
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
} satisfies BackendTimetableConfigDto;

const period = {
  id: "period-1",
  timetableConfigId: config.id,
  index: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
} satisfies BackendTimetablePeriodDto;

const missingConfigStatus: TimetableSetupStatus = {
  kind: "missing_config",
  config: null,
  periods: [],
};
const missingPeriodsStatus: TimetableSetupStatus = {
  kind: "missing_periods",
  config,
  periods: [],
};
const readyStatus: TimetableSetupStatus = {
  kind: "ready",
  config,
  periods: [period],
  readOnly: false,
};

const renderWizard = ({
  status = missingConfigStatus,
  onComplete = vi.fn(),
}: {
  status?: TimetableSetupStatus;
  onComplete?: () => void;
} = {}) =>
  render(
    <TimetableSetupWizard
      academicYearId="year-1"
      termId="term-1"
      academicYearName="2026/2027"
      termName="First term"
      status={status}
      onReload={vi.fn().mockResolvedValue(undefined)}
      onComplete={onComplete}
    />,
  );

it("starts at days when the term config is missing", () => {
  renderWizard({ status: missingConfigStatus });
  expect(screen.getByRole("heading", { name: "setup.steps.days.title" })).toHaveFocus();
});

it("resumes at periods when the config exists without instructional periods", () => {
  renderWizard({ status: missingPeriodsStatus });
  expect(screen.getByRole("heading", { name: "setup.steps.periods.title" })).toBeInTheDocument();
});

it("does not finish until an instructional period exists", () => {
  renderWizard({ status: missingPeriodsStatus });
  expect(screen.queryByRole("button", { name: "setup.startBuilding" })).not.toBeInTheDocument();
});

it("summarizes ready setup and completes through navigation", async () => {
  const onComplete = vi.fn();
  renderWizard({ status: readyStatus, onComplete });
  await userEvent.click(screen.getByRole("button", { name: "setup.startBuilding" }));
  expect(onComplete).toHaveBeenCalledOnce();
});

it("lets a ready draft return to earlier steps for editing", async () => {
  renderWizard({ status: readyStatus });
  await userEvent.click(screen.getByRole("button", { name: "setup.back" }));
  expect(screen.getByRole("heading", { name: "setup.steps.periods.title" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the wizard test and verify it fails**

```powershell
& { npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableSetupWizard.test.tsx }
```

Expected: FAIL because the wizard does not exist.

- [ ] **Step 3: Implement accessible step navigation**

Derive the initial step from status and keep progress local only while the page is mounted:

```ts
const initialStep = status.kind === "missing_config" ? 0 : status.kind === "missing_periods" ? 1 : 2;
const [activeStep, setActiveStep] = useState(initialStep);
```

After config save, call `onReload()`, move to periods, and focus the periods heading. After the first instructional period is present, enable review. `WizardStepper` must expose current/completed semantics using `aria-current="step"` and hidden status text rather than color alone.

- [ ] **Step 4: Compose the three step panels**

- Days uses `TimetableConfigEditor` with `{ scopeType: "TERM" }`, `allowScopeSelection={false}`, and `fixedName={t("setup.defaultConfigName", { term: termName })}` so the administrator is not asked for a technical config name.
- Periods uses `TimetablePeriodsEditor` and disables Continue until `periods.some(period => period.isInstructional)`.
- Review shows active days, period count, first time, last time, and the default-to-all-scopes explanation.

Use only existing UI primitives and responsive grid/stack utilities. Do not introduce another modal.

- [ ] **Step 5: Add complete Arabic and English copy**

Add the same keys to both locale files under `academics.timetable.setup`: page title/description, three step titles/subtitles, year/term labels, save/continue/back/retry/start actions, readiness explanations, read-only messages, default-scope explanation, and review labels.

- [ ] **Step 6: Apply required quality guards**

Invoke `test-guard` for the wizard tests, then `clean-code-guard` for the wizard and stepper changes. Fix focus, effect-dependency, state-reset, and excessive branching findings.

- [ ] **Step 7: Run wizard and dialog tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableSetupWizard.test.tsx src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx
}
```

Expected: PASS in both locales' key usage; no missing-message runtime errors.

- [ ] **Step 8: Commit the setup wizard**

```powershell
& {
  git add -- 'src/features/academics/timetable/components/TimetableSetupWizard.tsx' 'src/features/academics/timetable/components/__tests__/TimetableSetupWizard.test.tsx' 'src/features/academics/timetable/components/WizardStepper.tsx' 'src/messages/ar.json' 'src/messages/en.json'
  git commit -m 'feat(timetable): add term setup wizard'
}
```

---

### Task 5: Add the setup route and page integration

**Files:**

- Create: `src/features/academics/timetable/pages/TimetableSetupPage.tsx`
- Create: `src/features/academics/timetable/pages/__tests__/TimetableSetupPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/academics/(with-context)/timetable/setup/page.tsx`

**Interfaces:**

- Consumes: `useAcademicYearTermLayoutContext`, `usePermissions`, `useTimetableSetupStatus`, `TimetableSetupWizard`, `AccessDenied`, and `MainLoader`.
- Produces: the protected setup route. On completion it performs `router.replace("/academics/timetable")` with the active locale routing behavior used by the app.

- [ ] **Step 1: Write failing setup-page tests**

```tsx
const routerMocks = vi.hoisted(() => ({ replace: vi.fn() }));
const setupHookMock = vi.hoisted(() => ({
  result: {
    status: null as TimetableSetupStatus | null,
    isLoading: true,
    reload: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));
vi.mock("@/features/academics/timetable/hooks/useTimetableSetupStatus", () => ({
  useTimetableSetupStatus: () => setupHookMock.result,
}));
vi.mock("@/features/academics/timetable/components/TimetableSetupWizard", () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <button type="button" onClick={onComplete}>setup.startBuilding</button>
  ),
}));

const readOnlyMissingConfig: TimetableSetupStatus = {
  kind: "read_only",
  readiness: "missing_config",
  reason: "missing_permission",
  config: null,
  periods: [],
};

const readyStatus: TimetableSetupStatus = {
  kind: "ready",
  readOnly: false,
  config: {
    id: "term-config",
    academicYearId: "year-1",
    termId: "term-1",
    name: "First term timetable",
    weekStartDay: 0,
    activeDays: [0, 1, 2, 3, 4],
    scopeType: "term",
    scopeKey: "term:term-1",
    stageId: null,
    gradeId: null,
    sectionId: null,
    classroomId: null,
    status: "draft",
    createdAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
  },
  periods: [
    {
      id: "period-1",
      timetableConfigId: "term-config",
      index: 1,
      label: "Period 1",
      startTime: "08:00",
      endTime: "08:45",
      type: "class",
      isInstructional: true,
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    },
  ],
};

it("shows loading while academic context or setup status is unresolved", () => {
  setupHookMock.result = {
    status: null,
    isLoading: true,
    reload: vi.fn().mockResolvedValue(undefined),
  };
  render(<TimetableSetupPage />);
  expect(screen.getByRole("status", { name: "loadingLabel" })).toHaveAttribute("aria-busy", "true");
});

it("shows a management blocker for incomplete read-only setup", () => {
  setupHookMock.result = {
    status: readOnlyMissingConfig,
    isLoading: false,
    reload: vi.fn(),
  };
  render(<TimetableSetupPage />);
  expect(screen.getByText("setup.readOnly.missingPermission")).toBeInTheDocument();
});

it("replaces the setup route after completion", async () => {
  setupHookMock.result = {
    status: readyStatus,
    isLoading: false,
    reload: vi.fn().mockResolvedValue(undefined),
  };
  render(<TimetableSetupPage />);
  await userEvent.click(screen.getByRole("button", { name: "setup.startBuilding" }));
  expect(routerMocks.replace).toHaveBeenCalledWith("/academics/timetable");
});
```

- [ ] **Step 2: Run the setup-page test and verify it fails**

```powershell
& { npm run test:run -- src/features/academics/timetable/pages/__tests__/TimetableSetupPage.test.tsx }
```

Expected: FAIL because the page does not exist.

- [ ] **Step 3: Implement the feature page**

Pass localized academic year and term names to the wizard. Render a retry panel for `kind: "error"`, the permission-safe blocker for incomplete `read_only`, and the wizard for editable or ready data. Ready published data is rendered in read-only mode.

- [ ] **Step 4: Add the protected App Router page**

```tsx
import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import TimetableSetupPage from "@/features/academics/timetable/pages/TimetableSetupPage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.structure.view">
      <TimetableSetupPage />
    </AcademicsPermissionGuard>
  );
}
```

- [ ] **Step 5: Apply required quality guards**

Invoke `test-guard` for setup-page tests, then `clean-code-guard` for the feature and route components. Apply findings without broadening permissions.

- [ ] **Step 6: Run setup page, hook, and wizard tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/pages/__tests__/TimetableSetupPage.test.tsx src/features/academics/timetable/hooks/__tests__/useTimetableSetupStatus.test.tsx src/features/academics/timetable/components/__tests__/TimetableSetupWizard.test.tsx
}
```

Expected: PASS.

- [ ] **Step 7: Commit the setup route**

```powershell
& {
  git add -- 'src/features/academics/timetable/pages/TimetableSetupPage.tsx' 'src/features/academics/timetable/pages/__tests__/TimetableSetupPage.test.tsx' 'src/app/[lang]/(dashboard)/academics/(with-context)/timetable/setup/page.tsx'
  git commit -m 'feat(timetable): add term setup route'
}
```

---

### Task 6: Gate the timetable workspace

**Files:**

- Create: `src/features/academics/timetable/components/TimetableSetupGate.tsx`
- Create: `src/features/academics/timetable/components/__tests__/TimetableSetupGate.test.tsx`
- Modify: `src/features/academics/timetable/pages/TimetablePageContent.tsx`
- Modify: `src/features/academics/timetable/pages/__tests__/TimetablePageContent.test.tsx`

**Interfaces:**

- Consumes: Task 2 hook, `router.replace`, permissions, term status, existing loading skeleton, and localized setup copy.
- Produces:

```ts
interface TimetableSetupGateProps {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  canManage: boolean;
  children: React.ReactNode;
}
```

- [ ] **Step 1: Write failing gate tests**

```tsx
const routerMocks = vi.hoisted(() => ({ replace: vi.fn() }));
const setupHookMock = vi.hoisted(() => ({
  result: {
    status: null as TimetableSetupStatus | null,
    isLoading: false,
    reload: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => routerMocks }));
vi.mock("@/features/academics/timetable/hooks/useTimetableSetupStatus", () => ({
  useTimetableSetupStatus: () => setupHookMock.result,
}));

const termConfig = {
  id: "term-config",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Term timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "term",
  scopeKey: "term:term-1",
  stageId: null,
  gradeId: null,
  sectionId: null,
  classroomId: null,
  status: "draft",
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
} satisfies BackendTimetableConfigDto;

const period = {
  id: "period-1",
  timetableConfigId: termConfig.id,
  index: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
} satisfies BackendTimetablePeriodDto;

const statusByKind = {
  missing_config: { kind: "missing_config", config: null, periods: [] },
  missing_periods: { kind: "missing_periods", config: termConfig, periods: [] },
  ready: { kind: "ready", config: termConfig, periods: [period], readOnly: false },
  error: { kind: "error", error: new Error("offline") },
} satisfies Record<string, TimetableSetupStatus>;

const mockStatus = (kind: keyof typeof statusByKind) => {
  setupHookMock.result = {
    status: statusByKind[kind],
    isLoading: false,
    reload: vi.fn().mockResolvedValue(undefined),
  };
};

const renderGate = () =>
  render(
    <TimetableSetupGate
      academicYearId="year-1"
      termId="term-1"
      termStatus="open"
      canManage
    >
      <p>workspace child</p>
    </TimetableSetupGate>,
  );

it.each(["missing_config", "missing_periods"] as const)(
  "replaces the route for manageable %s setup",
  async (kind) => {
    mockStatus(kind);
    renderGate();
    await waitFor(() =>
      expect(routerMocks.replace).toHaveBeenCalledWith("/academics/timetable/setup"),
    );
  },
);

it("does not redirect an error", () => {
  mockStatus("error");
  renderGate();
  expect(routerMocks.replace).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "setup.retry" })).toBeInTheDocument();
});

it("allows a ready draft through", () => {
  mockStatus("ready");
  renderGate();
  expect(screen.getByText("workspace child")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run gate and page tests and verify failure**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableSetupGate.test.tsx src/features/academics/timetable/pages/__tests__/TimetablePageContent.test.tsx
}
```

Expected: FAIL because the gate is absent.

- [ ] **Step 3: Implement the gate**

Redirect in an effect only after loading finishes. While redirecting, retain the setup loading skeleton so the unconfigured workspace never flashes.

```ts
useEffect(() => {
  if (status?.kind === "missing_config" || status?.kind === "missing_periods") {
    router.replace("/academics/timetable/setup");
  }
}, [router, status]);
```

Render an explicit retry state for errors and an administrator-contact blocker for incomplete `read_only` state.

- [ ] **Step 4: Wrap only the timetable tab in `TimetablePageContent`**

Keep the Rooms tab available. Apply the gate around `TimetableView`, not the entire page, so room management is not blocked by timetable setup.

- [ ] **Step 5: Apply required quality guards**

Invoke `test-guard` for both changed test files, then `clean-code-guard` for the gate and page integration. Fix redirect loops, effect stability, and unauthorized-control findings.

- [ ] **Step 6: Run focused gate/page tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableSetupGate.test.tsx src/features/academics/timetable/pages/__tests__/TimetablePageContent.test.tsx
}
```

Expected: PASS, including existing unsaved-filter confirmation tests.

- [ ] **Step 7: Commit the workspace gate**

```powershell
& {
  git add -- 'src/features/academics/timetable/components/TimetableSetupGate.tsx' 'src/features/academics/timetable/components/__tests__/TimetableSetupGate.test.tsx' 'src/features/academics/timetable/pages/TimetablePageContent.tsx' 'src/features/academics/timetable/pages/__tests__/TimetablePageContent.test.tsx'
  git commit -m 'feat(timetable): gate incomplete term setup'
}
```

---

### Task 7: Decouple the editable term config from academic filters

**Files:**

- Modify: `src/features/academics/timetable/hooks/useTimetableData.ts`
- Modify: `src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx`

**Interfaces:**

- Consumes: existing API adapter and filter IDs.
- Produces: the existing `useTimetableData` result plus an optional explicit `configurationScope` input. The default config is always the exact term config; only the advanced override action may supply a narrower configuration scope. `timetableEntries` remain filtered independently by classroom.

- [ ] **Step 1: Replace scope-coupled expectations with failing term-config tests**

```tsx
it("loads the exact term config even when a stage and classroom are selected", async () => {
  const { result } = renderHook(() => useTimetableData(hookParams));
  await waitFor(() => expect(result.current.timetableLoading).toBe(false));
  expect(mockedGetConfig).toHaveBeenCalledWith({
    academicYearId: "year-1",
    termId: "term-1",
    scopeType: "TERM",
  });
  expect(result.current.config?.id).toBe("term-config");
});

it("loads a narrower config only when an explicit configuration scope is supplied", async () => {
  renderHook(() =>
    useTimetableData({
      ...hookParams,
      configurationScope: { scopeType: "STAGE", stageId: "stage-1" },
    }),
  );
  await waitFor(() =>
    expect(mockedGetConfig).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "STAGE",
      stageId: "stage-1",
    }),
  );
});

it("keeps the term config while a classroom filter changes", async () => {
  const { rerender, result } = renderHook(
    ({ classroomId }) =>
      useTimetableData({ ...hookParams, selectedClassroomId: classroomId }),
    { initialProps: { classroomId: "classroom-1" } },
  );
  await waitFor(() => expect(result.current.config?.id).toBe("term-config"));
  rerender({ classroomId: "classroom-2" });
  await waitFor(() => expect(result.current.timetableLoading).toBe(false));
  expect(mockedGetConfig).toHaveBeenLastCalledWith({
    academicYearId: "year-1",
    termId: "term-1",
    scopeType: "TERM",
  });
});
```

Retain an explicit test for the published effective resolver in its consumer path; do not silently delete coverage for inherited read models.

- [ ] **Step 2: Run the hook test and verify scope expectations fail**

```powershell
& { npm run test:run -- src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx }
```

Expected: FAIL because the hook currently requests the most specific selected scope.

- [ ] **Step 3: Load the exact term config independently from filters**

Add an optional configuration scope that defaults to `TERM`; never derive it reactively from the academic filters:

```ts
const activeConfigurationScope = configurationScope ?? {
  scopeType: "TERM" as const,
};

const configRequest = {
  academicYearId,
  termId,
  ...activeConfigurationScope,
};
```

Use `selectedClassroomId` only for `listEntries` filtering. Keep `allTermEntries` loaded without a classroom filter for conflict detection, deletion reconciliation, generation, validation references, and publication.

- [ ] **Step 4: Preserve explicit overrides and effective published reads**

When `configurationScope` is provided, retain the existing exact/inherited/unconfigured resolution for that explicit scope so an administrator can create or edit an override, manage its periods and entries, and return to the term default. Do not remove `resolveEffectiveDashboardTimetable` or its attendance consumers. The default call path must never derive `configurationScope` from stage, grade, section, or classroom filters.

- [ ] **Step 5: Apply required quality guards**

Invoke `test-guard` for the hook regression tests, then `clean-code-guard` for `useTimetableData`. Pay particular attention to this existing 1,000-line hook: extract a focused loader helper if the new branch makes it harder to reason about; do not perform unrelated refactoring.

- [ ] **Step 6: Run timetable data, mapper, save, and contract tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx src/features/academics/timetable/services/__tests__/timetableSaveMapper.test.ts src/features/academics/timetable/services/__tests__/timetableDashboardContract.test.ts src/features/attendance/shared/services/__tests__/effectiveAttendanceTimetable.test.ts
}
```

Expected: PASS; attendance still resolves published effective configs.

- [ ] **Step 7: Commit the term-config workspace behavior**

```powershell
& {
  git add -- 'src/features/academics/timetable/hooks/useTimetableData.ts' 'src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx'
  git commit -m 'fix(timetable): keep filters on term draft'
}
```

---

### Task 8: Make filters and override actions explicit

**Files:**

- Modify: `src/features/academics/timetable/components/FilterBar.tsx`
- Modify: `src/features/academics/timetable/components/__tests__/FilterBar.test.tsx`
- Modify: `src/features/academics/timetable/components/TimetableView.tsx`
- Modify: `src/features/academics/timetable/components/TimetableSourceBanner.tsx`
- Modify: `src/features/academics/timetable/components/__tests__/TimetableSourceBanner.test.tsx`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`

**Interfaces:**

- Consumes: Task 7 term config, existing filter callbacks, router, and advanced config dialog.
- Produces: a four-control academic filter bar, a **Timetable settings** route action, and an explicit override-editing mode with **Customize a specific scope** and **Return to term default** actions.

- [ ] **Step 1: Write failing filter and banner tests**

```tsx
const termConfig = {
  id: "term-config",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Term timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "term",
  scopeKey: "term:term-1",
  stageId: null,
  gradeId: null,
  sectionId: null,
  classroomId: null,
  status: "draft",
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
} satisfies BackendTimetableConfigDto;

const copy = {
  exactTitle: "Scope timetable",
  exactDescription: "Using the timetable configured for this scope.",
  inheritedTitle: "Inherited published timetable",
  inheritedDescription: "This published timetable is inherited and read-only.",
  termDefaultTitle: "Term default timetable",
  termDefaultDescription: "This draft applies to all classrooms by default.",
  sourceLabel: "Source",
  lockedLabel: "Inherited timetable is locked",
  customizeScope: "Customize a specific scope",
  returnToTermDefault: "Return to term default",
  overrideUnavailable: "Select a narrower scope before customizing.",
  publishedOverridesNote: "Published overrides take precedence in their scopes.",
};

it("renders academic filters without a scope selector", () => {
  render(
    <FilterBar
      stages={[]}
      grades={[]}
      sections={[]}
      classrooms={[]}
      selectedStageId=""
      selectedGradeId=""
      selectedSectionId=""
      selectedClassroomId=""
      onStageChange={vi.fn()}
      onGradeChange={vi.fn()}
      onSectionChange={vi.fn()}
      onClassroomChange={vi.fn()}
      locale="en"
    />,
  );
  expect(screen.queryByLabelText("selectScope")).not.toBeInTheDocument();
  expect(screen.getByLabelText("selectStage")).toBeInTheDocument();
});

it("describes the exact term config as the default for all classrooms", () => {
  render(
    <TimetableSourceBanner
      workspaceState={resolveTimetableWorkspaceState({
        exactConfig: termConfig,
        effectiveConfig: null,
      })}
      sourceName="Term timetable"
      configurationScope={{ scopeType: "TERM" }}
      canCreateOverride
      onCreateOverride={vi.fn()}
      onReturnToTermDefault={vi.fn()}
      copy={copy}
    />,
  );
  expect(screen.getByText(copy.termDefaultDescription)).toBeInTheDocument();
});

it("offers override creation only through the explicit action", async () => {
  const onCreateOverride = vi.fn();
  render(
    <TimetableSourceBanner
      workspaceState={resolveTimetableWorkspaceState({
        exactConfig: termConfig,
        effectiveConfig: null,
      })}
      sourceName="Term timetable"
      configurationScope={{ scopeType: "TERM" }}
      canCreateOverride
      onCreateOverride={onCreateOverride}
      onReturnToTermDefault={vi.fn()}
      copy={copy}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: copy.customizeScope }));
  expect(onCreateOverride).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run filter and banner tests and verify failure**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/components/__tests__/FilterBar.test.tsx src/features/academics/timetable/components/__tests__/TimetableSourceBanner.test.tsx
}
```

Expected: FAIL because the normal filter still includes scope selection and the banner copy is inherited/exact-centric.

- [ ] **Step 3: Simplify `FilterBar`**

Remove `selectedScopeType` and `onScopeChange` props and the scope `<Select>`. Keep cascading stage, grade, section, and classroom filtering, and change the desktop grid from five to four columns.

- [ ] **Step 4: Update `TimetableView` actions**

Remove `changeScope` from the default filter flow. Keep configuration scope as deliberate view state:

```ts
const [configurationScope, setConfigurationScope] =
  useState<TimetableScopeSelection>({ scopeType: "TERM" });

const openTimetableSettings = () => router.push("/academics/timetable/setup");

const customizeFilteredScope = () => {
  const selectedScope = resolveTimetableScopeSelection({
    stageId: selectedStageId,
    gradeId: selectedGradeId,
    sectionId: selectedSectionId,
    classroomId: selectedClassroomId,
  });
  if (selectedScope.scopeType !== "TERM") setConfigurationScope(selectedScope);
};

const returnToTermDefault = () =>
  setConfigurationScope({ scopeType: "TERM" });
```

Pass `configurationScope` to `useTimetableData`. Render the settings action in both desktop and mobile action groups. Keep the advanced config and period dialogs reachable in explicit override mode so existing overrides remain fully manageable. Disable customization when no narrower academic scope is selected. Returning to the term default reloads the exact term config without clearing academic filters.

- [ ] **Step 5: Update source banner semantics**

For an exact term config, show that the user is editing the term-wide default. For explicit override mode, show the selected configuration source and the **Return to term default** action. For an inherited override view, preserve its lock state and allow creation of an exact override when authorized. Do not claim that draft overrides already take precedence; refer to published overrides when explaining runtime inheritance.

- [ ] **Step 6: Add matching Arabic and English copy**

Add `actions.settings`, `source.termDefaultTitle`, `source.termDefaultDescription`, `source.customizeScope`, `source.returnToTermDefault`, and `source.publishedOverridesNote`. Remove keys only after `rg` confirms there are no remaining consumers.

- [ ] **Step 7: Apply required quality guards**

Invoke `test-guard` for filter/banner tests, then `clean-code-guard` for the production changes. Check prop simplification, duplicated desktop/mobile actions, and explicit override authorization.

- [ ] **Step 8: Run view-adjacent focused tests**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/components/__tests__/FilterBar.test.tsx src/features/academics/timetable/components/__tests__/TimetableSourceBanner.test.tsx src/features/academics/timetable/components/__tests__/TimetableCreationStepper.test.tsx src/features/academics/timetable/pages/__tests__/TimetablePageContent.test.tsx
}
```

Expected: PASS.

- [ ] **Step 9: Commit filter and override UX**

```powershell
& {
  git add -- 'src/features/academics/timetable/components/FilterBar.tsx' 'src/features/academics/timetable/components/__tests__/FilterBar.test.tsx' 'src/features/academics/timetable/components/TimetableView.tsx' 'src/features/academics/timetable/components/TimetableSourceBanner.tsx' 'src/features/academics/timetable/components/__tests__/TimetableSourceBanner.test.tsx' 'src/messages/ar.json' 'src/messages/en.json'
  git commit -m 'feat(timetable): separate filters from config scope'
}
```

---

### Task 9: Verify the integrated flow and prepare handoff

**Files:**

- Modify only files already in scope when a focused verification exposes a defect.
- Do not add unrelated documentation or refactors.

**Interfaces:**

- Consumes: all prior tasks.
- Produces: a verified feature branch ready for owner review.

- [ ] **Step 1: Run the complete focused timetable setup set**

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableSetupStatus.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableSetupStatus.test.tsx src/features/academics/timetable/components/__tests__/TimetableSetupWizard.test.tsx src/features/academics/timetable/components/__tests__/TimetableSetupGate.test.tsx src/features/academics/timetable/pages/__tests__/TimetableSetupPage.test.tsx src/features/academics/timetable/pages/__tests__/TimetablePageContent.test.tsx src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx src/features/academics/timetable/components/__tests__/FilterBar.test.tsx src/features/academics/timetable/components/__tests__/TimetableSourceBanner.test.tsx src/features/attendance/shared/services/__tests__/effectiveAttendanceTimetable.test.ts
}
```

Expected: PASS. This is a focused list, not the full test suite.

- [ ] **Step 2: Run static verification**

```powershell
& {
  npm run lint
  npm run typecheck
}
```

Expected: both commands exit 0 with no new warnings caused by the task.

- [ ] **Step 3: Run the production build**

```powershell
& { npm run build }
```

Expected: exit 0.

- [ ] **Step 4: Perform final guard reviews**

Invoke `test-guard` over every test diff and `clean-code-guard` over every production-code diff. Apply only task-scoped findings, then rerun the affected focused tests plus lint and typecheck.

- [ ] **Step 5: Inspect final scope and secrets**

```powershell
& {
  git status --short
  git diff origin/main...HEAD --stat
  git diff origin/main...HEAD --check
  git diff origin/main...HEAD -- . ':!package-lock.json' | Select-String -Pattern 'NEXT_PUBLIC_|api[_-]?key|secret|token' -CaseSensitive:$false
}
```

Expected: only timetable source, focused tests, translations, the spec, and this plan are changed; no secrets or environment files are present.

- [ ] **Step 6: Ask before any full-suite run**

Do not run `npm run test:run` without explicit file paths and do not run `npm run test:all` unless the owner explicitly approves the full test suite.

- [ ] **Step 7: Commit any verification-only fixes**

If verification required task-scoped fixes, commit them normally:

```powershell
& {
  git add --update
  git commit -m 'fix(timetable): address setup verification findings'
}
```

If no fixes were required, do not create an empty commit.

- [ ] **Step 8: Stop before push/PR unless requested**

Report focused tests, lint, typecheck, build, branch status, changed files, and known limitations. A push and Draft PR require the owner's implementation workflow request; never merge the PR.
