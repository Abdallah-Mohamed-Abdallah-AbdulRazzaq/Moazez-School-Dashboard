# Reinforcement Rewards Student Cascade Design

## Goal

Make student selection in `reinforcement/rewards` usable for large schools by guiding users through stage, grade, section, classroom, and finally student, while continuing to use the existing `GET /reinforcement/filter-options` response and preserving the redemption payload.

## Scope

This change is limited to the reinforcement rewards screens, specifically the create-redemption flow and the rewards overview student filter where a student can be selected. No backend changes, new endpoints, or changes to grades, admissions, transfers, attendance, or the general student list are included.

## Architecture

The existing filter-options request remains the single lookup request. A shared presentational cascade component owns only hierarchy filtering and dependent-value reset behavior; each consumer keeps ownership of its form/query state and maps the component value back to its existing payload shape. Student options are filtered by the selected academic IDs before being passed to the final selector, so the user never searches an unscoped school-wide list.

The cascade always renders the order `stageId → gradeId → sectionId → classroomId → studentId`. A child selector is disabled until its parent is selected. Changing a parent clears every descendant. Selecting a student does not alter the academic context and preserves the student enrollment ID selected from the option record.

## Data Flow

1. The rewards consumer calls `getReinforcementFilterOptions` as it does today.
2. The response is normalized into cascade records for stages, grades, sections, classrooms, and students.
3. `filterAcademicStudentCascadeOptions(value, options)` filters each child by its direct parent and filters students by all selected academic IDs.
4. The component emits `{ stageId, gradeId, sectionId, classroomId, studentId }`.
5. Redemption creation maps `studentId` and the matching option's `enrollmentId` into the existing request payload; rewards overview maps `studentId` into its existing URL/query filter.

## Error and Loading Behavior

The existing filter-options loading and error UI remains authoritative. While loading, all cascade controls are disabled. If the lookup fails, no student can be selected and the existing error message remains visible. If a parent change invalidates an already selected student, the child values are cleared immediately and the form/query state cannot retain a stale student ID.

## Testing

Add unit coverage for direct-parent filtering, student filtering by the full hierarchy, and descendant reset behavior. Extend the rewards modal/page tests to assert that the selected student and enrollment ID are preserved in the redemption payload and that the student filter is only enabled after a classroom is selected. Run focused Vitest tests followed by the project typecheck/lint command available in `package.json`.

## Non-goals

- Do not add server-side pagination or modify backend contracts.
- Do not refactor unrelated student selectors outside `reinforcement/rewards`.
- Do not change the redemption API payload or reward catalog data model.
