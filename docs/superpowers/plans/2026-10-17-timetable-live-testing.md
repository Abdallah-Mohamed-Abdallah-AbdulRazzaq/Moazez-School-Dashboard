# Timetable Live Testing Plan

**Goal:** Verify the timetable's live user journeys, dialogs, service interactions, persistence, recovery, and usability; fix reproducible frontend defects and retest them.

**Status:** In progress. Live observations, fixes, evidence, and remaining variants are recorded in the execution report.

**Approach:** Use the current frontend against its configured live backend, with dedicated test fixtures and both supplied administrator accounts. Verify each mutation through the UI, its network response, and a fresh read. Keep automated regression results separate from live evidence.

**Stack:** Next.js App Router, React, TypeScript, next-intl, shared UI components, and the timetable API adapter.

**Requirements:** The approved coverage in this conversation: all timetable features, services, dialogs, UI/UX, and the recent printing, performance, save, deletion, and undo changes.

## Constraints and execution rules

- Test the latest working-tree frontend, including uncommitted timetable fixes. Record branch and commit; a commit alone does not identify this working tree.
- Keep backend code unchanged. Record backend limitations separately from frontend defects.
- Do not include credentials, tokens, cookies, authorization headers, or private student information in the plan, results, screenshots, or logs.
- Use account A for setup and normal workflows, and account B for independent persistence and concurrent-change checks. Both accounts have full permissions; they cannot establish restricted-role behavior.
- Reuse existing authenticated sessions where possible. Do not change account credentials or permission assignments.
- Create fixtures through supported application workflows. Prefix their names with `QA-TT-20261017`; record every created ID and parent relationship.
- Perform destructive scenarios on those fixtures. Record baseline data if an existing record must be touched, and restore it using supported workflows.
- Do not restart the user's running frontend or alter shared configuration to launch tests. If necessary, use a separate local frontend process and record its origin and ownership.
- Do not run the full project test suite without asking. Timetable-specific regression checks, TypeScript, and focused lint remain in scope.
- Apply Clean Code Guard to fixes, Test Guard to test changes, and both project frontend skills to UI changes. Do not push or merge as part of this testing task.

## Deliverables

- This plan: `docs/superpowers/plans/2026-10-17-timetable-live-testing.md`.
- Execution report: `docs/superpowers/plans/2026-10-17-timetable-live-testing-results.md`, created during execution.
- Screenshots, print PDFs, and redacted diagnostics: `test-results/timetable-live-2026-10-17/`.
- Fixture register in the execution report: entity type, name, ID, scope, baseline, final state, and cleanup outcome.
- Defect register: scenario ID, reproduction, expected/actual behavior, severity, frontend/backend ownership, fix, and retest evidence.

Production files are modified only when a reproduced defect justifies a fix. Do not create passing results in advance.

## 1. Establish the environment and fixtures

- [ ] Record frontend origin, backend origin from configuration without exposing secrets, locale, browser/version, viewport, academic year/term IDs, term status, branch, commit, and working-tree changes.
- [ ] Confirm the tested frontend contains the latest changes; an older running production build is not acceptable evidence for them.
- [ ] Verify both accounts can reach the timetable and allocation pages. Record account labels A/B without credentials.
- [ ] Select or create an isolated open academic context through the UI. If creation is unavailable, use explicitly recorded disposable scopes in an existing context.
- [ ] Create two stages, two grades, at least two sections, and four classrooms distributed across them. Include classrooms within one scope and outside that scope.
- [ ] Create three active subjects, three eligible teachers, and rooms covering adequate capacity, inadequate capacity, and an inactive room if supported.
- [ ] Create subject-hour allocations and teacher allocations: valid assignments, an intentionally missing assignment, and a second eligible teacher for reassignment/conflict tests.
- [ ] Prepare five active weekdays, instructional periods with known times, a break, and an assembly/noninstructional period. Keep at least one alternate configuration with differing period times.
- [ ] Prepare configurations across TERM, STAGE, GRADE, SECTION, and CLASSROOM in dependency order during phase 3. Use these fixtures to expose inheritance and overrides.
- [ ] Prepare reproducible lessons for: valid save, classroom collision, teacher overlap, room overlap, unmet weekly hours, excess hours, and a cross-classroom move.
- [ ] Record expected fixture counts and selected scope before testing. Verify empty configuration output is actually empty, not inherited output mistaken for an empty draft.

