# Attendance Excuse Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make create and edit excuse requests match the backend contract, preserve a correct academic hierarchy, avoid redundant requests, and provide an accessible, resilient modal workflow.

**Architecture:** Keep scope as transient create-time lookup context, while mutation DTO mapping stays in the service layer. Move policy derivation to pure functions over one cached year/term policy snapshot, isolate hierarchy and attachment-diff rules in tested utilities, and make the modal the sole owner of pre-submit validation so the page only mutates and refreshes.

**Tech Stack:** Next.js, React, TypeScript, next-intl, Tailwind CSS, Vitest, Testing Library, existing API adapters and UI primitives.

## Global Constraints

- Preserve all unrelated dirty-worktree changes.
- Do not send scope fields in create or update excuse mutations.
- Do not send duplicate `selectedPeriodIds` and `selectedPeriodKeys`; mutations use canonical `selectedPeriodKeys`.
- Do not request a roster before an explicit complete create scope, or at all in ordinary edit mode.
- Do not request timetable configuration for `ABSENCE`.
- Require grade, section, or classroom context for create-time `LATE` and `EARLY_LEAVE`; never resolve school or stage directly to term.
- Do not request policies because reason text or attachment state changed.
- Treat the edit-mode student as immutable because the backend PATCH DTO does not accept `studentId`.
- Link only newly uploaded attachment file IDs in edit mode.
- Keep Arabic and English copy equivalent and preserve visible keyboard focus and accessible labels.

---

### Task 1: Stabilize and verify the academic hierarchy

**Files:**
- Modify: `src/features/attendance/excuses/components/ExcuseRequestModal.tsx`
- Modify: `src/features/attendance/excuses/utils/excuseScopeReadiness.ts`
- Delete if unused: `src/features/attendance/excuses/utils/excuseScopeType.ts`
- Create: `src/features/attendance/excuses/utils/excuseHierarchy.ts`
- Create: `src/features/attendance/excuses/utils/excuseHierarchy.test.ts`
- Modify: `src/features/attendance/excuses/utils/excuseScopeReadiness.test.ts`

**Interfaces:**
- Consumes: `AttendanceScopeType`, `AttendanceScopeIds`, and `isScopeSelectionComplete`.
- Produces: `updateExcuseHierarchy(scopeType, currentIds, level, value): AttendanceScopeIds` and `getReadyExcuseScope(scopeType, scopeIds, explicitSelection, requestType = "ABSENCE"): { scopeType; scopeIds } | null`.

- [ ] **Step 1: Write failing cascade and readiness tests**

```ts
it("keeps CLASSROOM as the target while filling its ancestors", () => {
  expect(updateExcuseHierarchy("CLASSROOM", {}, "stageId", "stage-1")).toEqual({ stageId: "stage-1" });
});

it("clears descendants when an ancestor changes", () => {
  const current = { stageId: "s1", gradeId: "g1", sectionId: "x1", classroomId: "c1" };
  expect(updateExcuseHierarchy("CLASSROOM", current, "gradeId", "g2")).toEqual({
    stageId: "s1",
    gradeId: "g2",
  });
});

it("does not treat the initial SCHOOL value as an explicit ready scope", () => {
  expect(getReadyExcuseScope("SCHOOL", {}, false)).toBeNull();
  expect(getReadyExcuseScope("SCHOOL", {}, true)).toEqual({ scopeType: "SCHOOL", scopeIds: {} });
});

it("rejects broad scopes for a period-based request", () => {
  expect(getReadyExcuseScope("STAGE", { stageId: "stage-1" }, true, "LATE")).toBeNull();
  expect(getReadyExcuseScope("GRADE", { stageId: "stage-1", gradeId: "grade-1" }, true, "LATE")).not.toBeNull();
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm test -- --run src/features/attendance/excuses/utils/excuseHierarchy.test.ts src/features/attendance/excuses/utils/excuseScopeReadiness.test.ts`

Expected: FAIL because `updateExcuseHierarchy` and the explicit-selection readiness argument do not exist.

- [ ] **Step 3: Implement deterministic hierarchy updates**

```ts
type HierarchyLevel = keyof AttendanceScopeIds;

export function updateExcuseHierarchy(
  _scopeType: AttendanceScopeType,
  current: AttendanceScopeIds,
  level: HierarchyLevel,
  value: string,
): AttendanceScopeIds {
  if (level === "stageId") return value ? { stageId: value } : {};
  if (level === "gradeId") return value ? { stageId: current.stageId, gradeId: value } : { stageId: current.stageId };
  if (level === "sectionId") return value
    ? { stageId: current.stageId, gradeId: current.gradeId, sectionId: value }
    : { stageId: current.stageId, gradeId: current.gradeId };
  return value ? { ...current, classroomId: value } : { ...current, classroomId: undefined };
}
```

