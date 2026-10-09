# Teacher Preparation Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a backend-compatible, preparation-specific detail experience that follows Screen 3’s hierarchy while preserving the existing academic-content editor contract and every other content-type editor.

**Architecture:** Keep the existing content route, editor hook, mutation services, dirty guards, permissions, and refresh behavior. Branch presentation only after aggregate loading: teacher preparations use a dedicated three-column view backed by a shared preparation-detail draft controller; all other content types keep the current generic view.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS, existing `src/components/ui` primitives, Lucide icons, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-05-teacher-preparation-detail-design.md`

## Global Constraints

- Do not modify the backend or invent API fields.
- Never display a readiness percentage, completed-section count, lesson duration, author identity, or raw unresolved identifier.
- Treat a resolved teacher allocation as an assigned teacher, not the content creator.
- Preserve the complete preparation-detail payload whenever any preparation-detail section is saved.
- Keep all non-`TEACHER_PREPARATION` editor behavior unchanged.
- Use existing components from `src/components/ui`; add a new UI primitive only when no suitable primitive exists.
- Preserve English, Arabic, RTL, keyboard access, permissions, read-only rules, and unsaved-change guards.
- The Overview must show attachments directly below Key Concepts; Resources remains a dedicated section using the same backend-backed attachment implementation.
- The worktree contains unrelated uncommitted editor, review, template, publication, configuration, and translation changes. Inspect `git diff` before every overlapping edit and stage only task-owned hunks.
- Apply Clean Code Guard to every production-code change and Test Guard to every test change.
- Do not run the full test suite without explicit user approval.

---

### Task 1: Preparation Presentation Model and Resolvers

**Files:**
- Create: `src/features/academic-content/model/teacherPreparationDetail.ts`
- Create: `src/features/academic-content/model/__tests__/teacherPreparationDetail.test.ts`

**Interfaces:**
- Consumes: `AcademicContentTarget`, `AcademicContentPreparationDetail`, `AcademicTargetOptions`, `AcademicContentDetailOptions`, and teacher directory items.
- Produces:
  - `TeacherPreparationPanel` union for `overview | targets | objectives | learningOutcomes | teachingStrategies | activities | resources | assessment | teacherNotes | references | readiness | publication | revisions`.
  - `TEACHER_PREPARATION_PANELS` definitions with stable label and icon keys.
  - `emptyTeacherPreparationDetail(): AcademicContentPreparationDetail`.
  - `normalizeTeacherPreparationDetail(detail): ReplaceAcademicContentPreparationDetailRequest`.
  - Pure target, assigned-teacher, curriculum, lesson-plan, and timetable resolution helpers that return display models or `null`, never raw IDs.

- [ ] **Step 1: Write failing model tests**

Cover payload preservation, whitespace normalization, multiple-target summaries, allocation resolution, optional-reference resolution, and unavailable identifiers:

```ts
it("preserves fields owned by other panels when normalizing one shared draft", () => {
  expect(normalizeTeacherPreparationDetail({
    ...emptyTeacherPreparationDetail(),
    topic: " Fractions ",
    objectives: [" Compare values "],
    teacherNotes: " Keep the visual model ",
  })).toMatchObject({
    topic: "Fractions",
    objectives: ["Compare values"],
    teacherNotes: "Keep the visual model",
  });
});