Use separate browser sessions for A/B if supported. If sessions cannot be isolated, record that limitation; sequential sign-ins verify persistence but do not count as simultaneous concurrency testing.

## 2. Scenario checklist and expected results

Run each section in order. Preserve prerequisite fixtures until dependent scenarios have finished. For every row record PASS, FAIL, BLOCKED, or NOT APPLICABLE and an evidence reference.

### A. Overview, loading, and navigation

| ID | Action | Expected result |
|---|---|---|
| OV-01 | Open the overview from a fresh browser page, then revisit it. | Correct context, useful loading state, no stale configuration flash or unhandled errors. |
| OV-02 | Search by classroom and Arabic/English scope names; combine scope, status, and attention filters; clear them. | Correct intersections, accurate counts, explicit empty/pending states, complete restoration after clearing. |
| OV-03 | Open an existing configuration and a classroom with an override. | URL, scope heading, lessons, and configuration identity agree. No duplicate configuration is created. |
| OV-04 | Open uncovered classrooms and scopes without classrooms. | Coverage explanation is accurate; creation and opening actions lead to the intended scope. |
| OV-05 | Use browser back/forward, a copied direct link, and return-to-overview with an unsaved draft. | Draft is retained until discard is confirmed; cancel stays in the edited context. |
| OV-06 | Change year/term and switch configurations rapidly while requests are pending. | A late response cannot replace the current context's data. |

### B. Configuration, inheritance, and periods

| ID | Action | Expected result |
|---|---|---|
| CF-01 | Create TERM, STAGE, GRADE, SECTION, and CLASSROOM configurations on the fixtures. | Every configuration saves at the selected scope and reopens with matching data. |
| CF-02 | Open configuration and periods from both TERM and custom scopes. | Two separate buttons open their respective dialogs; current editing scope is clear. |
| CF-03 | Add progressively narrower overrides and inspect affected/unaffected classrooms. | The nearest applicable configuration is shown; neighboring scopes retain their own data. |
| CF-04 | Change classroom viewing filters within a configuration. | Editing configuration remains fixed; the classroom filter changes only the view. |
| CF-05 | Try blank names, no active days, and removing a day that contains saved lessons. | Invalid changes receive actionable validation; existing lesson protection works. |
| CF-06 | Open an already closed term, if one is available, without closing a shared term for testing. | Read-only explanation is visible; configuration, periods, generation, and lesson mutations are unavailable. Otherwise record the missing fixture. |
| PE-01 | Add, edit, cancel, and delete instructional periods; add break/assembly periods. | Labels, types, times, ordering, and persisted results agree after reopening. |
| PE-02 | Try missing times, end before start, duplicate/overlapping periods, and adjacent valid periods. | Invalid intervals are explained; valid adjacent intervals are accepted. |
| PE-03 | Change/delete a period used by a saved lesson; close/reopen the dialog after a failed save. | The configured protection/impact flow is explicit; no silent lesson loss or false success. |

### C. Manual editing, allocations, save, and reset

| ID | Action | Expected result |
|---|---|---|
| ED-01 | Add a valid lesson; inspect defaults; edit its teacher/room; save and reopen. | The intended classroom/day/period and reference IDs persist. |
| ED-02 | Open lessons across grades with different subject/teacher allocations. | Options correspond to the destination classroom; inactive/ineligible choices are handled correctly. |
| ED-03 | Try missing allocations, missing required teacher, capacity mismatch, holidays, and noninstructional slots. | Blocking versus warning behavior is clear and consistent; invalid writes are not reported as saved. |
| ED-04 | Clear one saved lesson, add a temporary lesson, then save. | The cleared lesson is deleted, the new lesson persists, and untouched lessons remain. |
| ED-05 | Reset an unsaved edit successfully; repeat with the reload request failed. | Success restores authoritative data. Failure retains the draft and unsaved status and shows an error. |
| ED-06 | Attempt edits, dragging, undo, and repeated save clicks during a delayed save. | No competing local mutation or duplicate write is accepted; reload cannot silently discard a new edit. |
| AL-01 | Replace a fixture teacher through teacher allocation and inspect its reassignment preview. | Preview states affected timetable work, blockers, and scope accurately; confirmed results match fresh reads. |
| AL-02 | Change allocated subject hours and revisit validation; test allocation removal where supported. | Deficits/excesses and invalid dependencies are visible; unsupported operations are recorded honestly. |

