# Testing Guide

## Focused backend suites

The final acceptance closeout reports these focused checks:

- `test/e2e/school-support-chat.e2e-spec.ts` passed.
- `test/security/tenancy.school-support-chat.spec.ts` passed.
- `npx prisma validate` passed.
- `npx prisma generate` passed.
- `npm run seed` passed.
- `npm run build` passed on rerun with longer timeout.
- `npx tsc -p tsconfig.build.json --noEmit` passed.
- Dashboard and platform-admin security regressions passed.

## Recommended manual API test order

1. Login as a school admin user.
2. `GET /api/v1/school-support/conversation` to create/load conversation.
3. `POST /api/v1/school-support/messages` with `clientMessageId`.
4. Repeat the same `POST` to verify idempotency.
5. Login as platform admin.
6. `GET /api/v1/platform-admin/support/conversations?hasUnread=true`.
7. Read conversation detail and messages.
8. Reply as platform support with `clientMessageId`.
9. Repeat reply to verify idempotency.
10. Mark platform read.
11. Login as school admin again and verify unread count increased.
12. Mark school read.
13. Close conversation as platform support.
14. Verify school send returns 409.
15. Reopen conversation as platform support.
16. Verify school send works again.

## Negative/security checks

- Teacher, Parent, Student, and Dismissal Staff should not access school support routes by default.
- School B should not read School A messages.
- School-side tenant override fields must be rejected.
- Platform route without the specific `platform.support.*` permission must fail.
- Platform support through generic `/communication/*` must fail.

## Known pre-existing broader regression

The broad Communication tenancy suite had a documented pre-existing pattern of `8 failed, 60 passed`. The closeout states no failure references School Support Chat routes.