it("never falls back to unresolved identifiers", () => {
  expect(resolveTeacherPreparationReferences(detail, options)).toMatchObject({
    curriculum: null,
    timetable: null,
  });
});
```

- [ ] **Step 2: Run the focused model test and confirm failure**

Run:

```powershell
& { npx vitest run src/features/academic-content/model/__tests__/teacherPreparationDetail.test.ts; exit $LASTEXITCODE }
```

Expected: failure because the model does not exist.

- [ ] **Step 3: Implement the pure model**

Use explicit display types and stable null fallbacks. Normalization must trim optional text, normalize ordered arrays with the existing preparation rules, and retain every contract field:

```ts
export function normalizeTeacherPreparationDetail(
  detail: AcademicContentPreparationDetail,
): ReplaceAcademicContentPreparationDetailRequest {
  return {
    topic: detail.topic?.trim() || null,
    objectives: normalizeOrderedValues(detail.objectives),
    learningOutcomes: normalizeOrderedValues(detail.learningOutcomes),
    teachingStrategies: normalizeOrderedValues(detail.teachingStrategies),
    activities: normalizeOrderedValues(detail.activities),
    resourceNotes: detail.resourceNotes?.trim() || null,
    assessmentNotes: detail.assessmentNotes?.trim() || null,
    teacherNotes: detail.teacherNotes?.trim() || null,
    curriculumId: detail.curriculumId || null,
    curriculumUnitId: detail.curriculumUnitId || null,
    curriculumLessonId: detail.curriculumLessonId || null,
    lessonPlanId: detail.lessonPlanId || null,
    lessonPlanItemId: detail.lessonPlanItemId || null,
    timetableEntryId: detail.timetableEntryId || null,
  };
}

function normalizeOrderedValues(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}
```

- [ ] **Step 4: Run the model test**

Expected: all cases pass.

- [ ] **Step 5: Apply Clean Code Guard and Test Guard, then commit**

Confirm resolver names describe business meaning, no helper exposes raw IDs, and tests assert behavior rather than implementation details.

```powershell
& { git add -- src/features/academic-content/model/teacherPreparationDetail.ts src/features/academic-content/model/__tests__/teacherPreparationDetail.test.ts; git commit -m "feat(academic-content): model preparation detail presentation" }
```

---

### Task 2: Shared Preparation Detail Draft Controller

**Files:**
- Create: `src/features/academic-content/hooks/useTeacherPreparationDetailDraft.ts`
- Create: `src/features/academic-content/hooks/__tests__/useTeacherPreparationDetailDraft.test.tsx`

**Interfaces:**
- Consumes: initial `AcademicContentPreparationDetail`, `contentVersion`, disabled state, `AcademicContentEditorSectionState`, `onDirty`, and `onSave(request): Promise<boolean>`.
- Produces:

```ts
export interface TeacherPreparationDetailDraftController {
  draft: AcademicContentPreparationDetail;
  validationError: string | null;
  update<K extends keyof AcademicContentPreparationDetail>(
    field: K,
    value: AcademicContentPreparationDetail[K],
  ): void;
  save(): Promise<boolean>;
  resetValidation(): void;
}
```

- [ ] **Step 1: Write failing hook tests**

Test that edits from different panels coexist, save sends one complete normalized payload, successful save resynchronizes safely, failed save preserves draft values, blank ordered items block the request, and a newer server version replaces the draft only when it is clean.

```ts
act(() => {
  result.current.update("objectives", ["Compare fractions"]);
  result.current.update("teacherNotes", "Use fraction tiles");
});
await act(() => result.current.save());
expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
  objectives: ["Compare fractions"],
  teacherNotes: "Use fraction tiles",
  learningOutcomes: initial.learningOutcomes,
}));
```

- [ ] **Step 2: Run the hook test and confirm failure**

```powershell
& { npx vitest run src/features/academic-content/hooks/__tests__/useTeacherPreparationDetailDraft.test.tsx; exit $LASTEXITCODE }
```

- [ ] **Step 3: Implement the controller**

Use one draft for all preparation-detail panels. Call `onDirty()` on the first and subsequent changes. Validate empty ordered entries before `onSave`. Since the backend request replaces the complete detail, one successful save saves and clears all detail-panel changes through the existing editor `details` section state.

- [ ] **Step 4: Run the hook test**

Expected: all cases pass without act warnings.

- [ ] **Step 5: Apply both guards and commit**

```powershell
& { git add -- src/features/academic-content/hooks/useTeacherPreparationDetailDraft.ts src/features/academic-content/hooks/__tests__/useTeacherPreparationDetailDraft.test.tsx; git commit -m "feat(academic-content): share preparation detail draft" }
```

---

### Task 3: Preparation Header and Section Navigation

**Files:**
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationHeader.tsx`
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationSectionNav.tsx`
- Create: `src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationChrome.test.tsx`
- Create: `src/messages/__tests__/teacherPreparationDetailTranslations.test.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: loaded teacher-preparation content, academic year/term labels, resolved target summary, assigned-teacher display, `TeacherPreparationPanel`, editor indicators, permissions, workflow state, and navigation callbacks.
- Produces: responsive, RTL-safe page chrome with preparation-specific section selection.

