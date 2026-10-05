# Weekly Plan Detail Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated, responsive Weekly Plan detail workspace that matches Screen 5’s hierarchy while displaying and mutating only data supported by the latest backend contract.

**Architecture:** Keep the existing academic-content detail route and `useAcademicContentEditor` as the aggregate owner. Add a `WEEKLY_PLAN` presentation branch composed from focused Weekly Plan components and one shared complete-detail draft controller, while reusing the existing target, link, file, readiness, publication, revision, and lifecycle surfaces. Align publication contracts and revision actions with backend `origin/main` before the specialized view consumes them.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, next-intl, Lucide React, Vitest, Testing Library, existing `src/components/ui` primitives.

**Spec:** `docs/superpowers/specs/2026-10-05-weekly-plan-detail-design.md`

## Global Constraints

- Do not change the backend or invent API fields.
- Do not display Daily Breakdown, Activities, Weekly Plan curriculum references, additional audiences, or separate teacher and guardian notes.
- Use the single backend `audience` value and the single Weekly Plan `notes` field.
- Use the shared rich-text editor and formatter under `src/components/ui`.
- Preserve the complete Weekly Plan detail payload whenever one detail panel saves.
- Use existing UI components and application colors; add a primitive under `src/components/ui` only when no suitable primitive exists.
- Keep other content-type editors behaviorally unchanged.
- Apply `clean-code-guard` after every production-code change and `test-guard` after every test change.
- Run only focused tests until the user explicitly approves the full test suite.
- Before every commit, inspect `git diff --cached --name-only`. Stage only the task-owned paths or hunks; use `git add -p` for any file that was already dirty before this plan began.

---

## File Structure

### Contract and publication alignment

- Modify `src/features/academic-content/types/contracts.ts` — latest detail/publication fields and revision-start response.
- Modify `src/features/academic-content/services/academicContentApi.ts` — publication revision endpoint.
- Modify `src/features/academic-content/model/academicContentPublicationPolicy.ts` — minor-update draft/request mapping and revision action policy.
- Modify `src/features/academic-content/hooks/useAcademicContentPublication.ts` — expose revision mutation and refresh behavior.
- Modify `src/features/academic-content/components/publication/PublicationDialog.tsx` — minor-update choice when applicable.
- Modify `src/features/academic-content/components/publication/PublicationHistoryPanel.tsx` — revision-start action.
- Modify publication/API tests adjacent to those files.

### Weekly Plan domain and presentation

- Create `src/features/academic-content/model/weeklyPlanDetail.ts` — panel definitions, empty detail, normalization, week formatting inputs, and target/reference display models.
- Create `src/features/academic-content/services/weeklyPlanDetailOptions.ts` — load only homework and assessment references needed by this view.
- Create `src/features/academic-content/hooks/useWeeklyPlanDetailDraft.ts` — one shared complete-detail draft controller.
- Create `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanEditorView.tsx` — page composition.
- Create `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanHeader.tsx` — back link, title, status, summary strip, and actions.
- Create `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanSectionNav.tsx` — responsive section navigation and indicators.
- Create `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanDetailsPanel.tsx` — title, description, dates, and optional labels.
- Create `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanOrderedListPanel.tsx` — objectives/topics editor.
- Create `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanReferenceNotesPanel.tsx` — homework/assessment rich text and references.
- Create `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanNotesPanel.tsx` — general plan notes.
- Create `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanResources.tsx` — links and attachments.
- Create `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanContextRail.tsx` — readiness, publication, target/topic, and attachment summaries.
- Create focused tests under `components/weekly-plan-detail/__tests__` and `hooks/__tests__`.
- Modify `src/features/academic-content/pages/AcademicContentEditorPage.tsx` — `WEEKLY_PLAN` presentation branch.
- Modify `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx` — branch regression.
- Modify `src/messages/en.json` and `src/messages/ar.json` — complete Weekly Plan detail copy.
- Modify `src/messages/__tests__/academicContentWorkflowTranslations.test.ts` — bilingual key parity.

