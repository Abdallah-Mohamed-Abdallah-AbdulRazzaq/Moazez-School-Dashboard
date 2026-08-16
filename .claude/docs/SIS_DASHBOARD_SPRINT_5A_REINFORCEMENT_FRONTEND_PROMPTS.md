# SIS Dashboard — Sprint 5A Reinforcement Frontend Implementation Prompts

**Purpose:** This file contains ready-to-send prompts for an AI developer/Codex agent to implement Sprint 5A frontend support in the `sis_dashboard` repository.

**Sprint:** 5A — Reinforcement Foundation  
**Frontend target:** `sis_dashboard`  
**Backend base API:** `/api/v1`  
**Main module:** Reinforcement / التحفيز

---

## Source-of-truth summary for the AI developer

Implement the frontend for Sprint 5A only.

Sprint 5A covers:

1. Reinforcement overview.
2. Reinforcement templates.
3. Reinforcement tasks.
4. Task duplicate.
5. Task cancel.
6. XP policies.
7. Effective XP policy.
8. Manual XP grant.
9. XP ledger.
10. XP summary.
11. Student reinforcement progress.
12. Classroom reinforcement summary.

Do **not** implement the full review approval flow yet. Do **not** implement Hero Journey. Do **not** implement Rewards catalog/redemption. Those are out of scope for Sprint 5A.

Reason: the review submit endpoint requires `assignmentId`, but the current task response only exposes `assignmentSummary`, not assignment IDs.

---

## Known backend endpoints to integrate

### Auth / context dependency

These likely already exist in the repo and should be reused:

```text
POST /auth/login
GET  /auth/me

GET  /academics/structure/years
GET  /academics/structure/terms
GET  /academics/structure/tree

POST /academics/subjects
POST /students-guardians/students
POST /students-guardians/enrollments
```

Do not rebuild the existing academic/student modules unless missing. Prefer existing selectors/services.

### Templates

```text
GET  /reinforcement/templates
POST /reinforcement/templates
```

### Tasks

```text
GET  /reinforcement/filter-options
GET  /reinforcement/tasks
POST /reinforcement/tasks
GET  /reinforcement/tasks/:taskId
POST /reinforcement/tasks/:taskId/duplicate
POST /reinforcement/tasks/:taskId/cancel
```

### XP

```text
GET   /reinforcement/xp/policies
GET   /reinforcement/xp/policies/effective
POST  /reinforcement/xp/policies
PATCH /reinforcement/xp/policies/:policyId

POST /reinforcement/xp/grants/manual
GET  /reinforcement/xp/ledger
GET  /reinforcement/xp/summary
```

### Overview

```text
GET /reinforcement/overview
GET /reinforcement/students/:studentId/progress
GET /reinforcement/classrooms/:classroomId/summary
```

---

## Permissions to wire into the UI

Use the existing permissions system. If the repo has a `usePermissions` hook or route guard, reuse it.

```text
reinforcement.templates.view
reinforcement.templates.manage
reinforcement.tasks.view
reinforcement.tasks.manage
reinforcement.xp.view
reinforcement.xp.manage
reinforcement.overview.view
```

Suggested mapping:

```text
Overview page -> reinforcement.overview.view
Templates list -> reinforcement.templates.view
Templates create -> reinforcement.templates.manage
Tasks list/detail -> reinforcement.tasks.view
Task create/duplicate/cancel -> reinforcement.tasks.manage
XP policies/ledger/summary view -> reinforcement.xp.view
XP policy create/patch/manual grant -> reinforcement.xp.manage
```

---

## Required enum values

```ts
type ReinforcementSource = "teacher" | "parent" | "system";

type ReinforcementRewardType =
  | "xp"
  | "badge"
  | "moral"
  | "financial";

type ReinforcementProofType =
  | "none"
  | "image"
  | "video"
  | "document";

type ReinforcementTargetScope =
  | "school"
  | "stage"
  | "grade"
  | "section"
  | "classroom"
  | "student";
```

---

## Critical implementation rule about dates

Do **not** hardcode the Postman dates from the package, because they may already be in the past.

Default frontend task due date should be calculated dynamically:

```text
today + 7 days
```

Duplicate task due date should also default to a future date unless the user explicitly picks a date.

---

## Required frontend route plan

Add routes under the existing dashboard app structure.

Expected routes:

