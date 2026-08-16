# Daily Attendance Policy Mode Design

## Goal

Make the effective attendance policy the single source of truth for whether a
scope uses daily or period-based attendance. The dashboard must match the
backend `DAILY` and `PERIOD` modes without creating timetable requests for
daily workflows.

## Policy creation

The attendance-policy wizard exposes both backend-supported modes.

- `DAILY` submits `mode: "DAILY"`, empty `selectedPeriodIds`, and the manual
  daily computation strategy. It does not load timetable configuration or show
  period selection.
- `PERIOD` submits `mode: "PERIOD"` and requires selected period IDs from the
  completed target scope's timetable configuration.
- Timetable lookup starts only after the selected hierarchy target is complete.
  It queries the target scope only: grade, section, or classroom.
- A missing target config blocks a period policy with an explicit configuration
  message. It never falls back to synthetic periods.

## Roll Call

Roll Call resolves the effective policy before opening a session. The policy
mode controls the session mode:

- A `DAILY` policy resolves a single daily session and hides the period picker.
- A `PERIOD` policy loads the selected target timetable and requires a period
  before session resolution.
- Users cannot override the policy mode in Roll Call.

## Related attendance flows

- Absence excuses remain date-based in both modes.
- Late and early-leave actions require a period only when the effective policy
  is `PERIOD`.
- Daily-policy contexts do not request timetable data merely to render
  late/early filters or excuses.
- Reports and Absences render backend-derived results and do not infer a mode
  locally.

## Error handling and UX

- Incomplete hierarchy: make no timetable request.
- Missing period timetable: explain that a timetable must be configured for the
  selected scope and prevent proceeding with a period policy.
- Daily policy: never surface a timetable requirement.
- Existing period policies with invalid or removed periods remain blocked until
  valid periods are selected.

## Verification

- Policy payload tests cover both `DAILY` and `PERIOD`.
- Daily flows make no timetable calls.
- Period flows request only the completed target scope config.
- Roll Call session selection is derived from the effective policy mode.
- Existing excuse, late/early, and attendance service tests continue to pass.