---

### Task 1: Align the frontend publication contract with backend `origin/main`

**Files:**
- Modify: `src/features/academic-content/types/contracts.ts`
- Modify: `src/features/academic-content/services/academicContentApi.ts`
- Modify: `src/features/academic-content/model/academicContentPublicationPolicy.ts`
- Modify when required by TypeScript: existing strongly typed `AcademicContentDetail` fixtures listed below
- Test: `src/features/academic-content/services/__tests__/academicContentApi.test.ts`
- Test: `src/features/academic-content/model/__tests__/academicContentPublicationPolicy.test.ts`

**Interfaces:**
- Produces: required detail metadata `latestPublicationId`, `publicationStatus`, `publishAt`, `visibleFrom`, `visibleUntil`.
- Produces: `AcademicContentPublicationCancellationReason`, `AcademicContentChangeSignificance`, `AcademicContentPublicationRevisionStartResponse`.
- Produces: `startAcademicContentPublicationRevision(contentId: string, publicationId: string): Promise<AcademicContentPublicationRevisionStartResponse>`.
- Produces: `PublicationDraft.notifyMinorUpdate: boolean` and exact request mapping.

- [ ] **Step 1: Write failing contract/API tests**

Add a service test that calls the new revision API and asserts the real boundary request:

```ts
it("starts a revision through the published-content revision endpoint", async () => {
  const response = {
    contentId: "content-1",
    oldPublicationId: "publication-1",
    oldRevisionId: "revision-1",
    cancellationReason: "REVISION_STARTED",
    restoredContentStatus: "DRAFT",
    cancelledAt: "2026-10-05T09:00:00.000Z",
  } as const;
  apiPost.mockResolvedValue(response);

  await expect(
    startAcademicContentPublicationRevision("content-1", "publication-1"),
  ).resolves.toEqual(response);
  expect(apiPost).toHaveBeenCalledWith(
    "/academics/academic-content/content-1/publications/publication-1/revise",
    {},
  );
});
```

Add a policy test proving `notifyMinorUpdate` is included in both the fingerprint and request:

```ts
it("preserves the minor-update notification choice in publication requests", () => {
  const draft = {
    mode: "now",
    publishAt: null,
    visibleFrom: null,
    visibleUntil: null,
    notifyMinorUpdate: true,
  } as const;

  expect(publicationDraftFingerprint(draft)).toContain('"notifyMinorUpdate":true');
  expect(publicationRequestFromDraft(draft, "request-1")).toEqual({
    clientRequestId: "request-1",
    notifyMinorUpdate: true,
  });
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```powershell
& { npm exec vitest -- run src/features/academic-content/services/__tests__/academicContentApi.test.ts src/features/academic-content/model/__tests__/academicContentPublicationPolicy.test.ts }
```

Expected: failure because the revision function and new draft field do not exist.

- [ ] **Step 3: Add exact backend contract fields and endpoint**

Add the enums and response type:

```ts
export type AcademicContentPublicationCancellationReason =
  | "UNSCHEDULED"
  | "WITHDRAWN"
  | "REVISION_STARTED";

export type AcademicContentChangeSignificance = "MINOR" | "SIGNIFICANT";