```text
src/app/[lang]/(dashboard)/reinforcement/page.tsx
src/app/[lang]/(dashboard)/reinforcement/templates/page.tsx
src/app/[lang]/(dashboard)/reinforcement/tasks/page.tsx
src/app/[lang]/(dashboard)/reinforcement/tasks/new/page.tsx
src/app/[lang]/(dashboard)/reinforcement/tasks/[taskId]/page.tsx
src/app/[lang]/(dashboard)/reinforcement/xp/policies/page.tsx
src/app/[lang]/(dashboard)/reinforcement/xp/ledger/page.tsx
src/app/[lang]/(dashboard)/reinforcement/students/[studentId]/progress/page.tsx
src/app/[lang]/(dashboard)/reinforcement/classrooms/[classroomId]/summary/page.tsx
```

If the repo uses a slightly different route grouping convention, follow the existing convention exactly and document the difference in the final report.

---

## Required feature folder plan

Add:

```text
src/features/reinforcement/
  types.ts

  services/
    reinforcementTemplatesService.ts
    reinforcementTasksService.ts
    reinforcementXpService.ts
    reinforcementOverviewService.ts
    reinforcementFilterOptionsService.ts

  pages/
    ReinforcementOverviewPage.tsx
    ReinforcementTemplatesPage.tsx
    ReinforcementTasksPage.tsx
    ReinforcementTaskCreatePage.tsx
    ReinforcementTaskDetailPage.tsx
    ReinforcementXpPoliciesPage.tsx
    ReinforcementXpLedgerPage.tsx
    StudentReinforcementProgressPage.tsx
    ClassroomReinforcementSummaryPage.tsx

  components/
    ReinforcementAcademicContextFilter.tsx
    ReinforcementMetricCards.tsx
    ReinforcementTemplateForm.tsx
    ReinforcementTemplateTable.tsx
    ReinforcementTaskTable.tsx
    ReinforcementTaskForm.tsx
    ReinforcementTaskTargetSelector.tsx
    ReinforcementTaskStagesEditor.tsx
    ReinforcementTaskDuplicateModal.tsx
    ReinforcementTaskCancelModal.tsx
    XpPolicyForm.tsx
    XpPolicyTable.tsx
    ManualXpGrantModal.tsx
    XpLedgerTable.tsx
    StudentProgressCard.tsx
    ClassroomSummaryPanel.tsx

  __tests__/
    reinforcementServices.test.ts
    taskPayloadMapper.test.ts
    xpPolicyMapper.test.ts
```

If the repo already has equivalent shared components, reuse them instead of duplicating.

---

# PROMPT 0 — Repository audit before coding

Send this first.

```text
You are working inside the `sis_dashboard` frontend repository.

Goal:
Audit the repo structure before implementing Sprint 5A Reinforcement frontend.

Do not implement code yet. First inspect the repository and report the exact existing conventions for:

1. App route structure under `src/app`.
2. Dashboard layout route grouping.
3. Feature module structure under `src/features`.
4. Existing API helper location and usage pattern.
5. Auth/session handling.
6. Permissions/role guard implementation.
7. Navigation/sidebar configuration.
8. Translation/i18n setup for English and Arabic.
9. Existing academic year/term/classroom/student/subject selectors or services.
10. Existing table/form/modal components.
11. Existing test setup: Vitest, React Testing Library, Playwright, MSW, or equivalent.
12. Existing lint/build/typecheck commands from `package.json`.

Sprint 5A frontend scope:
- Reinforcement Overview
- Templates
- Tasks
- Task duplicate
- Task cancel
- XP policies
- Manual XP grant
- XP ledger/summary
- Student progress
- Classroom summary

Out of scope:
- Full review approval flow
- Hero Journey
- Rewards catalog/redemptions
- Backend changes unless the frontend cannot compile without a type/API mismatch

Backend endpoints to integrate:
- GET/POST `/reinforcement/templates`
- GET `/reinforcement/filter-options`
- GET/POST `/reinforcement/tasks`
- GET `/reinforcement/tasks/:taskId`
- POST `/reinforcement/tasks/:taskId/duplicate`
- POST `/reinforcement/tasks/:taskId/cancel`
- GET/POST/PATCH `/reinforcement/xp/policies`
- GET `/reinforcement/xp/policies/effective`
- POST `/reinforcement/xp/grants/manual`
- GET `/reinforcement/xp/ledger`
- GET `/reinforcement/xp/summary`
- GET `/reinforcement/overview`
- GET `/reinforcement/students/:studentId/progress`
- GET `/reinforcement/classrooms/:classroomId/summary`

Important:
Do not hardcode stale dates from the Postman collection. Use a dynamic default due date of today + 7 days.

Deliverable:
Return an audit report with:
- Existing repo conventions found
- Files that need to be created
- Files that need to be modified
- Any missing shared services/components
- Risks/blockers
- Exact implementation order
Do not write code until the audit report is complete.
```

