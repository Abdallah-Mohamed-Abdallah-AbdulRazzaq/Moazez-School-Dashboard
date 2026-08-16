# Attendance / Behavior / Discipline Docs Package Manifest

Generated for Moazez Backend from repository state:

```text
HEAD -> main, origin/main: 0b840e8 docs: add attendance behavior discipline frontend handoff
Working tree: clean
```

## Package contents

```text
docs/attendance-behavior-discipline/README.md
docs/attendance-behavior-discipline/OVERVIEW.md
docs/attendance-behavior-discipline/CHANGELOG_SPRINT_25.md
docs/attendance-behavior-discipline/ATTENDANCE_CORE.md
docs/attendance-behavior-discipline/BEHAVIOR_CORE.md
docs/attendance-behavior-discipline/DISCIPLINE_DERIVED_LAYER.md
docs/attendance-behavior-discipline/TEACHER_APP_ATTENDANCE.md
docs/attendance-behavior-discipline/STUDENT_PARENT_BEHAVIOR_DISCIPLINE.md
docs/attendance-behavior-discipline/PARENT_REPORTS_DISCIPLINE.md
docs/attendance-behavior-discipline/API_REFERENCE.md
docs/attendance-behavior-discipline/DATA_MODEL_AND_SOURCE_OF_TRUTH.md
docs/attendance-behavior-discipline/SECURITY_TENANCY_PERMISSIONS.md
docs/attendance-behavior-discipline/FRONTEND_HANDOFF.md
docs/attendance-behavior-discipline/DEFERRED_GAPS_AND_NON_GOALS.md
docs/attendance-behavior-discipline/TESTING_GUIDE.md
docs/attendance-behavior-discipline/API_TESTS.http
README_PACKAGE.md
MANIFEST.md
```

## Scope

This package documents the implemented V1 state for:

- Core Attendance
- Core Behavior
- Derived Discipline read layer
- Teacher App Attendance mapping
- Student/Parent Behavior and Discipline surfaces
- Parent Reports Discipline summary alignment
- Frontend integration handoff and documented drift

## Important non-goals

This package does not claim implementation of:

- Dashboard Discipline KPI
- Combined discipline score/percentage formula
- Discipline write/source table
- Teacher App `early_leave` write authority
- Teacher App `lateMinutes` persistence
- Teacher App arrival/dismissal persistence
- Teacher App scheduleId/period attendance writes
- ADR route aliases not present in the backend

## GitHub writes

No GitHub write or commit was made by this package generation.
