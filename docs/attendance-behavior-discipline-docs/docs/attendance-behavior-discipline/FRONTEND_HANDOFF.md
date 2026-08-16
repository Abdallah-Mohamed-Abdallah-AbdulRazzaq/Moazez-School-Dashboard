# Frontend Handoff

## Integration decision

```text
Frontend integration: READY_WITH_DOCUMENTED_DRIFT
```

This means frontend can integrate safely if it follows backend-native stable routes and does not assume ADR examples are literal runtime contracts when they conflict with current implementation.

## Do

- Use `/api/v1` for every endpoint.
- Use bearer authentication.
- Use Teacher `TeacherSubjectAllocation.id` as `classId`.
- Use `/api/v1/teacher/classroom/:classId/attendance/today` for the classroom attendance screen.
- Treat `unmarked` and `early_leave` as Teacher read statuses.
- Send only `present`, `absent`, `late`, or `excused` in Teacher attendance writes.
- Use `/student/discipline` and `/parent/children/:studentId/discipline` for mixed Attendance + Behavior timelines.
- Use Behavior routes only for approved positive/negative behavior records.
- Use Parent Reports `discipline` object for raw derived discipline counts.
- Treat `disciplinePercentage` as legacy attendance present-rate.

## Do not

- Do not use `scheduleId` as an Attendance write target.
- Do not send `early_leave` to Teacher attendance update entries.
- Do not send `lateMinutes` expecting Teacher write persistence.
- Do not send arrival/dismissal times expecting persistence.
- Do not use `/teacher/classrooms/*` plural aliases.
- Do not expect Dashboard Discipline KPI in V1.
- Do not treat `disciplinePercentage` as a combined Discipline score.
- Do not mix Behavior and Discipline semantics in the frontend without product-approved mapping.
- Do not use Dashboard/Admin Attendance routes from Student/Parent mobile surfaces.
- Do not expect internal tenant, storage, audit, or actor ids in app-facing responses.

## Documented drift register

| Frontend expectation | Backend reality | Classification | Frontend action |
| --- | --- | --- | --- |
| Teacher `classId` is classroom id | `classId` is `TeacherSubjectAllocation.id` | Documented drift | Pass allocation id. |
| Teacher plural `/classrooms` aliases | Stable base is singular `/teacher/classroom/:classId` | Frontend should adapt | Use singular route. |
| scheduleId attendance writes | Not supported | Intentional deferred | Do not use schedule ids for writes. |
| Teacher arrival/dismissal persistence | Not implemented | Documented drift | Do not rely on persistence. |
| Teacher `lateMinutes` write | Not supported by Teacher adapter | Deferred | Do not send expecting persistence. |
| Teacher `early_leave` write | Read-only in Teacher App | Deferred | Do not send `early_leave`. |
| Teacher excuse reason write | Not supported by Teacher adapter | Deferred | Use core/formal flows only if product permits. |
| Behavior mixed feed | Behavior routes are behavior-only | Backend stable | Use Discipline routes. |
| Parent `disciplinePercentage` as combined discipline score | It is attendance-derived present-rate | Documented drift | Use `discipline` raw counts. |
| Dashboard Discipline KPI | No route/formula | Product decision required | Do not render live KPI unless scoped. |
| Combined Discipline score | Not implemented | Product decision required | Do not invent backend score client-side. |
| `/attendance/context` convenience endpoint | Not implemented | Deferred | Use existing routes. |

## Recommended frontend route use

### Teacher classroom attendance screen

1. Load owned classroom/allocation context from Teacher App class APIs.
2. Use allocation id as `classId`.
3. Call:

```http
GET /api/v1/teacher/classroom/:classId/attendance/today?date=YYYY-MM-DD
```

4. If user intentionally starts roll-call, call:

```http
POST /api/v1/teacher/classroom/:classId/attendance/session/resolve
```

5. Save entries only with supported statuses.

### Student discipline screen

```http
GET /api/v1/student/discipline?page=1&limit=20
GET /api/v1/student/discipline/summary
```

### Parent child discipline screen

```http
GET /api/v1/parent/children/:studentId/discipline?page=1&limit=20
GET /api/v1/parent/children/:studentId/discipline/summary
```

### Parent reports summary

```http
GET /api/v1/parent/children/:studentId/reports/summary
```

Use:

- `attendance.disciplinePercentage` for legacy attendance rate.
- `discipline` for raw Attendance + Behavior discipline counts.