Update readiness to return `null` until `explicitSelection` is true, then apply `isScopeSelectionComplete`. For `LATE` and `EARLY_LEAVE`, also reject `SCHOOL` and `STAGE`. In the modal, present request type before context, remove `inferExcuseScopeType`, preserve the user's selected target type, and clear the student whenever hierarchy IDs change. When switching from a broad-scope absence to a period-based type, preserve reason/date/attachment fields but clear incompatible scope/student state and focus the context guidance.

- [ ] **Step 4: Run hierarchy tests**

Run: `npm test -- --run src/features/attendance/excuses/utils/excuseHierarchy.test.ts src/features/attendance/excuses/utils/excuseScopeReadiness.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the hierarchy repair**

```bash
git add src/features/attendance/excuses/components/ExcuseRequestModal.tsx src/features/attendance/excuses/utils/excuseHierarchy.ts src/features/attendance/excuses/utils/excuseHierarchy.test.ts src/features/attendance/excuses/utils/excuseScopeReadiness.ts src/features/attendance/excuses/utils/excuseScopeReadiness.test.ts src/features/attendance/excuses/utils/excuseScopeType.ts
git commit -m "fix(attendance): stabilize excuse scope hierarchy"
```

### Task 2: Make mutation payloads canonical and attachments differential

**Files:**
- Modify: `src/features/attendance/excuses/types.ts`
- Modify: `src/features/attendance/excuses/services/attendanceExcusesService.ts`
- Modify: `src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts`
- Create: `src/features/attendance/excuses/utils/excuseAttachmentDiff.ts`
- Create: `src/features/attendance/excuses/utils/excuseAttachmentDiff.test.ts`

**Interfaces:**
- Consumes: existing `ExcuseRequest` and `AttachmentMeta`.
- Produces: canonical request bodies with `selectedPeriodKeys`, `getNewAttachmentFileIds(current, initial): string[]`, and `ExcuseAttachmentLinkError` carrying the successfully created or updated request.

- [ ] **Step 1: Add failing contract tests**

```ts
expect(mockedApiPost).toHaveBeenCalledWith("/attendance/excuse-requests", {
  academicYearId: "year-1",
  termId: "term-1",
  studentId: "student-1",
  type: "LATE",
  dateFrom: "2026-07-01",
  dateTo: "2026-07-01",
  selectedPeriodKeys: ["period-1"],
  lateMinutes: 10,
  reasonAr: null,
  reasonEn: "Transport delay",
});
expect(mockedApiPost.mock.calls[0][1]).not.toHaveProperty("selectedPeriodIds");

expect(getNewAttachmentFileIds(
  [{ id: "existing", name: "old.pdf", size: 1, type: "application/pdf" }, { id: "new", name: "new.pdf", size: 1, type: "application/pdf" }],
  [{ id: "existing", name: "old.pdf", size: 1, type: "application/pdf" }],
)).toEqual(["new"]);

