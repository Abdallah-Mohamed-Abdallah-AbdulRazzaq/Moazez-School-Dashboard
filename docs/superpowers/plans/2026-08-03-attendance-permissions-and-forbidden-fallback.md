# Attendance Permissions and Forbidden Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Enforce the existing Attendance permission catalog in the dashboard UI and show a persistent dashboard-level access-denied banner for unexpected API 403 responses.

**Architecture:** A small Attendance route guard prevents protected page content from mounting until the required view permission is granted. Existing Attendance controls receive explicit write-capability booleans combined with the current term read-only condition. The shared Axios interceptor emits one browser event for a 403, and a dashboard-only provider displays the existing AccessDenied banner for the active route.

**Tech Stack:** Next.js 16, React 19, TypeScript, Axios, next-intl, Vitest, React Testing Library.

## Global Constraints

- Frontend-only: do not alter E:\Moazzez\Moazez-Backend-main, API contracts, seeded roles, or backend authorization.
- The backend remains authoritative; UI checks only prevent predictable forbidden requests.
- Reuse the existing AccessDenied component and usePermissions hook. Add no dependency.
- Unavailable write controls stay rendered and disabled; term read-only is an independent restriction.
- The global banner is non-destructive, persists for one pathname, and clears only after pathname changes.
- Stage only task-owned files because unrelated untracked files already exist.

---

## File structure

- src/hooks/usePermissions.ts: permission literals and Late/Early navigation mapping.
- src/features/attendance/shared/components/AttendancePermissionGuard.tsx: reusable view gate.
- src/lib/api.ts: exported 403 browser event and event publication.
- src/providers/PermissionDeniedProvider.tsx: active-route access-denied banner.
- src/app/[lang]/(dashboard)/layout.tsx: dashboard-only provider mount.
- Attendance pages and their panel/table/drawer/modal children: page gates and disabled write capabilities.
- Focused Vitest tests beside each primitive and protected page.

## Task 1: Create the Attendance view guard and align permission keys

**Files:**
- Create: src/features/attendance/shared/components/AttendancePermissionGuard.tsx
- Create: src/features/attendance/shared/components/__tests__/AttendancePermissionGuard.test.tsx
- Modify: src/hooks/usePermissions.ts
- Create: src/hooks/__tests__/usePermissions.test.tsx

**Interfaces:**
- Produces AttendancePermissionGuard({ permission, children }) where permission is PermissionKey.
- Adds attendance.policies.manage, attendance.sessions.manage, attendance.excuses.manage.
- Maps attendance-late-early to attendance.absences.view.

- [ ] **Step 1: Write the failing tests**

    it("does not mount protected content when the view permission is absent", () => {
      const onMount = vi.fn();
      render(
        <AttendancePermissionGuard permission="attendance.reports.view">
          <Probe onMount={onMount} />
        </AttendancePermissionGuard>,
      );
      expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
      expect(onMount).not.toHaveBeenCalled();
    });

    it("maps Late/Early navigation to absence read access", () => {
      expect(navigationPermissionByKey["attendance-late-early"])
        .toBe("attendance.absences.view");
    });

Mock usePermissions with isPermissionsReady true and a false hasPermission result. Probe must call onMount from useEffect, proving that denied content never mounted.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: npm run test:run -- src/features/attendance/shared/components/__tests__/AttendancePermissionGuard.test.tsx src/hooks/__tests__/usePermissions.test.tsx

Expected: FAIL because the guard and the three permission literals do not exist and Late/Early uses the write key.

- [ ] **Step 3: Implement the minimal guard and mapping**

    "use client";
    import { AccessDenied } from "@/components/ui";
    import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

    export default function AttendancePermissionGuard({ permission, children }: {
      permission: PermissionKey;
      children: React.ReactNode;
    }) {
      const { hasPermission, isPermissionsReady } = usePermissions();
      if (!isPermissionsReady) return null;
      if (hasPermission(permission)) return <>{children}</>;
      return <main className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-4 sm:p-6">
        <AccessDenied className="max-w-md" />
      </main>;
    }

Add the three literal keys to PermissionKey. Change only navigationPermissionByKey["attendance-late-early"] to attendance.absences.view.

- [ ] **Step 4: Run focused verification**

Run: npm run test:run -- src/features/attendance/shared/components/__tests__/AttendancePermissionGuard.test.tsx src/hooks/__tests__/usePermissions.test.tsx
Expected: PASS.

Run: npm run typecheck
Expected: PASS.

- [ ] **Step 5: Commit**

    git add src/hooks/usePermissions.ts src/hooks/__tests__/usePermissions.test.tsx src/features/attendance/shared/components/AttendancePermissionGuard.tsx src/features/attendance/shared/components/__tests__/AttendancePermissionGuard.test.tsx
    git commit -m "feat: add attendance permission guard"

