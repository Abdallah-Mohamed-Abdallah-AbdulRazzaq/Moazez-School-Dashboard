# Lesson Plans Missing-Data CTAs Design

## Goal

Give each actionable missing-data state on the Lesson Plans page a button that opens the owning Academics page in the closest supported scope. Selection-only states remain on Lesson Plans.

## Evidence and scope

The backend lesson-plan contract identifies teacher allocation, curriculum lessons, and timetable slots as prerequisites. It exposes `academics.lesson_plan.auto_plan_no_curriculum` and `academics.lesson_plan.auto_plan_no_slots`; it does not define frontend routes. The frontend destination pages define the supported URL query contract.

## CTA mapping

| Lesson Plans state | Destination | Query parameters |
| --- | --- | --- |
| Missing grade | `/{locale}/academics/structure` | `year`, `term`, plus `nodeType=stage` and `nodeId={stageId}` when a stage is selected |
| Missing section | `/{locale}/academics/structure` | `year`, `term`, plus `nodeType=grade` and `nodeId={gradeId}` |
| Missing classroom | `/{locale}/academics/structure` | `year`, `term`, plus `nodeType=section` and `nodeId={sectionId}` |
| Missing subject | `/{locale}/academics/subjects` | `year`, `term`, `tab=subjects` |
| Missing teacher allocation | `/{locale}/academics/teacher-allocation` | `year`, `term`, `tab=matrix`, `grade`, `section`, `classroom`, and `subject` when available |
| Missing curriculum | `/{locale}/academics/curriculum` | `year`, `term`, `grade`, and `subject` |
| Curriculum has no lessons | `/{locale}/academics/curriculum` | `year`, `term`, `grade`, and `subject` |
| Auto-plan has no timetable slots | `/{locale}/academics/timetable` | `year`, `term`, `grade`, `section`, and `classroom` when available |

Parameters are omitted when their source value is empty. Existing locale-aware routing is preserved.

## UI behavior

The generic `scopeStatus !== "ready"` branch will render the relevant CTA for actionable missing-data statuses. Filter prompts that only require a user selection, such as choosing among existing classrooms, do not navigate away. Existing Curriculum CTAs remain and use the same scoped URL builder.

CTA labels are state-specific in English and Arabic: go to Academic Structure, Subjects, Teacher Allocation, Curriculum, or Timetable. Buttons use the existing Lesson Plans empty-state button styling.

## Implementation shape

Create one small route-building helper that accepts a destination and the current Lesson Plans scope, emits only parameters supported by that destination, and is independently testable. The page maps each actionable state to a destination and label, avoiding repeated `URLSearchParams` construction and preventing unsupported parameters from leaking between modules.

## Testing

- Unit-test every destination URL with a complete scope.
- Unit-test omission of unavailable optional parameters.
- Component-test that each missing-data state renders the correct CTA and pushes the expected localized scoped URL.
- Confirm selection-only states do not render a navigation CTA.
- Run the focused Lesson Plans tests, TypeScript validation, and lint checks applicable to changed files.

## Non-goals

- No backend changes.
- No automatic creation modal on the destination page.
- No changes to destination-page query contracts.
- No CTA for closed-term or permission-denied states.
