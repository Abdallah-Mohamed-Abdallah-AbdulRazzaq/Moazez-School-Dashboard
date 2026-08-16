# Academics V1 Workflows and Lifecycles

## 1. Academic setup workflow

Typical dashboard setup sequence:

```text
1. Create academic year.
2. Create terms.
3. Create stages.
4. Create grades under stages.
5. Create sections under grades.
6. Create classrooms under sections.
7. Create rooms if timetable room assignment is needed.
8. Create subjects.
9. Configure subject allocations weekly hours.
10. Configure teacher allocations.
11. Configure timetable.
12. Create academic calendar events.
13. Create curriculum.
14. Create lesson plans.
15. Publish/activate relevant academic structures and planning artifacts.
```

The backend does not require all of these steps to be performed by a single endpoint. Each area has its own APIs.

## 2. Subject allocation workflow

Purpose:

```text
(term, grade, subject) -> weeklyHours
```

Workflow:

```text
1. Select term.
2. Select grade.
3. Assign subjects and weekly hours.
4. Save using bulk subject allocation API.
5. Timetable and lesson-plan validation can consume the weekly-hours matrix.
```

Closed terms reject subject allocation writes.

## 3. Teacher allocation workflow

Purpose:

```text
(term, classroom, subject) -> teacher
```

Supported operations:

- Create individual allocations.
- Bulk save allocations.
- Apply teacher allocation to grade.
- Clear allocations by subject.
- Validate allocation coverage.
- View teacher loads.
- Delete allocation when safe.

Teacher App uses these allocations as ownership boundaries.

## 4. Timetable workflow

Typical timetable sequence:

```text
1. Create or update timetable config.
2. Create timetable periods.
3. Create or bulk save timetable entries.
4. Preview timetable grid.
5. Validate completeness and weekly-hours coverage.
6. Check conflicts.
7. Publish timetable.
8. Optionally unpublish for term scope.
```

Timetable supports both saved conflicts and proposed conflict checking without saving.

## 5. Academic calendar workflow

Dashboard workflow:

```text
1. Create calendar event.
2. Update event if needed.
3. List events by range/filter.
4. Read event detail.
5. Soft delete event if removed.
```

App-facing workflow:

```text
Teacher/Student/Parent apps read safe calendar event projections.
```

Notifications/reminders are not part of V1.

## 6. Curriculum workflow

Typical curriculum workflow:

```text
1. Create curriculum.
2. Add units.
3. Add lessons under units.
4. Add lesson content items.
5. Reorder units, lessons, or content as needed.
6. Activate curriculum when ready.
7. Archive curriculum when it should become read-only.
8. Soft delete if needed.
```

Archive/read-only protection prevents unsafe mutation of archived curriculum structures and lesson content.

## 7. Lesson plan workflow

Typical lesson-plan workflow:

```text
1. Create lesson plan.
2. Create lesson plan items manually or via auto-plan.
3. Review weeks and summary.
4. Validate readiness.
5. Move/reschedule items if needed.
6. Activate lesson plan.
7. Update item lifecycle statuses.
8. Archive or soft delete plan when needed.
```

Lesson plan item dashboard statuses include actions such as:

- start
- complete
- skip
- cancel
- move/reschedule
- reorder

Closed terms block mutation actions.

## 8. Teacher lesson-preparation workflow

Teacher App workflow:

```text
1. Teacher opens daily or weekly lesson-preparation list.
2. Backend resolves current teacher context.
3. Backend lists owned teacher allocations.
4. Backend returns lesson-plan items owned by that teacher.
5. Teacher opens detail if needed.
6. Teacher updates status when allowed.
```

Allowed update statuses:

```text
planned
in_progress
done
skipped
```

Allowed transitions:

```text
PLANNED     -> IN_PROGRESS | DONE | SKIPPED
IN_PROGRESS -> DONE | SKIPPED
DONE        -> no transition
SKIPPED     -> no transition
RESCHEDULED -> no transition
CANCELLED   -> no transition
```

No `prepared` status exists.

## 9. Student lesson content workflow

Student App workflow:

```text
1. Student opens lessons today/week/detail.
2. Backend resolves linked student and active enrollment.
3. Backend derives classroom, academic year, and term scope.
4. Backend returns visible active lesson-plan items.
5. Backend includes safe lesson content and file metadata only.
```

Student App is read-only for lessons.

## 10. Parent child lesson workflow

Parent App workflow:

```text
1. Parent requests child lessons today/week/detail.
2. Backend verifies the child is linked to the parent through guardian records.
3. Backend verifies active enrollment for the child.
4. Backend uses the child enrollment scope to read visible lesson-plan items.
5. Backend returns safe child lesson content.
```

Parent App is read-only for lessons.

## 11. Closed-term workflow

The accepted V1 convention:

```text
Term.isActive === false => closed term
```

Closed terms block mutations, but reads can still return safe data where applicable.

## 12. Archive/read-only workflow

Archived curriculum or lesson plans are treated as read-only for unsafe mutations.

App-facing read models filter archived content according to the app-specific rules:

- Student App requires active curriculum and active lesson plan for visible lesson content.
- Teacher App normal reads exclude archived plans/curricula, while some status-update checks may load archived context only to return proper read-only errors.
