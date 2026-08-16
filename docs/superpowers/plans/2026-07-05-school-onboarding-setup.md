# School Onboarding Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a data-driven school setup checklist on the dashboard and a permanent Settings page for organization, academic context, structure, subject allocation, and rooms.

**Architecture:** A focused onboarding feature normalizes existing service results into one snapshot and evaluates completion through pure predicates. A shared controller powers both the dashboard card and full page; small domain adapters reuse existing dialogs/services and trigger slice-level refreshes after mutations.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS, Lucide React, Vitest, Testing Library.

---

## File map

- Create `src/features/onboarding/types.ts`: normalized snapshot, request state, and step status contracts.
- Create `src/features/onboarding/config/setupSteps.ts`: ordered metadata and prerequisites.
- Create `src/features/onboarding/utils/setupStatus.ts`: pure completion and dependency evaluation.
- Create `src/features/onboarding/hooks/useSetupStatus.ts`: parallel loading and targeted refresh orchestration.
- Create `src/features/onboarding/components/SetupGuide.tsx`: shared responsive checklist shell.
- Create `src/features/onboarding/components/SetupGuideCard.tsx`: dismissible dashboard wrapper.
- Create `src/features/onboarding/components/steps/*.tsx`: focused organization, academic context, structure, subjects, and rooms adapters.
- Create `src/features/onboarding/pages/SchoolOnboardingPage.tsx`: dedicated page.
- Create `src/app/[lang]/(dashboard)/settings/onboarding/page.tsx`: route entry.
- Modify `src/features/dashboard/views/SchoolDashboardView.tsx`: render the setup card above existing dashboard sections.
- Modify `src/config/navigation.ts`: add the Settings child route.
- Modify `src/messages/en.json` and `src/messages/ar.json`: bilingual copy.
- Add focused unit/component tests under `src/features/onboarding/__tests__/` and update the dashboard view test surface.

### Task 1: Define setup status contracts and predicates

**Files:**
- Create: `src/features/onboarding/types.ts`
- Create: `src/features/onboarding/config/setupSteps.ts`
- Create: `src/features/onboarding/utils/setupStatus.ts`
- Test: `src/features/onboarding/__tests__/setupStatus.test.ts`

- [ ] **Step 1: Write failing predicate tests**

Cover empty data, a valid complete chain, orphaned structure/allocation relationships, a failed prerequisite, and progress calculation. Use a helper shaped like:

```ts
const completeSnapshot: SetupSnapshot = {
  organization: { status: "success", data: validProfile },
  academicContext: { status: "success", data: { years: [year], termsByYear: { [year.id]: [term] } } },
  structure: { status: "success", data: { stages: [stage], grades: [grade], sections: [section], classrooms: [] } },
  subjects: { status: "success", data: { subjects: [subject], allocations: [{ subjectId: subject.id, gradeId: grade.id, weeklyHours: 4 }] } },
  rooms: { status: "success", data: [room] },
};

expect(evaluateSetup(completeSnapshot).completedCount).toBe(5);
expect(evaluateSetup(emptySnapshot).steps.academicContext.status).toBe("locked");
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm run test:run -- src/features/onboarding/__tests__/setupStatus.test.ts`

Expected: FAIL because onboarding contracts and `evaluateSetup` do not exist.

- [ ] **Step 3: Implement the contracts and ordered registry**

Define `SetupStepId` as `organization | academicContext | structure | subjects | rooms`, `ResourceState<T>` as loading/success/error, and `SetupEvaluation` with keyed step results, `completedCount`, `totalCount`, `progressPercent`, and `isComplete`.

```ts
export const setupSteps: SetupStepDefinition[] = [
  { id: "organization", translationKey: "organization", prerequisites: [] },
  { id: "academicContext", translationKey: "academic_context", prerequisites: ["organization"] },
  { id: "structure", translationKey: "structure", prerequisites: ["academicContext"] },
  { id: "subjects", translationKey: "subjects", prerequisites: ["structure"] },
  { id: "rooms", translationKey: "rooms", prerequisites: ["subjects"] },
];
```

