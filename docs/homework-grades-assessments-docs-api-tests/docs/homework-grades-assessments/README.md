# Homework / Grades / Assessments V1 Documentation

This documentation describes the implemented Moazez Backend V1 logic for the Homework, Grades, and Assessments feature family.

The feature family is accepted as closed for V1 based on Sprint 23H. It includes dashboard administration surfaces, app-facing teacher/student/parent read and workflow surfaces, grade assessment workflows, homework submission workflows, and Homework-to-Grades synchronization.

## Documentation map

- `OVERVIEW.md` - high-level implemented scope and decisions.
- `DASHBOARD_GRADES_ASSESSMENTS.md` - School Dashboard Grades and Assessments.
- `HOMEWORK_CORE.md` - School Dashboard Homework Core.
- `TEACHER_APP_HOMEWORK_GRADES.md` - Teacher App Homework and Classroom Grades.
- `STUDENT_APP_HOMEWORK_GRADES.md` - Student App Homework and Grades.
- `PARENT_APP_HOMEWORK_GRADES.md` - Parent App Homework and Grades.
- `API_REFERENCE.md` - all implemented route families.
- `DATA_MODEL.md` - data model overview.
- `WORKFLOWS_AND_LIFECYCLES.md` - lifecycle documentation.
- `SECURITY_TENANCY_PERMISSIONS.md` - access, ownership, tenancy, permissions.
- `SAFE_RESPONSES_AND_NO_LEAK.md` - response safety boundaries.
- `ERRORS_AND_NON_GOALS.md` - accepted non-goals and deferred scope.
- `TESTING_GUIDE.md` - verification commands and evidence.
- `API_TESTS.http` - manual API smoke test collection.

## Source evidence

Primary source files reviewed include:

- `docs/sprint-23h-homework-grades-assessments-final-closeout-audit.md`
- `docs/sprint-23f-homework-grades-assessments-security-closeout.md`
- `src/modules/grades/**/controller/*.ts`
- `src/modules/homework/controller/*.ts`
- `src/modules/teacher-app/homeworks/controller/teacher-homeworks.controller.ts`
- `src/modules/teacher-app/classroom/grades/controller/*.ts`
- `src/modules/student-app/homeworks/controller/student-homeworks.controller.ts`
- `src/modules/student-app/grades/controller/student-grades.controller.ts`
- `src/modules/parent-app/homeworks/controller/parent-homeworks.controller.ts`
- `src/modules/parent-app/grades/controller/parent-grades.controller.ts`
- `prisma/seeds/01-permissions.seed.ts`
- `test/security/tenancy.grades.spec.ts`
- `test/security/tenancy.homework*.spec.ts`
- `test/security/tenancy.teacher-app.spec.ts`
- `test/security/tenancy.student-app.spec.ts`
- `test/security/tenancy.parent-app.spec.ts`

## V1 acceptance summary

Homework / Grades / Assessments V1 is accepted as complete for the implemented backend scope.

No additional runtime sprint is required before V1 closure unless product reopens deferred scope such as direct Teacher App score-only grade entry, parent homework submission, notifications, XP/rewards, exports, or advanced analytics.