export interface AcademicContentPublicationRevisionStartResponse {
  contentId: string;
  oldPublicationId: string;
  oldRevisionId: string;
  cancellationReason: AcademicContentPublicationCancellationReason;
  restoredContentStatus: AcademicContentStatus;
  cancelledAt: string;
}
```

Extend detail and publication contracts with the required backend fields, add `notifyMinorUpdate?: boolean` to the create request, and implement:

```ts
export function startAcademicContentPublicationRevision(
  contentId: string,
  publicationId: string,
): Promise<AcademicContentPublicationRevisionStartResponse> {
  return apiPost<AcademicContentPublicationRevisionStartResponse>(
    `${publicationPath(contentId, publicationId)}/revise`,
    {},
  );
}
```

Update `PublicationDraft`, `emptyDraft`, its fingerprint, and request mapping so `notifyMinorUpdate` defaults to `false` and is transmitted explicitly.

Because the five new aggregate publication fields are required by the backend response, update only existing fixtures that are statically declared with or `satisfies AcademicContentDetail` so they contain explicit values (normally `null`). Check these existing fixture locations and change only those that fail type-checking:

- `src/features/academic-content/services/__tests__/academicContentDetailOptions.test.ts`
- `src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationResources.test.tsx`
- `src/features/academic-content/components/editor/__tests__/AcademicTargetsSection.test.tsx`
- `src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx`
- `src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationEditorView.test.tsx`
- `src/features/academic-content/components/editor/details/__tests__/TypeDetailSection.test.tsx`
- `src/features/academic-content/components/editor/__tests__/LifecycleActions.test.tsx`
- `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`
- `src/features/academic-content/components/workflow/__tests__/AcademicContentWorkflowPanel.test.tsx`
- `src/features/academic-content/hooks/__tests__/useAcademicContentEditor.test.tsx`
- `src/features/academic-content/components/publication/__tests__/AcademicContentPublicationPanel.test.tsx`

Do not create a new shared fixture abstraction unless at least three changed fixtures already have the same construction pattern; explicit local fields are preferred over an unrelated test refactor.

- [ ] **Step 4: Run the focused tests**

Run the command from Step 2. Expected: both files pass.

- [ ] **Step 5: Apply code and test guards**

Review the production diff with `clean-code-guard` and the test diff with `test-guard`. Fix any contract drift, internal-module mocks, duplicate cases, dead types, or speculative flags.

- [ ] **Step 6: Commit**

```powershell
& { git add -p -- src/features/academic-content/types/contracts.ts src/features/academic-content/services/academicContentApi.ts src/features/academic-content/model/academicContentPublicationPolicy.ts src/features/academic-content/services/__tests__/academicContentApi.test.ts src/features/academic-content/model/__tests__/academicContentPublicationPolicy.test.ts; git diff --cached --name-only; git commit -m "feat(academic-content): align publication revision contract" }
```

Stage any required fixture-only compatibility edits explicitly after reviewing each diff.

### Task 2: Add revision behavior to the existing publication workflow

**Files:**
- Modify: `src/features/academic-content/hooks/useAcademicContentPublication.ts`
- Modify: `src/features/academic-content/components/publication/PublicationDialog.tsx`
- Modify: `src/features/academic-content/components/publication/PublicationHistoryPanel.tsx`
- Modify: `src/features/academic-content/components/publication/AcademicContentPublicationPanel.tsx`
- Test: `src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx`
- Test: `src/features/academic-content/components/publication/__tests__/PublicationHistoryPanel.test.tsx`

**Interfaces:**
- Consumes: `startAcademicContentPublicationRevision` and the Task 1 response types.
- Produces: `AcademicContentPublicationState.startRevision(publicationId: string): Promise<AcademicContentPublicationRevisionStartResponse | null>`.

- [ ] **Step 1: Write failing behavior tests**

Add a hook test that invokes `startRevision("publication-1")`, verifies the backend boundary is called, and asserts `onContentChanged` and publication reload occur after success. Add a history-panel test that renders a `PUBLISHED` record, clicks **Start revision**, confirms the destructive transition, and observes `onStartRevision("publication-1")`.

Use Testing Library roles and labels; mock only `academicContentApi`, which is the network boundary.

- [ ] **Step 2: Run the focused tests and verify failure**

```powershell
& { npm exec vitest -- run src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx src/features/academic-content/components/publication/__tests__/PublicationHistoryPanel.test.tsx }
```

Expected: failure because the hook and panel do not expose revision start.

- [ ] **Step 3: Implement revision start and minor-update control**

Add `startRevision` to the hook using the same mutation/error/refresh discipline as cancel and unschedule, but return `AcademicContentPublicationRevisionStartResponse`. Add `onStartRevision` to the history panel and a confirmation dialog whose copy explains that the active publication is withdrawn and authoring returns to Draft.

Render the `notifyMinorUpdate` checkbox in `PublicationDialog` only when the caller is publishing a revision that supersedes a previous publication. Pass an explicit `showMinorUpdateOption` boolean from `AcademicContentPublicationPanel`, derived from aggregate `latestPublicationId` and editable revision state; do not show the control for first publication.

- [ ] **Step 4: Run the focused tests**

Run the Step 2 command. Expected: pass.

- [ ] **Step 5: Apply code and test guards**

Use `clean-code-guard` and `test-guard`; specifically verify the new mutation does not swallow refresh failures and confirmation tests assert user-visible behavior rather than component state.

- [ ] **Step 6: Commit**

```powershell
& { git add src/features/academic-content/hooks/useAcademicContentPublication.ts src/features/academic-content/components/publication/PublicationDialog.tsx src/features/academic-content/components/publication/PublicationHistoryPanel.tsx src/features/academic-content/components/publication/AcademicContentPublicationPanel.tsx src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx src/features/academic-content/components/publication/__tests__/PublicationHistoryPanel.test.tsx; git commit -m "feat(academic-content): support publication revisions" }
```

### Task 3: Create the Weekly Plan domain model and shared detail draft

**Files:**
- Create: `src/features/academic-content/model/weeklyPlanDetail.ts`
- Create: `src/features/academic-content/services/weeklyPlanDetailOptions.ts`
- Create: `src/features/academic-content/hooks/useWeeklyPlanDetailDraft.ts`
- Test: `src/features/academic-content/model/__tests__/weeklyPlanDetail.test.ts`
- Test: `src/features/academic-content/services/__tests__/weeklyPlanDetailOptions.test.ts`
- Test: `src/features/academic-content/hooks/__tests__/useWeeklyPlanDetailDraft.test.tsx`

**Interfaces:**
- Produces: `WEEKLY_PLAN_PANELS` and `WeeklyPlanPanel`.
- Produces: `emptyWeeklyPlanDetail(termStartDate?: string): AcademicContentWeeklyPlanDetail`.
- Produces: `normalizeWeeklyPlanDetail(detail): ReplaceAcademicContentWeeklyPlanDetailRequest`.
- Produces: `loadWeeklyPlanDetailOptions(content): Promise<{ homeworkAssignments; assessments }>` without curriculum, lesson-plan, or timetable requests.
- Produces: `WeeklyPlanDetailDraftController` with `draft`, `validationError`, `update`, `save`, and `resetValidation`.

- [ ] **Step 1: Write failing model and hook tests**

Cover these observable cases:

```ts
it("normalizes every weekly field into one replacement payload", () => {
  expect(normalizeWeeklyPlanDetail({
    weekStartDate: "2026-09-01",
    weekEndDate: "2026-09-07",
    objectives: ["  Compare planets  ", ""],
    topics: [" Solar system "],
    expectedHomework: "  Read chapter 1 ",
    upcomingAssessments: " ",
    notes: "  Bring models ",
    homeworkAssignmentIds: ["homework-1", "homework-1"],
    gradeAssessmentIds: ["assessment-1"],
  })).toEqual({
    weekStartDate: "2026-09-01",
    weekEndDate: "2026-09-07",
    objectives: ["Compare planets"],
    topics: ["Solar system"],
    expectedHomework: "Read chapter 1",
    upcomingAssessments: null,
    notes: "Bring models",
    homeworkAssignmentIds: ["homework-1"],
    gradeAssessmentIds: ["assessment-1"],
  });
});
```

The hook test must edit objectives, then save, and assert the request still contains unchanged dates, topics, notes, homework, assessments, and both reference arrays.

Add a loader test proving it makes only the homework-assignment and grade-assessment option requests needed by the Weekly Plan view, and preserves each resource's loading failure independently.

- [ ] **Step 2: Run tests and verify failure**

```powershell
& { npm exec vitest -- run src/features/academic-content/model/__tests__/weeklyPlanDetail.test.ts src/features/academic-content/services/__tests__/weeklyPlanDetailOptions.test.ts src/features/academic-content/hooks/__tests__/useWeeklyPlanDetailDraft.test.tsx }
```

- [ ] **Step 3: Implement the minimal model and controller**

Define the exact panel order:

```ts
export const WEEKLY_PLAN_PANELS = [
  { id: "details", labelKey: "plan_details" },
  { id: "targets", labelKey: "targets" },
  { id: "objectives", labelKey: "objectives" },
  { id: "topics", labelKey: "topics" },
  { id: "homework", labelKey: "homework" },
  { id: "assessments", labelKey: "assessments" },
  { id: "notes", labelKey: "plan_notes" },
  { id: "resources", labelKey: "resources" },
  { id: "readiness", labelKey: "readiness" },
  { id: "publication", labelKey: "publication" },
  { id: "revisions", labelKey: "revisions" },
] as const;
```

Validate non-empty ordered rows, required valid date-only values, start-before-or-equal-end, and term bounds before calling `onSave(normalizeWeeklyPlanDetail(draft))`. Keep unsaved draft state when panels switch by mounting the controller in `WeeklyPlanEditorView`, not individual panels.

Implement `loadWeeklyPlanDetailOptions` as a narrow adapter over the existing homework and assessment API boundaries. It must not call the broader academic-content detail option loader because that also requests curricula, lesson plans, and timetable data that this screen cannot display.

- [ ] **Step 4: Run focused tests**

Run the Step 2 command. Expected: pass.

- [ ] **Step 5: Apply code and test guards**

Check boundary cases explicitly: missing detail, one-day range, start after end, outside term, empty/one/many ordered rows, duplicate references, and rich-text strings that normalize to empty.

- [ ] **Step 6: Commit**

```powershell
& { git add src/features/academic-content/model/weeklyPlanDetail.ts src/features/academic-content/services/weeklyPlanDetailOptions.ts src/features/academic-content/hooks/useWeeklyPlanDetailDraft.ts src/features/academic-content/model/__tests__/weeklyPlanDetail.test.ts src/features/academic-content/services/__tests__/weeklyPlanDetailOptions.test.ts src/features/academic-content/hooks/__tests__/useWeeklyPlanDetailDraft.test.tsx; git diff --cached --name-only; git commit -m "feat(academic-content): add weekly plan detail draft" }
```

### Task 4: Build the Weekly Plan header and responsive navigation

**Files:**
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanHeader.tsx`
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanSectionNav.tsx`
- Test: `src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanChrome.test.tsx`

**Interfaces:**
- Consumes: `WeeklyPlanPanel`, aggregate Weekly Plan detail, resolved target summaries, and existing lifecycle actions.
- Produces: accessible page chrome used by `WeeklyPlanEditorView`.

- [ ] **Step 1: Write failing presentation tests**

Test that the header:

- links back to `/academic-content-hub/weekly-plans` while preserving `year` and `term`;
- displays saved date range, all-subject/all-target summaries, single audience, content status, and separate publication status;
- omits creator name and fake published time when unavailable;
- uses `aria-current="page"` for the active navigation panel;
- hides Publication navigation when policy disallows it.

- [ ] **Step 2: Run the focused test and verify failure**

```powershell
& { npm exec vitest -- run src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanChrome.test.tsx }
```

- [ ] **Step 3: Implement the header and navigation**

Reuse `Button`, `Link`, `AcademicContentStatusBadge`, publication status badge, and Lucide icons. Render a four-cell summary strip for week, subjects, targets, and audience. For missing details, show the translated “Week not set” state rather than dates derived from the term.

Use the same desktop/mobile navigation behavior as Teacher Preparations, with Weekly Plan-specific icons and indicator labels from the existing editor translation namespace.

- [ ] **Step 4: Run the focused test**

Expected: pass.

- [ ] **Step 5: Apply code and test guards**

Verify no single-target assumption, no raw identifier fallback, no scale-based hover, and accessible names for icon-only actions.

- [ ] **Step 6: Commit**

```powershell
& { git add src/features/academic-content/components/weekly-plan-detail/WeeklyPlanHeader.tsx src/features/academic-content/components/weekly-plan-detail/WeeklyPlanSectionNav.tsx src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanChrome.test.tsx; git commit -m "feat(academic-content): add weekly plan detail chrome" }
```

### Task 5: Build focused Weekly Plan authoring panels

**Files:**
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanDetailsPanel.tsx`
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanOrderedListPanel.tsx`
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanReferenceNotesPanel.tsx`
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanNotesPanel.tsx`
- Test: `src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanPanels.test.tsx`

**Interfaces:**
- Consumes: `WeeklyPlanDetailDraftController`, existing metadata/tag save functions, `AcademicContentDetailOptions`, and editor section states.
- Produces: independent visual panels that respect three explicit save boundaries: metadata, complete Weekly Plan detail, and tags.

- [ ] **Step 1: Write failing panel tests**

Test these user behaviors:

- editing description uses `RichTextEditor` and metadata save preserves title and audience;
- changing dates updates `weekStartDate` and `weekEndDate` in the shared controller;
- objectives and topics update ordered arrays and call one complete-detail save;
- Homework edits `expectedHomework` and `homeworkAssignmentIds` without touching assessment references;
- Assessments edits `upcomingAssessments` and `gradeAssessmentIds` without touching homework references;
- Plan Notes edits only `notes` in the draft before complete save;
- unresolved saved reference IDs remain selected and visible as unavailable references until explicitly removed.

- [ ] **Step 2: Run the focused test and verify failure**

```powershell
& { npm exec vitest -- run src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanPanels.test.tsx }
```

- [ ] **Step 3: Implement the panels**

Use existing `Input`, `Button`, `RichTextEditor`, `OrderedTextList`, `OptionalReferenceSelect` or a narrowly adapted existing checklist component, and standard error cards. Keep dates in the Weekly Plan detail controller while title, description, audience, and labels continue through metadata/tag mutations.

Within `WeeklyPlanDetailsPanel`, render three clearly separated subcards/actions rather than implying an atomic page save:

1. **Basic information** saves title, description, and audience through the metadata endpoint and preserves the other metadata fields.
2. **Week settings** saves dates through the shared complete-detail controller.
3. **Labels** saves tags through the existing tag endpoint.

Each action owns its loading/error state and success feedback. Never issue the other two mutations automatically when one action is used.

Render homework and assessment reference labels from `AcademicContentDetailOptions`. Preserve selected IDs missing from the current option response with a translated unavailable-reference row and a user-controlled remove action.

- [ ] **Step 4: Run the focused test**

Expected: pass.

- [ ] **Step 5: Apply code and test guards**

Verify panels do not create local copies of the whole aggregate, no panel constructs a partial type-detail request, and tests use real draft values rather than mocked state objects.

- [ ] **Step 6: Commit**

```powershell
& { git add src/features/academic-content/components/weekly-plan-detail/WeeklyPlanDetailsPanel.tsx src/features/academic-content/components/weekly-plan-detail/WeeklyPlanOrderedListPanel.tsx src/features/academic-content/components/weekly-plan-detail/WeeklyPlanReferenceNotesPanel.tsx src/features/academic-content/components/weekly-plan-detail/WeeklyPlanNotesPanel.tsx src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanPanels.test.tsx; git commit -m "feat(academic-content): add weekly plan authoring panels" }
```

### Task 6: Add Resources and the contextual rail

**Files:**
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanResources.tsx`
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanContextRail.tsx`
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanSummaryCard.tsx`
- Test: `src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanResourcesAndRail.test.tsx`