### D. Drag/drop, placement, undo, copy, and move

| ID | Action | Expected result |
|---|---|---|
| DD-01 | Place a library item, move an existing lesson to an empty slot, then save/reopen. | Placement creates one lesson; dragging an existing lesson moves it without leaving a source copy. |
| DD-02 | Drop onto an occupied slot for supported swaps and invalid combinations. | Supported swaps preserve both lessons; rejected drops preserve the original timetable. |
| DD-03 | Move across classroom timetables while scrolling, including an initially unloaded classroom and a collapsed target. | Scrolling/loading does not lose the drag source or target; the correct classroom receives the lesson. |
| DD-04 | Test invalid teacher/subject allocations, time overlaps, full rooms, read-only mode, Escape, and drop outside the grid. | Correct rejection/warning; cancellation leaves data unchanged. |
| DD-05 | Undo a move/placement; then try undo after manual edit, save, reset, deletion, and configuration/term change. | Valid undo restores the draft; obsolete history cannot resurrect outdated lessons or cross scopes. |
| MV-01 | Open copy and move from a single-classroom filter. | All eligible destination classrooms in the configuration remain available. |
| MV-02 | Select classroom/day/period and compare source/destination previews; check and confirm. | Copy keeps the source; move clears it; one correct destination persists after save. |
| MV-03 | Choose an occupied destination, a conflicting teacher, and an invalid allocation. | Confirmation is blocked with a specific reason; no accidental overwrite. |
| MV-04 | Change destination during an in-flight check; fail the check; cancel/reopen. | A stale response cannot authorize a different destination; retry and cancellation preserve the draft. |

### E. Generation, validation, and conflict inspection

| ID | Action | Expected result |
|---|---|---|
| GN-01 | Open generation with missing prerequisites, unsaved edits, and a complete fixture. | Preconditions and enabled actions agree; the actual request uses the selected configuration. |
| GN-02 | Generate a small satisfiable schedule and an intentionally constrained schedule. | Progress, filled/remaining lessons, conflicts, and completion state reflect the backend response. |
| GN-03 | Delay/fail generation and fail its subsequent refresh independently; retry. | No false completion or duplicate generation after persisted success; refresh retry performs reads. |
| GN-04 | Generate with existing saved lessons, then inspect every affected classroom and scope. | Preserved/replaced lessons agree with the selected operation and backend response; outside-scope lessons remain unchanged. |
| VA-01 | Validate known missing, excess, and valid subject-hour fixtures plus teacher/classroom/room conflicts. | Counts, severity, affected resources, times, and scope match the fixture and API response. |
| VA-02 | Search/filter every category, group overlaps, navigate tabs, and expand long lists. | No lost issues, duplicate groups, misleading empty states, or broken keyboard focus. |
| VA-03 | Edit a lesson after checking, recheck, fail a recheck, and switch contexts mid-check. | Stale results are identified; failed/late checks cannot mark unrelated data current. |
| VA-04 | Follow repair links into subject/teacher allocation and back. | Year, term, classroom/grade, and issue target remain correct. |
| CO-01 | Inspect teacher and classroom conflicts with different period times across configurations. | Dialog shows actual overlapping lessons and each configuration's scope/times. |
| CO-02 | Focus an affected lesson and open either classroom in a new tab. | Destination is `/academics/timetable` with correct context/configuration/lesson; origin remains intact. |
| CO-03 | Move/delete an affected lesson before reopening its old conflict; fail its detail request. | Stale/missing data and retry are handled explicitly; previous classroom data is not reused misleadingly. |

### F. Bulk deletion and publication