await expect(createExcuseRequest(payloadWithAttachment)).rejects.toMatchObject({
  name: "ExcuseAttachmentLinkError",
  request: expect.objectContaining({ id: "excuse-1" }),
});
```

- [ ] **Step 2: Run service and diff tests to verify failure**

Run: `npm test -- --run src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts src/features/attendance/excuses/utils/excuseAttachmentDiff.test.ts`

Expected: FAIL because mutation aliases are duplicated, empty reasons are not normalized to `null`, and edit linking includes existing files.

- [ ] **Step 3: Implement canonical builders and attachment diffing**

```ts
function normalizeReason(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getNewAttachmentFileIds(current: AttachmentMeta[], initial: AttachmentMeta[]) {
  const existing = new Set(initial.map((item) => item.id));
  return [...new Set(current.map((item) => item.id).filter((id) => id && !existing.has(id)))];
}
```

Build create/update DTOs using only backend DTO property names. Pass the initial attachment collection to `updateExcuseRequest`, link only the computed new IDs, and continue skipping the attachment endpoint when the list is empty. If the mutation succeeds but attachment linking fails, throw `ExcuseAttachmentLinkError` with the mapped request so the UI can report a partial success and retain the failed files for retry.

- [ ] **Step 4: Run contract tests**

Run: `npm test -- --run src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts src/features/attendance/excuses/utils/excuseAttachmentDiff.test.ts`

Expected: PASS, including assertions that no redundant attachment POST occurs.

- [ ] **Step 5: Commit the contract repair**

```bash
git add src/features/attendance/excuses/types.ts src/features/attendance/excuses/services/attendanceExcusesService.ts src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts src/features/attendance/excuses/utils/excuseAttachmentDiff.ts src/features/attendance/excuses/utils/excuseAttachmentDiff.test.ts
git commit -m "fix(attendance): align excuse mutations with backend"
```

### Task 3: Load one policy snapshot and derive policy state locally

**Files:**
- Modify: `src/features/attendance/excuses/services/attendanceExcusesService.ts`
- Modify: `src/features/attendance/excuses/components/ExcuseRequestModal.tsx`
- Create: `src/features/attendance/excuses/utils/excusePolicyState.ts`
- Create: `src/features/attendance/excuses/utils/excusePolicyState.test.ts`
- Modify: `src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx`
- Create: `src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx`
- Create: `src/features/attendance/excuses/pages/__tests__/AttendanceExcusesPage.test.tsx`

**Interfaces:**
- Consumes: `fetchPolicies`, `resolveEffectiveExcuseAttendancePolicy`, and `getExcusePolicyIssue`.
- Produces: `deriveExcusePolicyState(policies, input): { policy; issue }` with no network behavior.

- [ ] **Step 1: Write failing pure-derivation and request-count tests**

```ts
it("derives reason and attachment issues without fetching", () => {
  const result = deriveExcusePolicyState(policies, {
    dateFrom: "2026-07-01",
    dateTo: "2026-07-01",
    scopeType: "CLASSROOM",
    scopeIds,
    reasonAr: "",
    reasonEn: "",
    attachments: [],
  });
  expect(result.issue?.code).toBe("REASON_REQUIRED");
});
```

Add a modal test that types multiple reason characters and changes attachments after initial policy loading, then asserts `fetchPolicies` was called once.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- --run src/features/attendance/excuses/utils/excusePolicyState.test.ts src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx`

Expected: FAIL because the modal currently invokes two policy-backed functions whenever reason or attachment dependencies change.

- [ ] **Step 3: Implement snapshot loading and local derivation**

```ts
export function deriveExcusePolicyState(policies: AttendancePolicy[], input: ExcusePolicyInput) {
  const policy = resolveEffectiveExcuseAttendancePolicy(
    policies,
    input.dateFrom,
    input.scopeType,
    input.scopeIds,
  );
  return { policy, issue: getExcusePolicyIssue(input, policies) };
}
```

Load policies in one modal effect keyed only by `isOpen`, `yearId`, and `termId`. Use `useMemo` for local derivation. Remove `validateExcusePolicyRange` and `resolveRequestPolicy` calls from `AttendanceExcusesPage.handleSave`; the modal has already validated the same snapshot before invoking `onSave`.

- [ ] **Step 4: Run policy and page tests**

Run: `npm test -- --run src/features/attendance/excuses/utils/excusePolicyState.test.ts src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx src/features/attendance/excuses/pages/__tests__/AttendanceExcusesPage.test.tsx`

Expected: PASS with one policy list call per modal year/term context and no submit-time policy reads.

- [ ] **Step 5: Commit policy request optimization**

```bash
git add src/features/attendance/excuses/services/attendanceExcusesService.ts src/features/attendance/excuses/components/ExcuseRequestModal.tsx src/features/attendance/excuses/utils/excusePolicyState.ts src/features/attendance/excuses/utils/excusePolicyState.test.ts src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx src/features/attendance/excuses/pages/__tests__/AttendanceExcusesPage.test.tsx
git commit -m "perf(attendance): reuse excuse policy snapshot"
```

### Task 4: Enforce mode-specific roster and timetable loading

**Files:**
- Modify: `src/features/attendance/excuses/components/ExcuseRequestModal.tsx`
- Modify: `src/features/attendance/excuses/utils/excusePeriodLoading.ts`
- Modify: `src/features/attendance/excuses/utils/excusePeriodLoading.test.ts`
- Modify: `src/features/attendance/excuses/utils/excuseTimetableScope.ts`
- Modify: `src/features/attendance/excuses/utils/excuseTimetableScope.test.ts`
- Modify: `src/features/attendance/excuses/utils/timetableConfigCache.ts`
- Modify: `src/features/attendance/excuses/utils/timetableConfigCache.test.ts`
- Modify: `src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx`

**Interfaces:**
- Consumes: ready explicit scope, request type, edit/create mode, and cached `fetchTimetableConfig`.
- Produces: `getExcuseTimetableCandidates(academicYearId, termId, scopeType, scopeIds): FetchTimetableConfigParams[]`, `resolveCachedExcuseTimetable(candidates): Promise<TimetableConfig | null>`, and request effects that ignore stale results.

- [ ] **Step 1: Add failing request-boundary tests**

```ts
expect(fetchRoster).not.toHaveBeenCalled(); // initial create render
await selectCompleteClassroomScope();
expect(fetchRoster).toHaveBeenCalledTimes(1);

renderModal({ initialRequest });
expect(fetchRoster).not.toHaveBeenCalled(); // edit render

renderModal({ type: "ABSENCE" });
expect(fetchTimetableConfig).not.toHaveBeenCalled();

expect(getExcuseTimetableCandidates("year-1", "term-1", "CLASSROOM", {
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
})).toEqual([
  { academicYearId: "year-1", termId: "term-1", scopeType: "CLASSROOM", gradeId: "grade-1", sectionId: "section-1", classroomId: "classroom-1" },
  { academicYearId: "year-1", termId: "term-1", scopeType: "SECTION", gradeId: "grade-1", sectionId: "section-1" },
  { academicYearId: "year-1", termId: "term-1", scopeType: "GRADE", gradeId: "grade-1" },
  { academicYearId: "year-1", termId: "term-1", scopeType: "TERM" },
]);

expect(getExcuseTimetableCandidates("year-1", "term-1", "STAGE", {
  stageId: "stage-1",
})).toEqual([]);
```

Add tests proving `SCHOOL` and `STAGE` produce no timetable candidates, a found classroom config prevents section/grade/term calls, a classroom 404 falls through in order, and non-404 errors stop resolution. Add a deferred-promise test where scope A resolves after scope B and assert only B appears in roster/period options.

- [ ] **Step 2: Run modal and cache tests to verify failure**

Run: `npm test -- --run src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx src/features/attendance/excuses/utils/excusePeriodLoading.test.ts src/features/attendance/excuses/utils/excuseTimetableScope.test.ts src/features/attendance/excuses/utils/timetableConfigCache.test.ts`

Expected: FAIL on initial create roster loading, edit roster loading, or stale response behavior.

- [ ] **Step 3: Implement guarded effects**

Replace the single exact-scope helper with a candidate builder ordered `CLASSROOM > SECTION > GRADE > TERM`. Return no candidates for `SCHOOL` or `STAGE`. Include all selected ancestor IDs supported by the backend DTO so its hierarchy consistency checks run. Resolve candidates sequentially through the existing exact-config cache and stop at the first non-null config.

Use a monotonically increasing request token in each asynchronous effect:

```ts
const rosterRequestId = useRef(0);
const requestId = ++rosterRequestId.current;
const students = await fetchRoster(...);
if (requestId === rosterRequestId.current) setRoster(students);
```

Roster dependencies must exclude reason, attachments, minutes, and request type. Timetable dependencies must include type and effective hierarchy, use the exact-candidate promise cache, and clear irrelevant periods when switching to `ABSENCE`. In edit mode, retain current period keys without a roster call; request context only when a new timetable selection is required and unavailable.

- [ ] **Step 4: Run request-boundary tests**

Run: `npm test -- --run src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx src/features/attendance/excuses/utils/excusePeriodLoading.test.ts src/features/attendance/excuses/utils/excuseTimetableScope.test.ts src/features/attendance/excuses/utils/timetableConfigCache.test.ts`

Expected: PASS with exact call-count assertions.

- [ ] **Step 5: Commit request orchestration**

```bash
git add src/features/attendance/excuses/components/ExcuseRequestModal.tsx src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx src/features/attendance/excuses/utils/excusePeriodLoading.ts src/features/attendance/excuses/utils/excusePeriodLoading.test.ts src/features/attendance/excuses/utils/excuseTimetableScope.ts src/features/attendance/excuses/utils/excuseTimetableScope.test.ts src/features/attendance/excuses/utils/timetableConfigCache.ts src/features/attendance/excuses/utils/timetableConfigCache.test.ts
git commit -m "perf(attendance): guard excuse lookup requests"
```

### Task 5: Refine create/edit UX and accessible error recovery

**Files:**
- Modify: `src/features/attendance/excuses/components/ExcuseRequestModal.tsx`
- Modify: `src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: the validated form state and guarded request states from Tasks 1-4.
- Produces: one responsive, accessible modal with explicit create/edit differences and retry actions.

- [ ] **Step 1: Generate the required UI guidance before editing**

Run:

```bash
python .codex/skills/ui-ux-pro-max/scripts/search.py "education dashboard attendance excuse form modal accessible bilingual" --design-system -p "Moazez SIS"
python .codex/skills/ui-ux-pro-max/scripts/search.py "modal form validation loading retry accessibility" --domain ux
python .codex/skills/ui-ux-pro-max/scripts/search.py "responsive accessible modal form" --stack react
```

Expected: recommendations emphasizing clear grouping, visible focus, inline validation, localized loading, and stable responsive actions. Apply them within the existing design tokens rather than introducing a new visual system.

- [ ] **Step 2: Add failing UI behavior and accessibility tests**

```ts
expect(screen.getByText(initialRequest.studentNameEn)).toBeVisible();
expect(screen.queryByRole("combobox", { name: /student/i })).not.toBeInTheDocument();
expect(screen.getByRole("button", { name: /remove old\.pdf/i })).toBeVisible();
expect(screen.getByRole("button", { name: /retry loading students/i })).toBeVisible();
```

Test tab-accessible actions, field-error association, type-specific field clearing, create/edit headings, equivalent Arabic copy keys, broad-scope guidance for period-based types, preservation of saved edit period keys, and an `ExcuseAttachmentLinkError` state that says the request was saved while evidence still needs retrying.

- [ ] **Step 3: Run modal and translation tests to verify failure**

Run: `npm test -- --run src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx src/messages/__tests__`

Expected: FAIL because edit currently renders editable hierarchy/student controls, remove buttons lack accessible names, and retry copy/actions are missing.

- [ ] **Step 4: Implement the refined modal**

Structure the body into labeled sections: attendance context, student, incident details, reason, and evidence. Render edit student data in a read-only summary. Use existing `Button`, `Select`, `Input`, and upload primitives; add `aria-label={t("removeAttachment", { name: attachment.name })}` to attachment removal. Add localized retry buttons that increment a retry token consumed only by the failed resource effect. Catch `ExcuseAttachmentLinkError` separately, preserve the request and pending file IDs, and offer an evidence-link retry without repeating the create/update mutation. Keep the action footer reachable on mobile and avoid hover transforms or motion beyond existing 150-300ms color transitions.

- [ ] **Step 5: Run modal, translation, and accessibility-focused tests**

Run: `npm test -- --run src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx src/messages/__tests__`

Expected: PASS in English and Arabic test cases.

- [ ] **Step 6: Commit UX improvements**

```bash
git add src/features/attendance/excuses/components/ExcuseRequestModal.tsx src/features/attendance/excuses/components/__tests__/ExcuseRequestModal.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat(attendance): refine excuse request modal UX"
```

### Task 6: Integrate, quality-review, and verify the complete flow

**Files:**
- Modify only if verification exposes a scoped defect: files already listed in Tasks 1-5.

**Interfaces:**
- Consumes: all deliverables from Tasks 1-5.
- Produces: verified create/edit behavior with clean production and test-code reviews.

- [ ] **Step 1: Run the focused attendance excuse suite**

Run: `npm test -- --run src/features/attendance/excuses`

Expected: PASS with no unhandled promise rejection or React act warning.

- [ ] **Step 2: Run TypeScript and lint verification**

Run: `npm run type-check`

Expected: exit 0.

Run: `npx eslint src/features/attendance/excuses src/messages/en.json src/messages/ar.json`

Expected: exit 0 or only documented pre-existing warnings outside changed lines.

- [ ] **Step 3: Run the relevant attendance integration tests**

Run: `npm test -- --run src/features/attendance/roll-call src/features/attendance/policies src/features/attendance/excuses`

Expected: PASS.

- [ ] **Step 4: Review changed production code with clean-code-guard**

Inspect the final diff for redundant effects, mixed responsibilities, mutation aliases, unstable dependencies, unsafe assertions, stale-state races, and unrelated changes. Correct only findings within this feature, then rerun Steps 1-3.

- [ ] **Step 5: Review changed test code with test-guard**

Confirm tests assert observable behavior and exact request boundaries without duplicating implementation details, brittle snapshots, excessive cases, or meaningless mocks. Correct findings, then rerun the focused suite.

- [ ] **Step 6: Inspect the final scoped diff**

Run: `git diff --check 661a1e5..HEAD && git status --short`

Expected: no whitespace errors; status contains only the user's unrelated pre-existing changes.

- [ ] **Step 7: Commit any verification-only corrections**

```bash
git add src/features/attendance/excuses src/messages/en.json src/messages/ar.json
git commit -m "test(attendance): verify excuse modal workflow"
```

Skip this commit when Steps 1-6 require no corrections.