**Interfaces:**
- Consumes: aggregate assets/links, readiness, aggregate publication metadata, resolved targets/topics, file refresh callback, and existing resource editors.
- Produces: one Resources panel and read-only contextual summaries with no independent server state.

- [ ] **Step 1: Write failing resource/rail tests**

Assert that:

- Resources renders the existing links editor and attachment manager against the same aggregate collection;
- upload/unlink refresh invokes both `refreshAggregate` and `refreshReadiness`;
- the rail shows backend readiness without a percentage;
- the rail shows publication status and real timestamps only when provided;
- the rail omits “Created By”;
- targets, topics, and attachments render empty states when absent;
- a reference-resolution failure affects only its summary card.

- [ ] **Step 2: Run the focused test and verify failure**

```powershell
& { npm exec vitest -- run src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanResourcesAndRail.test.tsx }
```

- [ ] **Step 3: Implement Resources and rail cards**

Compose existing `LinksSection` and `FilesSection` in `WeeklyPlanResources`. Keep `WeeklyPlanContextRail` read-only and pass already-loaded values into small `WeeklyPlanSummaryCard` instances. Do not call the aggregate detail endpoint again from rail components.

- [ ] **Step 4: Run the focused test**

Expected: pass.

- [ ] **Step 5: Apply code and test guards**