Organization is complete when `schoolName.trim()` is non-empty. Academic context requires a real year and a term belonging to it. Structure requires a valid stage → grade → section chain. Subjects require a subject and allocation referencing both an existing subject and grade. Rooms require one room.

- [ ] **Step 4: Run tests and commit**

Run: `npm run test:run -- src/features/onboarding/__tests__/setupStatus.test.ts`

Expected: PASS.

```bash
git add src/features/onboarding/types.ts src/features/onboarding/config/setupSteps.ts src/features/onboarding/utils/setupStatus.ts src/features/onboarding/__tests__/setupStatus.test.ts
git commit -m "feat: add onboarding completion model"
```

### Task 2: Load and refresh real setup data

**Files:**
- Create: `src/features/onboarding/hooks/useSetupStatus.ts`
- Test: `src/features/onboarding/__tests__/useSetupStatus.test.tsx`

- [ ] **Step 1: Write failing hook tests**

Mock `fetchBrandingProfile`, `fetchAcademicYears`, `fetchTermsByYear`, `fetchStructureTree`, `fetchSubjects`, `fetchSubjectAllocations`, and `fetchRooms`. Assert initial loading, parallel root requests, context-dependent requests using the first active/open context, partial failure isolation, `retryStep("rooms")`, and `refreshStep("academicContext")`.

- [ ] **Step 2: Run the hook test and verify failure**

Run: `npm run test:run -- src/features/onboarding/__tests__/useSetupStatus.test.tsx`

Expected: FAIL because `useSetupStatus` does not exist.

- [ ] **Step 3: Implement the hook**

Expose:

```ts
export interface UseSetupStatusResult {
  snapshot: SetupSnapshot;
  evaluation: SetupEvaluation;
  selectedYear: AcademicYear | null;
  selectedTerm: Term | null;
  schoolId: string;
  refreshStep(stepId: SetupStepId): Promise<void>;
  retryStep(stepId: SetupStepId): Promise<void>;
}
```

Resolve `schoolId` from `useAuth().user.activeMembership.schoolId`; do not use the existing `"active-school"` fallback. If no school ID exists, return a rooms resource error. Load years first, then terms for each year. Select the active year and open term, falling back to the first real items. Only request structure, subjects, and allocations when real IDs exist. Guard unmounts with an ignore flag.

- [ ] **Step 4: Run tests and commit**

Run: `npm run test:run -- src/features/onboarding/__tests__/useSetupStatus.test.tsx`

Expected: PASS with no unhandled promise warnings.

```bash
git add src/features/onboarding/hooks/useSetupStatus.ts src/features/onboarding/__tests__/useSetupStatus.test.tsx
git commit -m "feat: load onboarding setup status"
```

### Task 3: Build the shared setup guide shell

**Files:**
- Create: `src/features/onboarding/components/SetupGuide.tsx`
- Create: `src/features/onboarding/components/SetupGuideSkeleton.tsx`
- Test: `src/features/onboarding/__tests__/SetupGuide.test.tsx`

- [ ] **Step 1: Write failing interaction and accessibility tests**

Render one complete, one available, one error, and two locked steps. Assert progress text, selected panel, keyboard-operable buttons, locked `aria-disabled`, prerequisite explanation, scoped retry, and no action invocation for locked steps.

- [ ] **Step 2: Run the test and verify failure**

Run: `npm run test:run -- src/features/onboarding/__tests__/SetupGuide.test.tsx`

Expected: FAIL because `SetupGuide` does not exist.

- [ ] **Step 3: Implement the responsive guide**

