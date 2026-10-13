# Teacher allocation frontend contract repair

**Goal:** Show saved teacher names, select eligible invited/active teachers, and keep retained assignments and loads inspectable using the existing backend.

**Architecture:** The existing paginated `GET /api/v1/teachers` directory supplies account, membership, employment and profile completeness. Allocation identities use `userId`, never `TeacherProfile.id`. The UI annotates eligibility locally and retains saved names from allocation responses. Teacher loads are fetched by term and filtered locally because backend filtered loads require active membership.

**Tech Stack:** Next.js, TypeScript, React, shared UI Select, Vitest.

**Evidence:** The read-only audit found invited assignees excluded by the old settings query and retained assignments for an inactive teacher. Backend changes were rolled back at the owner's request.

## Constraints

- Frontend changes only. Existing API paths, methods and responses remain unchanged.
- `/teachers` requires `teachers.records.view`; without it, saved allocations remain readable and assignment controls explain the permission requirement.
- Subject Allocation remains unchanged. Teacher Allocation still uses positive weekly hours for each grade.
- No production writes, deployment, merge, schema change or backend source changes.
- Relevant feature tests, changed-file lint, typecheck and build only. Apply clean-code-guard and test-guard before delivery.

## Tasks

- [x] Read the existing backend contracts and verify canonical identities and eligibility fields.
- [x] Replace allocation-only settings role discovery and active-only queries with all pages of the existing Teacher Directory; preserve the shared legacy teacher reader for other modules.
- [x] Use shared searchable Select; preserve unavailable saved labels and prevent choosing unavailable assignees.
- [x] Annotate local eligibility, flag reassignment, exclude ineligible assignments from completion and validation success.
- [x] Preserve saved data with zero eligible candidates or missing directory permission.
- [x] Fetch current-term teacher loads without an individual teacher filter, filter locally and preserve pagination.
- [x] Run targeted regressions, lint, typecheck, build and review the final diff.
- Delivery: normal commit/push, update the existing frontend draft PR and record the verified handoff.