| ID | Action | Expected result |
|---|---|---|
| DL-01 | Cancel delete-all, then confirm it within one classroom and save. | Cancel changes nothing; confirmed deletion affects the intended draft only and persists after reload. |
| DL-02 | Delete all fixture lessons in the all-classrooms view, including temporary draft lessons. | Saved lessons disappear, temporary lessons do not generate delete requests, and outside-scope lessons remain. |
| DL-03 | Inspect requests and progress for more than four saved lessons. | At most four deletes run concurrently; progress is accurate; one all-classrooms lesson-list request occurs per reload. |
| DL-04 | Fail one delete while sibling requests are delayed, and separately fail the authoritative reload. | Later batches stop; in-flight requests settle before recovery; partial/uncertain results are not reported as success. |
| PB-01 | Attempt publication with unsaved changes, no lessons, blockers, warnings, and a valid schedule. | Readiness and confirmation agree with the response; only accepted publication shows success. |
| PB-02 | Reopen a published fixture through both accounts and try editing it. | Published state persists; editing, placement, deletion, and undo are locked. |
| PB-03 | Unpublish TERM, GRADE, and CLASSROOM fixtures; inspect STAGE and SECTION. | Supported scopes unlock after confirmed success. Unsupported scopes explain the restriction and do not claim success. |
| PB-04 | Fail/delay publish and unpublish; retry and refresh. | No duplicate accepted mutation, false toast, or incorrect lock state. |

### G. Print, export, and rooms

| ID | Action | Expected result |
|---|---|---|
| PR-01 | Print one-classroom-per-page with displayed/all classrooms and teacher/room toggles. | Preview and PDF agree on scope, lessons, headings, times, status, detail visibility, and classroom numbering. |
| PR-02 | Print compact mode with one, two, odd, and many classrooms, plus a long timetable. | Landscape layout remains readable; no omitted lessons, clipped rows, or unexplained blank pages. Long content continues onto pages. |
| PR-03 | Use native Ctrl+P with the print dialog closed; cancel and print again. | The report uses current data/options without dashboard chrome or accumulating hidden print frames. |
| EX-01 | Export each format actually offered by the UI. | Files open and contain the selected classrooms, localized headings, complete periods, and accurate lesson/teacher/room values. |
| RM-01 | Open the rooms view, exercise the fixture room operations actually offered, and return to the timetable. | Correct context, validation, persistence, capacity/conflict display, and unsaved-change handling. |

### H. UI/UX, sessions, and service failures

| ID | Action | Expected result |
|---|---|---|
| UX-01 | Repeat the core create/save, move, validate, and print journeys in Arabic and English. | Correct RTL/LTR, readable names/times, localized messages, and logical navigation. |
| UX-02 | Inspect desktop at 1440×900 and mobile at 390×844; check an intermediate 768×1024 viewport. | Actions remain reachable; scrolling is contained; grids/dialogs have no inaccessible content. Reset viewport afterward. |
| UX-03 | Navigate controls and dialogs using keyboard, Escape, and focus return; inspect errors and loading announcements. | Focus is visible, modal behavior is consistent, labels/errors are associated, and keyboard use can complete core workflows. |
| UX-04 | Check empty, loading, no-results, disabled, and reduced-motion states. | Each state explains the next action and has no misleading success or decorative blocking animation. |
| UX-05 | Use classroom search and previous/next switching; find a lesson and step through matches. | Boundaries are correct; the selected classroom/day is revealed, highlighted, and scrolled into view. Clearing search removes the highlight. |
| UX-06 | Toggle focus mode and grid density, collapse/expand individual/all classrooms, and open/close desktop/mobile lesson libraries. | Controls and lessons remain reachable; focus, counts, selected classroom, and scroll behavior remain coherent. |
| CC-01 | Save with A, then open/refresh with B. | Both accounts read the same authoritative fixture data. |
| CC-02 | With both sessions open, edit the same lesson/configuration; save one and then the stale other. | Record actual concurrency behavior. Silent destructive overwrites or misleading success are defects; do not assume backend version protection exists. |
| ER-01 | Delay/fail configuration, entries, periods, publication, validation, and conflict-detail reads individually. | Recoverable error states, useful retries, no stale cross-scope display, and no unhandled promise/console errors. |
| ER-02 | Exercise a missing/deleted configuration link and unavailable session through normal browser flows where feasible. | No data leakage, broken persistent spinner, or incorrect successful mutation; authentication recovery is clear. |

## 3. Service and performance evidence

