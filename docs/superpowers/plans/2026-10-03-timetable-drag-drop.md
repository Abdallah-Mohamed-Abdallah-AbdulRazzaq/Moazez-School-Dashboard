# Timetable Drag-and-Drop Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a scoped scheduling library that lets editors place lesson bundles and override teachers or rooms directly in timetable slots while preserving the dialog, validation, save, and publication workflows.

**Architecture:** Keep server loading and persistence in `useTimetableData`, scheduling interaction state in `useTimetableScheduling`, and workspace composition in `TimetableView`. Put resource derivation and drop mutations in pure service functions, while focused components own the scheduling library, draggable cards, droppable slot presentation, and undo banner. One `DndContext` spans the library and visible grids; touch and keyboard use the same typed placement handler as pointer drops.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, `next-intl`, `@dnd-kit/core` 6.3.1, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-03-timetable-drag-drop.md`

## Global Constraints

- Work only on a feature branch created from the latest `origin/main`; never push directly to `main`.
- Reuse `Button` and `Input` from `src/components/ui`; do not introduce a duplicate primitive library.
- Preserve the existing `EditSlotDialog` as the detailed/fallback editor.
- Keep all drag/drop changes local until the existing Save action runs; no backend contract changes are in scope.
- Keep English and Arabic translation trees structurally identical.
- Use the clean-code guard after every production-code change.
- Use the test guard after every test-code change.
- Run only the named targeted tests during implementation. Ask the owner before running `npm run test:run`, `npm run test:all`, or another full test command.
- Do not modify deployment files, environment files, authentication, or unrelated academic modules.

## File map

**Create**

- `src/features/academics/timetable/services/timetableDragDrop.ts` — typed library-item derivation, drop preflight, immutable mutations, move/replace history, and undo.
- `src/features/academics/timetable/services/__tests__/timetableDragDrop.test.ts` — pure service behavior and edge cases.
- `src/features/academics/timetable/components/TimetableResourceLibrary.tsx` — responsive Lessons/Teachers/Rooms library, search, unscheduled filtering, and selection state.
- `src/features/academics/timetable/components/TimetableDraggableCard.tsx` — shared pointer/keyboard/touch resource card using `@dnd-kit/core`.
- `src/features/academics/timetable/components/TimetableResourceCard.tsx` — localized lesson, teacher, and room card content.
- `src/features/academics/timetable/components/TimetableSlotControl.tsx` — shared desktop/mobile slot placement and drag behavior.
- `src/features/academics/timetable/components/TimetableUndoBanner.tsx` — single-level accessible undo action using the shared `Button`.
- `src/features/academics/timetable/components/__tests__/TimetableResourceLibrary.test.tsx` — library rendering, filtering, selection, and accessibility tests.
- `src/features/academics/timetable/components/__tests__/TimetableUndoBanner.test.tsx` — undo announcement and action tests.
- `src/features/academics/timetable/hooks/useTimetableScheduling.ts` — scoped selection, DnD sensors, placement, rejection messaging, and undo orchestration.
- `src/features/academics/timetable/hooks/__tests__/useTimetableScheduling.test.tsx` — controller-level placement, Escape cancellation, dirty state, and undo integration.

**Modify**

- `src/features/academics/timetable/services/timetableSlotEditing.ts` — expose one reusable lesson-resolution helper shared by the dialog and drag/drop service.
- `src/features/academics/timetable/services/__tests__/timetableSlotEditing.test.ts` — cover deterministic teacher and room resolution inputs.
- `src/features/academics/timetable/components/TimetableGrid.tsx` — make instructional slots typed drop targets and existing lessons draggable; preserve click-to-dialog behavior.
- `src/features/academics/timetable/components/__tests__/TimetableGrid.test.tsx` — cover slot accessibility, selected-item placement, disabled destinations, and move payloads.
- `src/features/academics/timetable/components/TimetableView.tsx` — compose the DnD workspace, resource panels, grids, and undo focus restoration.
- `src/messages/en.json` — add `academics.timetable.schedulingLibrary` copy.
- `src/messages/ar.json` — add the matching Arabic copy.
- `src/messages/__tests__/timetableTranslations.test.ts` — assert new key parity and required interpolation variables.

---

### Task 1: Define the drag/drop domain and pure placement behavior

**Files:**

- Create: `src/features/academics/timetable/services/timetableDragDrop.ts`
- Create: `src/features/academics/timetable/services/__tests__/timetableDragDrop.test.ts`
- Modify: `src/features/academics/timetable/services/timetableSlotEditing.ts`
- Modify: `src/features/academics/timetable/services/__tests__/timetableSlotEditing.test.ts`

**Interfaces:**

- Consumes: `TimetableEntry`, `Subject`, `SubjectAllocation`, `Teacher`, `TeacherAllocation`, `Room`, `Classroom`, `subjectOptionsForGradeAllocations`, `teacherAllocationOptions`, `getDefaultRoomSuggestion`, and `evaluateRoomEligibility`.
- Produces:

```ts
export type TimetableLibraryItem =
  | {
      kind: "LESSON";
      id: string;
      subjectId: string;
      teacherId: string | null;
      roomId: string | null;
      targetPeriods: number;
      scheduledPeriods: number;
      remainingPeriods: number;
    }
  | { kind: "TEACHER"; id: string; teacherId: string; subjectId: string }
  | { kind: "ROOM"; id: string; roomId: string }
  | { kind: "ENTRY"; id: string; entryId: string };

