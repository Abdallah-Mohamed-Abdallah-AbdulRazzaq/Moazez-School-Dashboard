# Academic Content Contract Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining frontend gaps against the existing academic-content backend contract across all six content-type pages without changing the backend.

**Architecture:** Extend each specialized list model and filter surface with missing contract-backed filters while keeping one paginated request per page. Reuse the existing audience policy, add a focused notification-policy settings slice beside existing file/workflow settings, and render optional readiness metadata through one safe shared presenter.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS, existing MOAZEZ UI components, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-06-academic-content-contract-completion-spec.md`

## Global Constraints

- Do not change backend endpoints or request/response contracts.
- Backend authority is revision `f0521cb452b27e22313986408ed79957d76850e6` of `Moazez-Backend`.
- Use components from `src/components/ui/` for controls and interaction patterns.
- Keep one main paginated list request per page; never fetch detail data per row.
- Add `weeklyDateFrom` and `weeklyDateTo` as normal date inputs inside the Weekly Plans filter panel and preserve backend overlap semantics.
- Present Online Sessions `today` as “Starts today”; the backend cannot correctly query cross-day running sessions.
- Preserve all existing specialized detail-page behavior.
- Run clean-code-guard after every production-code task and test-guard after every test-code task.
- Run focused tests during implementation. Ask before `npm run test:run`, `npm run test:all`, or any full-suite command.
- Preserve unrelated dirty-worktree changes and stage only task files.

---

## File structure

### New production files

- `src/features/academic-content/model/academicContentListFilters.ts` — audience options and hierarchical reset constants.
- `src/features/academic-content/components/filters/TagFilterInput.tsx` — shared bounded tag control.
- `src/features/academic-content/components/editor/ReadinessReasonDetails.tsx` — safe structured reason-detail presenter.
- `src/features/academic-content/model/academicContentNotificationPolicy.ts` — diffing and reminder-offset validation.
- `src/features/academic-content/hooks/useAcademicContentNotificationPolicy.ts` — policy load/save state.
- `src/features/academic-content/components/settings/AcademicContentSettingsCard.tsx` — settings navigation card.
- `src/features/academic-content/pages/AcademicContentSettingsPage.tsx` — settings landing page.
- `src/features/academic-content/pages/AcademicContentNotificationPolicyPage.tsx` — policy editor.
- `src/app/[lang]/(dashboard)/academic-content-hub/settings/page.tsx` — settings route.
- `src/app/[lang]/(dashboard)/academic-content-hub/settings/notifications/page.tsx` — notification route.

### Existing production areas modified

- Six list models under `src/features/academic-content/model/`.
- Six list filters under `src/features/academic-content/components/*/`.
- `src/features/academic-content/types/contracts.ts`, `src/features/academic-content/services/academicContentApi.ts`, `src/features/academic-content/components/editor/ReadinessPanel.tsx`, and `src/features/academic-content/components/overview/AcademicContentQuickLinks.tsx`.
- `src/messages/en.json` and `src/messages/ar.json`.

### Test surfaces

- Model tests for all six list models and the two new shared models.
- Presentation tests for all six list pages.
- Component tests for tag and readiness detail rendering.
- API, hook, settings-page, overview, and translation parity tests.

---

### Task 1: Establish shared list-filter policy

**Files:**
- Create: `src/features/academic-content/model/academicContentListFilters.ts`
- Create: `src/features/academic-content/model/__tests__/academicContentListFilters.test.ts`
- Create: `src/features/academic-content/components/filters/TagFilterInput.tsx`
- Create: `src/features/academic-content/components/filters/__tests__/TagFilterInput.test.tsx`

**Interfaces:**
- Consumes: `allowedAudiences(type)` and academic-content contract types.
- Produces: `listAudienceOptions`, `STAGE_FILTER_RESET`, `GRADE_FILTER_RESET`, `SECTION_FILTER_RESET`, and `TagFilterInput`.

- [ ] **Step 1: Write failing audience/reset tests**

```ts
expect(listAudienceOptions("ONLINE_SESSION", String).map(({ value }) => value))
  .toEqual(["STUDENTS", "STUDENTS_AND_GUARDIANS"]);
expect(STAGE_FILTER_RESET).toEqual({ gradeId: "", sectionId: "", classroomId: "" });
expect(GRADE_FILTER_RESET).toEqual({ sectionId: "", classroomId: "" });
expect(SECTION_FILTER_RESET).toEqual({ classroomId: "" });
```

- [ ] **Step 2: Run the test and confirm missing-module failure**

```powershell
npx vitest run src/features/academic-content/model/__tests__/academicContentListFilters.test.ts
```

- [ ] **Step 3: Implement the shared policy**

```ts
export const STAGE_FILTER_RESET = { gradeId: "", sectionId: "", classroomId: "" } as const;
export const GRADE_FILTER_RESET = { sectionId: "", classroomId: "" } as const;
export const SECTION_FILTER_RESET = { classroomId: "" } as const;

export function listAudienceOptions(type: AcademicContentType, label: (value: AcademicContentAudience) => string) {
  return allowedAudiences(type).map((value) => ({ value, label: label(value) }));
}
```

- [ ] **Step 4: Write the failing bounded-input test**

```tsx
fireEvent.change(screen.getByLabelText("Tag"), { target: { value: "x".repeat(90) } });
expect(onChange).toHaveBeenCalledWith("x".repeat(80));
```

- [ ] **Step 5: Implement `TagFilterInput` with the UI `Input`**

Set `maxLength={80}` and emit `event.target.value.slice(0, 80)`.

- [ ] **Step 6: Run focused tests**

```powershell
npx vitest run src/features/academic-content/model/__tests__/academicContentListFilters.test.ts src/features/academic-content/components/filters/__tests__/TagFilterInput.test.tsx
```

- [ ] **Step 7: Run test-guard and clean-code-guard; resolve all findings**

---

### Task 2: Complete Teacher Preparations and Weekly Plans filters

**Files:**
- Modify: `src/features/academic-content/model/teacherPreparations.ts`, `src/features/academic-content/model/weeklyPlans.ts`.
- Modify: `src/features/academic-content/components/preparations/TeacherPreparationFilters.tsx`, `src/features/academic-content/components/weekly-plans/WeeklyPlanFilters.tsx`.
- Modify: `src/features/academic-content/model/__tests__/teacherPreparations.test.ts`, `src/features/academic-content/model/__tests__/weeklyPlans.test.ts`, `src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx`.
- Create: `src/features/academic-content/components/weekly-plans/__tests__/WeeklyPlansPresentation.test.tsx`.
- Modify: `src/messages/en.json`, `src/messages/ar.json`, and `src/messages/__tests__/academicContentWorkflowTranslations.test.ts`.

**Interfaces:**
- Teacher Preparations adds `sectionId` and `tag`.
- Weekly Plans adds `sectionId`, `tag`, `teacherUserId`, `weeklyDateFrom`, and `weeklyDateTo`.

- [ ] **Step 1: Add failing query assertions**

```ts
expect(teacherPreparationListQuery(filters, "year-1", "term-1"))
  .toMatchObject({ sectionId: "section-1", tag: "fractions" });
expect(weeklyPlanListQuery(filters, "year-1", "term-1"))
  .toMatchObject({
    sectionId: "section-1",
    teacherUserId: "teacher-1",
    tag: "week-4",
    weeklyDateFrom: "2026-10-01",
    weeklyDateTo: "2026-10-31",
  });
```

- [ ] **Step 2: Run the two model tests and confirm failure**

```powershell
npx vitest run src/features/academic-content/model/__tests__/teacherPreparations.test.ts src/features/academic-content/model/__tests__/weeklyPlans.test.ts
```

- [ ] **Step 3: Add URL parsing and query mapping**

Read `sectionId`, `teacherUserId`, `tag`, `weeklyDateFrom`, and `weeklyDateTo` using their backend names. Bound tag to 80 characters, accept only valid `YYYY-MM-DD` date-only values, and omit empty or invalid values from the query. If both dates are valid but From is after To, omit To defensively so the frontend never sends a backend-invalid range.

- [ ] **Step 4: Add failing UI tests**

Verify Section is between Grade and Classroom, target hierarchy resets are correct, Tag is removable, Weekly Plans has Teacher, and Weekly audiences exclude `INTERNAL_STAFF`. Verify From and To are ordinary `type="date"` inputs inside `FilterPanel`; To uses `min={weeklyDateFrom || undefined}`; each date can filter independently; a reversed range never reaches the query; the applied range chip clears both values; Clear all resets both values; and any date change resets pagination to page 1 through the existing page filter-update flow.

- [ ] **Step 5: Implement UI controls**

Derive sections from grade, classrooms from section, use Task 1 reset constants and `TagFilterInput`, and source Weekly audiences with `listAudienceOptions("WEEKLY_PLAN", audienceT)`. Add the two date inputs directly to the expanded `filtersSlot`; do not restore the removed previous/next-week toolbar or add a separate date toolbar.

Add localized labels equivalent to “Week date from”, “Week date to”, and “Shows plans whose week overlaps this range” in both message files.

- [ ] **Step 6: Run the four focused tests**

```powershell
npx vitest run src/features/academic-content/model/__tests__/teacherPreparations.test.ts src/features/academic-content/model/__tests__/weeklyPlans.test.ts src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx src/features/academic-content/components/weekly-plans/__tests__/WeeklyPlansPresentation.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

- [ ] **Step 7: Run test-guard and clean-code-guard; resolve all findings**

---

### Task 3: Complete Guardian Notes and Subject Resources filters

**Files:**
- Modify: `src/features/academic-content/model/guardianNotes.ts`, `src/features/academic-content/model/subjectResources.ts`.
- Modify: `src/features/academic-content/components/guardian-notes/GuardianNoteFilters.tsx`, `src/features/academic-content/components/subject-resources/SubjectResourceFilters.tsx`.
- Modify: `src/features/academic-content/model/__tests__/guardianNotes.test.ts`, `src/features/academic-content/model/__tests__/subjectResources.test.ts`.
- Create: `src/features/academic-content/components/guardian-notes/__tests__/GuardianNotesPresentation.test.tsx`, `src/features/academic-content/components/subject-resources/__tests__/SubjectResourcesPresentation.test.tsx`.

**Interfaces:**
- Guardian Notes adds `sectionId`, `teacherUserId`, and `tag`; audience stays fixed to Guardians.
- Subject Resources adds `sectionId`, `tag`, and type-valid audiences.

- [ ] **Step 1: Add failing query assertions**

```ts
expect(guardianNoteListQuery(filters, "year-1", "term-1"))
  .toMatchObject({ sectionId: "section-1", teacherUserId: "teacher-1", tag: "urgent" });
expect(subjectResourceListQuery(filters, "year-1", "term-1"))
  .toMatchObject({ sectionId: "section-1", tag: "worksheet" });
```

- [ ] **Step 2: Run model tests and confirm failure**

```powershell
npx vitest run src/features/academic-content/model/__tests__/guardianNotes.test.ts src/features/academic-content/model/__tests__/subjectResources.test.ts
```

- [ ] **Step 3: Implement model fields, URL parsing, and query mapping**

Keep Guardian audience fixed in its service. Do not add an audience selector.

- [ ] **Step 4: Add and implement UI tests and controls**

Cover hierarchy resets, Guardian Teacher/Tag, Subject Tag, and absence of `INTERNAL_STAFF` from Subject Resource audiences. Use `listAudienceOptions("SUBJECT_RESOURCE", audienceT)`.

- [ ] **Step 5: Run four focused tests**

```powershell
npx vitest run src/features/academic-content/model/__tests__/guardianNotes.test.ts src/features/academic-content/model/__tests__/subjectResources.test.ts src/features/academic-content/components/guardian-notes/__tests__/GuardianNotesPresentation.test.tsx src/features/academic-content/components/subject-resources/__tests__/SubjectResourcesPresentation.test.tsx
```

- [ ] **Step 6: Run test-guard and clean-code-guard; resolve all findings**

---

### Task 4: Complete Online Sessions and General Resources filters

**Files:**
- Modify: `src/features/academic-content/model/onlineSessions.ts`, `src/features/academic-content/model/generalResources.ts`.
- Modify: `src/features/academic-content/components/online-sessions/OnlineSessionFilters.tsx`, `src/features/academic-content/components/general-resources/GeneralResourceFilters.tsx`.
- Modify: `src/messages/en.json`, `src/messages/ar.json`.
- Modify: `src/features/academic-content/model/__tests__/onlineSessions.test.ts`, `src/features/academic-content/model/__tests__/generalResources.test.ts`, `src/features/academic-content/components/online-sessions/__tests__/OnlineSessionsPresentation.test.tsx`, `src/features/academic-content/components/general-resources/__tests__/GeneralResourcesPresentation.test.tsx`, and `src/messages/__tests__/academicContentWorkflowTranslations.test.ts`.

**Interfaces:**
- Online Sessions adds `sectionId`, `tag`, valid audiences, and accurate “Starts today” copy.
- General Resources adds `sectionId`.

- [ ] **Step 1: Add failing model assertions for the new fields**

```ts
expect(onlineSessionListQuery(filters, "year-1", "term-1"))
  .toMatchObject({ sectionId: "section-1", tag: "revision" });
expect(generalResourceListQuery(filters, "year-1", "term-1"))
  .toMatchObject({ sectionId: "section-1" });
```

- [ ] **Step 2: Run model tests and confirm failure**

```powershell
npx vitest run src/features/academic-content/model/__tests__/onlineSessions.test.ts src/features/academic-content/model/__tests__/generalResources.test.ts
```

- [ ] **Step 3: Implement model and UI changes**

Use `listAudienceOptions("ONLINE_SESSION", audienceT)`. Retain `sessionDatePreset=today` in URLs but translate it as “Starts today”. Do not add a second request or unsupported end-time filter.

- [ ] **Step 4: Add UI tests**

Assert Section behavior on both pages, Online Tag, exactly two Online audience options, and explicit English/Arabic starts-today labels.

- [ ] **Step 5: Run focused tests and translation parity**

```powershell
npx vitest run src/features/academic-content/model/__tests__/onlineSessions.test.ts src/features/academic-content/model/__tests__/generalResources.test.ts src/features/academic-content/components/online-sessions/__tests__/OnlineSessionsPresentation.test.tsx src/features/academic-content/components/general-resources/__tests__/GeneralResourcesPresentation.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

- [ ] **Step 6: Run test-guard and clean-code-guard; resolve all findings**

---

### Task 5: Render structured readiness reason details

**Files:**
- Create: `src/features/academic-content/components/editor/ReadinessReasonDetails.tsx` and `src/features/academic-content/components/editor/__tests__/ReadinessReasonDetails.test.tsx`.
- Modify: `src/features/academic-content/components/editor/ReadinessPanel.tsx` and `src/features/academic-content/components/editor/__tests__/ReadinessPanel.test.tsx`.
- Modify: English/Arabic messages and translation parity if new labels are required.

**Interfaces:**
- Consumes: `Record<string, unknown> | undefined` from `AcademicContentReadinessReason.details`.
- Produces: a semantic presenter for strings, finite numbers, booleans, null, and arrays of those primitives.

- [ ] **Step 1: Write a failing safe-rendering test**

```tsx
render(<ReadinessReasonDetails details={{
  missingCount: 2,
  fields: ["subjectId", "title"],
  retryable: false,
  internal: { id: "secret" },
}} />);
expect(screen.getByText("2")).toBeVisible();
expect(screen.getByText("subjectId, title")).toBeVisible();
expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the test and confirm missing-module failure**

```powershell
npx vitest run src/features/academic-content/components/editor/__tests__/ReadinessReasonDetails.test.tsx
```

- [ ] **Step 3: Implement the presenter**

Render supported entries in a `<dl>` with humanized keys. Return `null` when nothing safe remains. Never use `dangerouslySetInnerHTML` or raw `JSON.stringify`.

- [ ] **Step 4: Add a failing `ReadinessPanel` integration assertion**

Pass a reason with `details: { missingCount: 2 }` and require both the translated/message text and detail value.

- [ ] **Step 5: Compose the presenter beneath each readiness message**

Preserve current behavior: known codes use localized copy; unknown codes use the backend message.

- [ ] **Step 6: Run focused tests**

```powershell
npx vitest run src/features/academic-content/components/editor/__tests__/ReadinessReasonDetails.test.tsx src/features/academic-content/components/editor/__tests__/ReadinessPanel.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

- [ ] **Step 7: Run test-guard and clean-code-guard; resolve all findings**

---

### Task 6: Add notification-policy contract types and API calls

**Files:**
- Modify: `src/features/academic-content/types/contracts.ts`.
- Modify: `src/features/academic-content/services/academicContentApi.ts`.
- Modify: `src/features/academic-content/services/__tests__/academicContentApi.test.ts`.

**Interfaces:**
- Produces: `AcademicContentNotificationPolicy`, `UpdateAcademicContentNotificationPolicyRequest`, `getAcademicContentNotificationPolicy`, and `updateAcademicContentNotificationPolicy`.
- Endpoint: `/academics/academic-content/settings/notification-policy` via GET/PATCH.

- [ ] **Step 1: Add failing API tests**

```ts
await getAcademicContentNotificationPolicy();
expect(apiMocks.apiGet).toHaveBeenCalledWith(
  "/academics/academic-content/settings/notification-policy",
);
await updateAcademicContentNotificationPolicy({
  onlineSessionRemindersEnabled: true,
  onlineSessionReminderOffsetsMinutes: [30, 60],
});
expect(apiMocks.apiPatch).toHaveBeenCalledWith(
  "/academics/academic-content/settings/notification-policy",
  { onlineSessionRemindersEnabled: true, onlineSessionReminderOffsetsMinutes: [30, 60] },
);
```

- [ ] **Step 2: Run the service test and confirm missing exports**

```powershell
npx vitest run src/features/academic-content/services/__tests__/academicContentApi.test.ts
```

- [ ] **Step 3: Add exact contract types**

```ts
export interface AcademicContentNotificationPolicy {
  notificationsEnabled: boolean;
  studentNotificationsEnabled: boolean;
  guardianNotificationsEnabled: boolean;
  weeklyPlanNotificationsEnabled: boolean;
  guardianWeeklyNoteNotificationsEnabled: boolean;
  subjectResourceNotificationsEnabled: boolean;
  onlineSessionNotificationsEnabled: boolean;
  generalResourceNotificationsEnabled: boolean;
  significantUpdateNotificationsEnabled: boolean;
  cancellationNotificationsEnabled: boolean;
  onlineSessionRemindersEnabled: boolean;
  onlineSessionReminderOffsetsMinutes: number[];
}
export type UpdateAcademicContentNotificationPolicyRequest =
  Partial<AcademicContentNotificationPolicy>;
```

- [ ] **Step 4: Add the API constant and functions**

```ts
const NOTIFICATION_POLICY_PATH = `${BASE_PATH}/settings/notification-policy`;
export const getAcademicContentNotificationPolicy = () =>
  apiGet<AcademicContentNotificationPolicy>(NOTIFICATION_POLICY_PATH);
export const updateAcademicContentNotificationPolicy =
  (request: UpdateAcademicContentNotificationPolicyRequest) =>
    apiPatch<AcademicContentNotificationPolicy>(NOTIFICATION_POLICY_PATH, request);
```

- [ ] **Step 5: Run the service test, test-guard, and clean-code-guard**

---

### Task 7: Implement notification-policy validation and state

**Files:**
- Create: `src/features/academic-content/model/academicContentNotificationPolicy.ts` and `src/features/academic-content/model/__tests__/academicContentNotificationPolicy.test.ts`.
- Create: `src/features/academic-content/hooks/useAcademicContentNotificationPolicy.ts` and `src/features/academic-content/hooks/__tests__/useAcademicContentNotificationPolicy.test.tsx`.

**Interfaces:**
- Produces: `notificationPolicyChanges`, `parseReminderOffsets`, and a race-safe load/save hook.

- [ ] **Step 1: Write failing normalization tests**

```ts
expect(parseReminderOffsets("60, 30, 60, 5"))
  .toEqual({ value: [5, 30, 60], error: null });
for (const invalid of ["4", "10081", "30.5", "a", "5,10,15,20,25,30"]) {
  expect(parseReminderOffsets(invalid).error).not.toBeNull();
}
```

- [ ] **Step 2: Run the model test and confirm failure**

```powershell
npx vitest run src/features/academic-content/model/__tests__/academicContentNotificationPolicy.test.ts
```

- [ ] **Step 3: Implement validation and changed-field calculation**

Accept comma-separated integers, trim whitespace, allow empty, enforce 5–10080 inclusive, enforce at most five unique values, and sort numerically. Compare offset arrays by value when building PATCH changes.

- [ ] **Step 4: Write failing hook tests**

Cover successful load, stale-load suppression, changed-fields-only PATCH, preservation of offsets when reminders are disabled, save success, and recoverable failure.

- [ ] **Step 5: Implement the hook using existing request-id/error patterns**

Reuse `academicContentUiError`; expose policy, draft, loading/saving/error/saved state, `updateDraft`, `save`, and `reload`. Never clear offsets when reminders are disabled.

- [ ] **Step 6: Run focused tests**

```powershell
npx vitest run src/features/academic-content/model/__tests__/academicContentNotificationPolicy.test.ts src/features/academic-content/hooks/__tests__/useAcademicContentNotificationPolicy.test.tsx
```

- [ ] **Step 7: Run test-guard and clean-code-guard; resolve all findings**

---

### Task 8: Build notification settings and settings navigation

**Files:**
- Create: `src/features/academic-content/components/settings/AcademicContentSettingsCard.tsx`.
- Create: `src/features/academic-content/pages/AcademicContentSettingsPage.tsx` and `src/features/academic-content/pages/__tests__/AcademicContentSettingsPage.test.tsx`.
- Create: `src/features/academic-content/pages/AcademicContentNotificationPolicyPage.tsx` and `src/features/academic-content/pages/__tests__/AcademicContentNotificationPolicyPage.test.tsx`.
- Create: the two App Router files listed in File structure.
- Modify: `src/features/academic-content/components/overview/AcademicContentQuickLinks.tsx` and `src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx`.
- Modify: English/Arabic messages and translation parity test.

**Interfaces:**
- Consumes: Task 7 hook, `Button`, `ButtonLink`, `Input`, `EmptyState`, `PartialLoader`, and `usePermissions`.
- Produces: localized settings landing and notification-policy routes.

- [ ] **Step 1: Write failing landing-page tests**

Assert locale-preserving links to:

```text
/academic-content-hub/settings/file-policy
/academic-content-hub/settings/workflow
/academic-content-hub/settings/notifications
```

Also assert the overview Settings quick link opens `/academic-content-hub/settings`.

- [ ] **Step 2: Write failing notification-page tests**

Require all twelve policy fields, read-only behavior without `academics.academic_content.settings.manage`, invalid-offset blocking, normalized save, preserved offsets when disabled, retry on load failure, and save-success status.

- [ ] **Step 3: Run new page tests and confirm missing modules**

```powershell
npx vitest run src/features/academic-content/pages/__tests__/AcademicContentSettingsPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentNotificationPolicyPage.test.tsx
```

- [ ] **Step 4: Implement the settings landing page using reusable UI controls**

Cards link to File Policy, Workflow Policy, and Notifications with icon, title, description, and accessible link text. Do not duplicate the forms on the landing page.

- [ ] **Step 5: Implement the complete notification editor**

Group master/recipient switches, five content-type switches, update/cancellation switches, and online-session reminder controls. Disabled parent switches may visually disable children but must preserve values. Submit only changed fields.

- [ ] **Step 6: Add App Router files**

```tsx
import AcademicContentNotificationPolicyPage from "@/features/academic-content/pages/AcademicContentNotificationPolicyPage";
export default function Page() {
  return <AcademicContentNotificationPolicyPage />;
}
```

Use the analogous import for `AcademicContentSettingsPage`.

- [ ] **Step 7: Add English/Arabic copy and run focused tests**

```powershell
npx vitest run src/features/academic-content/pages/__tests__/AcademicContentSettingsPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentNotificationPolicyPage.test.tsx src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

- [ ] **Step 8: Run test-guard and clean-code-guard; resolve all findings**

Check keyboard operation, focus visibility, labels, RTL, and read-versus-manage permissions.

---

### Task 9: Contract regression verification and handoff

**Files:**
- Verify only; modify files solely to correct failures caused by Tasks 1–8.

**Interfaces:**
- Produces: evidence of contract coverage without a full-suite run unless authorized.

- [ ] **Step 1: Run the focused academic-content tests changed by Tasks 1–8**

```powershell
npx vitest run src/features/academic-content/model/__tests__/academicContentListFilters.test.ts src/features/academic-content/model/__tests__/teacherPreparations.test.ts src/features/academic-content/model/__tests__/weeklyPlans.test.ts src/features/academic-content/model/__tests__/guardianNotes.test.ts src/features/academic-content/model/__tests__/subjectResources.test.ts src/features/academic-content/model/__tests__/onlineSessions.test.ts src/features/academic-content/model/__tests__/generalResources.test.ts src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx src/features/academic-content/components/weekly-plans/__tests__/WeeklyPlanFilters.test.tsx src/features/academic-content/components/online-sessions/__tests__/OnlineSessionsPresentation.test.tsx src/features/academic-content/components/general-resources/__tests__/GeneralResourcesPresentation.test.tsx src/features/academic-content/components/editor/__tests__/ReadinessReasonDetails.test.tsx src/features/academic-content/components/editor/__tests__/ReadinessPanel.test.tsx src/features/academic-content/services/__tests__/academicContentApi.test.ts src/features/academic-content/model/__tests__/academicContentNotificationPolicy.test.ts src/features/academic-content/hooks/__tests__/useAcademicContentNotificationPolicy.test.tsx src/features/academic-content/pages/__tests__/AcademicContentSettingsPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentNotificationPolicyPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

- [ ] **Step 2: Run typecheck and scoped lint**

```powershell
npm run typecheck
npx eslint src/features/academic-content 'src/app/[lang]/(dashboard)/academic-content-hub/settings' src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

- [ ] **Step 3: Run test-guard and clean-code-guard across the final diff**

Resolve must-fix findings and re-run affected focused tests.

- [ ] **Step 4: Manually verify the contract matrix**

Confirm all six lists pass year, term, fixed type, pagination, status, search, and applicable filters; every page exposes Section; five newly expose Tag; Weekly/Guardian newly expose Teacher; Weekly dates are normal filter-panel inputs mapped to `weeklyDateFrom`/`weeklyDateTo`; Online audiences/copy are accurate; notification settings cover all fields; readiness details are safe; and no row triggers a detail request.

- [ ] **Step 5: Ask before running the full suite**

Do not run `npm run test:run`, `npm run test:all`, or full Playwright without explicit approval.

- [ ] **Step 6: Run docs-guard on the spec and plan**

Verify every path, symbol, endpoint, permission, command, and field against final source.

- [ ] **Step 7: Deliver the handoff**

Report focused test/typecheck/lint results, whether the full suite was authorized, and the Online Sessions limitation: “Starts today” rather than cross-day running lookup.

---

## Completion criteria

- Six lists consume every applicable existing filter, including the Weekly Plan overlap range.
- Audience selectors cannot form backend-invalid type/audience combinations.
- Online Session copy does not imply unsupported running-session lookup.
- Notification policy has complete types, API, validation, permissions, localized UI, discoverable routes, and tests.
- Structured readiness details render safely.
- Existing complete detail contracts and one-request list behavior remain intact.
- Focused tests, typecheck, and scoped lint pass; full tests run only with approval.
