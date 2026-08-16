# Learning Flow / Reinforcement Documentation Package

This package documents the implemented Moazez Backend Learning Flow, with a special focus on Reinforcement from commit `d46b19e2fe249197b68402a5789b376ebdfadb25` (`docs: lock reinforcement completion contract`) through the current documented baseline `252f9fa6fafc4b9ac79a325e2152dd0e54b6251d` (`docs: lock learning flow deferred decisions`).

The documentation is based on the implemented backend routes, closeout audits, controller inventory, source-of-truth boundaries, security posture, and accepted deferred items.

## Scope

Covered areas:

- Reinforcement core tasks, templates, reviews, submissions, and proof metadata.
- XP policy, XP ledger, review XP grant, and manual XP grant hardening.
- Rewards catalog and redemption lifecycle.
- Hero Journey badges, missions, progress, and app-facing actions.
- Teacher App tasks, review queue, and XP center.
- Student App tasks, task-stage submission, Hero actions, rewards, redemptions, and XP-backed progress.
- Parent App task/reinforcement reads, Hero reads, XP reads, rewards/redemption reads.
- Learning Flow frontend handoff rules.
- Security, tenancy, safe response, and no-leak rules.
- Deferred and non-goal decisions.
- API test inventory.

## Final status snapshot

| Area | Status |
| --- | --- |
| Sprint 26A contract lock | PASS; no runtime changes; target set to `V1_READY_FULL_APP_CONTRACT`. |
| Sprint 26B core hardening | PASS; core reinforcement policy hardened. |
| Sprint 26C Teacher reinforcement | PASS; ready except Teacher manual XP bonus route deferred. |
| Sprint 26D Student task submission | PASS; current-student-only task-stage submission implemented. |
| Sprint 26E Student Hero actions | PASS; start/complete/objective-complete implemented through core. |
| Sprint 26F Student rewards/redemptions | PASS; student rewards catalog/read/redeem implemented. |
| Sprint 26G Parent Hero/XP/Rewards reads | PASS; parent child-scoped reads implemented. |
| Sprint 26H Parent task/reinforcement reads | PASS; reads hardened, proof download deferred. |
| Sprint 26I Parent Learning Flow closeout | PASS; parent learning flow backend ready. |
| Sprint 26J frontend handoff | PASS; frontend contract ready with deferred items. |

## Recommended reading order

1. `OVERVIEW.md`
2. `SPRINT_26_CHANGELOG.md`
3. `SOURCE_OF_TRUTH.md`
4. `CORE_REINFORCEMENT.md`
5. `CORE_XP.md`
6. `CORE_REWARDS.md`
7. `CORE_HERO_JOURNEY.md`
8. `TEACHER_APP_REINFORCEMENT.md`
9. `STUDENT_APP_REINFORCEMENT.md`
10. `PARENT_APP_LEARNING_FLOW.md`
11. `SECURITY_TENANCY_PERMISSIONS.md`
12. `FILE_PROOF_AND_SAFE_RESPONSES.md`
13. `FRONTEND_HANDOFF.md`
14. `DEFERRED_AND_NON_GOALS.md`
15. `API_REFERENCE.md`
16. `TESTING_GUIDE.md`
17. `API_TESTS.http`