Verify one source of truth for attachments, no per-card fetching, failure isolation, semantic headings, and keyboard-accessible actions.

- [ ] **Step 6: Commit**

```powershell
& { git add src/features/academic-content/components/weekly-plan-detail/WeeklyPlanResources.tsx src/features/academic-content/components/weekly-plan-detail/WeeklyPlanContextRail.tsx src/features/academic-content/components/weekly-plan-detail/WeeklyPlanSummaryCard.tsx src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanResourcesAndRail.test.tsx; git commit -m "feat(academic-content): add weekly plan resources and context" }
```

### Task 7: Compose the specialized Weekly Plan editor view

**Files:**
- Create: `src/features/academic-content/components/weekly-plan-detail/WeeklyPlanEditorView.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`
- Create: `src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanEditorView.test.tsx`

**Interfaces:**
- Consumes: all Tasks 1–6 outputs plus existing editor, target, detail-option, permission, readiness, publication, revision, and lifecycle APIs.
- Produces: the complete specialized `WEEKLY_PLAN` detail experience.

- [ ] **Step 1: Add failing integration tests**

In `AcademicContentEditorPage.test.tsx`, mock `WeeklyPlanEditorView` and assert only `WEEKLY_PLAN` selects it. Keep the existing Teacher Preparation branch assertion and add one generic type assertion to prevent regressions.