---

# PROMPT 1 — Implement types and API service layer

Send this after Prompt 0 audit is accepted.

```text
Implement Sprint 5A Reinforcement frontend service layer and types.

Follow the repo conventions discovered in the audit. Use existing API helpers only. Do not introduce a new HTTP client if the repo already has one.

Create or update:

1. `src/features/reinforcement/types.ts`
2. `src/features/reinforcement/services/reinforcementTemplatesService.ts`
3. `src/features/reinforcement/services/reinforcementTasksService.ts`
4. `src/features/reinforcement/services/reinforcementXpService.ts`
5. `src/features/reinforcement/services/reinforcementOverviewService.ts`
6. `src/features/reinforcement/services/reinforcementFilterOptionsService.ts`

Required enums:

- `ReinforcementSource = "teacher" | "parent" | "system"`
- `ReinforcementRewardType = "xp" | "badge" | "moral" | "financial"`
- `ReinforcementProofType = "none" | "image" | "video" | "document"`
- `ReinforcementTargetScope = "school" | "stage" | "grade" | "section" | "classroom" | "student"`

Required API methods:

Templates:
- `listReinforcementTemplates(params)`
- `createReinforcementTemplate(payload)`

Tasks:
- `getReinforcementFilterOptions(params)`
- `listReinforcementTasks(params)`
- `createReinforcementTask(payload)`
- `getReinforcementTask(taskId)`
- `duplicateReinforcementTask(taskId, payload)`
- `cancelReinforcementTask(taskId, payload)`

XP:
- `listXpPolicies(params)`
- `getEffectiveXpPolicy(params)`
- `createXpPolicy(payload)`
- `patchXpPolicy(policyId, payload)`
- `grantManualXp(payload)`
- `listXpLedger(params)`
- `getXpSummary(params)`

Overview:
- `getReinforcementOverview(params)`
- `getStudentReinforcementProgress(studentId, params)`
- `getClassroomReinforcementSummary(classroomId, params)`

Rules:
1. All functions must use existing auth/session handling.
2. All request/response types must be exported.
3. Do not invent fake endpoints.
4. Do not implement review, hero, or rewards APIs.
5. Add safe handling for both wrapped list responses `{ items: [] }` and plain array responses if the existing codebase uses that convention.
6. Add unit tests for URL building and payload mapping if the repo has service tests.

Acceptance gates:
- TypeScript passes.
- Existing tests still pass.
- New service tests pass if test framework exists.
- No duplicate API client created.
- No backend code changed.
Return changed files and verification commands/results.
```

---

# PROMPT 2 — Add navigation, permissions, and translations

Send this after service layer is accepted.

```text
Add Sprint 5A Reinforcement navigation, permissions, and translations.

Follow existing `sis_dashboard` conventions for:
- sidebar/navigation config
- permission guards
- route visibility
- next-intl or existing i18n structure
- English and Arabic labels

Add navigation group:

Reinforcement / التحفيز

Children:
1. Overview / النظرة العامة
2. Templates / القوالب
3. Tasks / المهام
4. XP Policies / سياسات النقاط
5. XP Ledger / سجل النقاط

Permission mapping:
- Overview page: `reinforcement.overview.view`
- Templates list: `reinforcement.templates.view`
- Templates create action: `reinforcement.templates.manage`
- Tasks list/detail: `reinforcement.tasks.view`
- Task create/duplicate/cancel actions: `reinforcement.tasks.manage`
- XP policies/ledger/summary view: `reinforcement.xp.view`
- XP policy create/patch/manual grant actions: `reinforcement.xp.manage`

Required translation groups:
- `reinforcement.nav.*`
- `reinforcement.overview.*`
- `reinforcement.templates.*`
- `reinforcement.tasks.*`
- `reinforcement.xp.*`
- `reinforcement.common.*`
- `reinforcement.validation.*`
- `reinforcement.emptyStates.*`
- `reinforcement.actions.*`

Rules:
1. Arabic must be real Arabic, not English copied into Arabic files.
2. Do not expose nav items to users without the matching permission.
3. Do not break existing navigation.
4. If permissions are not yet present in seed/backend, keep the frontend checks prepared and document how the backend should provide them.
5. Do not implement pages yet unless route placeholders are required to compile.

Acceptance gates:
- Navigation renders without breaking existing sidebar.
- English and Arabic routes compile.
- Permission-hidden actions are not visible to unauthorized users.
- TypeScript/build passes.
Return changed files and verification commands/results.
```

