# Admissions Dashboard / Applicant Document Review / Workflow Policy Delta

This documentation describes only the code changes introduced in the six-commit range:

```text
240552a4af62166949f700934a4ed26875eb1f08
feat: expose admissions document review eligibility

through

5fe6fb629f066048a128f95101290b633eb83db5
docs: add admissions frontend contract audit
```

## What this delta adds

1. School-side Admissions document responses now expose review eligibility state for Applicant Portal bridged documents.
2. Staff-created Admissions documents can no longer be created as `pending_review`.
3. Admissions application list/detail responses now include `documentsSummary` counters.
4. Admissions applications now include `dashboardState` for decision/register/dashboard action state.
5. A school-scoped Admissions workflow policy was added to make placement tests and interviews configurable.
6. Guardian search/list routes now have canonical `/students-guardians/guardians` routes, while legacy routes remain compatible.
7. Frontend-facing Swagger/OpenAPI metadata was added for the new DTO fields.

## What this delta does not do

- It does not redesign Applicant Portal intake.
- It does not convert Applicant accounts into Parent or Student accounts.
- It does not create Student, Guardian, StudentGuardian, Enrollment, or school membership from Applicant Portal.
- It does not alter Parent App or Student App response contracts.
- It does not remove legacy guardians routes.
- It does not add grade/program-specific workflow policies.
