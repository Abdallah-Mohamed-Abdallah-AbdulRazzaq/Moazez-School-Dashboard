# Health Readiness

The Health module exposes a public liveness/readiness endpoint.

## Route

```http
GET /api/v1/health
```

Controller path: `health` under the global `/api/v1` prefix.

The route is marked public. It does not require a bearer token.

## Response Shape

```json
{
  "status": "ok",
  "timestamp": "2026-06-25T10:00:00.000Z",
  "version": "0.1.0",
  "checks": {
    "db": { "status": "ok", "durationMs": 12 },
    "redis": { "status": "ok", "durationMs": 5 },
    "storage": { "status": "ok", "durationMs": 18 },
    "queues": {
      "status": "ok",
      "durationMs": 20,
      "details": {
        "queues": [
          {
            "name": "school-email-delivery",
            "status": "ok",
            "counts": {
              "waiting": 0,
              "active": 0,
              "delayed": 0,
              "failed": 0
            }
          }
        ]
      }
    },
    "email": {
      "status": "skipped",
      "durationMs": 3,
      "message": "no_active_email_connections",
      "details": { "activeConnections": 0 }
    },
    "push": {
      "status": "skipped",
      "durationMs": 1,
      "message": "push_disabled",
      "details": { "mode": "disabled" }
    }
  }
}
```

## Status Values

Each dependency check can return:

- `ok`
- `degraded`
- `error`
- `skipped`

Overall report status is either:

- `ok`
- `degraded`

There is no `error` overall status in the current DTO. Dependency failures degrade the report.

## Checks

### DB

Uses Prisma raw query:

```sql
SELECT 1
```

### Redis

Uses BullMQ Redis ping through queue infrastructure.

### Storage

Uses the storage service readiness check for configured storage/bucket readiness.

### Queues

Checks these queue names:

- school email delivery
- communication notification generation
- communication push notification delivery

If any queue reports failed jobs, queue readiness becomes `degraded`.

### Email

Reads active `SchoolEmailConnection` records and checks whether active SMTP connections have enough configuration and decryptable secret material.

Email readiness does not expose:

- school ids
- host credentials
- passwords
- API keys
- encrypted secret values

When there are no active connections, the check returns:

```json
{
  "status": "skipped",
  "message": "no_active_email_connections",
  "details": { "activeConnections": 0 }
}
```

### Push

Uses Firebase Admin provider readiness.

When push is disabled, the check returns:

```json
{
  "status": "skipped",
  "message": "push_disabled",
  "details": { "mode": "disabled" }
}
```

## Timeout Behavior

Every dependency check is wrapped in a timeout of `1000ms`.

A timeout becomes an error check with message:

```text
dependency_check_timeout
```

## Failure Sanitization

Dependency failure messages are sanitized before entering the public response.

Allowed failure messages must be simple identifiers no longer than 80 characters. Other messages become:

```text
dependency_check_failed
```

This prevents leaking:

- connection strings
- bucket names
- provider endpoints
- SMTP passwords
- encrypted email secrets
- Firebase private key material
- stack traces

## Operational Meaning

Use `/health` as:

- simple app liveness check
- dependency readiness snapshot
- smoke test after deployment
- fast visibility into queue/storage/email/push readiness

Do not use it as:

- full observability dashboard
- metrics endpoint
- replacement for logs
- deep SMTP delivery guarantee
- detailed storage diagnostics