---

# PROMPT 3 — Add shared academic/student context selectors

Send this after nav/i18n is accepted.

```text
Implement reusable Reinforcement context selector components.

Goal:
The user must not manually paste IDs. The UI must reuse or wrap existing academic/student selectors.

Create:

- `src/features/reinforcement/components/ReinforcementAcademicContextFilter.tsx`
- `src/features/reinforcement/components/ReinforcementTaskTargetSelector.tsx`

Reuse existing services/components where available for:
- academic year
- term
- stage
- grade
- section
- classroom
- subject
- student search/select
- enrollment lookup/selection

Required behavior:
1. Academic year selector.
2. Term selector depending on academic year.
3. Classroom chain selector if existing tree service is available.
4. Subject selector.
5. Student selector.
6. Target scope selector:
   - school
   - stage
   - grade
   - section
   - classroom
   - student
7. For Sprint 5A, optimize the create-task default target scope to `student`.
8. Expose selected values to parent forms as typed data.
9. Show loading, empty, and error states.
10. Work in English and Arabic.
11. Respect RTL layout.

Rules:
- Do not create new academic/student APIs if existing ones already exist.
- Do not hardcode IDs.
- Do not create fake options.
- If a dependency service is missing, implement only a thin wrapper around the documented backend endpoint and document it.

Acceptance gates:
- Components compile.
- Components can be rendered in isolation/unit tests.
- No manual ID entry is required for normal use.
- Arabic layout does not break.
Return changed files and verification commands/results.
```

---

# PROMPT 4 — Implement Reinforcement Overview pages

Send this after context selectors are accepted.

```text
Implement Sprint 5A Reinforcement Overview UI.

Routes:
- `/[lang]/reinforcement`
- `/[lang]/reinforcement/students/[studentId]/progress`
- `/[lang]/reinforcement/classrooms/[classroomId]/summary`

Use the actual route grouping convention in the repo, likely:
- `src/app/[lang]/(dashboard)/reinforcement/page.tsx`
- `src/app/[lang]/(dashboard)/reinforcement/students/[studentId]/progress/page.tsx`
- `src/app/[lang]/(dashboard)/reinforcement/classrooms/[classroomId]/summary/page.tsx`

Create or update:
- `src/features/reinforcement/pages/ReinforcementOverviewPage.tsx`
- `src/features/reinforcement/pages/StudentReinforcementProgressPage.tsx`
- `src/features/reinforcement/pages/ClassroomReinforcementSummaryPage.tsx`
- `src/features/reinforcement/components/ReinforcementMetricCards.tsx`
- `src/features/reinforcement/components/StudentProgressCard.tsx`
- `src/features/reinforcement/components/ClassroomSummaryPanel.tsx`

Endpoints:
- `GET /reinforcement/overview`
- `GET /reinforcement/students/:studentId/progress`
- `GET /reinforcement/classrooms/:classroomId/summary`

Required UI:
1. Academic year and term filters.
2. Classroom filter for overview if applicable.
3. Metric cards.
4. Recent/summary sections based on returned data.
5. Student progress details.
6. Classroom summary details.
7. Loading/error/empty states.
8. Refresh action.
9. Permission guard using `reinforcement.overview.view`.

Rules:
- Do not assume exact backend metric names beyond typed optional fields. Render defensively.
- Do not crash if backend returns empty arrays or missing optional metrics.
- Do not implement Hero Journey or Rewards panels.
- Do not implement review approval flow.

Acceptance gates:
- Overview route compiles and renders.
- Student progress route compiles and renders.
- Classroom summary route compiles and renders.
- Loading, empty, and error states are implemented.
- English and Arabic work.
- Build/typecheck passes.
Return changed files and verification commands/results.
```

---

# PROMPT 5 — Implement Templates UI

Send this after Overview is accepted.

