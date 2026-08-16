# Hero Journey Mission Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the Hero Journey mission create/edit modal into a four-step wizard with a read-only review step and a shared unsaved-changes discard confirmation.

**Architecture:** Keep one form state and payload builder in `HeroJourneyMissionFormModal`, add a local `activeStep` state, and render one step panel at a time through the existing `WizardStepper`. Reuse the shared `ConfirmDialog` for every modal-close path; keep API contracts and page-level option loading unchanged.

**Tech Stack:** React, TypeScript, Next.js, next-intl, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Preserve the existing CreateHeroMissionDto payload and dirty-field normalization.
- Keep Grade and the grade-dependent mission lesson dropdown.
- Preserve published-mission read-only protections.
- Keep RTL labels and keyboard/focus-visible behavior.
- Do not mutate form state from the Review step.

---

### Task 1: Add failing wizard and discard-guard coverage

**Files:**
- Modify: `src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx`

**Interfaces:**
- Consumes: existing `renderModal`, option fixtures, and mocked `onSubmit` helpers.
- Produces: executable expectations for `WizardStepper`, step navigation, review mode, and `ConfirmDialog` behavior.

- [ ] **Step 1: Write tests for the four-step shell**

Add tests that assert the initial Basics content is visible, Links & rewards and Objectives controls are absent until Next is clicked, and Review is reached after three successful Next actions. Assert Review fields are rendered as text and do not expose editable inputs.

```tsx
it("moves through basics, links, objectives, and read-only review", async () => {
  const user = userEvent.setup();
  renderModal();

  expect(screen.getByText(labels.steps.basics)).toBeInTheDocument();
  expect(screen.getByLabelText(labels.titleEn)).toBeInTheDocument();
  expect(screen.queryByLabelText(labels.subject)).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: labels.next }));
  expect(screen.getByLabelText(labels.subject)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: labels.next }));
  expect(screen.getByTestId("mission-objective-card")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: labels.next }));

  expect(screen.getByText(labels.reviewHeading)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: labels.save })).toBeInTheDocument();
  expect(screen.queryByLabelText(labels.titleEn)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Write tests for scoped validation and Back**

Add two named tests. `it("does not leave Basics when stage and titles are missing")` clicks Next and asserts the existing `stageRequired`/`titleRequired` error text while the Basics title input remains mounted. `it("preserves values when navigating Back")` fills a valid title, advances to Links & rewards, clicks Back, and asserts the title value is still present. Add `it("blocks Review when an objective order is invalid")`, navigate to Objectives, set the first objective order to `0`, click Next, and assert the existing `objectiveOrderInvalid` message while the Objectives card remains visible.

- [ ] **Step 3: Write tests for clean and dirty close paths**

Assert a clean Cancel calls `onClose` immediately. Change a field, click Cancel, and assert the confirmation dialog with Stay/Discard labels. Stay keeps the wizard open and values intact; Discard calls `onClose` and removes the confirmation. Cover the modal close button by invoking the same `onClose` path used by `Modal`.

- [ ] **Step 4: Run the focused tests and confirm they fail**

Run:

```powershell
npm run test:run -- src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx
```

Expected: the new wizard and discard assertions fail against the current single-page form.

---

### Task 2: Implement step state, validation, and unsaved close protection

**Files:**
- Modify: `src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: existing form state, dirty field set, payload builder, `WizardStepper`, and `ConfirmDialog` APIs.
- Produces: `activeStep`, four step definitions, step-scoped validation, `handleNext`, `handleBack`, `handleClose`, `handleDiscardChanges`, and `handleSubmit` behavior used by the modal.

- [ ] **Step 1: Add step and discard state**

Import `useLocale`, `Save`, `WizardStepper`, and `ConfirmDialog`. Add:

```tsx
const [activeStep, setActiveStep] = useState(0);
const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
const locale = useLocale();
```

Reset `activeStep`, `showUnsavedDialog`, error state, and dirty fields when `isOpen` or `mission` changes. Keep the existing field initialization and option-loading effects.