In `WeeklyPlanEditorView.test.tsx`, exercise navigation between Details, Objectives, Resources, Publication, and Revisions; assert unsaved detail changes remain present after switching panels; assert Publication is permission-gated and disappears for an invalid policy combination.

- [ ] **Step 2: Run integration tests and verify failure**

```powershell
& { npm exec vitest -- run src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanEditorView.test.tsx }
```

- [ ] **Step 3: Implement `WeeklyPlanEditorView` and the editor branch**

Add this branch after Teacher Preparation and before the generic editor body:

```tsx
if (content.type === "WEEKLY_PLAN") {
  return (
    <WeeklyPlanEditorView
      editor={{ ...editor, content }}
      canManage={canManage}
      canPublish={canPublish}
      academicYearName={academicYearName}
      termName={termName}
      termBounds={termBounds}
      onLifecycleChanged={onLifecycleChanged}
      onDeleted={onDeleted}
    />
  );
}
```

Mount the detail draft controller once at the view level. Load academic target options and the narrow `loadWeeklyPlanDetailOptions` result with per-resource failure isolation. Map each active panel to the focused component, reusing `AcademicTargetsSection`, `ReadinessPanel`, `AcademicContentPublicationPanel`, and `RevisionHistoryPanel` where applicable.

- [ ] **Step 4: Run the integration tests**