```text
Implement Sprint 5A Reinforcement Templates frontend.

Route:
- `/[lang]/reinforcement/templates`

Create or update:
- `src/app/[lang]/(dashboard)/reinforcement/templates/page.tsx`
- `src/features/reinforcement/pages/ReinforcementTemplatesPage.tsx`
- `src/features/reinforcement/components/ReinforcementTemplateTable.tsx`
- `src/features/reinforcement/components/ReinforcementTemplateForm.tsx`

Endpoints:
- `GET /reinforcement/templates`
- `POST /reinforcement/templates`

Template create payload must support:
- `nameEn`
- `nameAr`
- `descriptionEn`
- `descriptionAr` if supported by current DTO
- `source`
- `rewardType`
- `rewardValue`
- `rewardLabelEn`
- `rewardLabelAr` if supported by current DTO
- `stages[]`

Stage fields:
- `sortOrder`
- `titleEn`
- `titleAr`
- `descriptionEn`
- `descriptionAr` if supported
- `proofType`
- `requiresApproval`

Enums:
- source: teacher | parent | system
- rewardType: xp | badge | moral | financial
- proofType: none | image | video | document

Required UI:
1. Search templates.
2. Templates table/cards.
3. Create template modal/drawer/page.
4. Dynamic stages editor.
5. Reward section.
6. Proof type selector.
7. Requires approval toggle.
8. Bilingual fields.
9. Success toast and list refresh.
10. Loading/error/empty states.
11. Permission:
    - list requires `reinforcement.templates.view`
    - create requires `reinforcement.templates.manage`

Rules:
- Do not implement update/delete unless endpoint already exists and is documented in repo.
- Do not invent backend fields.
- Validate that at least one stage exists.
- Validate that at least one title field is provided according to backend rules.
- Do not hardcode test data.

Acceptance gates:
- Template list works.
- Create template builds correct payload.
- New template appears after refresh.
- English and Arabic labels are present.
- TypeScript/build/tests pass.
Return changed files and verification commands/results.
```

---

# PROMPT 6 — Implement Tasks UI

Send this after Templates UI is accepted.

```text
Implement Sprint 5A Reinforcement Tasks frontend.

Routes:
- `/[lang]/reinforcement/tasks`
- `/[lang]/reinforcement/tasks/new`
- `/[lang]/reinforcement/tasks/[taskId]`

Create or update:
- `src/app/[lang]/(dashboard)/reinforcement/tasks/page.tsx`
- `src/app/[lang]/(dashboard)/reinforcement/tasks/new/page.tsx`
- `src/app/[lang]/(dashboard)/reinforcement/tasks/[taskId]/page.tsx`
- `src/features/reinforcement/pages/ReinforcementTasksPage.tsx`
- `src/features/reinforcement/pages/ReinforcementTaskCreatePage.tsx`
- `src/features/reinforcement/pages/ReinforcementTaskDetailPage.tsx`
- `src/features/reinforcement/components/ReinforcementTaskTable.tsx`
- `src/features/reinforcement/components/ReinforcementTaskForm.tsx`
- `src/features/reinforcement/components/ReinforcementTaskStagesEditor.tsx`
- `src/features/reinforcement/components/ReinforcementTaskDuplicateModal.tsx`
- `src/features/reinforcement/components/ReinforcementTaskCancelModal.tsx`

Endpoints:
- `GET /reinforcement/filter-options`
- `GET /reinforcement/tasks`
- `POST /reinforcement/tasks`
- `GET /reinforcement/tasks/:taskId`
- `POST /reinforcement/tasks/:taskId/duplicate`
- `POST /reinforcement/tasks/:taskId/cancel`

Create task payload must support:
- `academicYearId`
- `yearId` if backend compatibility requires it
- `termId`
- `subjectId`
- `titleEn`
- `titleAr`
- `descriptionEn`
- `descriptionAr` if supported
- `source`
- `rewardType`
- `rewardValue`
- `rewardLabelEn`
- `rewardLabelAr` if supported
- `dueDate`
- `assignedById`
- `assignedByName`
- `targets[]`
- `stages[]`

Targets:
- `scopeType`
- `scopeId`

Stages:
- `sortOrder`
- `titleEn`
- `titleAr`
- `descriptionEn`
- `descriptionAr` if supported
- `proofType`
- `requiresApproval`

Required UI:
1. Task list with filters:
   - academic year
   - term
   - subject
   - student
   - classroom
   - status if supported
   - include cancelled toggle
2. Create task form.
3. Default target scope should be `student`.
4. Dynamic stages editor.
5. Default due date should be today + 7 days.
6. Task detail page.
7. Duplicate task modal:
   - title override
   - due date override defaulting to future date
8. Cancel task modal:
   - reason required
9. Assignment summary display if returned.
10. Success/error toasts.
11. Loading/error/empty states.
12. Permissions:
   - list/detail requires `reinforcement.tasks.view`
   - create/duplicate/cancel requires `reinforcement.tasks.manage`

Rules:
- Do not hardcode stale Postman due dates.
- Do not implement assignment stage submission or review approval.
- Do not assume task response includes assignment IDs.
- Do not invent update/delete endpoints.
- Do not allow cancelling an already-cancelled task from UI; disable/hide cancel action.
- Do not allow duplicate targets in the UI payload.
- Show backend validation errors clearly.

Acceptance gates:
- Task list renders.
- Create student-targeted task works.
- Duplicate task works and returns a new task.
- Cancel duplicate task works.
- Already-cancelled task cannot be cancelled again from the UI.
- Arabic layout works.
- TypeScript/build/tests pass.
Return changed files and verification commands/results.
```