## Task 2: Add the global 403 fallback without changing error propagation

**Files:**
- Modify: src/lib/api.ts
- Create: src/lib/__tests__/api-forbidden-event.test.ts
- Create: src/providers/PermissionDeniedProvider.tsx
- Create: src/providers/__tests__/PermissionDeniedProvider.test.tsx
- Modify: src/app/[lang]/(dashboard)/layout.tsx

**Interfaces:**
- Produces ACCESS_DENIED_EVENT = "moazez:access-denied".
- Produces PermissionDeniedProvider({ children }).
- A shared-client 403 dispatches the event and still rejects with ApiError.

- [ ] **Step 1: Write the failing tests**

    it("emits one event and preserves a 403 ApiError", async () => {
      const listener = vi.fn();
      window.addEventListener(ACCESS_DENIED_EVENT, listener);
      await expect(apiGet("/forbidden")).rejects.toMatchObject({ status: 403 });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("keeps the banner until the pathname changes", () => {
      const { rerender } = render(<PermissionDeniedProvider><div>page</div></PermissionDeniedProvider>);
      window.dispatchEvent(new Event(ACCESS_DENIED_EVENT));
      expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
      rerender(<PermissionDeniedProvider><div>page</div></PermissionDeniedProvider>);
      expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
      mockPathname = "/en/other";
      rerender(<PermissionDeniedProvider><div>other</div></PermissionDeniedProvider>);
      expect(screen.queryByText("common.accessDenied.title")).not.toBeInTheDocument();
    });

Mock Axios using the response-interceptor capture pattern in src/lib/__tests__/api-refresh-queue.test.ts. Its forbidden response must be an Axios-shaped 403. Mock usePathname with a mutable mockPathname.

- [ ] **Step 2: Run the tests and verify failure**

Run: npm run test:run -- src/lib/__tests__/api-forbidden-event.test.ts src/providers/__tests__/PermissionDeniedProvider.test.tsx
Expected: FAIL because neither event nor provider exists.

- [ ] **Step 3: Implement event publication and route-scoped state**

    export const ACCESS_DENIED_EVENT = "moazez:access-denied";

    function publishAccessDenied() {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(ACCESS_DENIED_EVENT));
      }
    }

In the Axios response-error interceptor, call publishAccessDenied only for error.response?.status === 403, before returning ApiError.fromAxiosError(error). Do not change 401 refresh behavior, retries, or the rejected error.

    "use client";
    export function PermissionDeniedProvider({ children }: { children: React.ReactNode }) {
      const pathname = usePathname();
      const [isDenied, setIsDenied] = useState(false);
      useEffect(() => { setIsDenied(false); }, [pathname]);
      useEffect(() => {
        const show = () => setIsDenied(true);
        window.addEventListener(ACCESS_DENIED_EVENT, show);
        return () => window.removeEventListener(ACCESS_DENIED_EVENT, show);
      }, []);
      return <>{isDenied && <AccessDenied className="mx-4 max-w-none" />}{children}</>;
    }

Mount PermissionDeniedProvider inside ToastProvider and around the dashboard content/providers in src/app/[lang]/(dashboard)/layout.tsx. Do not mount it in global app providers because onboarding and public routes are out of scope.

- [ ] **Step 4: Run focused verification**

Run: npm run test:run -- src/lib/__tests__/api-forbidden-event.test.ts src/lib/__tests__/api-refresh-queue.test.ts src/providers/__tests__/PermissionDeniedProvider.test.tsx
Expected: PASS. The existing 401 refresh behavior is unchanged.

Run: npm run typecheck
Expected: PASS.

- [ ] **Step 5: Commit**

    git add src/lib/api.ts src/lib/__tests__/api-forbidden-event.test.ts src/providers/PermissionDeniedProvider.tsx src/providers/__tests__/PermissionDeniedProvider.test.tsx "src/app/[lang]/(dashboard)/layout.tsx"
    git commit -m "feat: show global access denied fallback"

## Task 3: Protect Policies and Roll Call with independent write capabilities

**Files:**
- Modify: src/features/attendance/policies/pages/AttendancePoliciesPage.tsx
- Modify: src/features/attendance/policies/components/PoliciesListPanel.tsx
- Modify: src/features/attendance/policies/components/PolicyWizardDialog.tsx
- Modify: src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx
- Modify: src/features/attendance/roll-call/components/SessionPickerPanel.tsx
- Modify: src/features/attendance/roll-call/components/RollCallHeaderBar.tsx
- Modify: src/features/attendance/roll-call/components/RosterTable.tsx
- Create: src/features/attendance/policies/pages/__tests__/AttendancePoliciesPage.test.tsx
- Create: src/features/attendance/roll-call/pages/__tests__/AttendanceRollCallPage.test.tsx

