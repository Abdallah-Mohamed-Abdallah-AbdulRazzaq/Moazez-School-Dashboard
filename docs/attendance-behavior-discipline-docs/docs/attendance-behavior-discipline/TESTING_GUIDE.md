# Testing Guide

## Recommended verification posture

Run tests by family and surface. This keeps failures easy to isolate.

## Attendance

```bash
npm test -- --runInBand attendance
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.attendance.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/attendance-excuses-corrections.e2e-spec.ts
```

Expected coverage:

- Roll-call session CRUD/read flows.
- Entry save/upsert.
- Submit/unsubmit.
- Closed-term write rejection.
- Absence correction convenience endpoints.
- Formal excuse request lifecycle.
- Cross-school safe not-found behavior.

## Behavior

```bash
npm test -- --runInBand behavior
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.behavior.spec.ts
```

Expected coverage:

- Behavior category lifecycle.
- Behavior records create/update/submit/cancel.
- Review queue.
- Approve/reject.
- Dashboard overview and summaries.
- Tenant isolation.

## Discipline

```bash
npm test -- --runInBand discipline
```

Expected coverage:

- Derived repository timeline composition.
- Submitted Attendance incidents only.
- Approved Behavior records only.
- Summary formulas.
- Presenter camelCase and snake_case aliases.
- No source duplication.

## Student App

```bash
npm test -- --runInBand student-app
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.student-app.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/student-app-final-closeout.e2e-spec.ts
```

Expected coverage:

- Student Behavior remains behavior-only.
- Student Discipline derived timeline exists.
- Student cannot see other-student/cross-school data.
- Non-student actors are rejected.

## Parent App

```bash
npm test -- --runInBand parent-app
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.parent-app.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/parent-app-final-closeout.e2e-spec.ts
```

Expected coverage:

- Parent Behavior remains behavior-only.
- Parent Discipline derived timeline exists for linked child.
- Parent Reports include additive discipline object.
- Unlinked/cross-school children are hidden safely.

## Teacher App Attendance

```bash
npm test -- --runInBand teacher-app
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.teacher-app.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/teacher-app-classroom-operations.e2e-spec.ts
```

Expected coverage:

- `today` route returns safe classroom attendance model.
- `unmarked` and `early_leave` read mappings work.
- Teacher writes remain limited.
- Teacher classId is allocation id.
- Unowned/cross-school allocations are safe.

## Build and global checks

```bash
npx prisma validate
npx prisma generate
npm run build
```

## Sprint 25 handoff note

Sprint 25J itself is documentation-only. It should be verified by checking that no runtime code changed in that sprint and that the handoff reflects current stable backend routes.