- [ ] **Step 2: Define four localized steps and scoped validation**

Add localized step titles/subtitles under `heroJourney.missionForm.steps`. Implement one concrete validator in the modal; it must set the existing `error` state and return a boolean:

```tsx
const validateStep = (step: number): boolean => {
  if (step === 0) {
    if (!stageId.trim()) {
      setError(t("errors.stageRequired"));
      return false;
    }
    if (!titleEn.trim() && !titleAr.trim()) {
      setError(t("errors.titleRequired"));
      return false;
    }
  }
  if (step === 1 && !validateNumericMissionFields()) return false;
  if (step === 2 && !validateObjectiveOrders()) return false;
  setError(null);
  return true;
};
```

  Extract `validateNumericMissionFields` and `validateObjectiveOrders` from the current submit checks without changing their messages or rules. `handleNext` validates the current step and increments only on success; `handleBack` clears step errors and decrements without touching form state. `handleSubmit` runs `validateStep(0)`, `validateStep(1)`, and `validateStep(2)` before invoking `onSubmit`.

- [ ] **Step 3: Add the close state machine**

Replace direct `onClose` calls with:

```tsx
const handleClose = () => {
  if (dirtyFields.size > 0) setShowUnsavedDialog(true);
  else onClose();
};

const handleDiscardChanges = () => {
  setShowUnsavedDialog(false);
  setDirtyFields(new Set());
  onClose();
};
```

Use `handleClose` for `Modal.onClose` and the footer Cancel button. After successful submit, clear dirty fields before calling `onClose`. Render `ConfirmDialog` after the main Modal with localized `unsavedChangesTitle`, `unsavedChangesDesc`, `discard`, and `stay` messages.

- [ ] **Step 4: Render the wizard shell and step panels**

Place `WizardStepper steps={steps} activeStep={activeStep} locale={locale}` above the content. Move existing controls into four conditional panels:

1. Basics: academic year, term, stage, grade, titles, briefs.
2. Links & rewards: subject, mission lesson, assessment, rewards, coordinates, sort order.
3. Objectives: existing complete objective editor.
4. Review: read-only labels/values and objective summaries.

Use text/value blocks on Review instead of disabled inputs. Keep option errors and lesson-loading errors visible in the relevant step. The footer renders Cancel, Back when `activeStep > 0`, Next until Review, and Save only on Review.

- [ ] **Step 5: Add localized wizard and discard copy**

Add matching English and Arabic keys for `steps.basics`, `steps.links`, `steps.objectives`, `steps.review`, `next`, `back`, `unsavedChangesTitle`, `unsavedChangesDesc`, `discard`, and `stay` under `heroJourney.missionForm`. Keep existing labels and error keys unchanged.

- [ ] **Step 6: Run focused tests and typecheck**

Run:

```powershell
npm run test:run -- src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx
npm run typecheck
```

Expected: focused component tests pass and TypeScript reports no errors.

---

### Task 3: Review production code and verify the feature

**Files:**
- Review: `src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx`
- Review: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx`
- Review: `src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx`

**Interfaces:**
- Consumes: completed wizard implementation and focused tests.
- Produces: verified mission create/edit flow with no page-level contract regressions.

- [ ] **Step 1: Run the complete Hero Journey suite**

```powershell
npm run test:run -- src/features/hero-journey
```

Expected: all Hero Journey tests pass.

- [ ] **Step 2: Run lint and diff checks**

```powershell
npm run lint -- --file src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx --file src/features/hero-journey/components/HeroJourneyMissionsPage.tsx
git diff --check
```

Expected: no lint errors and no whitespace errors.

- [ ] **Step 3: Review behavior against the contract**

Confirm the final Review payload still contains academic year/term context, stage, grade metadata restoration, subject, lesson reference, assessment, reward fields, and every objective field. Confirm no direct close path bypasses `handleClose`, and a successful Save cannot trigger the discard prompt.

- [ ] **Step 4: Commit the implementation**

```powershell
git add -- src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: add hero mission wizard flow"
```