**Interfaces:**
- Policies use canManagePolicies.
- Roll Call uses canManageSessions, canManageEntries, canSubmitSessions.
- Default pages are thin guards; all loading hooks live in authorized inner content components.

- [ ] **Step 1: Write failing access and disabled-control tests**

    it("does not load policies without attendance.policies.view", () => {
      render(<AttendancePoliciesPage />);
      expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
      expect(listAttendancePolicies).not.toHaveBeenCalled();
    });

    it("keeps policy creation visible but disabled without manage access", () => {
      render(<PoliciesListPanel {...props} canManagePolicies={false} />);
      expect(screen.getByRole("button", { name: "createPolicy" })).toBeDisabled();
    });

    it("separates draft editing from submission", () => {
      render(<RollCallHeaderBar {...props} canManageEntries={false} canSubmit={true} />);
      expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "submit" })).toBeEnabled();
    });

- [ ] **Step 2: Run the tests and verify failure**

Run: npm run test:run -- src/features/attendance/policies/pages/__tests__/AttendancePoliciesPage.test.tsx src/features/attendance/roll-call/pages/__tests__/AttendanceRollCallPage.test.tsx
Expected: FAIL because the page gates and capability props do not exist.

- [ ] **Step 3: Implement the gates and propagate capabilities**

Use this shape for both page exports:

    export default function AttendancePoliciesPage() {
      return <AttendancePermissionGuard permission="attendance.policies.view">
        <AttendancePoliciesContent />
      </AttendancePermissionGuard>;
    }

Keep existing state and effects only in AttendancePoliciesContent. Derive canManagePolicies from attendance.policies.manage. Pass it to PoliciesListPanel and PolicyWizardDialog, disabling but retaining create, edit, activate/deactivate, delete, wizard fields, and save whenever !canManagePolicies || isReadOnly.

Gate Roll Call with attendance.sessions.view and derive:
- canManageSessions from attendance.sessions.manage
- canManageEntries from attendance.entries.manage
- canSubmitSessions from attendance.sessions.submit

Session resolution uses canManageSessions. Roster changes, bulk mark/clear, reset, and draft save use canManageEntries. Submit/unsubmit uses canSubmitSessions. Pass the values to SessionPickerPanel, RosterTable, and RollCallHeaderBar; combine them with existing isReadOnly, dirty, and submitted checks without hiding permission-disabled controls.

- [ ] **Step 4: Run focused verification**

Run: npm run test:run -- src/features/attendance/policies/pages/__tests__/AttendancePoliciesPage.test.tsx src/features/attendance/roll-call/pages/__tests__/AttendanceRollCallPage.test.tsx src/features/attendance/policies/components/__tests__/PolicyWizardDialog.test.tsx src/features/attendance/roll-call/components/__tests__/SessionPickerPanel.test.tsx
Expected: PASS.

Run: npm run typecheck
Expected: PASS.

- [ ] **Step 5: Commit**

    git add src/features/attendance/policies src/features/attendance/roll-call
    git commit -m "feat: guard attendance policies and roll call"

## Task 4: Protect Absences and Late/Early corrections

**Files:**
- Modify: src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx
- Modify: src/features/attendance/absences/components/AbsencesTable.tsx
- Modify: src/features/attendance/absences/components/AbsenceDetailsPanel.tsx
- Modify: src/features/attendance/absences/components/EarlyLeaveEditorModal.tsx
- Modify: src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx
- Modify: src/features/attendance/late-early/components/LateEarlyTable.tsx
- Modify: src/features/attendance/late-early/components/IncidentDetailsDrawer.tsx
- Modify: src/features/attendance/late-early/components/MinutesEditorModal.tsx
- Create: src/features/attendance/absences/pages/__tests__/AttendanceAbsencesPage.test.tsx
- Create: src/features/attendance/late-early/pages/__tests__/AttendanceLateEarlyPage.test.tsx

**Interfaces:**
- Both pages require attendance.absences.view.
- Their correction controls consume canManageEntries.

- [ ] **Step 1: Write failing tests**

    it("shows access denied and skips absence loading without read access", () => {
      render(<AttendanceAbsencesPage />);
      expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
      expect(fetchAbsences).not.toHaveBeenCalled();
    });

    it("disables a submitted incident correction without entry management", () => {
      render(<LateEarlyTable incidents={[submittedIncident]} isReadOnly={false} canManageEntries={false} {...callbacks} />);
      expect(screen.getByRole("button", { name: /edit/i })).toBeDisabled();
    });

