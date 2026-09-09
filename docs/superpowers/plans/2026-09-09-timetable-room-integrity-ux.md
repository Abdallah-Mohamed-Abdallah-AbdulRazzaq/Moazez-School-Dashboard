# Timetable Room Integrity UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent users from selecting rooms the backend will reject and explain room lifecycle dependency failures without losing form state.

**Architecture:** A pure eligibility policy mirrors the existing backend contract from already-loaded fields. Room recommendation and selection consume the same result, while a typed error mapper preserves dependency details for room dialogs.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-09-academics-timetable-backend-gap-closure-design.md`

## Global Constraints

- Frontend only; unknown capacity remains eligible, matching backend behavior.
- Invalid rooms stay visible but disabled with textual reasons.
- Do not invent or request a room-default endpoint.
- Use existing Select, Modal/ConfirmDialog, Button, and toast components.
- Apply code/test guards; ask before full tests.

---

## File structure

- Create `src/features/academics/rooms/services/roomSchedulingEligibility.ts` and tests.
- Create `src/features/academics/rooms/services/roomSchedulingErrors.ts` and tests.
- Create `src/features/academics/rooms/components/RoomDependencyDialog.tsx` and tests.
- Modify `roomRecommendations.ts`, `EditSlotDialog.tsx`, `roomsApiAdapter.ts`, `roomsService.ts`, `RoomsView.tsx`, and tests.
- Modify bilingual messages.

### Task 1: Implement room eligibility as a pure policy

**Interfaces:**
- Produces `evaluateRoomEligibility(room, classroom): RoomEligibility`.

```ts
export type RoomEligibility =
  | { eligible: true }
  | { eligible: false; reason: "inactive" | "capacity_insufficient"; roomCapacity?: number; classroomCapacity?: number };
```

- [ ] Write failing tests for inactive rooms, sufficient capacity, insufficient capacity, null room capacity, and unknown classroom capacity.
- [ ] Run the focused test; expect missing-module failure.
- [ ] Implement the exact backend rule: inactive fails; capacity fails only when both values are known and room is smaller.
- [ ] Re-run tests; expect PASS. Run guards and commit with `feat(rooms): model scheduling eligibility`.

### Task 2: Use eligibility in recommendations and selection

- [ ] Add failing recommendation tests proving invalid rooms are never suggested and valid rooms retain existing ranking.
- [ ] Add failing `EditSlotDialog` tests proving invalid rooms remain visible, disabled, and carry an accessible reason.
- [ ] Run both focused test files; expect FAIL.
- [ ] Build `SelectOption[]` with `disabled`, `trailingContent`, and `ariaLabel`; order eligible recommendations before disabled options.
- [ ] Re-run tests; expect PASS. Run guards and commit with `fix(timetable): disable ineligible rooms`.

### Task 3: Remove unsupported default-room claims

- [ ] Add a failing service/hook test asserting production room recommendations do not label an arbitrary room `CLASSROOM_DEFAULT` or `SECTION_DEFAULT` when the adapter has no assignment data.
- [ ] Run the affected room and timetable tests; confirm current always-empty adapter path is redundant.
- [ ] Remove `roomDefaults` from production timetable loading and generation props. Keep compatibility types only if another verified consumer requires them; otherwise remove the empty adapter method and related dead branches.
- [ ] Re-run focused tests; expect PASS. Run guards and commit with `refactor(rooms): remove unsupported default assignments`.

### Task 4: Normalize scheduling dependency errors

**Interfaces:**
- Produces `roomSchedulingUiError(error): RoomSchedulingUiError` containing `code`, `message`, `operation`, bounded dependency counts, and `traceId`.

- [ ] Write failing tests for `room_inactive`, `room_capacity_insufficient`, `academics.rooms.scheduling_dependency`, and unknown fallback.
- [ ] Run the new test; expect missing-module failure.
- [ ] Implement typed parsing without assuming every details field exists.
- [ ] Re-run tests; expect PASS. Run guards and commit with `feat(rooms): explain scheduling dependency errors`.

### Task 5: Preserve room dialog state after rejection

- [ ] Add failing `RoomsView` and `RoomDependencyDialog` tests proving rejected update keeps the edit dialog data and rejected delete keeps confirmation context.
- [ ] Run focused component tests; expect FAIL.
- [ ] Show `RoomDependencyDialog` with operation and counts. Close mutation dialogs only after successful API resolution; retain current draft on error.
- [ ] Add English and Arabic copy, then re-run tests.
- [ ] Run guards, `npm run lint`, `npm run typecheck`, and `npm run build`; ask before full tests.
- [ ] Commit with `feat(rooms): present scheduling dependency details`.