Use semantic buttons instead of a tab role because locked steps cannot be selected. Render Lucide icons (`Building2`, `CalendarRange`, `Network`, `BookOpen`, `DoorOpen`, `CheckCircle2`, `LockKeyhole`, `AlertCircle`) with text labels. Use `grid-cols-1 md:grid-cols-5`, visible `focus-visible:ring-2`, text status, and an `aria-live="polite"` progress summary. The skeleton must preserve the final card height.

- [ ] **Step 4: Run tests and commit**

Run: `npm run test:run -- src/features/onboarding/__tests__/SetupGuide.test.tsx`

Expected: PASS.

```bash
git add src/features/onboarding/components/SetupGuide.tsx src/features/onboarding/components/SetupGuideSkeleton.tsx src/features/onboarding/__tests__/SetupGuide.test.tsx
git commit -m "feat: add responsive setup guide"
```

### Task 4: Add organization and academic context actions

**Files:**
- Create: `src/features/onboarding/components/steps/OrganizationSetupStep.tsx`
- Create: `src/features/onboarding/components/steps/AcademicContextSetupStep.tsx`
- Test: `src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx`
- Test: `src/features/onboarding/__tests__/AcademicContextSetupStep.test.tsx`

- [ ] **Step 1: Write failing form and dialog tests**

Assert organization save merges edited basic fields into the fetched `SchoolProfileSettings` and calls `updateBrandingProfile`; failed save preserves fields. Assert academic context opens `YearDialog` when no year exists, then `TermDialog` after refresh when a year exists, passing `existingYears`, `academicYear`, and `existingTerms` exactly.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx src/features/onboarding/__tests__/AcademicContextSetupStep.test.tsx`

Expected: FAIL because both step adapters are missing.

- [ ] **Step 3: Implement organization setup**

Use existing `Input`, `Select`, and `Button` primitives for school name, short name, timezone, address, city, and country. Initialize from the fetched profile, require school name, and pass the complete merged object to `updateBrandingProfile` so optional branding fields are not erased. Call `refreshStep("organization")` after success.

- [ ] **Step 4: Implement academic context setup**

Render counts and the next action. Reuse `YearDialog` and `TermDialog`; their `onSuccess` calls `refreshStep("academicContext")`. Do not reproduce date validation.

- [ ] **Step 5: Run tests and commit**

Run: `npm run test:run -- src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx src/features/onboarding/__tests__/AcademicContextSetupStep.test.tsx`

Expected: PASS.

```bash
git add src/features/onboarding/components/steps/OrganizationSetupStep.tsx src/features/onboarding/components/steps/AcademicContextSetupStep.tsx src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx src/features/onboarding/__tests__/AcademicContextSetupStep.test.tsx
git commit -m "feat: add organization and academic onboarding steps"
```

### Task 5: Add the compact academic structure flow

**Files:**
- Create: `src/features/onboarding/components/steps/AcademicStructureSetupStep.tsx`
- Test: `src/features/onboarding/__tests__/AcademicStructureSetupStep.test.tsx`

- [ ] **Step 1: Write a failing sequential-flow test**

Starting from an empty tree, assert the form first creates a stage with `createStage(yearId, termId, payload)`, then offers grade creation with the created stage ID, then section creation with the created grade ID. Assert a failed request preserves field values.

- [ ] **Step 2: Run the test and verify failure**

Run: `npm run test:run -- src/features/onboarding/__tests__/AcademicStructureSetupStep.test.tsx`

Expected: FAIL because the structure step is missing.

- [ ] **Step 3: Implement the minimal sequential form**

Use one bilingual name form at a time. Derive the next missing entity from the current tree. Call existing `createStage`, `createGrade`, and `createSection`; never create a classroom because the approved completion rule stops at section. After every success call `refreshStep("structure")`, and use refreshed IDs for the next action.

- [ ] **Step 4: Run tests and commit**

Run: `npm run test:run -- src/features/onboarding/__tests__/AcademicStructureSetupStep.test.tsx`

Expected: PASS.

```bash
git add src/features/onboarding/components/steps/AcademicStructureSetupStep.tsx src/features/onboarding/__tests__/AcademicStructureSetupStep.test.tsx
git commit -m "feat: add academic structure onboarding step"
```

### Task 6: Add subject allocation and room actions

**Files:**
- Create: `src/features/onboarding/components/steps/SubjectsSetupStep.tsx`
- Create: `src/features/onboarding/components/steps/RoomsSetupStep.tsx`
- Test: `src/features/onboarding/__tests__/SubjectsSetupStep.test.tsx`
- Test: `src/features/onboarding/__tests__/RoomsSetupStep.test.tsx`

- [ ] **Step 1: Write failing subject and room tests**

Assert the subject step opens `SubjectDialog` when no subject exists, then renders grade/subject/weekly-hours allocation fields and calls `bulkUpsertSubjectAllocations(termId, [allocation])`. Assert the room step passes a payload from `RoomDialog` to `createRoom(schoolId, payload)` and refreshes rooms after success.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/features/onboarding/__tests__/SubjectsSetupStep.test.tsx src/features/onboarding/__tests__/RoomsSetupStep.test.tsx`