- [ ] **Step 1: Write failing presentation tests**

Verify:

- breadcrumb and Back to Preparations preserve `year` and `term`;
- title, description, status, and multi-target summary render without invented fields;
- assigned teacher uses the “Assigned teacher” label;
- submit/resubmit is hidden or disabled according to permission, policy, mutability, readiness, dirty, saving, and submitting state;
- desktop and mobile section controls have accessible names and `aria-current`;
- no readiness percentage or lesson-duration copy is rendered.

```tsx
expect(screen.getByRole("link", { name: "Back to preparations" })).toHaveAttribute(
  "href",
  "/en/academic-content-hub/preparations?year=year-1&term=term-1",
);
expect(screen.queryByText(/%|minutes/i)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the focused component test and confirm failure**

```powershell
& { npx vitest run src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationChrome.test.tsx; exit $LASTEXITCODE }
```

- [ ] **Step 3: Implement header and navigation with existing UI components**

Use `Button`, established status badges, and Lucide icons. Do not create a custom button, dropdown, badge, or tooltip primitive. Keep the submit callback injected; the header must not call workflow APIs itself.

- [ ] **Step 4: Add aligned English and Arabic copy**

Add a `academic_content.teacher_preparation_detail` namespace with header, section, state, empty, and accessible-label strings. Stage only that namespace because both locale files contain unrelated changes.

- [ ] **Step 5: Run presentation and translation alignment tests**

```powershell
& { npx vitest run src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationChrome.test.tsx src/messages/__tests__/teacherPreparationDetailTranslations.test.ts; exit $LASTEXITCODE }
```

Create `src/messages/__tests__/teacherPreparationDetailTranslations.test.ts` in this step and assert English/Arabic key-path equality.

- [ ] **Step 6: Apply both guards and commit only task-owned hunks**

```powershell
& { git add -- src/features/academic-content/components/preparation-detail/TeacherPreparationHeader.tsx src/features/academic-content/components/preparation-detail/TeacherPreparationSectionNav.tsx src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationChrome.test.tsx src/messages/__tests__/teacherPreparationDetailTranslations.test.ts; git add -p -- src/messages/en.json src/messages/ar.json; git commit -m "feat(academic-content): add preparation detail chrome" }
```

---

### Task 4: Overview and Dedicated Resources Surfaces

**Files:**
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationOverview.tsx`
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationResources.tsx`
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationKeyConcepts.tsx`
- Create: `src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationResources.test.tsx`
- Modify: `src/features/academic-content/components/editor/FilesSection.tsx`
- Modify: `src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx`

**Interfaces:**
- Consumes: editor metadata/tag/link/file state, shared detail draft controller, loaded content, and `onFilesChanged`.
- Produces:
  - Overview order: metadata/topic → Key Concepts → attachments.
  - Dedicated Resources order: resource notes → attachment manager → links.
  - One reusable attachment implementation with optional compact/full presentation; no separate asset state.

- [ ] **Step 1: Inspect and preserve overlapping file changes**

Run:

```powershell
& { git diff -- src/features/academic-content/components/editor/FilesSection.tsx src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx }
```

If the diff contains unrelated work, layer the smallest compatible prop addition and stage only the new hunks.

- [ ] **Step 2: Write failing resource-surface tests**

Verify that Overview places Attachments after Key Concepts, both surfaces use the same `content.assets`, upload/unlink refresh invokes the provided aggregate/readiness callback, Resources contains resource notes and links, and read-only mode removes upload/unlink controls.

```tsx
const overview = screen.getByTestId("preparation-overview");
const keyConcepts = within(overview).getByRole("heading", { name: "Key concepts" });
const attachments = within(overview).getByRole("heading", { name: "Attachments" });
expect(keyConcepts.compareDocumentPosition(attachments)).toBe(
  Node.DOCUMENT_POSITION_FOLLOWING,
);
```

- [ ] **Step 3: Run the tests and confirm failure**

