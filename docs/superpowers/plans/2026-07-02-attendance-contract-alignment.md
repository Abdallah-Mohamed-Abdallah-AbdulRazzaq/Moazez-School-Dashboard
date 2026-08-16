# Attendance Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the existing admin attendance service layer and focused tests with `docs/moazez_attendance_frontend_contract.md`.

**Architecture:** Keep current attendance pages and component-facing models intact. Treat each service as the backend-contract boundary: serializers emit DTO-clean requests, mappers normalize backend aliases, and tests assert exact endpoints/payloads. UI shell and broader visual polish remain deferred.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, existing `apiGet/apiPost/apiPut/apiPatch/apiDelete` helpers.

---

## File Structure

- Modify: `src/features/attendance/roll-call/services/attendanceRollCallService.ts`
  - Owns roll-call query/body serialization and roll-call session/entry response mapping.
- Modify: `src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts`
  - Verifies roster, resolve, save, submit/unsubmit, correction, list, and detail contracts.
- Modify: `src/features/attendance/absences/services/attendanceAbsencesService.ts`
  - Owns derived absence incident list/summary/correction contracts.
- Modify: `src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts`
  - Verifies absence list, summary, and correction endpoint payloads.
- Modify: `src/features/attendance/late-early/services/attendanceLateEarlyService.ts`
  - Owns late/early incident filtering and late/early minute correction contracts.
- Modify: `src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts`
  - Verifies derived incident reads and full correction payloads.
- Modify: `src/features/attendance/excuses/services/attendanceExcusesService.ts`
  - Owns formal excuse list/create/update/attachment/review/delete contracts.
- Modify: `src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts`
  - Verifies DTO-clean excuse payloads, attachment linking, and review bodies.
- Modify: `src/features/attendance/reports/services/attendanceReportsService.ts`
  - Owns report query serialization and report aggregate mapping.
- Modify: `src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts`
  - Verifies lowercase `groupBy`, aggregate endpoints, and `0..1` rate handling.
- Modify as needed: `src/features/attendance/policies/services/attendancePolicyService.ts`
  - Already mostly aligned; touch only if shared DTO-clean behavior or tests expose drift.
- Modify as needed: `src/features/attendance/policies/services/__tests__/attendancePolicyService.test.ts`
  - Keep existing policy contract coverage passing.

---

### Task 1: Baseline And Contract Drift Inventory

**Files:**
- Read: `docs/moazez_attendance_frontend_contract.md`
- Read: `docs/superpowers/specs/2026-07-02-attendance-contract-alignment-design.md`
- Inspect: all service/test files listed above

- [ ] **Step 1: Run focused attendance service tests before edits**

Run:

```bash
npm run test:run -- src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts src/features/attendance/policies/services/__tests__/attendancePolicyService.test.ts
```

Expected: may pass or fail. Record failures that point to current contract drift.

- [ ] **Step 2: Search for known contract traps**

Run:

```bash
rg -n "yearId:|page:|limit:|groupBy|selectedPeriodKeys|periodIndex|correctionReason|attendanceRate|api(Post|Put|Patch|Get|Delete)" src/features/attendance -g "*.ts" -g "*.tsx"
```

Expected: identify every place where outbound request bodies/params are built for attendance services.

- [ ] **Step 3: Commit nothing**

This task is inventory only. Do not change files.

---

### Task 2: Roll Call Contract Tests First

**Files:**
- Modify: `src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts`
- Later modify: `src/features/attendance/roll-call/services/attendanceRollCallService.ts`

- [ ] **Step 1: Add/adjust failing tests for DTO-clean resolve and list payloads**

In `attendanceRollCallService.test.ts`, update the resolve-session assertion so it expects no unknown DTO fields such as `periodIndex`. The expected body should look like:

```ts
expect(mockedApiPost).toHaveBeenCalledWith("/attendance/roll-call/session/resolve", {
  academicYearId: "year-1",
  termId: "term-1",
  date: "2026-02-10",
  scopeType: "CLASSROOM",
  classroomId: "classroom-1",
  scopeId: "classroom-1",
  mode: "PERIOD",
  periodKey: "period-1",
  periodId: "period-1",
});
```