export interface TimetableDropTarget {
  dayKey: string;
  periodIndex: number;
  sectionId: string;
  classroomId: string;
}

export type TimetableDropRejection =
  | "READ_ONLY"
  | "HOLIDAY"
  | "NON_INSTRUCTIONAL"
  | "SUBJECT_REQUIRED"
  | "TEACHER_SUBJECT_MISMATCH"
  | "ROOM_INELIGIBLE"
  | "TEACHER_CONFLICT"
  | "ROOM_CONFLICT"
  | "SAME_SLOT";

export type TimetableDropResult =
  | { status: "REJECTED"; reason: TimetableDropRejection }
  | {
      status: "APPLIED";
      entries: TimetableEntry[];
      undoEntries: TimetableEntry[];
      effect: "CREATE" | "UPDATE" | "REPLACE" | "MOVE";
    };

export function buildTimetableLibraryItems(
  input: BuildTimetableLibraryItemsInput,
): TimetableLibraryItem[];

export function applyTimetableDrop(
  input: ApplyTimetableDropInput,
): TimetableDropResult;

export function mergeTimetableEntriesForValidation(
  authoritativeEntries: TimetableEntry[],
  editableEntries: TimetableEntry[],
): TimetableEntry[];
```

- `ApplyTimetableDropInput` must receive `createEntryId: () => string`; tests pass a deterministic function and `TimetableView` supplies the temporary-ID factory.
- `allEntries` is used for teacher/room collision checks, while `editableEntries` is the array returned after mutation. Exclude the target entry and the source entry from collision checks.

- [x] **Step 1: Write failing service tests for library derivation**

Add table-driven tests proving that:

```ts
expect(buildTimetableLibraryItems(input)).toEqual([
  expect.objectContaining({
    kind: "LESSON",
    subjectId: "math",
    teacherId: "teacher-math",
    roomId: "room-101",
    targetPeriods: 5,
    scheduledPeriods: 2,
    remainingPeriods: 3,
  }),
]);
```

Also cover grade filtering, classroom-specific teacher allocation, a missing teacher, a missing recommended room, and clamping `remainingPeriods` to zero.

- [x] **Step 2: Run the new service test and verify it fails**

Run:

```powershell
& { npm run test:run -- src/features/academics/timetable/services/__tests__/timetableDragDrop.test.ts }
```

Expected: FAIL because `timetableDragDrop.ts` and its exports do not exist.

- [x] **Step 3: Implement library derivation and shared lesson resolution**

Add a reusable helper to `timetableSlotEditing.ts` rather than duplicating dialog rules:

```ts
export function resolveTimetableLessonDefaults({
  subjectId,
  sectionId,
  classroomId,
  teacherAllocations,
  teachers,
  subjects,
  rooms,
  selectedClassroom,
  locale,
}: ResolveTimetableLessonDefaultsInput): {
  teacherId: string | null;
  roomId: string | null;
} {
  const [allocation] = teacherAllocationOptions({
    teacherAllocations,
    teachers,
    subjects,
    sectionId,
    classroomId,
    subjectId,
    locale,
  });
  const room = getDefaultRoomSuggestion({
    subjectId,
    subjects,
    rooms,
    selectedClassroom,
  });
  return {
    teacherId: allocation?.teacherId || null,
    roomId: room.roomId,
  };
}
```

Use this helper inside `buildTimetableLibraryItems`. Count scheduled periods only for the target classroom and only entries with the matching subject.

- [x] **Step 4: Write failing placement tests**

Cover these exact outcomes:

- Lesson on empty slot → `CREATE` with subject, teacher, and room.
- Lesson on filled slot → `REPLACE` and complete `undoEntries` snapshot.
- Teacher on filled slot → `UPDATE`, preserving subject and room.
- Room on filled slot → `UPDATE`, preserving subject and teacher.
- Teacher/room on empty slot → `SUBJECT_REQUIRED` and original array identity/content unchanged.
- Existing entry moved to empty slot → `MOVE`, removes the source and preserves its ID.
- Existing entry moved onto filled slot → `MOVE`, removes source and replaces target.
- Same source/target → `SAME_SLOT`.
- Holiday, non-instructional, or read-only → corresponding rejection.
- Ineligible room, teacher collision, or room collision → corresponding rejection.

- [x] **Step 5: Implement `applyTimetableDrop` and pass targeted service tests**

Keep the function immutable and side-effect free. Copy the pre-mutation `editableEntries` into `undoEntries`; never call React state setters or translation functions from the service.

Run:

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableDragDrop.test.ts
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableSlotEditing.test.ts
}
```