```powershell
& { npx vitest run src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationResources.test.tsx; exit $LASTEXITCODE }
```

- [ ] **Step 4: Add a presentation prop to the existing file manager**

Add `variant?: "full" | "embedded"` to `FilesSectionProps`, default it to `"full"`, and use `"embedded"` only to remove the outer card border/shadow and lower the heading level inside Overview. Keep upload policy, queue, validation, unlink, and refresh logic inside `FilesSection`; do not fork those behaviors.

- [ ] **Step 5: Implement Overview and Resources**

Overview reuses `BasicInformationSection`, an editable topic panel backed by the shared draft, a tag-chip presentation/edit entry point, and embedded `FilesSection`. Resources renders resource notes backed by the shared draft, full `FilesSection`, and `LinksSection`.

- [ ] **Step 6: Run focused tests**

```powershell
& { npx vitest run src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationResources.test.tsx src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx; exit $LASTEXITCODE }
```

- [ ] **Step 7: Apply both guards and commit**

```powershell
& { git add -- src/features/academic-content/components/preparation-detail/TeacherPreparationOverview.tsx src/features/academic-content/components/preparation-detail/TeacherPreparationResources.tsx src/features/academic-content/components/preparation-detail/TeacherPreparationKeyConcepts.tsx src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationResources.test.tsx; git add -p -- src/features/academic-content/components/editor/FilesSection.tsx src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx; git commit -m "feat(academic-content): add preparation overview resources" }
```

---

### Task 5: Preparation Detail Panels

**Files:**
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationOrderedListPanel.tsx`
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationNotesPanel.tsx`
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationReferencesPanel.tsx`
- Create: `src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationPanels.test.tsx`

**Interfaces:**
- Consumes: `TeacherPreparationDetailDraftController`, editor `details` section state, disabled state, and loaded reference options.
- Produces focused panels for objectives, outcomes, strategies, activities, assessment notes, teacher notes, resource notes, and references.

- [ ] **Step 1: Write failing panel tests**

Verify ordered rows add/remove/reorder with visible labels, note panels enforce backend maximum lengths, reference selection clears dependent IDs, unavailable options show a retryable isolated state, and every save delegates to the shared controller rather than constructing a partial API payload.

```tsx
fireEvent.change(screen.getByLabelText("Objective 1"), {
  target: { value: "Compare equivalent fractions" },
});
fireEvent.click(screen.getByRole("button", { name: "Save objectives" }));
expect(controller.save).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run the panel tests and confirm failure**

```powershell
& { npx vitest run src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationPanels.test.tsx; exit $LASTEXITCODE }
```

- [ ] **Step 3: Implement generic ordered-list and note panels**

Reuse existing `Button`, `Input`, and `TextArea` components. Keep each component controlled through the draft controller and accept explicit field/label configuration rather than branching on translated strings.

- [ ] **Step 4: Implement references panel**

Reuse the current reference option types and dependency rules:

- clearing curriculum also clears curriculum unit, lesson, lesson plan, and lesson-plan item;
- clearing curriculum unit clears curriculum lesson;
- clearing lesson plan clears lesson-plan item;
- timetable remains optional.

- [ ] **Step 5: Run focused tests**

Expected: all panel tests pass.

- [ ] **Step 6: Apply both guards and commit**

```powershell
& { git add -- src/features/academic-content/components/preparation-detail/TeacherPreparationOrderedListPanel.tsx src/features/academic-content/components/preparation-detail/TeacherPreparationNotesPanel.tsx src/features/academic-content/components/preparation-detail/TeacherPreparationReferencesPanel.tsx src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationPanels.test.tsx; git commit -m "feat(academic-content): add preparation detail panels" }
```

---

### Task 6: Context Rail and Workflow Composition

**Files:**
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationContextRail.tsx`
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationReadinessCard.tsx`
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationReferenceCards.tsx`
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationApprovalHistoryCard.tsx`
- Create: `src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationContextRail.test.tsx`
- Modify: `src/features/academic-content/components/workflow/ApprovalHistoryPanel.tsx`
- Modify: `src/features/academic-content/components/editor/ReadinessPanel.tsx`