Also keep the session-list assertion limited to documented list params:

```ts
expect(mockedApiGet).toHaveBeenNthCalledWith(1, "/attendance/roll-call/sessions", {
  params: {
    academicYearId: "year-1",
    termId: "term-1",
    dateFrom: "2026-02-01",
    dateTo: "2026-02-28",
  },
});
```

- [ ] **Step 2: Add failing test for full correction payload**

Add an explicit correction call through `upsertEntry` or the existing submitted-entry path and assert the documented correction endpoint receives `status` and `correctionReason`:

```ts
await upsertEntry("year-1", "term-1", "session-1", "student-1", {
  status: "LATE",
  minutesLate: 10,
  note: "Corrected after review",
  correctionReason: "Corrected after review",
});

expect(mockedApiPost).toHaveBeenCalledWith(
  "/attendance/roll-call/sessions/session-1/entries/student-1/correct",
  {
    status: "LATE",
    lateMinutes: 10,
    note: "Corrected after review",
    correctionReason: "Corrected after review",
  },
);
```

If the public service API does not currently support `correctionReason`, the test should fail at TypeScript or runtime. That is expected.

- [ ] **Step 3: Run the roll-call test and verify failure**

Run:

```bash
npm run test:run -- src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts
```

Expected: FAIL until implementation supports DTO-clean resolve payloads and full correction payloads.

- [ ] **Step 4: Implement minimal roll-call service changes**

In `attendanceRollCallService.ts`:

- Remove unsupported outbound fields from `getOrCreateSession` payloads.
- Ensure `PERIOD` mode always sends `periodKey`.
- Keep uppercase Prisma enum values for core status, mode, and scope fields.
- Extend the entry update input path to accept an optional `correctionReason`.
- When `correctionReason` is present, call:

```ts
apiPost(`/attendance/roll-call/sessions/${sessionId}/entries/${studentId}/correct`, {
  status: entry.status,
  lateMinutes: entry.minutesLate ?? entry.lateMinutes,
  earlyLeaveMinutes: entry.minutesEarlyLeave ?? entry.earlyLeaveMinutes,
  excuseReason: entry.excuseReason,
  note: entry.note,
  correctionReason: entry.correctionReason,
});
```

Filter `undefined` values from this correction body before sending it so optional DTO fields are omitted when absent.

- Otherwise keep the draft upsert path:

```ts
apiPut(`/attendance/roll-call/sessions/${sessionId}/entries/${studentId}`, buildEntryPayload(entry));
```

- [ ] **Step 5: Run the roll-call test and verify pass**

Run:

```bash
npm run test:run -- src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit roll-call contract alignment**

Run:

```bash
git add src/features/attendance/roll-call/services/attendanceRollCallService.ts src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts
git commit -m "fix: align attendance roll-call contract"
```

---

### Task 3: Absences And Late/Early Contract Tests First

**Files:**
- Modify: `src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts`
- Modify: `src/features/attendance/absences/services/attendanceAbsencesService.ts`
- Modify: `src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts`
- Modify: `src/features/attendance/late-early/services/attendanceLateEarlyService.ts`

- [ ] **Step 1: Add absence summary contract test**

In `attendanceAbsencesService.test.ts`, add coverage for the exported `fetchAbsenceSummary` service function. If that function is missing, this test defines the required export. The test should assert params use `academicYearId`, `termId`, date range, scope fields, and status only when documented:

```ts
await fetchAbsenceSummary({
  yearId: "year-1",
  termId: "term-1",
  dateFrom: "2026-02-01",
  dateTo: "2026-02-28",
  scopeType: "SCHOOL",
  scopeIds: {},
});

