# Dashboard Performance Optimization Implementation Plan

> **For agentic workers:** Implement the tasks in order with a review after each task. Steps use checkbox (`- [ ]`) syntax for tracking. No subagent delegation is required.

**Goal:** Reduce avoidable dashboard requests and improve time to useful content without changing dashboard data or permissions.

**Architecture:** Keep the existing service functions and permission guards. Separate stable home-panel data from range-dependent chart data, coordinate home refresh through the container, and schedule analytics-page chart data requests as charts enter view with bounded concurrency and stale-response protection.

**Tech Stack:** Next.js 16, React 19, TypeScript, Axios, Vitest, React Testing Library, Recharts.

**Spec:** `docs/superpowers/specs/2026-09-23-dashboard-performance-scope.md`

## Global Constraints

- Start each implementation task from the latest `origin/main` on its own branch and use one task per pull request, as required by `Must Read Before Push.txt`.
- Preserve the current dashboard API contracts and permission checks.
- Use components in `src/components/ui` for any changed loading or status UI.
- Run clean-code-guard after production code changes and test-guard after test changes.
- Ask the owner before running `npm run test:run` without file arguments; focused test commands are allowed.
- Do not change backend or deployment files. Do not disturb the existing homework branch.

## File map

- `src/features/dashboard/container/SchoolDashboardContainer.tsx`: owns the existing `refreshSequence`, section loading, module-list loading, and module-detail cache.
- `src/features/dashboard/views/SchoolDashboardView.tsx`: passes `refreshSequence` to the intelligence panel and renders the current dashboard sections.
- `src/features/dashboard/components/DashboardIntelligencePanel.tsx`: separates stable panel requests from analytics-range requests and ignores obsolete responses.
- `src/features/dashboard/pages/DashboardAnalyticsPage.tsx`: schedules chart data loads and invalidates obsolete chart queries.
- `src/features/dashboard/__tests__/SchoolDashboardContainer.test.tsx`: verifies home refresh and module behavior.
- `src/features/dashboard/__tests__/DashboardAnalyticsPage.test.tsx`: verifies visible-chart loading, concurrency, and stale responses.
- Add `src/features/dashboard/__tests__/DashboardIntelligencePanel.test.tsx` only if the container test cannot clearly cover the panel request sequence.

## Task 1: Baseline and home request lifecycle

**Deliverable:** Changing the home analytics range reloads chart data only; home refresh updates its sections together; older responses cannot overwrite a newer selection.

**Files:** Modify `SchoolDashboardContainer.tsx`, `SchoolDashboardView.tsx`, `DashboardIntelligencePanel.tsx`, and the relevant dashboard tests listed in the file map. Keep a short measurement table in the pull request description.

**Interfaces:** `SchoolDashboardView` consumes the container's existing numeric `refreshSequence` and reports tab changes through `onActiveTabChange(tabKey: string)`. `DashboardIntelligencePanel` consumes `refreshSequence` and its existing `onCommandCenterChange` callback. The sequence changes only for a user-triggered home refresh.

```tsx
// New props at the container/view boundary.
refreshSequence: number;
onActiveTabChange: (tabKey: string) => void;
```

- [ ] Record baseline from a production build or equivalent local production run: on first home load and on analytics-range change, capture dashboard request URLs and counts, transferred bytes, and time until summary and intelligence content are visible. Use the same account, academic context, browser, and network profile for the after measurement.
- [ ] Add focused tests that settle the four stable intelligence requests, change range, and assert only `fetchAnalyticsChartData` runs again. Add a deferred response test in which the older range resolves last and assert the newest chart remains visible.
- [ ] Add a focused refresh test that loads a module tab, triggers the home refresh, and asserts summary, alerts, activity, module list, command center, widgets, todos, analytics, and the selected module detail are refreshed once. Check that a failed section retains an error state rather than blocking successful sections.
- [ ] Run the affected test file to confirm the new assertions fail before implementation: `npm run test:run -- src/features/dashboard/__tests__/SchoolDashboardContainer.test.tsx` and, if created, the intelligence-panel test file.
- [ ] In `DashboardIntelligencePanel`, split the existing `load(range)` path into stable-data and analytics-data functions. Keep `Promise.allSettled` behavior so one failed section does not block others. Key each analytics response by range and academic context; ignore a response when its key is no longer current.
- [ ] Make `SchoolDashboardContainer` track the selected tab via `onActiveTabChange` and reuse its existing `refreshSequence` on manual refresh. Invalidate module-detail cache, then request the selected module detail through the existing `loadModuleDetails` callback; keep other modules lazy. Pass the sequence through `SchoolDashboardView` to the intelligence panel. During refresh, keep successful data visible until replacement data arrives so the page does not flash to a full loading state.