Expected: both files PASS.

- [x] **Step 6: Run the mandatory guards and commit Task 1**

Run the test guard on both changed test files and the clean-code guard on both production service files. Address all must-fix findings, rerun the two targeted tests, then commit:

```powershell
& {
  git add src/features/academics/timetable/services/timetableDragDrop.ts src/features/academics/timetable/services/timetableSlotEditing.ts src/features/academics/timetable/services/__tests__/timetableDragDrop.test.ts src/features/academics/timetable/services/__tests__/timetableSlotEditing.test.ts
  git commit -m "feat(timetable): add direct placement domain logic"
}
```

---

### Task 2: Build the scheduling library from shared UI primitives

**Files:**

- Create: `src/features/academics/timetable/components/TimetableResourceLibrary.tsx`
- Create: `src/features/academics/timetable/components/TimetableDraggableCard.tsx`
- Create: `src/features/academics/timetable/components/__tests__/TimetableResourceLibrary.test.tsx`

**Interfaces:**

- Consumes: `TimetableLibraryItem[]`, localized subjects/teachers/rooms, `Button`, `Input`, and `useDraggable`.
- Produces:

```ts
export type TimetableLibraryTab = "LESSONS" | "TEACHERS" | "ROOMS";

export interface TimetableResourceLibraryProps {
  items: TimetableLibraryItem[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  locale: string;
  selectedItemId: string | null;
  isOpen: boolean;
  mobile: boolean;
  onOpenChange: (open: boolean) => void;
  onItemSelect: (item: TimetableLibraryItem | null) => void;
}
```

- [x] **Step 1: Write failing library component tests**

Test that the component:

- defaults to Lessons;
- renders localized subject, teacher, room, and `remainingPeriods` content;
- filters by localized names through the shared `Input`;
- toggles Unscheduled only and removes zero-remaining lessons;
- switches among Lessons, Teachers, and Rooms using `Button` controls with `aria-pressed`;
- marks a selected card with `aria-pressed="true"`;
- exposes a minimum 44px activation target and a visible keyboard focus class;
- disables resources when the timetable is not editable.

- [x] **Step 2: Run the component test and verify it fails**

Run:

```powershell
& { npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableResourceLibrary.test.tsx }
```

Expected: FAIL because the library components do not exist.

- [x] **Step 3: Implement `TimetableDraggableCard`**

Use `useDraggable({ id: item.id, data: { item } })`. Render a real button for selection, apply drag listeners/attributes only when enabled, and keep the card usable without dragging:

```tsx
<button
  ref={setNodeRef}
  type="button"
  aria-pressed={selected}
  disabled={disabled}
  onClick={() => onSelect(item)}
  className="min-h-11 w-full cursor-grab rounded-lg border bg-white p-3 text-start focus-visible:ring-2 focus-visible:ring-primary"
  {...attributes}
  {...listeners}
>
  {children}
</button>
```

Use Lucide icons already present in the project; do not use emoji icons.

- [x] **Step 4: Implement `TimetableResourceLibrary`**

Use `Input` for search and `Button` for tabs, Unscheduled only, collapse, and close actions. Desktop uses `w-80 shrink-0`; mobile uses a fixed bottom drawer with a backdrop, safe-area padding, `role="dialog"`, `aria-modal="true"`, and a translated accessible name. Use logical utilities (`border-e`, `text-start`) so Arabic and English share one layout.

- [x] **Step 5: Pass the targeted library tests**

Run:

```powershell
& { npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableResourceLibrary.test.tsx }
```

Expected: PASS.

- [x] **Step 6: Run the mandatory guards and commit Task 2**

Run the test guard on the new test and clean-code guard on both production components. Fix findings, rerun the targeted test, then commit:

```powershell
& {
  git add src/features/academics/timetable/components/TimetableResourceLibrary.tsx src/features/academics/timetable/components/TimetableDraggableCard.tsx src/features/academics/timetable/components/__tests__/TimetableResourceLibrary.test.tsx
  git commit -m "feat(timetable): add scheduling resource library"
}
```

---

### Task 3: Make timetable slots accessible placement targets

**Files:**

- Modify: `src/features/academics/timetable/components/TimetableGrid.tsx`
- Modify: `src/features/academics/timetable/components/__tests__/TimetableGrid.test.tsx`

**Interfaces:**

- Consumes: `TimetableDropTarget`, selected library item, active drag state, and placement/move callbacks.
- Extends `TimetableGridProps` with:

```ts
selectedLibraryItem: TimetableLibraryItem | null;
activeDragItem: TimetableLibraryItem | null;
classroomId: string;
sectionId: string;
canDropOnSlot: (
  item: TimetableLibraryItem,
  target: TimetableDropTarget,
) => { allowed: boolean; tone: "VALID" | "WARNING" | "INVALID"; reason?: TimetableDropRejection };
onPlaceItem: (
  item: TimetableLibraryItem,
  target: TimetableDropTarget,
) => void;
onEntryDragStart: (entry: TimetableEntry) => void;
```

- [x] **Step 1: Expand grid tests before implementation**

Add tests proving that:

- every editable instructional desktop and mobile slot has an accessible button name containing day and period;
- Enter/Space places the selected item instead of opening the dialog;
- normal activation with no selected item still calls `onSlotClick`;
- holiday and non-instructional slots are disabled drop targets;
- valid, warning, and invalid target states set text-independent `data-drop-state` attributes;
- a filled lesson exposes an `ENTRY` drag payload;
- read-only mode exposes neither placement nor dragging.

- [x] **Step 2: Run the grid test and verify the new assertions fail**

Run:

```powershell
& { npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableGrid.test.tsx }
```

