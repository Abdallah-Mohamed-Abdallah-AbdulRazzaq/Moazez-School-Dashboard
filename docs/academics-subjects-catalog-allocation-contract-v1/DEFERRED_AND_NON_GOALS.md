# Deferred and Non-Goals

## Not Implemented by This Sprint

- No schema migration.
- No seed change.
- No platform/system dashboard API.
- No route path change.
- No teacher allocation model change.
- No timetable model change.
- No apply-to-stage endpoint.
- No subject allocation delete endpoint change.
- No app-facing Teacher/Student/Parent route change.

## Explicit Non-Goal

This sprint does not make Subjects term-scoped. It does the opposite: it clarifies that `Subject` is catalog-only and `SubjectAllocation` owns term/grade/weeklyHours.

## Future Considerations

Potential future work, outside this sprint:

- A dashboard convenience endpoint to apply a subject to every grade in a stage.
- SQL-level or service-level delete/clear allocation flows.
- Teacher load analytics using `SubjectAllocation.weeklyHours`.
- Timetable readiness checks based on allocation matrix completeness.
- Broader academics setup checklist updates.
