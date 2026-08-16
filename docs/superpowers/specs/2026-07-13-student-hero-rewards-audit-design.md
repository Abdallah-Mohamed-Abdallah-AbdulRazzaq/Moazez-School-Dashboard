# Student Hero Journey Rewards Audit Design

## Goal

Redesign the Student Profile Hero Journey rewards experience as a staff-facing audit workspace. It must let authorized staff inspect reward coverage, diagnose missing mission rewards, and trace every XP grant or badge award to its source.

## Backend Contract

The screen consumes `GET /reinforcement/hero/students/{studentId}/rewards` with `academicYearId`, `yearId` (legacy alternative), `termId`, and optional `includeEvents` query parameters.

The response includes:

- `student`: id, names, code, admission number.
- `summary`: `totalHeroXp`, `badgesCount`, `completedMissions`, `xpGrantedMissions`, and `badgeAwardedMissions`.
- `xpLedger[]`: id, progress/mission references, source type, amount, localized reason, occurred-at timestamp, and actor user id.
- `badges[]`: earned badge records, linked mission/progress, full badge metadata, and earned-at timestamp.
- `missions[]`: each completed mission’s configured XP/badge values and whether each was actually awarded.
- `events[]`: optional Hero Journey event records, returned only when `includeEvents=true`.

The read endpoint requires `reinforcement.hero.progress.view`. Grant-XP and award-badge mutations require `reinforcement.hero.progress.manage`.

## Layout

1. **Rewards summary**
   - Present total Hero XP, badges earned, completed missions, XP coverage, and badge coverage.
   - Coverage is `awarded / completed`; show a numeric fraction plus a labeled progress bar.

2. **Mission reward reconciliation**
   - Use a responsive table/card list for completed missions.
   - Show completion date, configured XP, XP status, configured badge, badge status, and a direct link/anchor to its audit entry when available.
   - Treat “no reward configured” separately from “configured but not awarded.”

3. **Audit ledger**
   - Use a newest-first unified stream of XP and badge awards.
   - Each row identifies reward type/value, localized reason, mapped mission title, actor, and full timestamp with a relative-time helper.
   - When `includeEvents=true`, show supporting events only as contextual subtext; the ledger remains the primary audit record.

4. **Permission-gated actions**
   - Render Grant XP and Award Badge only when `reinforcement.hero.progress.manage` is granted.
   - Do not render disabled or explanatory mutation controls for unauthorized users.
   - Preserve form values and show an actionable inline error when a mutation fails. Refresh progress and rewards after success.

## States and Accessibility

- Render a structured skeleton for initial loading, an error card with Retry, and dedicated empty states for no completed missions and no reward history.
- Tables retain their column labels on desktop and become labeled card rows on small screens.
- Every status contains text as well as color. Progress indicators expose `role=progressbar` and numeric ARIA values.
- Use existing UI primitives, Lucide icons, and English/Arabic translations.

## Verification

- Test response normalization for every DTO collection, missing fields, and both reward-gap states.
- Test permission-hidden mutation actions, success refresh, and mutation failure retention.
- Test coverage math, audit ordering, mission resolution, loading/error/empty states, and responsive semantics.