Expected: existing conflict tests PASS and new placement tests FAIL.

- [x] **Step 3: Extract one reusable slot renderer inside `TimetableGrid.tsx`**

Introduce a focused internal `TimetableSlotControl` component so desktop and mobile use identical activation rules. Use `useDroppable` with an ID containing classroom, day, and period and data shaped as `{ target }`. Use a real full-size button inside the table cell/mobile period container; remove the nested Add button to avoid nested interactive elements.

- [x] **Step 4: Add entry dragging and visual feedback**

Filled editable lesson buttons use `useDraggable` with:

```ts
{
  item: { kind: "ENTRY", id: `entry:${entry.id}`, entryId: entry.id },
  source: { dayKey, periodIndex, sectionId, classroomId },
}
```

Apply stable color/border changes without scaling layout:

- `VALID`: primary/green border and subtle background.
- `WARNING`: amber border/background.
- `INVALID`: red border/background and `aria-disabled="true"`.

Preserve focused-conflict scrolling, mobile day expansion, print styles, and existing lesson content.

- [x] **Step 5: Pass the targeted grid tests**

Run:

```powershell
& { npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableGrid.test.tsx }
```

Expected: PASS, including all pre-existing conflict-focus tests.

- [x] **Step 6: Run the mandatory guards and commit Task 3**

Run test guard on `TimetableGrid.test.tsx` and clean-code guard on `TimetableGrid.tsx`. Fix findings, rerun the targeted test, then commit:

```powershell
& {
  git add src/features/academics/timetable/components/TimetableGrid.tsx src/features/academics/timetable/components/__tests__/TimetableGrid.test.tsx
  git commit -m "feat(timetable): add accessible timetable drop targets"
}
```

---

### Task 4: Integrate placement, undo, and responsive workspace state

**Files:**

- Create: `src/features/academics/timetable/components/TimetableUndoBanner.tsx`
- Create: `src/features/academics/timetable/hooks/useTimetableScheduling.ts`
- Create: `src/features/academics/timetable/hooks/__tests__/useTimetableScheduling.test.tsx`
- Modify: `src/features/academics/timetable/components/TimetableView.tsx`

**Interfaces:**

- Consumes: all Task 1–3 exports, current `timetableEntries`, `allTermEntries`, `resolvedConfig`, classroom scope, dirty callback, and toast announcements.
- Produces one typed placement path from `useTimetableScheduling`. Preview checks use a stable, side-effect-free ID, successful creates receive a generated temporary ID, and rejection/effect union values map directly to matching translation keys.

- [x] **Step 1: Write focused controller integration tests**

Exercise `useTimetableScheduling` with one classroom, one allocated lesson, one empty slot, and deterministic entries. Combine this with the real grid, resource-library, undo-banner, and pure-service tests. Assert:

- lesson placement updates the rendered slot and calls `onDirtyChange(true)` without opening `EditSlotDialog`;
- activating an unselected slot still opens `EditSlotDialog`;
- teacher and room placement preserve other fields;
- rejection keeps state unchanged and shows the translated reason;
- replacement displays Undo and Undo restores the full previous array;
- moving an existing lesson clears its source and fills its target;
- closing/reopening the mobile library does not clear timetable changes;
- read-only/published state hides the library and leaves the grid unchanged.

- [x] **Step 2: Run the integration test and verify it fails**

The controller test initially fails because scheduling orchestration and undo state do not exist.

- [x] **Step 3: Add DnD orchestration with `useTimetableScheduling`**

Create a `PointerSensor` with a 6px activation distance and a `TouchSensor` with a 200ms delay and 8px tolerance so clicks still select cards reliably. Keyboard users use the explicit select-then-place path rather than simulated dragging. Keep scoped selection, active drag, panel state, and a single undo snapshot in `useTimetableScheduling`. `onDragEnd` reads `{ item }` from the active payload and `{ target }` from the droppable payload, then calls the same placement function used by click placement.

