# Testing Guide

This package includes manual HTTP files and a verification plan grounded in the current code.

## Recommended Local Setup

```bash
npm run infra:up
npm run db:migrate
npm run seed
npm run start:dev
```

Base URL:

```text
http://localhost:3000/api/v1
```

## Automated Verification Commands

Focused module tests:

```bash
npm run test -- settings --runInBand
npm run test -- iam --runInBand
npm run test -- health --runInBand
```

Relevant E2E:

```bash
npm run test:e2e -- --runInBand --runTestsByPath test/e2e/identity-credentials-email-final-closeout.e2e-spec.ts
```

Relevant security suites:

```bash
npm run test:security -- --runInBand --runTestsByPath test/security/tenancy.settings.spec.ts
npm run test:security -- --runInBand --runTestsByPath test/security/tenancy.iam.spec.ts
npm run test:security -- --runInBand
```

Build/schema checks:

```bash
npx prisma validate
npx prisma generate
npm run build
```

## Manual Test Order

### 1. Health smoke test

Use `API_TESTS_HEALTH.http`:

1. `GET /health`
2. Confirm `checks.db`, `redis`, `storage`, `queues`, `email`, and `push` exist.
3. Confirm optional unconfigured email/push are `skipped`, not a hard failure.

### 2. Auth baseline

Use `API_TESTS_IAM.http`:

1. Login.
2. Store `accessToken` and `refreshToken`.
3. Call `/auth/me`.
4. Refresh token.
5. Change password only on a disposable test user.
6. Logout.

### 3. Settings read surface

Use `API_TESTS_SETTINGS.http`:

1. Read settings overview.
2. Read branding.
3. Read security settings.
4. List roles.
5. List permissions.
6. List users.
7. Read credential status.

### 4. Login identity setup

1. PUT `/settings/login-identity` with a school login domain.
2. Preview username.
3. Check username availability.
4. Create or invite a user using `username + contactEmail`.

### 5. Credential provisioning

1. Generate temporary password for the new user.
2. Verify response returns plaintext temporary password only once.
3. Login as that user.
4. Confirm `mustChangePassword=true` in auth response if generated password was used.
5. Change password.

### 6. Email setup and queue-backed delivery

1. PUT SMTP email connection.
2. POST test connection.
3. POST activate connection.
4. Preview credential delivery recipients.
5. Create credential delivery batch.
6. List delivery batches.
7. List recipients.
8. Cancel queued batch if applicable.

## Permission Negative Tests

Create or use a custom role lacking each permission and confirm:

- Missing `settings.permissions.view` blocks `GET /settings/permissions`.
- Missing `settings.email.connection.manage` blocks email connection mutation.
- Missing `settings.email.templates.manage` blocks template updates.
- Missing `settings.email.credential_deliveries.manage` blocks credential delivery creation.
- Missing `settings.email.campaigns.manage` blocks campaign creation.
- Missing `settings.email.deliveries.manage` blocks delivery cancel.

## Disabled User Tests

1. Login as a test user.
2. As admin, call `PATCH /settings/users/:id/status` with `inactive`.
3. Retry the user's existing access token on `/auth/me`.
4. Expected: rejected because session/user is no longer active.
5. Retry refresh token.
6. Expected: rejected and sessions revoked.

## No-Leak Tests

Verify responses do not include:

- `passwordHash`
- `refreshTokenHash`
- SMTP `password`
- encrypted provider secrets
- pending credential metadata
- Firebase private key material
- raw connection strings

Health failure responses should show simple sanitized messages such as `dependency_check_failed`.
