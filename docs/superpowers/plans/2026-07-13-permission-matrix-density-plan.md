# Permission Matrix Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dense settings permission table with compact collapsible module cards without changing permission semantics.

**Architecture:** Keep permission catalog grouping, action ordering, permission state calculation, bulk toggling, and save behavior in `SettingsRolesPage.tsx`. Replace only the matrix presentation with module cards: a module header contains the module count and bulk action controls, and expanded content contains resource rows with supported action controls.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, lucide-react, Vitest, Testing Library.

## Global Constraints

- Preserve permission keys, API requests, role authorization, persistence behavior, and loading/error/forbidden states.
- Modules are collapsed by default.
- Unsupported actions are omitted from resource rows instead of rendered as placeholder cells.
- Preserve Arabic/RTL layout and keyboard-accessible buttons.

---

### Task 1: Add presentation assertions for the compact matrix

**Files:**
- Modify: `src/features/settings/roles/pages/__tests__/SettingsRolesPage.permissions.test.tsx`
- Test: `src/features/settings/roles/pages/__tests__/SettingsRolesPage.permissions.test.tsx`

**Interfaces:**
- Consumes the existing mocked role and permission catalog.
- Produces assertions for the module-card presentation that the page implementation must satisfy.

- [ ] **Step 1: Extend the catalog fixture with two resources and two actions**

Use permission definitions for `users.view`, `users.manage`, and `reports.view`, keeping `reports.manage` absent so the test can verify unsupported actions are not rendered as resource controls.

- [ ] **Step 2: Add a failing test for collapsed modules and expanded supported actions**

After the catalog loads, assert the module button named `users` has `aria-expanded="false"`; click it; assert the `users` resource and its `view`/`manage` controls appear. Assert the `reports` resource does not expose a `manage` permission control.

- [ ] **Step 3: Run the focused test to verify the new assertion fails**

Run:

```powershell
npm run test:run -- src/features/settings/roles/pages/__tests__/SettingsRolesPage.permissions.test.tsx
```

Expected: the new presentation assertion fails because the current implementation renders the global table and does not expose module-card resource controls.

### Task 2: Replace the global permission table with compact module cards

**Files:**
- Modify: `src/features/settings/roles/pages/SettingsRolesPage.tsx`

**Interfaces:**
- Consumes existing `permissionMatrix`, `actionColumns`, `getPermissionCounts`, `getModuleActionState`, `toggleModuleAction`, `handleTogglePermission`, and `renderMatrixToggle` helpers.
- Produces the same permission changes and save payload through the existing handlers.

- [ ] **Step 1: Keep `expandedModules` initialized to collapsed**

Retain the existing `expandedModules` state and initialization effect, and ensure the render fallback is `false` rather than `true`:

```tsx
const isExpanded = expandedModules[module] ?? false;
```

- [ ] **Step 2: Render module cards instead of the global `<table>`**

For every `{ module, rows }`, render a bordered section containing:

```tsx
const moduleCounts = getPermissionCounts(rows);
const isExpanded = expandedModules[module] ?? false;

<section key={module} aria-labelledby={`${moduleId}-label`} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
  <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-4 py-3">
    <button
      type="button"
      aria-label={module}
      aria-expanded={isExpanded}
      aria-controls={`${moduleId}-rows`}
      className="inline-flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-left text-sm font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      onClick={() => setExpandedModules((current) => ({ ...current, [module]: !isExpanded }))}
    >
      {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
      <span id={`${moduleId}-label`}>{module}</span>
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-blue-700">
        {moduleCounts.selected} / {moduleCounts.total}
      </span>
    </button>
    <div className="flex flex-wrap items-center gap-1.5" aria-label={`${module} bulk permissions`}>
      {actionColumns.map((action) => {
        const supported = isPermissionActionSupported(rows, action);
        return supported ? (
          <span key={`${module}-${action}`} className="inline-flex items-center gap-1 text-[11px] text-gray-600">
            <span>{action}</span>
            {renderMatrixToggle(getModuleActionState(rows, action), () => toggleModuleAction(rows, action), !canManageRoles || Boolean(selectedRole?.isSystem))}
          </span>
        ) : null;
      })}
    </div>
  </div>
  {isExpanded ? (
    <div id={`${moduleId}-rows`} className="divide-y divide-gray-100">
      {rows.map((row) => (
        <div key={`${module}-${row.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-[12rem] items-center gap-2 text-sm text-gray-800">
            <span>{row.label}</span>
            <span className="shrink-0 text-[11px] tabular-nums text-gray-500">
              {getPermissionCounts([row]).selected} / {getPermissionCounts([row]).total}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actionColumns.map((action) => {
              const permission = row.cells[action];
              return permission ? (
                <span key={`${module}-${row.id}-${action}`} className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                  <span>{action}</span>
                  {renderMatrixToggle(isPermissionChecked(permission.key) ? "all" : "none", () => handleTogglePermission(permission.key), !canManageRoles || Boolean(selectedRole?.isSystem))}
                </span>
              ) : null;
            })}
          </div>
        </div>
      ))}
    </div>
  ) : null}
</section>
```

Use a vertical `flex flex-col gap-3` wrapper and retain the existing empty-state content. Do not call `renderUnavailablePermission` in the new presentation.

- [ ] **Step 3: Run the focused test to verify it passes**

Run:

```powershell
npm run test:run -- src/features/settings/roles/pages/__tests__/SettingsRolesPage.permissions.test.tsx
```

Expected: all permission catalog tests pass, including the new collapsed/expanded presentation assertion.

### Task 3: Review and verify the completed change

**Files:**
- Review: `src/features/settings/roles/pages/SettingsRolesPage.tsx`
- Review: `src/features/settings/roles/pages/__tests__/SettingsRolesPage.permissions.test.tsx`

- [ ] **Step 1: Check the diff for behavior changes outside presentation**

Run:

```powershell
git diff -- src/features/settings/roles/pages/SettingsRolesPage.tsx src/features/settings/roles/pages/__tests__/SettingsRolesPage.permissions.test.tsx
```

Confirm only matrix rendering, focused test fixtures/assertions, and the collapsed fallback changed.

- [ ] **Step 2: Run typecheck and lint**

Run:

```powershell
npm run typecheck
npm run lint -- src/features/settings/roles/pages/SettingsRolesPage.tsx src/features/settings/roles/pages/__tests__/SettingsRolesPage.permissions.test.tsx
```

Expected: both commands exit with code 0.

- [ ] **Step 3: Run the full unit test suite**

Run:

```powershell
npm run test:run
```

Expected: the suite exits with code 0 and reports no failed tests.