Derive library lesson items only when one classroom is selected. When the user changes academic scope, clear selected and undo state to prevent applying a stale scoped item. Multi-classroom views remain available for viewing and dialog editing.

- [x] **Step 4: Compose the responsive workspace**

Wrap only the editable workspace in one `DndContext`, then render:

```tsx
<div className="flex min-h-0 flex-1">
  <TimetableResourceLibrary {...libraryProps} />
  <div className="min-w-0 flex-1">{gridContent}</div>
</div>
```

Use a shared `Button` to reopen the collapsed desktop panel and mobile drawer. Add `DragOverlay` for a visual card copy. Add `print:hidden` to all scheduling-only UI.

- [x] **Step 5: Implement accessible single-level undo**

`TimetableUndoBanner` renders `role="status"` and shared `Button` controls. A successful placement stores the pre-change snapshot and prior dirty state; Undo restores both, announces success, clears the snapshot, and returns focus to the timetable workspace. The next successful placement replaces the previous undo snapshot.

- [x] **Step 6: Pass integration and regression tests**

Run:

```powershell
& {
  npm run test:run -- src/features/academics/timetable/hooks/__tests__/useTimetableScheduling.test.tsx
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableGrid.test.tsx
  npm run test:run -- src/features/academics/timetable/components/__tests__/EditSlotDialog.test.tsx
}
```

Expected: all three files PASS.

- [x] **Step 7: Run the mandatory guards and commit Task 4**

Run test guard on the controller and undo tests and clean-code guard on `useTimetableScheduling.ts`, `TimetableView.tsx`, and `TimetableUndoBanner.tsx`. Pay particular attention to stale closures, duplicated state mutation, unstable temporary IDs, and focus restoration. Fix findings, rerun targeted tests, then commit.

```powershell
& {
  git add src/features/academics/timetable/components/TimetableView.tsx src/features/academics/timetable/components/TimetableUndoBanner.tsx src/features/academics/timetable/components/__tests__/TimetableUndoBanner.test.tsx src/features/academics/timetable/hooks/useTimetableScheduling.ts src/features/academics/timetable/hooks/__tests__/useTimetableScheduling.test.tsx
  git commit -m "feat(timetable): integrate direct scheduling workflow"
}
```

---

### Task 5: Localize the workflow and lock translation parity

**Files:**

- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/timetableTranslations.test.ts`

**Interfaces:**

- Produces the `academics.timetable.schedulingLibrary` subtree used by Tasks 2–4.

- [x] **Step 1: Add failing translation assertions**

Require matching English/Arabic keys for:

```text
title, open, close, searchLabel, searchPlaceholder,
tabs.lessons, tabs.teachers, tabs.rooms,
unscheduledOnly, remainingPeriods, roomCapacity,
noLessons, noTeachers, noRooms,
clickSlotHint, selectClassroomHint, dragging,
effects.create, effects.update, effects.replace, effects.move,
rejections.READ_ONLY, rejections.HOLIDAY,
rejections.NON_INSTRUCTIONAL, rejections.SUBJECT_REQUIRED,
rejections.TEACHER_SUBJECT_MISMATCH, rejections.ROOM_INELIGIBLE,
rejections.TEACHER_CONFLICT, rejections.ROOM_CONFLICT,
rejections.SAME_SLOT, undo, dismissUndo, undoComplete
```

Assert that both locales contain `{remaining}` and `{target}` in `remainingPeriods` and keep matching nested key sets.

- [x] **Step 2: Run the translation test and verify it fails**

Run:

```powershell
& { npm run test:run -- src/messages/__tests__/timetableTranslations.test.ts }
```

Expected: FAIL because `schedulingLibrary` is missing.

- [x] **Step 3: Add concise English and Arabic copy**

Use terminology already established in `academics.timetable.editSlot` and `academics.timetable.grid`. Avoid encoding status only through color; rejection messages must name the reason.

- [x] **Step 4: Pass the translation and feature tests**

Run:

```powershell
& {
  npm run test:run -- src/messages/__tests__/timetableTranslations.test.ts
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableResourceLibrary.test.tsx
  npm run test:run -- src/features/academics/timetable/hooks/__tests__/useTimetableScheduling.test.tsx
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableUndoBanner.test.tsx
}
```

Expected: all four files PASS.

- [x] **Step 5: Run the mandatory guards and commit Task 5**

Run test guard on the translation test and clean-code guard on any production TypeScript adjusted for final translation keys. Then commit:

```powershell
& {
  git add src/messages/en.json src/messages/ar.json src/messages/__tests__/timetableTranslations.test.ts
  git commit -m "feat(timetable): localize direct scheduling controls"
}
```

---

### Task 6: Verify behavior, quality, and delivery readiness

**Files:**

- Review only unless a defect is found in files already listed by this plan.

**Interfaces:**

- Consumes the complete timetable drag/drop feature.
- Produces a verified feature branch ready for normal push and a Draft PR only when the owner requests execution through delivery.

- [x] **Step 1: Run focused automated verification**

Run:

```powershell
& {
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableDragDrop.test.ts
  npm run test:run -- src/features/academics/timetable/services/__tests__/timetableSlotEditing.test.ts
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableResourceLibrary.test.tsx
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableGrid.test.tsx
  npm run test:run -- src/features/academics/timetable/hooks/__tests__/useTimetableScheduling.test.tsx
  npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableUndoBanner.test.tsx
  npm run test:run -- src/features/academics/timetable/components/__tests__/EditSlotDialog.test.tsx
  npm run test:run -- src/messages/__tests__/timetableTranslations.test.ts
  npm run typecheck
  npm run lint
}
```

Expected: all targeted tests, typecheck, and lint PASS with no new warnings caused by the task.

- [ ] **Step 2: Perform manual desktop checks**

At 1440px and 1024px in both English and Arabic:

- open/collapse the library;
- search and filter all three tabs;
- drag a lesson to empty and occupied slots;
- drag a teacher and room onto a filled slot;
- move an existing lesson;
- verify rejection states for break/holiday/conflicts;
- undo replacement and move operations;
- open the legacy dialog by clicking with no selected resource;
- save, validate, and verify dirty-state navigation protection;
- print preview and confirm scheduling controls are absent.

- [ ] **Step 3: Perform manual touch and keyboard checks**

At 375px and 768px:

- open the bottom drawer;
- select a lesson, close the drawer, and place it in a mobile day slot;
- cancel selection with Escape;
- complete the same flow using only Tab, Enter/Space, and Escape;
- confirm visible focus, 44px targets, day expansion, focus restoration, and screen-reader announcements.

- [x] **Step 4: Run final guard reviews**

Run the clean-code guard across the complete production diff and test guard across the complete test diff. Resolve every blocker/high-confidence finding and rerun the affected targeted commands.

- [ ] **Step 5: Ask before full tests or build**

Ask the owner for permission before running `npm run test:run`, `npm run test:all`, or any agreed full-suite command. A production build is not a test, but run `npm run build` only as part of the owner-approved final verification scope because it is resource intensive.

- [ ] **Step 6: Inspect final scope and prepare delivery**

Run:

```powershell
& {
  git status --short
  git diff --stat origin/main...HEAD
  git diff --check origin/main...HEAD
}
```

Expected: only the timetable services/components/tests, translation files/tests, and this feature's plan/spec are changed; `git diff --check` emits no output.

If execution includes delivery, create normal commits only, push the feature branch without force, create or update one Draft PR against `main`, attach the PR to the task, and stop before merge.

## Out of scope

- Backend endpoint or schema changes.
- Automatic multi-slot scheduling or timetable generation changes.
- Persistent undo history across reloads.
- Cross-classroom copy/paste or bulk placement.
- Changes to global toast APIs solely to add an action button.
- Architectural refactors outside the timetable feature.
