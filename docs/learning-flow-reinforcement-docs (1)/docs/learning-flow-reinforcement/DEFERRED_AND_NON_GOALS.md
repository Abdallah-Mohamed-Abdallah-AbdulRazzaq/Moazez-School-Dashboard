# Deferred Items and Non-Goals

## Deferred items

- Teacher manual XP bonus route.
- Parent proof download until a parent-authorized download contract is approved.
- Parent task mutations.
- Parent reward redemption mutation.
- Parent Hero mutations.
- Parent XP grant.
- Parent homework submit.
- Dashboard frontend final handoff if not covered by existing dashboard docs.
- OpenAPI-generated frontend client alignment.
- Reward fulfillment/admin workflow beyond existing core dashboard/admin Rewards flow if product wants more app-level integration.

## Non-goals

- Wallet behavior.
- Finance/cash/payment behavior.
- Marketplace behavior.
- XP spending/deduction for reward redemption.
- Converting Behavior points into XP.
- Raw object storage URL exposure.
- Route aliases solely to match ADR wording.
- App modules becoming persistence owners for Reinforcement, Rewards, Hero Journey, XP, Behavior, Students, Academics, or Files.
- Parent mutating teacher/school/system tasks.
- Student accessing another student's resources.
- Teacher XP subject scoping without source metadata.

## Backend-correct drift examples

- Teacher review uses `submissionId`, not `taskId + stageId`.
- Teacher `classId` can mean `TeacherSubjectAllocation.id` in Teacher App reinforcement/XP contexts.
- Parent XP uses `/parent/children/:studentId/progress/xp`, not a separate `/xp` alias.
- Parent task proof download is deferred even though proof metadata is visible.
- Reward redemption is request/status workflow and does not spend XP.