Expected: pass.

- [ ] **Step 5: Apply code and test guards**

Check that the composition does not duplicate aggregate state, does not introduce a route-per-panel, keeps functions within the project’s complexity limits, and leaves non-Weekly Plan behavior unchanged.

- [ ] **Step 6: Commit**

```powershell
& { git add src/features/academic-content/components/weekly-plan-detail/WeeklyPlanEditorView.tsx src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanEditorView.test.tsx src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx; git commit -m "feat(academic-content): specialize weekly plan detail view" }
```

### Task 8: Add bilingual copy and complete focused verification

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/academicContentWorkflowTranslations.test.ts`
- Modify only if required by discovered accessibility defects: files created in Tasks 4–7.

**Interfaces:**
- Produces: complete `academic_content.weekly_plan_detail` translation namespace with identical English and Arabic key shapes.

- [ ] **Step 1: Write the failing translation-parity assertions**

Add `weekly_plan_detail` to the existing academic-content translation namespace list and assert the following nested groups exist in both locales:

```ts
[
  "sections",
  "header",
  "details",
  "objectives",
  "topics",
  "homework",
  "assessments",
  "notes",
  "resources",
  "context",
  "empty",
  "errors",
]
```

- [ ] **Step 2: Run the translation test and verify failure**

```powershell
& { npm exec vitest -- run src/messages/__tests__/academicContentWorkflowTranslations.test.ts }
```

- [ ] **Step 3: Add complete English and Arabic copy**

Use contract-accurate wording: “Plan notes,” “Single audience,” “Week not set,” “Reference unavailable,” “Publication status,” and “Start revision.” Do not add labels for excluded Screen 5 concepts.

- [ ] **Step 4: Run all Weekly Plan-focused tests**

```powershell
& {
  npm exec vitest -- run `
    src/features/academic-content/model/__tests__/weeklyPlanDetail.test.ts `
    src/features/academic-content/services/__tests__/weeklyPlanDetailOptions.test.ts `
    src/features/academic-content/hooks/__tests__/useWeeklyPlanDetailDraft.test.tsx `
    src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanChrome.test.tsx `
    src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanPanels.test.tsx `
    src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanResourcesAndRail.test.tsx `
    src/features/academic-content/components/weekly-plan-detail/__tests__/WeeklyPlanEditorView.test.tsx `
    src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx `
    src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx `
    src/features/academic-content/services/__tests__/academicContentApi.test.ts `
    src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: all focused files pass.

- [ ] **Step 5: Run scoped lint, type-check, and production build**

```powershell
& {
  npm exec eslint -- `
    src/features/academic-content/components/weekly-plan-detail `
    src/features/academic-content/hooks/useWeeklyPlanDetailDraft.ts `
    src/features/academic-content/model/weeklyPlanDetail.ts `
    src/features/academic-content/pages/AcademicContentEditorPage.tsx `
    src/features/academic-content/components/publication `
    src/features/academic-content/hooks/useAcademicContentPublication.ts `
    src/features/academic-content/services/academicContentApi.ts `
    src/features/academic-content/types/contracts.ts
  npm run typecheck
  npm run build
}
```

Expected: all three commands exit successfully. Do not run the full test suite without asking the user first.

- [ ] **Step 6: Run final clean-code and test-quality guards**

Review the complete implementation diff with `clean-code-guard`. Review every changed test with `test-guard`. Remove dead imports, duplicated presentation logic, broad error swallowing, implementation-detail assertions, and unjustified duplicate tests.

- [ ] **Step 7: Commit translations and final verification fixes**

```powershell
& { git add -p -- src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts; git diff --cached --name-only; git commit -m "feat(academic-content): complete weekly plan detail experience" }
```

If final guard fixes touch earlier task files, stage only those specific hunks after inspecting them; do not stage whole pre-existing dirty directories.

## Final Acceptance Check

- Weekly Plans render the specialized detail view; all other types retain their current views.
- Every field and action maps to the latest backend contract.
- Excluded Screen 5 concepts do not appear.
- One shared detail draft preserves fields across independent panel saves.
- Published content uses backend revision-start behavior before editing.
- Attachments and links share existing backend-backed state and actions.
- No repeated aggregate requests are introduced by context cards.
- English, Arabic, RTL, keyboard, mobile, tablet, and desktop behavior are verified.
- Focused tests, scoped lint, type-check, and production build pass.
- Full-suite status is reported as not run unless the user explicitly approves it.
