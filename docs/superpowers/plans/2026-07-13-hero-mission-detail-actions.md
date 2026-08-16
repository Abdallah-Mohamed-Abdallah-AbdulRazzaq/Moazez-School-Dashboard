# Hero Mission Detail Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a responsive copied action grid to the desktop mission details card while preserving the existing modal-footer actions.

**Architecture:** Extract the shared Edit/Delete/Publish/Archive button logic into a presentational `HeroJourneyMissionActions` component. Render the component in the modal footer exactly as today and render a second instance inside the desktop details card, wrapped in a two-column grid. The component receives mission state and callbacks from the page, so permissions, status rules, and async loading state remain centralized in the page.

**Tech Stack:** Next.js/React, TypeScript, Tailwind CSS, Vitest, React Testing Library, `next-intl`.

## Global Constraints

- Keep the existing modal-footer actions and behavior unchanged.
- Show copied actions only in the desktop details container, which is already hidden below the `xl` breakpoint.
- Reuse existing translated action labels and Button variants.
- Preserve current permission, status, disabled, and loading rules.
- Do not stage or modify the unrelated pre-existing `HeroJourneyMissionsPage.tsx` changes outside this feature.

---

### Task 1: Specify action component behavior with tests

**Files:**
- Create: `src/features/hero-journey/components/__tests__/HeroJourneyMissionActions.test.tsx`
- Reference: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx`

**Interfaces:**
- Consumes the planned `HeroJourneyMissionActionsProps` interface from Task 2.
- Produces executable coverage for action visibility, labels, callbacks, and disabled states.

- [ ] **Step 1: Write the failing test**

Create a mission fixture with `status: "published"`, mock `next-intl` so labels resolve to keys, render the component with all callbacks, and assert the four translated buttons render. Assert Edit, Delete, Publish, and Archive callbacks are called with the mission id when enabled. Add a second test for `status: "draft"` that asserts Edit renders, Publish is enabled, and Archive is disabled; add a third assertion that `canManage: false` renders no buttons.

```tsx
const mission = { id: "mission-1", status: "published" } as HeroJourneyMission;

it("renders mission actions and routes clicks to the selected mission", () => {
  const callbacks = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onPublish: vi.fn(),
    onArchive: vi.fn(),
  };

  render(
    <HeroJourneyMissionActions
      mission={mission}
      canManage
      isPublishing={false}
      deletingMissionId={null}
      {...callbacks}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "actions.edit" }));
  fireEvent.click(screen.getByRole("button", { name: "actions.delete" }));
  fireEvent.click(screen.getByRole("button", { name: "actions.publish" }));
  fireEvent.click(screen.getByRole("button", { name: "actions.archive" }));

  expect(callbacks.onEdit).toHaveBeenCalledWith("mission-1");
  expect(callbacks.onDelete).toHaveBeenCalledWith("mission-1");
  expect(callbacks.onPublish).toHaveBeenCalledWith("mission-1");
  expect(callbacks.onArchive).toHaveBeenCalledWith("mission-1");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:run -- src/features/hero-journey/components/__tests__/HeroJourneyMissionActions.test.tsx`

Expected: FAIL because `HeroJourneyMissionActions` does not exist yet.

### Task 2: Implement the shared mission action component

**Files:**
- Create: `src/features/hero-journey/components/HeroJourneyMissionActions.tsx`

**Interfaces:**
- Produces:

```ts
interface HeroJourneyMissionActionsProps {
  mission: HeroJourneyMission | null;
  canManage: boolean;
  isPublishing: boolean;
  deletingMissionId: string | null;
  onEdit: (missionId: string) => void;
  onDelete: (missionId: string) => void;
  onPublish: (missionId: string) => void;
  onArchive: (missionId: string) => void;
}
```

- [ ] **Step 1: Implement the minimal component**

Return `null` when `mission` is null or `canManage` is false. Otherwise render the existing four Button controls with the current rules: hide Edit unless `isHeroMissionEditable(mission.status)`, disable Delete when `deletingMissionId === mission.id`, disable Publish while publishing or when status is published/archived, and disable Archive while publishing or when status is not published. Use `useTranslations("heroJourney")`, `variant="secondary"` for Edit, `variant="danger"` for Delete, and the default variant for Publish and Archive.

- [ ] **Step 2: Run the focused test to verify it passes**

Run: `npm run test:run -- src/features/hero-journey/components/__tests__/HeroJourneyMissionActions.test.tsx`

Expected: PASS for all action visibility, callbacks, and disabled-state assertions.

### Task 3: Add the copied action grid to the details container and retain the footer

**Files:**
- Modify: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx`

**Interfaces:**
- Consumes `HeroJourneyMissionActions` from Task 2 with the page’s existing `canManageHero`, `isPublishing`, `deletingMissionId`, `openEditMission`, `removeMission`, `publishMission`, and `archiveMission` handlers.

- [ ] **Step 1: Replace the modal footer’s inline buttons with the shared component**

Keep the existing `footer` conditional and pass `selectedMission` plus the existing state and callbacks into `HeroJourneyMissionActions`. This keeps the footer action surface and all current status/permission behavior.

- [ ] **Step 2: Render the copied desktop details action grid**

Inside the `xl` details card, after `HeroJourneyMissionDetailContent`, add:

```tsx
<div className="mt-5 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
  <HeroJourneyMissionActions
    mission={detailMission}
    canManage={canManageHero}
    isPublishing={isPublishing}
    deletingMissionId={deletingMissionId}
    onEdit={(missionId) => void openEditMission(missionId)}
    onDelete={(missionId) => void removeMission(missionId)}
    onPublish={(missionId) => void publishMission(missionId)}
    onArchive={(missionId) => void archiveMission(missionId)}
  />
</div>
```

Because the details card is already `hidden xl:block`, the copied grid remains desktop-only and the modal footer remains the mobile action surface.

- [ ] **Step 3: Run the Hero Journey tests**

Run: `npm run test:run -- src/features/hero-journey`

Expected: all Hero Journey tests pass, including the new action component tests.

### Task 4: Verify quality and commit the implementation

**Files:**
- Modify: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx`
- Create: `src/features/hero-journey/components/HeroJourneyMissionActions.tsx`
- Create: `src/features/hero-journey/components/__tests__/HeroJourneyMissionActions.test.tsx`

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 2: Run ESLint on changed implementation and test files**

Run: `npx eslint src/features/hero-journey/components/HeroJourneyMissionsPage.tsx src/features/hero-journey/components/HeroJourneyMissionActions.tsx src/features/hero-journey/components/__tests__/HeroJourneyMissionActions.test.tsx`

Expected: exit code 0 with no lint errors.

- [ ] **Step 3: Check patch formatting**

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 4: Commit only feature files**

Run:

```bash
git add src/features/hero-journey/components/HeroJourneyMissionsPage.tsx src/features/hero-journey/components/HeroJourneyMissionActions.tsx src/features/hero-journey/components/__tests__/HeroJourneyMissionActions.test.tsx
git commit -m "feat: add mission detail action grid"
```

Expected: one commit containing the shared action component, its tests, and the desktop details integration. Preserve any unrelated working-tree changes.