expect(mockedApiGet).toHaveBeenCalledWith("/attendance/absences/summary", {
  params: {
    academicYearId: "year-1",
    termId: "term-1",
    dateFrom: "2026-02-01",
    dateTo: "2026-02-28",
    scopeType: "SCHOOL",
    scopeKey: "school",
  },
});
```

- [ ] **Step 2: Tighten late correction payload test**

In `attendanceLateEarlyService.test.ts`, keep the existing late correction assertion and ensure it includes `status: "LATE"`, `lateMinutes`, `correctionReason`, and does not send `yearId` or `termId` in the body:

```ts
expect(mockedApiPost).toHaveBeenCalledWith(
  "/attendance/roll-call/sessions/session-1/entries/student-1/correct",
  {
    status: "LATE",
    lateMinutes: 10,
    correctionReason: "Corrected late minutes",
    note: "Corrected late minutes",
  },
);
```

- [ ] **Step 3: Add early-leave correction endpoint assertion**

In `attendanceLateEarlyService.test.ts`, add or keep an early-leave edit path and assert the dedicated backend endpoint receives `earlyLeaveMinutes` and `correctionReason`:

```ts
expect(mockedApiPatch).toHaveBeenCalledWith(
  "/attendance/absences/incident-1/early-leave",
  {
    earlyLeaveMinutes: 15,
    correctionReason: "Corrected early leave minutes",
    note: "Corrected early leave minutes",
  },
);
```

- [ ] **Step 4: Run absence and late/early tests and verify failure**

Run:

```bash
npm run test:run -- src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts
```

Expected: FAIL if summary export or payload shape is missing.

- [ ] **Step 5: Implement absence summary and DTO-clean filters**

In `attendanceAbsencesService.ts`, export a summary function:

```ts
export interface AbsenceSummary {
  totalIncidents: number;
  absentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  excusedCount: number;
  affectedStudentsCount: number;
}

export async function fetchAbsenceSummary(
  params: { yearId: string; termId: string } & Partial<AbsencesFilters>
): Promise<AbsenceSummary> {
  return apiGet<AbsenceSummary>("/attendance/absences/summary", {
    params: buildAbsenceQueryParams(params),
  });
}
```

If there is no shared `buildAbsenceQueryParams`, create one in the same file and reuse it from `fetchAbsenceRecords`.

- [ ] **Step 6: Ensure late/early correction implementation matches contract**

In `attendanceLateEarlyService.ts`, keep early-leave correction on `/attendance/absences/:id/early-leave` and ensure late correction posts:

```ts
{
  status: "LATE",
  lateMinutes: params.minutes,
  correctionReason: "Corrected late minutes",
  note: "Corrected late minutes",
}
```

Also ensure early-leave correction patches:

```ts
{
  earlyLeaveMinutes: params.minutes,
  correctionReason: "Corrected early leave minutes",
  note: "Corrected early leave minutes",
}
```

- [ ] **Step 7: Run absence and late/early tests and verify pass**

Run:

```bash
npm run test:run -- src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit incident contract alignment**

Run:

```bash
git add src/features/attendance/absences/services/attendanceAbsencesService.ts src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts src/features/attendance/late-early/services/attendanceLateEarlyService.ts src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts
git commit -m "fix: align attendance incident contracts"
```

---

### Task 4: Formal Excuses Contract Tests First

**Files:**
- Modify: `src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts`
- Modify: `src/features/attendance/excuses/services/attendanceExcusesService.ts`

- [ ] **Step 1: Tighten create/update payload tests to omit unknown and undefined fields**

In `attendanceExcusesService.test.ts`, change create/update expectations so payloads do not include `undefined` properties. The create expectation should include only DTO fields with actual values:

```ts
expect(mockedApiPost).toHaveBeenNthCalledWith(1, "/attendance/excuse-requests", {
  academicYearId: "year-1",
  termId: "term-1",
  studentId: "student-1",
  type: "ABSENCE",
  dateFrom: "2026-02-10",
  dateTo: "2026-02-10",
  reasonAr: "موعد طبي",
  reasonEn: "Medical appointment",
});
```

- [ ] **Step 2: Add attachment-link test with already-uploaded file IDs**

Add a create or update case with attachments shaped like the UI model and assert the service links uploaded files using `{ fileIds }`:

