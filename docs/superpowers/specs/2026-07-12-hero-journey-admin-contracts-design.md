# Hero Journey Admin Contract Wiring

## Goal

Wire every school-management Hero Journey contract exposed by the Moazez backend into the SIS dashboard. Replace frontend-derived progress placeholders with direct backend read models, while retaining the existing Overview and Missions routes.

## Scope

The backend exposes 25 Hero Journey endpoints. The existing dashboard already calls badge CRUD, mission CRUD plus publish/archive, overview, and map (14 endpoints). This work wires the remaining 11 endpoints:

- Student progress: list/detail and starting/completing missions or objectives.
- Rewards: XP grant, badge award, and student rewards.
- Dashboard drill-downs: stage, classroom, and badge summaries.

It also fixes the overview query mismatch: the frontend currently submits `gradeId`, which is not accepted by the backend overview DTO and is rejected by the backend validation pipe.

## Information Architecture

Keep the current routes:

- `/hero-journey`: executive overview and summary cards.
- `/hero-journey/missions`: mission and badge catalog management.

Add a `Hero Journey` tab to the existing Student Profile. The tab receives the profile student ID, loads direct progress and rewards only while active, and exposes state-valid actions: start mission, complete objective, complete mission, grant XP, and award badge. Reward mutations require a confirmation dialog and refresh the affected progress, rewards, and dashboard summaries.

Overview cards and filters expose stage, classroom, and badge drill-downs from their dedicated server endpoints. The frontend must not recreate those aggregates locally.

## Data Architecture

Split `heroJourneyService.ts` into narrowly scoped modules:

- `heroJourneyCatalogService`: badges and missions.
- `heroJourneyDashboardService`: overview, map, and summary drill-downs.
- `heroJourneyProgressService`: student progress/detail and progress mutations.
- `heroJourneyRewardsService`: rewards, XP grant, and badge award.

Each module uses backend DTO types and explicit view-model mappers. A mapper may format or localize values but must not synthesize authoritative fields (current level, mission, objectives, badges, streak, activity, etc.) when the API does not supply them. Query builders must only submit DTO-supported fields.

Mutations use server state as the authority. On success, refetch the detail resource and affected overview/summary resources. Preserve filters and selected student across refreshes when still valid.

## Permissions, Errors, and Accessibility

Backend permissions remain authoritative. The UI can hide unavailable controls based on the existing permission model, but each server rejection must produce an actionable error message. Do not optimistically alter completion, XP, or badge state before a successful response.

Use the existing Student Profile tab framework, tab loader, cards, buttons, dialogs, status pills, and loading/empty/error components. New Hero Journey tab content must follow these established interaction patterns, preserve accessible labels, non-color status indicators, keyboard-focusable controls, stable 150-300ms feedback, and responsive layouts at 375px, 768px, 1024px, and 1440px. Do not introduce a separate visual theme, typography system, or standalone operations UI.

## Acceptance Criteria

1. All 25 school-management Hero Journey contracts have a frontend service function and are reachable from an appropriate admin workflow; student-specific operations are reached from Student Profile's Hero Journey tab.
2. No Hero Journey screen derives student progress from `/overview` or displays fake progress values.
3. Overview requests never send unsupported `gradeId`; selecting a grade cannot cause a validation error.
4. Stage, classroom, and badge summary UI reads the matching backend endpoint.
5. State-changing operations show loading, success, and backend error states and refresh dependent data.
6. Unit tests cover request paths, query/body DTOs, mappers, mutations, and the grade regression; component tests cover the primary operations workflow and error states.

## Out of Scope

- Backend schema or contract changes.
- Changing backend permission rules.
- A global dashboard redesign.
- A standalone Hero Journey Operations route or dashboard workflow.
- Student, teacher, or parent app Hero Journey flows.