---

# PROMPT 7 — Implement XP Policies, Manual XP Grant, Ledger, and Summary

Send this after Tasks UI is accepted.

```text
Implement Sprint 5A XP frontend.

Routes:
- `/[lang]/reinforcement/xp/policies`
- `/[lang]/reinforcement/xp/ledger`

Create or update:
- `src/app/[lang]/(dashboard)/reinforcement/xp/policies/page.tsx`
- `src/app/[lang]/(dashboard)/reinforcement/xp/ledger/page.tsx`
- `src/features/reinforcement/pages/ReinforcementXpPoliciesPage.tsx`
- `src/features/reinforcement/pages/ReinforcementXpLedgerPage.tsx`
- `src/features/reinforcement/components/XpPolicyForm.tsx`
- `src/features/reinforcement/components/XpPolicyTable.tsx`
- `src/features/reinforcement/components/ManualXpGrantModal.tsx`
- `src/features/reinforcement/components/XpLedgerTable.tsx`

Endpoints:
- `GET /reinforcement/xp/policies`
- `GET /reinforcement/xp/policies/effective`
- `POST /reinforcement/xp/policies`
- `PATCH /reinforcement/xp/policies/:policyId`
- `POST /reinforcement/xp/grants/manual`
- `GET /reinforcement/xp/ledger`
- `GET /reinforcement/xp/summary`

XP policy create payload must support:
- `academicYearId`
- `yearId` if backend compatibility requires it
- `termId`
- `scopeType`
- `scopeId`
- `dailyCap`
- `weeklyCap`
- `cooldownMinutes`
- `allowedReasons`
- `startsAt`
- `endsAt`
- `isActive`

Manual XP grant payload must support:
- `academicYearId`
- `yearId` if backend compatibility requires it
- `termId`
- `studentId`
- `enrollmentId`
- `amount`
- `reason`
- `reasonAr`
- `sourceId`
- `dedupeKey`

Required UI:
1. XP policy list with filters:
   - term
   - scope type
   - scope key/student
   - active status
2. Create XP policy form.
3. Patch caps action:
   - daily cap
   - weekly cap
   - cooldown minutes
4. Effective policy lookup for selected student.
5. XP ledger table.
6. XP summary panel/card.
7. Manual XP grant modal.
8. Allowed reasons input.
9. Dedupe key generated client-side if user does not provide one.
10. Clear backend validation errors:
    - disallowed reason
    - cap exceeded
    - duplicate dedupe key
    - missing effective policy
11. Permissions:
    - view requires `reinforcement.xp.view`
    - create/patch/manual grant requires `reinforcement.xp.manage`

Rules:
- Do not create XP grants without selected student and enrollment.
- Do not manually paste student/enrollment IDs in normal flow; use selectors/resolvers.
- Do not invent reward redemption screens.
- Do not implement Rewards module.
- Do not suppress backend errors.

Acceptance gates:
- XP policies list renders.
- Create XP policy works.
- Patch caps works.
- Effective policy lookup works.
- Manual XP grant works.
- Ledger refreshes after manual grant.
- Summary refreshes after manual grant.
- Arabic layout works.
- TypeScript/build/tests pass.
Return changed files and verification commands/results.
```

---

# PROMPT 8 — Add tests and final hardening

Send this after all pages are implemented.

