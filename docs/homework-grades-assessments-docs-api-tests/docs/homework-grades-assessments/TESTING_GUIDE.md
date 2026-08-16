# Testing Guide

## Final Sprint 23H verification evidence

Sprint 23H final verification completed successfully on 2026-06-17.

Accepted verification matrix:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
npm run build
npm run test -- grades --runInBand
npm run test -- homework --runInBand
npm run test -- teacher-app --runInBand
npm run test -- student-app --runInBand
npm run test -- parent-app --runInBand
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.grades.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.homework.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.teacher-app.spec.ts test/security/tenancy.student-app.spec.ts test/security/tenancy.parent-app.spec.ts
```

Reported results in Sprint 23H:

- Grades tests: 32 suites, 247 tests passed.
- Homework tests: 15 suites, 139 tests passed.
- Teacher App tests: 42 suites, 231 tests passed.
- Student App tests: 42 suites, 173 tests passed.
- Parent App tests: 39 suites, 148 tests passed.
- `tenancy.grades.spec.ts`: 1 suite, 111 tests passed.
- `tenancy.homework.spec.ts`: 1 suite, 24 tests passed.
- Teacher/Student/Parent app security group: 3 suites, 82 tests passed.
- Full homework security family: 5 suites, 46 tests passed.

## Focused security suites

Use the following when reviewing this feature family:

```bash
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.grades.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.homework.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.homework-answer-review.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.homework-answers-attachments.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.homework-grade-sync.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.homework-questions-attachments.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.teacher-app.spec.ts test/security/tenancy.student-app.spec.ts test/security/tenancy.parent-app.spec.ts
```

## What the tests must protect

Critical expectations:

- Dashboard Grades permissions and school tenancy.
- Dashboard Homework permissions and school tenancy.
- Teacher App owned-allocation boundaries.
- Student current-user boundaries.
- Parent linked-child boundaries.
- Locked assessment mutation denial.
- Closed/inactive term mutation denial.
- Draft/unpublished visibility boundaries.
- Parent homework read-only behavior.
- Absence of Teacher App direct score-only GradeItem write routes.
- Safe error and no-leak behavior.

## Manual smoke testing

Use `API_TESTS.http` after replacing placeholders:

- `{{baseUrl}}`
- `{{adminToken}}`
- `{{teacherToken}}`
- `{{studentToken}}`
- `{{parentToken}}`
- resource IDs such as `{{assessmentId}}`, `{{homeworkId}}`, and `{{studentId}}`.

The `.http` file is not a full E2E suite. It is a manual route and contract smoke-test helper.