```ts
await createExcuseRequest({
  yearId: "year-1",
  termId: "term-1",
  studentId: "student-1",
  type: "ABSENCE",
  dateFrom: "2026-02-10",
  dateTo: "2026-02-10",
  attachments: [{ id: "file-1", name: "medical.pdf", url: "/files/file-1" }],
} as any);

expect(mockedApiPost).toHaveBeenCalledWith(
  "/attendance/excuse-requests/excuse-1/attachments",
  { fileIds: ["file-1"] },
);
```

- [ ] **Step 3: Run excuses test and verify failure**

Run:

```bash
npm run test:run -- src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts
```

Expected: FAIL if serializers still include undefined fields or attachment IDs are not linked correctly.

- [ ] **Step 4: Implement DTO-clean excuse serializers**

In `attendanceExcusesService.ts`, add a local helper:

```ts
function omitUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}
```

Wrap `buildRequestPayload` and `buildUpdatePayload` return values with `omitUndefined`. Do not include UI-only fields such as names, scope, local policy data, or attachment objects in create/update DTO bodies.

- [ ] **Step 5: Preserve attachment linking via file IDs**

Keep `linkAttachments` separate from create/update. It should derive file IDs from already-uploaded attachments and call:

```ts
await apiPost(`${BASE}/${requestId}/attachments`, { fileIds });
```

It must not send multipart data.

- [ ] **Step 6: Run excuses test and verify pass**

Run:

```bash
npm run test:run -- src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit formal excuse contract alignment**

Run:

```bash
git add src/features/attendance/excuses/services/attendanceExcusesService.ts src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts
git commit -m "fix: align attendance excuse contracts"
```

---

### Task 5: Reports Contract Tests First

**Files:**
- Modify: `src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts`
- Modify: `src/features/attendance/reports/services/attendanceReportsService.ts`

- [ ] **Step 1: Update backend report fixtures to use `0..1` rates**

In `attendanceReportsService.test.ts`, change backend fixture rates from `80` to `0.8` and assert mapped presentation values only where the current frontend model expects percent display values. Backend DTO rates are `0..1`; current component-facing report models may map them to percent numbers only at the service boundary for backward compatibility.

```ts
attendanceRate: 0.8,
absenceRate: 0.1,
lateRate: 0.1,
```

Then assert:

```ts
expect(report.overview.cards.find((card) => card.key === "attendanceRate")?.value).toBe(80);
expect(report.trend.points).toEqual([
  expect.objectContaining({ dateFrom: "2026-02-10", attendanceRate: 80 }),
]);
expect(report.performance.classroom).toEqual([
  expect.objectContaining({ id: "classroom-1", attendanceRate: 80 }),
]);
```

- [ ] **Step 2: Keep lowercase `groupBy` assertion**

Ensure the scope-breakdown assertion stays:

```ts
groupBy: "classroom",
```

Do not uppercase this value.

- [ ] **Step 3: Add derived daily absences endpoint expectation**

Add a separate test for an exported `fetchDerivedDailyAbsences` service function. This function should call the documented endpoint without forcing the existing dashboard/report aggregator to fetch data it does not consume.

```ts
await expect(
  fetchDerivedDailyAbsences({
    yearId: "year-1",
    termId: "term-1",
    dateFrom: "2026-02-01",
    dateTo: "2026-02-28",
    scopeType: "CLASSROOM",
    scopeIds: { classroomId: "classroom-1" },
  }),
).resolves.toEqual([
  expect.objectContaining({
    date: "2026-02-10",
    studentId: "student-1",
    derivedStatus: "ABSENT",
    reportOnly: true,
  }),
]);
```

Assert the endpoint call:

```ts
expect(mockedApiGet).toHaveBeenCalledWith("/attendance/reports/derived-daily-absences", {
  params: {
    academicYearId: "year-1",
    termId: "term-1",
    dateFrom: "2026-02-01",
    dateTo: "2026-02-28",
    scopeType: "CLASSROOM",
    scopeKey: "classroom:classroom-1",
  },
});
```

Only call `fetchDerivedDailyAbsences` from `fetchAttendanceReportSummary` if an existing report section consumes the data. Do not add a network dependency to the dashboard/report aggregator that returns no product value.

- [ ] **Step 4: Run reports test and verify failure**

Run:

```bash
npm run test:run -- src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts
```

Expected: FAIL if backend `0..1` rates are not converted for current UI models.

- [ ] **Step 5: Implement rate normalization at mapper boundary**

In `attendanceReportsService.ts`, add a small mapper helper near backend report mappers:

```ts
function toPercentRate(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value <= 1 ? Math.round(value * 100) : value;
}
```

Use it only when mapping backend DTO rates into current component-facing models that expect percentages. Keep request params, raw backend response handling, and any new derived-daily-absence models documented as `0..1` backend contracts.

- [ ] **Step 6: Run reports test and verify pass**

Run:

```bash
npm run test:run -- src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit report contract alignment**