- [ ] Inspect requests triggered by the tested flows through `timetableApiAdapter.ts`: configuration, period CRUD, entry reads/deletes/bulk saves, generation, validation, conflict checks/details, publication, and dashboard reads.
- [ ] For each exercised service, record method, route, selected context/scope, response outcome, UI result, and persistence check. Redact identity/authentication details.
- [ ] Do not invent requests solely to mark unused adapter methods covered. Mark methods not reached by the supported UI as NOT EXERCISED and identify the gap separately.
- [ ] Check payloads for unintended classrooms/configurations and verify period/allocation IDs against the fixtures.
- [ ] Measure three cold-page loads and three warm revisits for overview and workspace. Distinguish browser cache state from backend cache state; do not claim control of server caches.
- [ ] Record navigation-to-usable time, requests, transferred bytes where observable, console errors, and visible stalls. Development compilation time is reported separately from application loading.
- [ ] Use the same recorded fixture dataset for classroom switching, search, progressive scrolling, generation, print preparation, and deletion timings. Record classroom/lesson counts with each measurement.
- [ ] Confirm editor/dialog bundles are deferred as intended, empty search does not delay interaction, and all-classrooms reload avoids duplicate lesson-list requests.
- [ ] Observe large-list scrolling and cross-classroom dragging; check that unloaded timetables do not make intended targets unreachable.
- [ ] Simulate request failures only with supported local browser/test controls. Record simulated versus naturally observed failures. If the browser cannot isolate a failure safely, mark that case BLOCKED rather than claiming live coverage from a unit test.

Performance findings are measurements, not promises of a fixed speedup. No production-build benchmark is inferred from a development preview.

## 4. Defect handling and retest

- [ ] For every failure, capture the smallest reproducible fixture, scenario ID, account/context, relevant response, expected/actual result, and screenshot.
- [ ] Classify severity: P0 data loss/exposure; P1 wrong-scope mutation, broken save/publish, or unrecoverable core journey; P2 functional/usability defect with a workaround; P3 visual/copy issue.
- [ ] Reproduce before changing code. Add a focused regression test where it protects meaningful behavior.
- [ ] Fix frontend defects within the authorized scope, review with the applicable guards, and rerun the failed live scenario plus adjacent workflows.
- [ ] For backend defects, preserve redacted evidence and document the user impact and workaround. Do not change backend code or label the frontend workaround a complete backend fix.
- [ ] After fixes, run `node node_modules/vitest/vitest.mjs run src/features/academics/timetable src/components/print/__tests__/usePrint.test.tsx`, `node node_modules/typescript/bin/tsc --noEmit`, and focused/module lint. Ask before expanding to the full project suite.

## 5. Cleanup and completion criteria

- [ ] Remove disposable lessons and configurations before their allocation/structure dependencies, using only supported cleanup operations.
- [ ] Restore any recorded existing data; verify the restored values from a fresh read. If removal/restoration is unsupported, list the remaining fixture IDs and their final state.
- [ ] Restore browser network/viewport overrides and close only testing sessions/tabs/processes owned by this run.
- [ ] Save a results matrix covering every scenario, service coverage gaps, measurements, fixed/open defects, and cleanup outcomes.
- [ ] Every critical core journey must pass after fixes: scoped configuration, manual save/reset, move/copy, cross-classroom drag, validation/repair navigation, generation, bulk deletion/recovery, supported publication/unpublication, and printing/export.
- [ ] No unresolved P0/P1 issue is compatible with an unrestricted release recommendation. Report any such issue explicitly; do not hide it behind a test count.
- [ ] Every BLOCKED/NOT APPLICABLE scenario has a concrete reason. Restricted-role authorization remains unverified with the two administrator accounts. Browser coverage is limited to the browser actually used.
- [ ] Final report distinguishes automated checks from live runs, and fixed defects from residual risk. Passing this plan does not prove the absence of all bugs.

## Results format

For each executed scenario use:

| Scenario | Account / locale / viewport | Fixture and scope IDs | Expected / actual | Result | Evidence | Defect / retest |
|---|---|---|---|---|---|---|

Record timestamps in Africa/Cairo. A PASS requires the observed result and evidence; a successful click or HTTP status alone is insufficient for a persistence or UX scenario.
