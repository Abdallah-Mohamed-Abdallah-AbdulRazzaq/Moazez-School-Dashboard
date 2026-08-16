# Commit Range and Tracks

## Commit range

The documented range contains six commits, from the parent of `240552a4` through `5fe6fb6`:

```text
240552a4 feat: expose admissions document review eligibility
... four intermediate commits ...
5fe6fb6 docs: add admissions frontend contract audit
```

## Tracks covered

| Track | Purpose | Runtime impact |
|---|---|---|
| ADM-DOC-UX-1A | Expose document review eligibility and source diagnostics | School Admissions document API response expands |
| STU-GUARD-ROUTE-1A | Add canonical guardians routes and preserve legacy aliases | Dashboard guardian search should move to canonical route |
| ADM-DOC-UX-1B | Add application document counters and summary fields | Application list/detail responses expand |
| ADM-WORKFLOW-POLICY-1A | Add configurable workflow policy for placement/interview requirements | Decision/register readiness changes based on policy |
| ADM-DASH-STATE-1A | Add backend-computed dashboard action state | Dashboard no longer derives action readiness manually |
| ADM-FE-CONTRACT-1A | Audit frontend contracts and Swagger schemas | No business logic change; schema metadata improved |

## Changed file families

- `src/modules/admissions/documents/**`
- `src/modules/admissions/applications/**`
- `src/modules/admissions/decisions/**`
- `src/modules/admissions/workflow-policy/**`
- `src/modules/students/guardians/**`
- `prisma/schema.prisma`
- `prisma/migrations/20260703120000_0050_admission_workflow_policy/migration.sql`
- focused E2E/security tests
- frontend contract docs