Expected: FAIL because both adapters are missing.

- [ ] **Step 3: Implement subject and allocation flow**

Reuse `SubjectDialog` with the real term, stages, and existing subjects. Once a subject exists, show existing shared `Select` and `Input` controls for a valid grade, subject, and positive weekly hours. Refresh `subjects` after subject creation and allocation save.

- [ ] **Step 4: Implement room flow**

Reuse `RoomDialog`, own only its open/saving state, and call `createRoom` from `onSave`. Reject action rendering when `schoolId` is absent rather than sending a placeholder ID. Refresh `rooms` after success.

- [ ] **Step 5: Run tests and commit**

Run: `npm run test:run -- src/features/onboarding/__tests__/SubjectsSetupStep.test.tsx src/features/onboarding/__tests__/RoomsSetupStep.test.tsx`

Expected: PASS.

```bash
git add src/features/onboarding/components/steps/SubjectsSetupStep.tsx src/features/onboarding/components/steps/RoomsSetupStep.tsx src/features/onboarding/__tests__/SubjectsSetupStep.test.tsx src/features/onboarding/__tests__/RoomsSetupStep.test.tsx
git commit -m "feat: add subjects and rooms onboarding steps"
```

### Task 7: Compose the dashboard card and full Settings page

**Files:**
- Create: `src/features/onboarding/components/SetupGuideCard.tsx`
- Create: `src/features/onboarding/pages/SchoolOnboardingPage.tsx`
- Create: `src/app/[lang]/(dashboard)/settings/onboarding/page.tsx`
- Modify: `src/features/dashboard/views/SchoolDashboardView.tsx`
- Test: `src/features/onboarding/__tests__/SetupGuideCard.test.tsx`
- Test: `src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx`

- [ ] **Step 1: Write failing composition tests**

Assert card visibility for incomplete setup, session dismissal, persistence only for the current session, automatic disappearance when complete, and permanent full-page rendering. Mock `sessionStorage` and `useSetupStatus` explicitly.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/features/onboarding/__tests__/SetupGuideCard.test.tsx src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx`

Expected: FAIL because card and page do not exist.

- [ ] **Step 3: Implement card, page, and route**

Use the key `sis:onboarding:dismissed:<schoolId>`. Read/write it only in an effect or event handler. The card returns `null` when complete or dismissed. The dedicated page never honors dismissal. Both select the first available step initially and share the same step-content mapping.

- [ ] **Step 4: Insert the card above dashboard content**

Render `<SetupGuideCard />` as the first content section inside `SchoolDashboardView`, before summary/alerts. Keep dashboard API loading independent from onboarding partial failures.

- [ ] **Step 5: Run tests and commit**

Run: `npm run test:run -- src/features/onboarding/__tests__/SetupGuideCard.test.tsx src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx src/features/dashboard/__tests__/SchoolDashboardContainer.test.tsx`

Expected: PASS.

```bash
git add src/features/onboarding/components/SetupGuideCard.tsx src/features/onboarding/pages/SchoolOnboardingPage.tsx 'src/app/[lang]/(dashboard)/settings/onboarding/page.tsx' src/features/dashboard/views/SchoolDashboardView.tsx src/features/onboarding/__tests__/SetupGuideCard.test.tsx src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx
git commit -m "feat: surface school onboarding setup"
```

### Task 8: Add navigation, translations, permissions, and responsive checks

**Files:**
- Modify: `src/config/navigation.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/messages/__tests__/onboardingTranslations.test.ts`
- Test: `src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx`

- [ ] **Step 1: Write failing translation parity and permission tests**

Assert the `onboarding` namespace has identical recursive keys in both locales. Mock domain permissions so progress remains visible but each unauthorized mutation button is disabled with explanatory copy.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/messages/__tests__/onboardingTranslations.test.ts src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx`