**Interfaces:**
- Consumes: authoritative readiness, resolved reference displays, workflow history/loading/error state, the already-loaded teacher directory for best-effort actor-name resolution, and retry callbacks.
- Produces compact card variants for the right rail while preserving the full existing readiness and approval-history panels for the generic editor.

- [ ] **Step 1: Inspect overlapping diffs before editing**

```powershell
& { git diff -- src/features/academic-content/components/workflow/ApprovalHistoryPanel.tsx src/features/academic-content/components/editor/ReadinessPanel.tsx }
```

- [ ] **Step 2: Write failing rail tests**

Verify:

- ready/blocked comes only from `canAdvance`;
- backend blocking reasons are localized with safe message fallback;
- no percentage or synthetic checklist is rendered;
- curriculum and timetable cards show resolved values or neutral unavailable states, never UUIDs;
- approval rounds and timestamps render from history;
- submitter and decision-maker names render only when resolved; otherwise a localized “Name unavailable” label is used instead of a raw user ID;
- a history/reference failure does not replace readiness or preparation content.

- [ ] **Step 3: Run the rail tests and confirm failure**

```powershell
& { npx vitest run src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationContextRail.test.tsx; exit $LASTEXITCODE }
```

- [ ] **Step 4: Extract compatible compact variants**

Add `variant?: "full" | "compact"` to both `ReadinessPanel` and `ApprovalHistoryPanel`, defaulting to `"full"`. The compact variant changes only card spacing and heading scale; it reuses the same readiness-reason mapping, date formatting, empty state, and approval rows.

- [ ] **Step 5: Implement the context rail**

Use semantic sections, headings, status text, and existing card styles. Keep each retry scoped to the resource that failed.

- [ ] **Step 6: Run rail plus existing readiness/workflow tests**

```powershell
& { npx vitest run src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationContextRail.test.tsx src/features/academic-content/components/editor/__tests__/ReadinessPanel.test.tsx src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx; exit $LASTEXITCODE }
```

- [ ] **Step 7: Apply both guards and commit task-owned hunks**

```powershell
& { git add -- src/features/academic-content/components/preparation-detail/TeacherPreparationContextRail.tsx src/features/academic-content/components/preparation-detail/TeacherPreparationReadinessCard.tsx src/features/academic-content/components/preparation-detail/TeacherPreparationReferenceCards.tsx src/features/academic-content/components/preparation-detail/TeacherPreparationApprovalHistoryCard.tsx src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationContextRail.test.tsx; git add -p -- src/features/academic-content/components/workflow/ApprovalHistoryPanel.tsx src/features/academic-content/components/editor/ReadinessPanel.tsx; git commit -m "feat(academic-content): add preparation context rail" }
```

---

### Task 7: Specialized View Assembly and Editor Branch

**Files:**
- Create: `src/features/academic-content/components/preparation-detail/TeacherPreparationEditorView.tsx`
- Create: `src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationEditorView.test.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx`

**Interfaces:**
- Consumes: `AcademicContentEditorState`, page context labels/bounds, manage/publish permissions, lifecycle callbacks, the detail-options loader, and the workflow hook.
- Produces the responsive three-column teacher-preparation view and a presentation branch that leaves all other content types on the existing editor.

- [ ] **Step 1: Inspect existing overlapping editor diffs**

```powershell
& { git diff -- src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx }
```

Preserve publication work and any existing editor refinements. Do not replace these files wholesale.

- [ ] **Step 2: Write failing integration tests**

Add tests proving:

- a loaded teacher preparation renders the preparation-specific header, nav, Overview attachment placement, and right rail;
- a weekly plan still renders the generic editor sections;
- active sections switch without route changes;
- unsaved preparation-detail values survive section switches;
- submit applies the transition and refreshes aggregate/readiness/history;
- desktop and mobile section navigation are accessible;
- context-guard and before-unload behavior remain active.

```tsx
expect(screen.getByRole("heading", { name: "Teacher preparation" })).toBeVisible();
fireEvent.click(screen.getByRole("button", { name: "Objectives" }));
expect(screen.getByRole("heading", { name: "Objectives" })).toBeVisible();
expect(replacePreparationDetail).not.toHaveBeenCalled();
```

