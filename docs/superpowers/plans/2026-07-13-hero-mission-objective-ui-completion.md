# Hero Mission Objective UI Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Hero Journey mission modal's DTO-backed UI while keeping Grade-dependent lesson loading and removing unrelated scope controls.

**Architecture:** Keep request normalization and dirty-field filtering in the existing contract/service boundary. Simplify the modal's academic selection state to Stage, Grade, and Subject; Academic Year and Term continue to come from page context. Retain Grade-dependent lesson and page-provided assessment options, remove Section/Classroom controls, and make each objective card an editor for all first-class objective fields except arbitrary metadata, which is preserved internally. Add localized labels and focused interaction tests without introducing a new form library.

**Tech Stack:** React 19, Next.js 16, TypeScript, next-intl, existing `Select`, `Input`, `TextArea`, `Button`, Vitest, Testing Library.

## Global Constraints

- Preserve `POST /reinforcement/hero/missions` and the existing mission PATCH route.
- Preserve Grade and Subject because `fetchCurriculumForScope` requires `academicYearId`, `termId`, `gradeId`, and `subjectId`.
- Remove Section and Classroom controls. Preserve the UI-required Grade in `metadata.academicScope.gradeId` on create and when metadata is explicitly changed; preserve unrelated metadata keys and do not automatically send metadata on PATCH.
- Keep published protected fields disabled and keep archived missions non-editable.
- Objective type defaults to `manual`; objective `isRequired` defaults to `true`.
- Preserve explicit blank/null semantics through the existing dirty-field submission contract.
- Do not add a validation or form-management dependency.
- Preserve unrelated staged and unstaged work in the shared working tree.

---

### Task 1: Add failing coverage for the completed objective editor

**Files:**

- Modify: `src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx`
- Modify: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx`

**Interfaces:**

- Consumes: `HeroJourneyMissionFormModal` and the existing `HeroMissionObjectiveCandidate` form shape.
- Produces: regression coverage for field rendering, defaults, and dirty objective submission.

- [x] **Step 1: Write failing tests**

Add tests that render a draft mission and scope repeated assertions to a specific `[data-testid="mission-objective-card"]`. Confirm the custom `Select` interaction pattern before asserting its selected option. Assert:

```tsx
const firstObjective = within(screen.getAllByTestId("mission-objective-card")[0]);
expect(firstObjective.getByLabelText("heroJourney.missionForm.labels.objectiveType")).toBeInTheDocument();
expect(firstObjective.getByLabelText("heroJourney.missionForm.labels.objectiveSubtitleEn")).toHaveValue("");
expect(firstObjective.getByLabelText("heroJourney.missionForm.labels.objectiveSubtitleAr")).toHaveValue("");
expect(firstObjective.getByLabelText("heroJourney.missionForm.labels.objectiveLessonRef")).toHaveValue("");
expect(firstObjective.getByLabelText("heroJourney.missionForm.labels.objectiveAssessment")).toBeInTheDocument();
expect(firstObjective.getByRole("checkbox", { name: "heroJourney.missionForm.labels.objectiveRequired" })).toBeChecked();
```

Add a submission test that changes the objective type to `quiz`, fills a subtitle, and verifies `onSubmit` receives `objectives` marked dirty with those values. Cover blank, decimal, zero, duplicate, and valid positive objective order values through the contract/service tests. Add create-mode coverage confirming Grade and Subject remain visible while Section and Classroom labels are absent. Add draft-edit coverage proving an existing objective's metadata survives a subtitle edit, and that Grade or Subject changes clear a stale mission-level lesson selection. Add a published test covering disabled objective type, titles, subtitles, references, order, required checkbox, and add/remove actions. Keep archived edit suppression covered by the shared `isHeroMissionEditable`/normalizer tests.

- [x] **Step 2: Run the focused test and confirm red**

Run:

```powershell
npm run test:run -- src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx
```

Expected: FAIL because objective type, subtitles, links, required status, and the removed-scope assertions are not yet represented by the current modal.

---

### Task 2: Simplify mission scope state and add objective controls

**Files:**

- Modify: `src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx`
- Modify: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx`

**Interfaces:**

- Consumes: `HeroMissionObjectiveCandidate`, Grade/Subject-based `onLoadLessons`, page-provided assessment options, and existing mission metadata.
- Produces: a modal that renders all first-class objective DTO fields except arbitrary metadata and only the supported academic scope controls.

