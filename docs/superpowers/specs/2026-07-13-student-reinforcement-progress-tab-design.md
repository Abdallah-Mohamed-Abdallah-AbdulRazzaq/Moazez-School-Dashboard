# Student Reinforcement Progress Tab Design

## Goal

Add a localized **Reinforcement Progress / تقدم التعزيز** tab to Student Profile for `GET /reinforcement/students/{studentId}/progress`, scoped by the active academic year and term.

## Architecture

Reuse the existing `getStudentReinforcementProgress` service and `StudentProgressCard` presentation. Add a profile-focused wrapper that owns permission gating, loading, error, retry, and empty states without embedding the standalone reinforcement page header, student selector, or academic filters.

The router-based profile adds a `reinforcement` segment and the legacy in-page profile adds the same tab key so both profile surfaces remain consistent. The wrapper receives `studentId`, `academicYearId`, and `termId`; it does not refetch the student record.

## UI and Data Mapping

- Show assignment and submission summary metrics.
- Show task rows with localized titles, assignment status, progress, and due date.
- Show total XP, XP source breakdown, and recent ledger entries.
- Reuse the existing `StudentProgressCard` normalization for the backend DTO.
- Do not display raw UUIDs as primary labels when a localized name or title exists.

## Permissions and States

- Gate reads with `reinforcement.overview.view`, matching the existing standalone page.
- Render a layout-faithful loading state, retryable error state, empty state, and access notice.
- Refresh whenever student, academic year, or term changes.

## Localization

- Add `students_guardians.profile.tabs.reinforcement_progress` in English and Arabic.
- Reuse existing `reinforcement.*` messages for the tab content and state text.

## Verification

- Test that the wrapper calls the endpoint with the student, academic year, and term.
- Test populated, error/retry, empty, and permission-denied behavior.
- Test router and legacy tab registration.
- Run focused tests, ESLint, and TypeScript.