Expected: FAIL because messages and permission behavior are incomplete.

- [ ] **Step 3: Add bilingual copy and navigation**

Add `School setup` / `إعداد المدرسة` under Settings immediately after Branding & Profile, using `ListChecks`, with `/en/settings/onboarding` and `/ar/settings/onboarding`. Add all titles, summaries, statuses, prerequisite messages, field labels, retry/dismiss actions, save feedback, and permission explanations under one `onboarding` namespace.

- [ ] **Step 4: Apply existing domain permissions**

Use `usePermissions` and the permission keys already used by branding and academic pages. Do not invent new keys. Keep read-only progress visible while disabling create/update actions.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm run test:run -- src/messages/__tests__/onboardingTranslations.test.ts src/features/onboarding/__tests__ src/features/dashboard/__tests__/SchoolDashboardContainer.test.tsx`

Expected: PASS.

```bash
git add src/config/navigation.ts src/messages/en.json src/messages/ar.json src/messages/__tests__/onboardingTranslations.test.ts src/features/onboarding
git commit -m "feat: localize school onboarding"
```

### Task 9: Final verification and clean-code review

**Files:**
- Modify only files identified by verification failures.

- [ ] **Step 1: Run the complete onboarding test set**

Run: `npm run test:run -- src/features/onboarding src/messages/__tests__/onboardingTranslations.test.ts src/features/dashboard/__tests__/SchoolDashboardContainer.test.tsx`

Expected: all tests pass.

- [ ] **Step 2: Run static verification**

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npm run lint -- src/features/onboarding src/features/dashboard/views/SchoolDashboardView.tsx src/config/navigation.ts`

Expected: exit code 0 with no new warnings.

- [ ] **Step 3: Run repository hygiene checks**

Run: `git diff --check`

Expected: no output.

Run: `git status --short`

Expected: only intentional onboarding changes, or a clean tree after the prior commits.

- [ ] **Step 4: Perform manual responsive and localization verification**

Run: `npm run dev`, then inspect `/en/dashboard`, `/ar/dashboard`, `/en/settings/onboarding`, and `/ar/settings/onboarding` at 375, 768, 1024, and 1440 pixels. Verify no horizontal overflow, correct RTL order, visible keyboard focus, text-based locked/error states, preserved form values after a forced failure, and reduced-motion behavior.

- [ ] **Step 5: Review changed production code with `clean-code-guard` and changed tests with `test-guard`**

Resolve only concrete findings: duplicated domain logic, unsafe placeholder IDs, oversized components, tests asserting implementation details, or missing failure-path assertions.

- [ ] **Step 6: Commit verification fixes if required**

```bash
git add src/features/onboarding src/features/dashboard/views/SchoolDashboardView.tsx src/config/navigation.ts src/messages/en.json src/messages/ar.json src/messages/__tests__/onboardingTranslations.test.ts
git commit -m "fix: harden school onboarding setup"
```