- [x] **Step 1: Remove Section/Classroom form state and controls**

Delete `sectionId`, `classroomId`, their option props/derived options, and their controls/handlers. Keep `stageId`, `gradeId`, `subjectId`, and Grade-dependent lesson loading. Keep page-provided assessment options filtered by available Stage/Subject data; do not delete assessment loading. Preserve the reset chain: Stage changes clear Grade and the selected mission lesson; Grade changes clear the selected mission lesson; Subject changes clear the selected mission lesson and assessment. On create, write only `academicScope.gradeId` alongside preserved metadata; on update, do not mark metadata dirty automatically, so unrelated metadata survives untouched. If metadata is explicitly changed, merge existing metadata and delete only stale `sectionId`/`classroomId` keys without sending `metadata: null`.

- [x] **Step 2: Add objective state handlers**

Keep objective state as `HeroMissionObjectiveCandidate[]`. Ensure `blankObjective()` returns `type: "manual"`, empty titles/subtitles/links, no sort order, and `isRequired: true`. Extend `updateObjective` to accept type, subtitle, linked references, order, and required changes while marking `objectives` dirty. Add a small helper for objective type options:

```ts
const objectiveTypeOptions = HERO_MISSION_OBJECTIVE_TYPES.map((type) => ({
  value: type,
  label: t(`objectiveTypes.${type}`),
}));
```

- [x] **Step 3: Render the complete objective card**

Use the existing UI primitives. Each card should contain:

- Type `Select`.
- Title EN/AR `Input` with `maxLength={255}`.
- Subtitle EN/AR `TextArea` with `maxLength={500}`.
- Linked lesson reference `Input` with `maxLength={255}`.
- Linked assessment `Select` using the existing page-provided assessment options, with a localized `__none__` sentinel converted to `null` so untouched, cleared, and newly selected values remain distinct.
- Positive order `Input` with `min={1}` and `step={1}`, blank when unset. Keep the raw string while editing; do not call `Number("")` in the change handler.
- Required native checkbox input, defaulted to checked.
- Remove button with the existing draft/create/published rules.

Preserve `objective.metadata` in every objective candidate passed through the form. Since the backend replaces the objective collection when `objectives` is present, editing a subtitle or link must not drop existing objective metadata. Add `data-testid="mission-objective-card"` to each card and scope repeated labels in tests; use the repository's existing custom `Select` testing pattern rather than assuming a native `<select>`.

Do not add a generic metadata JSON editor. Keep all new controls disabled for published missions and keep title/brief/position/sortOrder editable according to the existing status rules. Update the modal caller to stop passing Section/Classroom props while preserving page assessment-option loading and Grade-based lesson loading.

- [x] **Step 4: Run the focused test and confirm green**

Run the same Vitest command from Task 1. Expected: PASS.

---

### Task 3: Localize labels and verify the integrated form

**Files:**

- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx`

**Interfaces:**

- Consumes: the new modal translation keys under `heroJourney.missionForm`.
- Produces: English/Arabic labels and objective-type names with no untranslated keys.

- [x] **Step 1: Add matching translation keys**

Add labels for objective type, subtitles, lesson reference, assessment, and required status, plus a localized `options.noAssessment` label for the `__none__` sentinel. Add six objective type labels under `objectiveTypes`: manual, lesson, quiz, assessment, task, and custom. Add Arabic equivalents with the same key structure.

- [x] **Step 2: Extend tests for localized key usage**

Keep the existing mocked translator and assert controls by their translation keys, ensuring the component does not hardcode user-facing English text.

- [x] **Step 3: Run integrated checks**

Run:

```powershell
npm run test:run -- src/features/hero-journey
npm run typecheck
npm run lint -- src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx src/features/hero-journey/components/HeroJourneyMissionsPage.tsx src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx
```

Expected: all Hero Journey tests pass, TypeScript exits 0, and ESLint reports no findings.

---

## Final Verification

- [x] Run the baseline commands before implementation and compare their results with the post-change commands:

```powershell
npm run typecheck
npm run test:run -- src/features/hero-journey
```

- [x] Run `git diff --check`.
- [x] Parse `src/messages/en.json` and `src/messages/ar.json` as JSON.
- [x] Confirm Section/Classroom no longer appear in the mission modal while Grade and Subject remain, and confirm Grade is restored from `metadata.academicScope.gradeId` when editing.
- [x] Confirm the working tree still contains unrelated user changes and no destructive cleanup was performed.