```text
Add Sprint 5A frontend tests and hardening.

Scope:
Test the Reinforcement frontend module implemented in previous steps.

Add/extend unit tests:
- service URL building
- request payload mapping
- enum rendering
- target duplicate prevention
- default due date = today + 7 days
- XP policy patch payload
- manual XP grant payload
- permission-hidden actions
- empty/error states where practical

Add/extend Playwright or E2E tests if the repo has Playwright:
- `/en/reinforcement` loads
- `/ar/reinforcement` loads with RTL
- templates list renders
- create template flow calls correct endpoint
- tasks list renders
- create task flow calls correct endpoint
- duplicate task flow calls correct endpoint
- cancel task flow calls correct endpoint
- XP policies page renders
- manual XP grant flow calls correct endpoint
- ledger/summary render returned values

Use mocks/MSW if that is the existing repo convention. Do not require a real backend for frontend unit tests unless the repo already uses integration tests.

Hardening requirements:
1. No stale hardcoded Postman dates.
2. No fake assignment IDs.
3. No review approval UI.
4. No Hero Journey UI.
5. No Rewards UI.
6. No duplicate HTTP client.
7. No broken Arabic layout.
8. No permission leakage for manage actions.
9. No console errors in happy-path E2E.
10. No TypeScript `any` unless unavoidable and justified in comments.

Run:
- install command only if needed
- lint
- typecheck
- unit tests
- e2e tests if available
- production build

Return a final report with:
- Execution summary
- Files created
- Files modified
- Routes added
- API endpoints integrated
- Permissions wired
- Translations added
- Tests added
- Verification commands and exact results
- Known limitations
- Out-of-scope items confirmed untouched
```

---

# PROMPT 9 — Final acceptance audit prompt

Send this after Codex claims it is done.

```text
Perform a strict final acceptance audit for the Sprint 5A Reinforcement frontend implementation.

Do not add features. Audit only, then fix defects found within Sprint 5A scope.

Check all of the following:

1. The Reinforcement module exists under the repo's correct feature structure.
2. All required routes exist and compile:
   - overview
   - templates
   - tasks
   - task create
   - task detail
   - XP policies
   - XP ledger
   - student progress
   - classroom summary
3. All Sprint 5A endpoints are integrated:
   - templates
   - filter-options
   - tasks
   - duplicate
   - cancel
   - XP policies
   - effective XP policy
   - manual XP grant
   - XP ledger
   - XP summary
   - overview
   - student progress
   - classroom summary
4. No out-of-scope modules were implemented:
   - no Hero Journey
   - no Rewards catalog/redemptions
   - no full review approval flow
   - no assignment stage submit UI
5. No fake assignment ID logic exists.
6. No stale hardcoded due dates exist.
7. Default due date is dynamic future date.
8. Existing API helper is reused.
9. Existing auth/session flow is reused.
10. Existing permission system is reused.
11. Manage actions are hidden/disabled without manage permissions.
12. English translations exist.
13. Arabic translations exist and render correctly in RTL.
14. Loading states exist.
15. Empty states exist.
16. Error states exist.
17. Backend validation errors are visible to the user.
18. Duplicate target prevention exists in task form.
19. Already-cancelled tasks cannot be cancelled again from UI.
20. Manual XP grant requires selected student and enrollment.
21. XP ledger and summary refresh after grant.
22. TypeScript passes.
23. Lint passes.
24. Unit tests pass.
25. E2E tests pass if available.
26. Production build passes.

Return final audit report in this format:

# Sprint 5A Reinforcement Frontend — Final Audit

## 1. Final Status
PASS / FAIL

## 2. Completion Percentage
Give a realistic percentage.

## 3. Files Created

## 4. Files Modified

## 5. Routes Verified

## 6. API Endpoints Verified

## 7. Permission Gates Verified

## 8. English/Arabic Translation Verification

## 9. Test Results
Include exact commands and outputs.

## 10. Defects Found and Fixed

## 11. Remaining Limitations
Only include true limitations. Do not hide out-of-scope items.

## 12. Out-of-Scope Confirmation
Confirm review approval, Hero Journey, and Rewards were not implemented.

## 13. Recommendation
State whether this frontend is ready for backend-connected Sprint 5A testing.
```

---

# Single all-in-one prompt if you want to send one large instruction instead of phases

Use this only if you want the AI developer to perform the whole job in one pass.