- [ ] **Step 3: Run integration tests and confirm failure**

```powershell
& { npx vitest run src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationEditorView.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx; exit $LASTEXITCODE }
```

- [ ] **Step 4: Assemble the specialized view**

Load detail options once per content/version with stale-response protection. Load workflow once and pass derived state to header and history rail. Build the layout:

```tsx
<TeacherPreparationHeader />
<TeacherPreparationSectionNav variant="mobile" />
<div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
  <TeacherPreparationSectionNav variant="desktop" />
  <section>{activePanelContent}</section>
  <TeacherPreparationContextRail />
</div>
```

At narrower breakpoints, allow the rail to flow after the main panel. Keep sticky positioning only on desktop and apply the dashboard-safe top offset.

- [ ] **Step 5: Branch presentation inside the existing editor view**

Retain common loading and aggregate-error handling. After content is available:

```tsx
if (editor.content.type === "TEACHER_PREPARATION") {
  return <TeacherPreparationEditorView {...sharedProps} editor={editor} />;
}
return <GenericAcademicContentEditorView {...sharedProps} editor={editor} />;
```

The generic component contains the current editor markup with no behavior changes.

- [ ] **Step 6: Run editor and workflow integration tests**

```powershell
& { npx vitest run src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationEditorView.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx; exit $LASTEXITCODE }
```

- [ ] **Step 7: Apply both guards and commit task-owned hunks**

```powershell
& { git add -- src/features/academic-content/components/preparation-detail/TeacherPreparationEditorView.tsx src/features/academic-content/components/preparation-detail/__tests__/TeacherPreparationEditorView.test.tsx; git add -p -- src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx; git commit -m "feat(academic-content): specialize preparation detail view" }
```

---

### Task 8: Final Regression and Production Verification

**Files:**
- Modify only files required to fix failures directly caused by Tasks 1–7.

**Interfaces:**
- Consumes: the completed specialized preparation view.
- Produces: a verified, reviewable implementation with unrelated worktree changes preserved.

- [ ] **Step 1: Run all preparation-detail focused tests**

```powershell
& { npx vitest run src/features/academic-content/model/__tests__/teacherPreparationDetail.test.ts src/features/academic-content/hooks/__tests__/useTeacherPreparationDetailDraft.test.tsx src/features/academic-content/components/preparation-detail/__tests__ src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx src/messages/__tests__/teacherPreparationDetailTranslations.test.ts; exit $LASTEXITCODE }
```

- [ ] **Step 2: Run scoped lint**

```powershell
& { npx eslint src/features/academic-content/model/teacherPreparationDetail.ts src/features/academic-content/hooks/useTeacherPreparationDetailDraft.ts src/features/academic-content/components/preparation-detail src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/model/__tests__/teacherPreparationDetail.test.ts src/features/academic-content/hooks/__tests__/useTeacherPreparationDetailDraft.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx src/messages/__tests__/teacherPreparationDetailTranslations.test.ts; exit $LASTEXITCODE }
```

- [ ] **Step 3: Run TypeScript checking**

```powershell
& { npm run typecheck; exit $LASTEXITCODE }
```

- [ ] **Step 4: Run the production build**

```powershell
& { npm run build; exit $LASTEXITCODE }
```

- [ ] **Step 5: Request explicit approval before the full suite**

Ask the user whether to run `npm run test:run`. Do not execute it until approval is received.

- [ ] **Step 6: Perform final Clean Code Guard and Test Guard reviews**

Review production files for duplicated backend state, partial replacement payloads, stale async responses, overgrown components, fabricated display data, and inaccessible controls. Review tests for brittle implementation assertions, redundant cases, missing behavior coverage, and unhandled async work. Fix findings and rerun the smallest affected checks.

- [ ] **Step 7: Inspect final scope and commit verification fixes**

```powershell
& { git status --short; git diff --check; git diff --stat }
```

Stage only task-owned fixes. Leave unrelated existing changes untouched.

```powershell
& { git commit -m "fix(academic-content): harden preparation detail experience" }
```

Skip the final commit if the verification pass produces no code changes.
