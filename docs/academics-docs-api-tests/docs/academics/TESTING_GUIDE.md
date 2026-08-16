# Academics V1 Testing Guide

## Purpose

This guide documents the final verification posture for Academics V1.

It covers:

- Prisma validation.
- Build.
- Unit/integration filters.
- E2E route inventory.
- Security/tenancy sweeps.
- App-facing lesson safety checks.

## Final verification matrix

The Sprint 22L closeout recorded the following successful checks:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
npm run build
npm run test -- academics --runInBand
npm run test -- timetable --runInBand
npm run test -- lesson-plans --runInBand
npm run test -- curriculum --runInBand
npm run test -- teacher-allocation --runInBand
npm run test -- subject-allocation --runInBand
npm run test -- subjects --runInBand
npm run test -- calendar --runInBand
npm run test -- teacher-app --runInBand
npm run test -- student-app --runInBand
npm run test -- parent-app --runInBand
npm run test -- lesson-preparation --runInBand
npm run test -- student-lessons --runInBand
npm run test -- parent-child-lessons --runInBand
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/academics-final-completion.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.academics-final-completion.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/teacher-app-lesson-preparation.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/student-app-lessons.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/parent-app-child-lessons.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.teacher-app-lesson-preparation.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.student-app-lessons.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.parent-app-child-lessons.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/teacher-app-final-closeout.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/student-app-final-closeout.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/parent-app-final-closeout.e2e-spec.ts
```

## Route inventory coverage

The final route inventory checks representative accepted routes across:

- Dashboard Academics overview.
- Calendar.
- Subjects.
- Subject allocations.
- Teacher allocations.
- Timetable.
- Curriculum.
- Lesson plans.
- Teacher schedule and lesson-preparation.
- Student schedule, subjects, calendar, lessons.
- Parent child schedule, calendar, lessons.

The route inventory also asserts absent Student/Parent lesson mutation routes.

## Security coverage

Security tests verify:

- Dashboard routes deny unauthenticated users.
- Dashboard routes deny app-role users without dashboard permissions.
- Dashboard routes deny school users without required permissions.
- Cross-school dashboard list filtering.
- Safe 404 behavior for cross-school detail IDs.
- Teacher/Student/Parent role isolation.
- App-facing lesson response safety.
- Teacher-only notes do not leak to Student/Parent.
- Closed-term representative mutation blocking.

## Manual `.http` coverage

`API_TESTS.http` includes manual requests for:

- Dashboard overview.
- Structure.
- Rooms.
- Subjects.
- Subject allocation.
- Teacher allocation.
- Timetable.
- Calendar.
- Curriculum.
- Lesson plans.
- Teacher App schedule/calendar/lesson preparation.
- Student App schedule/subjects/calendar/lessons.
- Parent App child schedule/calendar/lessons.

The `.http` file uses placeholders. Replace them with real local values before running.

## Recommended local verification flow

Use this minimal flow after changes to Academics:

```bash
npx prisma validate
npm run build
npm run test -- academics --runInBand
npm run test -- teacher-app --runInBand
npm run test -- student-app --runInBand
npm run test -- parent-app --runInBand
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/academics-final-completion.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.academics-final-completion.spec.ts
```

For app-facing lesson changes, additionally run:

```bash
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/teacher-app-lesson-preparation.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/student-app-lessons.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/parent-app-child-lessons.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.teacher-app-lesson-preparation.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.student-app-lessons.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.parent-app-child-lessons.spec.ts
```
