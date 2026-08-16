# Testing Guide

This guide lists commands referenced by the Sprint 26 closeout documents and recommended verification commands for future updates.

## Baseline validation

```bash
npx prisma validate
npx prisma generate
npm run build
```

## Core suites

```bash
npm test -- --runInBand reinforcement
npm test -- --runInBand xp
npm test -- --runInBand rewards
npm test -- --runInBand hero-journey
```

## App suites

```bash
npm test -- --runInBand teacher-app
npm test -- --runInBand student-app
npm test -- --runInBand parent-app
```

## Focused suites

```bash
npm test -- --runInBand teacher-tasks
npm test -- --runInBand teacher-xp
npm test -- --runInBand student-tasks
npm test -- --runInBand student-hero
npm test -- --runInBand student-rewards
npm test -- --runInBand parent-tasks
npm test -- --runInBand parent-hero
npm test -- --runInBand parent-rewards
npm test -- --runInBand parent-progress
```

## Security / E2E

```bash
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.student-app.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.parent-app.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.teacher-app.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/student-app-final-closeout.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/parent-app-final-closeout.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/reinforcement-foundation.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/hero-journey-foundation.e2e-spec.ts
```

## No-leak assertions to preserve

Future changes must continue asserting absence of:

- tenant ids
- actor ids
- reviewer ids
- XP ledger internals
- BehaviorPointLedger-derived XP
- reward redemption internals where not app-safe
- storage internals
- wallet/finance/marketplace/payment fields

## Important notes

- Sprint 26J reported no runtime changes and only an untracked handoff doc before commit.
- Some closeout commands had local Git permission warnings around a user config ignore file; those warnings were not backend failures.
- Some builds required longer timeout reruns; successful reruns are the accepted result.
