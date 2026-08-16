# Testing Guide

## Focused Verification from Closeout

The sprint closeout reports these commands as passed:

- `npx prisma validate`
- `npx prisma generate`
- `npm run seed`
- `npm run build`
- `npx tsc -p tsconfig.build.json --noEmit`
- `npx jest --runInBand src/modules/academics/subjects/tests/subjects.use-case.spec.ts`
- `npx jest --config ./test/jest-e2e.json --runInBand test/e2e/academics-subject-allocations.e2e-spec.ts`
- `npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.academics-subject-allocations.spec.ts`

## Manual API Testing Order

1. Login as a school dashboard user with subject and structure permissions.
2. Create a catalog subject without `termId` or `stage`.
3. Confirm response does not contain `termId` or `stage`.
4. Attempt invalid create with `termId`; expect validation rejection.
5. Attempt invalid update with `stage`; expect validation rejection.
6. Bulk allocate the subject to a term/grade with weekly hours.
7. Read allocations by `termId` and `gradeId`.
8. Confirm Teacher/Student/Parent tokens cannot access the dashboard allocation matrix by default.

## Regression Boundary

The closeout notes that `academics-final-completion.e2e-spec.ts` failed outside the changed contract surface due to shared app-facing calendar fixture roles lacking Teacher App permissions. This package does not treat that as a subject catalog/allocation regression.