```text
You are working inside the `sis_dashboard` frontend repository.

Implement Sprint 5A Reinforcement frontend support end-to-end, following the existing repo conventions exactly.

Before coding:
1. Audit app route structure.
2. Audit feature folder conventions.
3. Audit API helper usage.
4. Audit auth/session/permission handling.
5. Audit navigation config.
6. Audit i18n setup for English/Arabic.
7. Audit existing academic/student/subject selectors.
8. Audit test setup and package scripts.

Then implement only Sprint 5A:

Covered:
- Reinforcement overview
- Templates
- Tasks
- Task duplicate
- Task cancel
- XP policies
- Effective XP policy
- Manual XP grant
- XP ledger
- XP summary
- Student progress
- Classroom summary

Out of scope:
- Full review approval flow
- Assignment stage submission UI
- Hero Journey
- Rewards catalog/redemptions

Backend endpoints:
- GET/POST `/reinforcement/templates`
- GET `/reinforcement/filter-options`
- GET/POST `/reinforcement/tasks`
- GET `/reinforcement/tasks/:taskId`
- POST `/reinforcement/tasks/:taskId/duplicate`
- POST `/reinforcement/tasks/:taskId/cancel`
- GET/POST/PATCH `/reinforcement/xp/policies`
- GET `/reinforcement/xp/policies/effective`
- POST `/reinforcement/xp/grants/manual`
- GET `/reinforcement/xp/ledger`
- GET `/reinforcement/xp/summary`
- GET `/reinforcement/overview`
- GET `/reinforcement/students/:studentId/progress`
- GET `/reinforcement/classrooms/:classroomId/summary`

Add routes:
- `/[lang]/reinforcement`
- `/[lang]/reinforcement/templates`
- `/[lang]/reinforcement/tasks`
- `/[lang]/reinforcement/tasks/new`
- `/[lang]/reinforcement/tasks/[taskId]`
- `/[lang]/reinforcement/xp/policies`
- `/[lang]/reinforcement/xp/ledger`
- `/[lang]/reinforcement/students/[studentId]/progress`
- `/[lang]/reinforcement/classrooms/[classroomId]/summary`

Add feature module:
- `src/features/reinforcement/types.ts`
- service files for templates/tasks/xp/overview/filter-options
- page components
- shared components
- tests

Enums:
- source: teacher | parent | system
- rewardType: xp | badge | moral | financial
- proofType: none | image | video | document
- target scope: school | stage | grade | section | classroom | student

Permissions:
- `reinforcement.templates.view`
- `reinforcement.templates.manage`
- `reinforcement.tasks.view`
- `reinforcement.tasks.manage`
- `reinforcement.xp.view`
- `reinforcement.xp.manage`
- `reinforcement.overview.view`

Critical rules:
1. Reuse existing API helper. Do not create duplicate HTTP clients.
2. Reuse existing auth/session flow.
3. Reuse existing permissions hook/guard.
4. Reuse existing navigation/i18n conventions.
5. Reuse existing academic/student/subject selectors when available.
6. Do not hardcode stale Postman due dates. Default due date = today + 7 days.
7. Do not create fake assignment IDs.
8. Do not implement review approval flow.
9. Do not implement Hero Journey.
10. Do not implement Rewards.
11. Do not invent backend endpoints.
12. Do not require users to paste IDs manually in normal flow.
13. Support English and Arabic.
14. Preserve RTL layout.
15. Show loading, empty, and error states.
16. Display backend validation errors.

Acceptance gates:
- TypeScript passes.
- Lint passes.
- Unit tests pass.
- E2E tests pass if available.
- Production build passes.
- Existing screens are not broken.
- New navigation works.
- Permissions hide/manage actions correctly.
- Arabic routes render correctly.
- All integrated endpoints are covered by services and UI paths.

Final report format:
# Sprint 5A Reinforcement Frontend Implementation Report

## 1. Execution Summary
## 2. Files Created
## 3. Files Modified
## 4. Routes Added
## 5. API Endpoints Integrated
## 6. Permissions Wired
## 7. Translations Added
## 8. Tests Added
## 9. Verification Commands and Results
## 10. Known Limitations
## 11. Out-of-Scope Confirmation
## 12. Final Recommendation
```

---

# My recommended sending order

Use the prompts in this order:

```text
Prompt 0  -> audit only
Prompt 1  -> types/services
Prompt 2  -> nav/permissions/i18n
Prompt 3  -> selectors
Prompt 4  -> overview
Prompt 5  -> templates
Prompt 6  -> tasks
Prompt 7  -> XP
Prompt 8  -> tests/hardening
Prompt 9  -> final audit
```

Do not send the all-in-one prompt unless you want a larger, riskier implementation pass.