Run:

```bash
git add src/features/attendance/reports/services/attendanceReportsService.ts src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts
git commit -m "fix: align attendance report contracts"
```

---

### Task 6: Policy Regression And Error Envelope Coverage

**Files:**
- Modify as needed: `src/features/attendance/policies/services/__tests__/attendancePolicyService.test.ts`
- Modify as needed: `src/features/attendance/policies/services/attendancePolicyService.ts`
- Modify as needed: `src/lib/__tests__/api-error.test.ts`
- Modify as needed: `src/lib/api-error.ts`

- [ ] **Step 1: Run policy service tests**

Run:

```bash
npm run test:run -- src/features/attendance/policies/services/__tests__/attendancePolicyService.test.ts
```

Expected: PASS. If it fails, only fix drift directly related to the approved spec.

- [ ] **Step 2: Check existing error-envelope tests**

Run:

```bash
npm run test:run -- src/lib/__tests__/api-error.test.ts src/lib/__tests__/api-refresh-queue.test.ts
```

Expected: PASS. If there is no assertion for the documented envelope shape, add one to `api-error.test.ts` using:

```ts
{
  error: {
    code: "validation.failed",
    message: "Request validation failed",
    details: { fields: ["termId must be a UUID"] },
    traceId: "trace-1",
  },
}
```

Assert the parsed error exposes code, message, details, and trace ID according to the existing `ApiError` API.

- [ ] **Step 3: Implement only required error parser changes**

If the test fails, adjust `src/lib/api-error.ts` to preserve the envelope fields already used by the app. Do not change user-facing toast behavior unless an existing test requires it.

- [ ] **Step 4: Re-run policy and API error tests**

Run:

```bash
npm run test:run -- src/features/attendance/policies/services/__tests__/attendancePolicyService.test.ts src/lib/__tests__/api-error.test.ts src/lib/__tests__/api-refresh-queue.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit policy/error-envelope regression coverage if changed**

If files changed, run:

```bash
git add src/features/attendance/policies/services/attendancePolicyService.ts src/features/attendance/policies/services/__tests__/attendancePolicyService.test.ts src/lib/api-error.ts src/lib/__tests__/api-error.test.ts
git commit -m "test: cover attendance error envelope contract"
```

If no files changed, do not create an empty commit.

---

### Task 7: Final Verification

**Files:**
- All changed service and test files

- [ ] **Step 1: Run all focused attendance service tests**

Run:

```bash
npm run test:run -- src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts src/features/attendance/policies/services/__tests__/attendancePolicyService.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run component regression tests that already cover policy behavior**

Run:

```bash
npm run test:run -- src/features/attendance/policies/components/__tests__/PolicyWizardDialog.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS or only pre-existing warnings unrelated to changed files. If lint fails in changed files, fix it before completion.

- [ ] **Step 5: Review final diff for scope control**

Run:

```bash
git diff --stat HEAD
git diff -- src/features/attendance src/lib
```

Expected: changes are limited to service contract alignment, tests, and any necessary shared error parser coverage. No shared workspace shell or UI redesign files should be present.

- [ ] **Step 6: Commit final cleanup if needed**

If final fixes were made after the task commits, run:

```bash
git add src/features/attendance src/lib
git commit -m "chore: finish attendance contract verification"
```

If no files changed since the last task commit, do not create an empty commit.