- [ ] **Step 2: Run the tests and verify failure**

Run: npm run test:run -- src/features/attendance/absences/pages/__tests__/AttendanceAbsencesPage.test.tsx src/features/attendance/late-early/pages/__tests__/AttendanceLateEarlyPage.test.tsx
Expected: FAIL because no view gates or entry capability exists.

- [ ] **Step 3: Implement access gates and corrections**

Wrap each default page in AttendancePermissionGuard permission="attendance.absences.view" and move its page-specific effects into inner authorized content. Derive canManageEntries from attendance.entries.manage.

Pass canManageEntries to tables, details panels, and editors. Every affected control uses the effective condition:

    const canCorrect = canManageEntries && !isReadOnly && record.sessionStatus === "SUBMITTED";

Use it for Absences mark-excused and early-leave controls, and Late/Early edit-minute and save controls. Preserve all existing session and incident eligibility checks and keep the controls rendered.

- [ ] **Step 4: Run focused verification**

Run: npm run test:run -- src/features/attendance/absences/pages/__tests__/AttendanceAbsencesPage.test.tsx src/features/attendance/late-early/pages/__tests__/AttendanceLateEarlyPage.test.tsx src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts
Expected: PASS.

Run: npm run typecheck
Expected: PASS.

- [ ] **Step 5: Commit**

    git add src/features/attendance/absences src/features/attendance/late-early
    git commit -m "feat: guard attendance corrections by permission"

## Task 5: Protect Excuses and Reports and run regression checks

**Files:**
- Modify: src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx
- Modify: src/features/attendance/excuses/components/ExcusesTable.tsx
- Modify: src/features/attendance/excuses/components/ExcuseDetailsDrawer.tsx
- Modify: src/features/attendance/excuses/components/ExcuseRequestModal.tsx
- Modify: src/features/attendance/excuses/components/DecisionModal.tsx
- Modify: src/features/attendance/reports/pages/AttendanceReportsPage.tsx
- Create: src/features/attendance/excuses/pages/__tests__/AttendanceExcusesPage.test.tsx
- Create: src/features/attendance/reports/pages/__tests__/AttendanceReportsPage.test.tsx

**Interfaces:**
- Excuses use canManageExcuses and canReviewExcuses independently.
- Reports require attendance.reports.view and have no write capability.

- [ ] **Step 1: Write failing tests**

    it("does not load excuse requests without attendance.excuses.view", () => {
      render(<AttendanceExcusesPage />);
      expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
      expect(fetchExcuseRequests).not.toHaveBeenCalled();
    });

    it("enables review while disabling request edits for a review-only user", () => {
      render(<ExcusesTable {...props} canManageExcuses={false} canReviewExcuses />);
      expect(screen.getByRole("button", { name: /approve/i })).toBeEnabled();
      expect(screen.getByRole("button", { name: /edit/i })).toBeDisabled();
    });

    it("does not load reports without attendance.reports.view", () => {
      render(<AttendanceReportsPage />);
      expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
      expect(fetchAttendanceReportSummary).not.toHaveBeenCalled();
    });

- [ ] **Step 2: Run the tests and verify failure**

Run: npm run test:run -- src/features/attendance/excuses/pages/__tests__/AttendanceExcusesPage.test.tsx src/features/attendance/reports/pages/__tests__/AttendanceReportsPage.test.tsx
Expected: FAIL because pages and controls have no split capabilities.

- [ ] **Step 3: Implement Excuses and Reports gating**

Wrap Excuses in AttendancePermissionGuard permission="attendance.excuses.view". Derive canManageExcuses from attendance.excuses.manage and canReviewExcuses from attendance.excuses.review. Pass both through the page to table, details drawer, request modal, decision modal, and create action.

Disable but keep rendered: create/edit/delete, attachment changes, and request save for !canManageExcuses; approve/reject and decision confirmation for !canReviewExcuses. Combine each with isReadOnly and current request status.

Wrap Reports in AttendancePermissionGuard permission="attendance.reports.view" and move report data effects to inner authorized content. Do not invent a report-write key.

- [ ] **Step 4: Run regression verification**

Run: npm run test:run -- src/features/attendance src/hooks/__tests__ src/lib/__tests__/api-forbidden-event.test.ts src/lib/__tests__/api-refresh-queue.test.ts src/providers/__tests__/PermissionDeniedProvider.test.tsx
Expected: PASS.

Run: npm run typecheck
Expected: PASS.

Run: npm run lint
Expected: PASS with no new warnings in touched files.

- [ ] **Step 5: Commit**

    git add src/features/attendance/excuses src/features/attendance/reports
    git commit -m "feat: guard attendance excuses and reports"
