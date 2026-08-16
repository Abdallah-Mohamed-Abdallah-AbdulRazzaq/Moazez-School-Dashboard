# Deferred and Non-Goals

This file documents what is not implemented as active runtime behavior yet.

## Settings Security Stored-Only Controls

The following fields are stored and exposed through Settings Security, but full runtime enforcement is deferred:

- `enforceTwoFactor`
- `ipAllowlistEnabled`
- `ipAllowlist`
- `suspiciousLoginAlerts`
- `passwordRotationDays`

Do not present them as fully enforced controls until a dedicated implementation adds enforcement points.

## Credential and Auth Deferrals

Deferred:

- activation-account token flow
- forgot-password token flow
- reset-password token delivery flow
- self-service password reset
- 2FA enrollment and challenge flow
- password rotation enforcement
- account lockout and brute-force throttling beyond current guards

Implemented:

- login
- refresh rotation
- session records
- logout/session revocation
- admin credential generation/set/regenerate
- must-change-password flag
- change-password endpoint for current authenticated user

## Email Deferrals

Deferred:

- non-SMTP provider runtime sends
- provider webhooks
- open/click tracking
- scheduled campaign sending
- unsubscribe/preferences center
- template asset upload workflow beyond existing file references
- transactional outbox for provider-send/apply-credential atomicity

Implemented:

- SMTP configuration validation path
- encrypted provider secrets
- school email templates
- queue-backed credential delivery
- queue-backed general campaign creation
- delivery batch and recipient monitoring
- cancel queued delivery

## Health Deferrals

Health is not a full observability dashboard.

Deferred:

- Prometheus metrics export in this Health route
- detailed queue dashboards
- per-school email connection listing
- provider secret diagnostics
- deep storage object listing
- external SMTP delivery guarantee
- Firebase send test from health endpoint

Implemented:

- DB readiness
- Redis readiness
- storage readiness
- queue readiness counts
- email readiness summary
- push provider mode summary
- sanitized public failure messages

## Settings Module Deferrals

Some Settings model families exist in schema but do not have complete current runtime controllers in the code inspected here:

- generic notification template management runtime
- generic integration provider/connection runtime
- backup/import/export runtime

Do not document them as active APIs unless future controllers/use-cases are added.

## Scope Boundaries

Settings routes are school-scoped. Platform Admin is separate and should not be mixed into Settings routes.

Teacher, Student, and Parent app settings surfaces, if any, should remain app-facing composition layers and must not reuse school admin Settings management endpoints directly.
