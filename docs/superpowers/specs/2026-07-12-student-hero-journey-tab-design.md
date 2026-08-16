# Student Profile Hero Journey Tab Redesign

## Goal

Redesign the Student Profile Hero Journey tab as a staff-facing, progress-first dashboard. It must make the student’s overall mission status, current blockers, rewards, and recent activity easy to understand from the progress endpoint while retaining authorized reward actions.

## Scope

The implementation targets `src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx` and its directly related supporting code only.

It consumes the existing student progress response from:

`GET /reinforcement/hero/students/{studentId}/progress?academicYearId={id}&termId={id}`

It continues to load the existing rewards endpoint for earned badges, XP activity, and quick-action mutations.

## Information Architecture

1. **Student progress summary**
   - Show the student’s Hero Journey summary first: completion rate, total missions, and counts for not started, in progress, completed, and cancelled missions.
   - Use a labeled segmented progress bar. Every segment has a text count, so status is not conveyed by color alone.
   - Show the active academic context when it is available.

2. **Permission-gated quick actions**
   - Place Grant XP and Award badge in the summary header.
   - Render each action only when the current user has its corresponding permission. Do not render disabled controls or permission-explanation UI.
   - Keep backend authorization authoritative. Mutation failures, including forbidden responses, appear as actionable inline feedback.
   - Grant XP opens a small modal/form with amount and optional reason. Award badge opens a focused badge-selection modal/form using available badge data if supported by the current UI contract; otherwise retain the current action payload behavior.
   - Successful mutations refresh both progress and rewards data.

3. **Mission progress**
   - Render responsive mission cards, sorted by last activity descending.
   - Each card includes localized title fallback, status pill, required objective completion, progress percent, XP reward, and optional badge reward thumbnail/name.
   - Progress bars expose accessible `role=progressbar` and numeric ARIA values.
   - When all required objectives are complete but the mission is still in progress, display an explicit attention callout: the work is complete but the mission awaits final completion.

4. **Recent activity**
   - Show a compact, newest-first event feed beside missions on wide screens and after missions on narrow screens.
   - Translate event types such as mission started and objective completed to clear labels and pair them with consistent Lucide icons.
   - Resolve mission IDs to mission titles; never show raw identifiers as the primary activity description.
   - Include localized relative time with an absolute timestamp tooltip.

5. **Rewards snapshot**
   - Display earned badge count and total Hero XP as supporting summary data.
   - Render earned badges and recent XP ledger entries only when present; preserve meaningful empty states.

## Visual and Responsive Design

- Follow the existing dashboard system: white cards, gray borders, high-contrast slate text, and 150–200ms color/opacity transitions.
- Use the current project’s Lucide icon set; do not use emoji icons.
- Mobile (375px): summary stacks, mission cards are single-column, activity follows mission cards, actions wrap without overflow.
- Tablet (768px): status metrics form a two- or four-column grid as space permits.
- Desktop (1024px+): mission area and activity feed use a two-column layout, with missions receiving more width.
- Support both English and Arabic through the existing locale utilities and translations.

## Data Mapping

- `summary` drives headline completion and status counts.
- `missions[]` drives cards, status, objective detail, rewards, timestamps, and mission-title lookup.
- `recentEvents[]` drives the activity feed.
- `badgeReward` is displayed per mission without assuming it was already earned.
- Rewards API data supplies the earned-badge and XP-ledger sections.

## States and Errors

- Use a layout-faithful loading skeleton.
- Show a recoverable error state with Retry when either initial request fails.
- Show an empty state when no missions exist for the active academic year/term.
- Validate quick-action inputs before mutation and retain the form state on failed submission.

## Permission Integration

Use the existing `usePermissions` hook and existing project permission keys/capabilities. Before implementation, identify the canonical Hero Journey mutation keys from the permission catalog; do not invent a new client-only authorization scheme.

## Verification

- Add or update unit/component tests for loading, error, empty, populated, action visibility, successful action refresh, and mutation error handling.
- Test the “objectives complete but mission still in progress” callout.
- Run the targeted test suite plus lint/type checks applicable to the changed files.