```tsx
// The current refreshDashboard already increments refreshSequence. Reuse it
// for the intelligence panel, and invalidate the detail cache before asking
// loadModuleDetails to fetch the selected tab again.
setCachedModules({});
setModuleLoadingStates({});
setRefreshSequence((sequence) => sequence + 1);
```
- [ ] Run the focused test files again. Run `npm run lint`, `npm run typecheck`, and `npm run build`. Do not run the full test suite until the owner authorizes it.
- [ ] Apply clean-code-guard and test-guard to the diff. Repeat the baseline capture and include before and after measurements in the task's pull request. Commit and open one draft pull request for this task.

**Acceptance:** Range change does not refetch stable panel endpoints; refresh covers the home data listed above; old responses cannot replace the current range or academic context; permissions and error isolation remain intact. Any performance claim is backed by the recorded before and after trace.

## Task 2: Progressive analytics chart loading

**Deliverable:** The analytics page requests data for visible charts first and never has more than four chart-data requests in flight.

**Files:** Modify `src/features/dashboard/pages/DashboardAnalyticsPage.tsx` and `src/features/dashboard/__tests__/DashboardAnalyticsPage.test.tsx`. A small scheduler hook in `src/features/dashboard/hooks/useVisibleChartData.ts` is appropriate if it makes the page easier to review; do not add a dependency for scheduling.

**Interfaces:** The page still uses `fetchAnalyticsCharts` to list chart definitions and `fetchAnalyticsChartData(chartKey, query)` for data. A chart enters the scheduler when its card intersects a viewport margin of approximately one screen, so nearby charts are ready before scrolling reaches them. The queue is keyed by chart key plus the formatted query and academic context.

- [ ] Capture the current analytics trace with an account that has enough available charts to show fan-out. Record chart count, peak simultaneous chart-data requests, total requests, and time until the first visible chart is usable.
- [ ] Add focused tests using an `IntersectionObserver` stub: only intersecting cards request data, queued cards start as slots free up, at most four requests run concurrently, and a filter or academic-context change prevents an old response from replacing the current chart. Include manual refresh of visible charts.
- [ ] Run `npm run test:run -- src/features/dashboard/__tests__/DashboardAnalyticsPage.test.tsx` and confirm the new assertions fail before implementation.
- [ ] Replace the `charts.forEach` eager request effect with a queue for visible chart keys. Start up to four requests, drain when one settles, and discard queued work for a superseded query. Keep the existing per-chart loading and error UI and the existing hierarchy-recovery behavior.

```ts
const MAX_IN_FLIGHT_CHARTS = 4;
type ChartRequestKey = `${string}:${string}`; // chart key + serialized query
// Enqueue on intersection. On query change, discard queued keys and ignore
// results whose request key no longer matches the chart's current query.
```
- [ ] Run the focused analytics test file, `npm run lint`, `npm run typecheck`, and `npm run build`. Apply clean-code-guard and test-guard. Compare traces under the same conditions and report any slower chart reveal as well as request improvements.
- [ ] Commit and open a separate draft pull request for this task.

**Acceptance:** Visible charts load without requiring a click; scrolling eventually loads every available chart; request concurrency stays at four or fewer; filters and academic-context changes cannot display stale chart data; chart export uses the current chart result.

## Task 3: Bundle check and conditional chart split

**Deliverable:** A measured bundle decision. Make a code change only if the home route loads substantial chart code before chart content is needed.

**Files if needed:** `src/features/dashboard/views/SchoolDashboardView.tsx`, `src/features/dashboard/components/DashboardAnalysisCharts.tsx`, `src/features/dashboard/components/DashboardIntelligencePanel.tsx`, and existing tests that render those components.

- [ ] Compare the home route's production JavaScript transfer and parse cost before and after Tasks 1 and 2 using the same browser profile. Identify whether Recharts code is on the initial route path and whether chart rendering is a material contributor.
- [ ] If the trace supports it, use a Next.js client dynamic import for the chart-only section, preserving the same content and an existing `src/components/ui` loading treatment. Verify Arabic and English layout and that the chart appears when its section is reached.
- [ ] Run focused dashboard tests, lint, typecheck, and build. Apply clean-code-guard and test-guard to any changes. Record bundle and content timing before and after; keep the split only if it improves the measured result without delaying useful content.
- [ ] If a code change remains, commit it on its own branch and open its own draft pull request. Otherwise record the measurement and close this task without a code change.

## Final verification and handoff

- [ ] For each task, verify the branch contains only that task's files and report the exact commands and results.
- [ ] Ask the owner before the full test suite. After authorization, run the required final verification from `Must Read Before Push.txt`: lint, typecheck, full tests, and build.
- [ ] Do not merge or deploy. Hand off each draft pull request with the baseline, after measurements, known limits, and any backend observation that requires a separate owner decision.
