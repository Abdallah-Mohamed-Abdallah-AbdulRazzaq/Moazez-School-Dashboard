# Backend Requirements: Admissions Module

## Context
This document captures what the frontend needs from backend to support the Admissions & Registration area across the currently implemented admissions screens and flows.

The goal here is to describe the frontend’s data needs, UI behaviors, action availability, and edge cases without prescribing backend implementation details. Open to suggestions on a better approach. Let me know if this doesn’t match how the data is modeled. Push back if this adds unnecessary complexity.

This handoff covers:
- Admissions dashboard / overview
- Shared admissions academic year / term context behavior
- Leads
- Applications list
- Application 360 / application profile
- Tests
- Interviews
- Decisions
- Enrollment
- Admissions document settings / required documents
- Cross-cutting needs across the admissions lifecycle

## Working Principles
- The frontend needs enough information to render lists, details, summaries, charts, filters, exports, and conditional actions.
- The frontend needs backend to express business state clearly enough that UI actions can be enabled, disabled, hidden, or shown with confidence.
- The frontend should not have to infer workflow stage from unrelated records where backend can provide a more direct source of truth.
- For anything the frontend currently only implies or partially represents, I’ve put it under uncertainties or questions instead of guessing.

## Screens / Areas

### Admissions Shared Context
**Context**: All admissions pages are scoped by an admissions-specific academic year / term selector shown at the module level.

**Purpose**: Let users switch admissions records and analytics into the correct academic context and immediately understand whether the selected term is open or closed.

**Data I need to display**:
- The list of selectable academic years for admissions.
- The list of selectable terms for the selected academic year.
- Human-readable names for academic years and terms, including bilingual display where available.
- Which academic year / term should be selected by default when the page first loads.
- The current status of the selected term, at minimum enough to distinguish open vs closed.
- Enough loading/error context to show the selector state safely before options are ready.

**Actions**:
- Change academic year → refresh all admissions views into the selected context.
- Change term → refresh all admissions views into the selected context.
- Reload / refresh context metadata when needed.

**States to handle**:
- **Loading**: academic years and terms are still loading.
- **Empty**: no years or no terms are available.
- **Error**: admissions context metadata cannot be loaded.
- **Read-only**: selected term is closed, so edit actions across the module should be disabled.
- **Default selection fallback**: frontend may need a valid fallback if the requested year / term is missing.

**Business rules affecting UI**:
- A selected academic year controls which terms can be chosen.
- A selected year / term controls what records, summaries, analytics, and exports are shown across the module.
- Closed terms put the admissions module into read-only mode.
- Open / closed status needs to be trustworthy enough that the frontend can disable actions globally.

**Permissions / read-only behavior**:
- Read-only term state should be treated separately from user permissions.
- The frontend needs to know both whether the context is editable and whether the user is allowed to act.

**Relationships to other admissions entities**:
- Context affects leads, applications, tests, interviews, decisions, enrollment, and dashboard metrics.
- Context also affects which structure choices are valid later during enrollment.

**Uncertainties**:
- It is not fully clear whether admissions context should always default to the first available open term, the current calendar term, or a backend-defined active admissions term.
- It is not fully clear whether historical contexts should remain editable for privileged users.

**Questions for backend**:
- Should there be a single backend-defined “active admissions context” in addition to the selectable year / term lists?
- Should read-only be driven purely by term status, or can permissions override it in some roles?

### Admissions Dashboard / Overview
**Context**: The dashboard is the overview entry point for the module.

**Purpose**: Give admissions staff a fast snapshot of pipeline health, trends, conversions, and latest applications, with drill-down entry points into downstream workflows.

**Data I need to display**:
- KPI values for application volume, conversion, and average processing / time-to-decision style metrics.
- Date-range-aware analytics based on the selected dashboard period.
- Funnel / pipeline stage counts and conversion values.
- Grade distribution for applications in scope.
- Application source distribution in scope.
- Weekly inquiries trend in scope.
- Latest applications table rows with enough context to identify and open the application.
- Chart empty-state information when there is no data for the selected date range or context.
- Export-ready data for dashboard analytics and latest-application rows.

**Actions**:
- Change dashboard date range, including a custom date range.
- Export the dashboard dataset.
- Open the full applications list from the latest applications widget.
- Open a specific application from the latest applications table.
- Potentially drill from KPI / chart states into downstream flows if we want to deepen navigation later.

**States to handle**:
- **Loading**: dashboard summaries / charts are loading.
- **Empty**: no analytics for the selected period or context.
- **Error**: analytics or latest rows fail to load.
- **Read-only**: dashboard still visible, but any edit actions reachable from it should respect term state.

**Business rules affecting UI**:
- Dashboard date range and academic year / term scope both affect what the user sees.
- KPI totals, chart totals, and latest-table results need to stay internally consistent for the same scope.
- Average processing metrics depend on recognizable milestone dates rather than frontend estimation.
- “Latest applications” should use a clear backend definition of recency within the selected context.

**Permissions / read-only behavior**:
- Dashboard viewing may be broader than action-taking permissions.
- Export availability may also need permission-aware handling.

**Relationships to other admissions entities**:
- Dashboard depends on lead and application funnel data, plus downstream decision and enrollment outcomes.
- Latest-table navigation lands in application profile.

**Uncertainties**:
- The frontend implies dashboard export behavior but does not make the exact export scope fully explicit.
- It is not fully clear whether KPI cards themselves should be clickable for drill-down or only the table / view-all entry points should navigate.

**Questions for backend**:
- Can backend provide dashboard metrics and chart data from one consistent scoped source so all cards/charts match?
- For exports, should backend return already export-ready rows, or should frontend transform a more generic analytics response?

### Leads
**Context**: Leads are the earliest admissions records before a full application exists.

**Purpose**: Help the team track inbound inquiries, monitor conversion progress, and convert leads into applications.

**Data I need to display**:
- Lead list rows with lead identifier, contact name, phone, email, lead channel, current status, interested grade, and created date.
- Lead summary KPIs such as total leads, new, contacted, and converted within the selected time range.
- Searchable lead identity/contact information.
- Channel and status values suitable for filtering.
- Optional unread / conversation indicator data shown on lead rows.
- Enough lead detail to open a lead-specific page if that flow remains in scope.
- Export-ready lead list data.

**Actions**:
- Create a new lead.
- Import leads in bulk.
- Filter / search leads.
- Open a lead from the table.
- Convert a lead into an application draft.
- Export lead data.

**States to handle**:
- **Loading**: lead list or context is loading.
- **Empty**: no leads in the selected context.
- **Filtered empty**: no leads match current search / filters.
- **Error**: context or list load fails.
- **Read-only**: create/import/convert actions disabled while viewing remains available.

**Business rules affecting UI**:
- Lead KPIs and list results should honor both academic context and date-range filters.
- Converting a lead should preserve enough information to prefill a new application.
- Conversation or unread indicators should be tied to the lead in a stable way if they continue to appear in the table.

**Permissions / read-only behavior**:
- View may be allowed while create/import/convert is disabled.
- Closed terms should disable create/import/convert even if the list remains visible.

**Relationships to other admissions entities**:
- Leads convert into applications.
- Lead contact details and student-interest details should be reusable during application creation.

**Uncertainties**:
- Lead detail behavior was implied by row navigation, but I did not inspect a dedicated lead profile screen here.
- Bulk import behavior is visible in the UI, but backend-side validation and import feedback expectations are not fully represented.

**Questions for backend**:
- When a lead is converted, should the original lead remain editable, become locked, or simply reflect a converted status?
- Should the application draft created from a lead remain linked back to that lead for analytics and audit purposes?

### Applications List
**Context**: This is the main working queue for admissions applications.

**Purpose**: Let staff review application volume, find records quickly, understand pipeline state, and start application-level actions.

**Data I need to display**:
- Application list rows with application identifier, student identity, guardian identity, date of birth, gender, nationality, requested grade, status, and submitted date.
- Searchable values across application id, student, guardian, and guardian contact details.
- Filter values for status, grade, gender, nationality, and date range.
- KPI summaries for application volume, pending review, missing documents, accepted, rejected, and average processing time.
- Aggregate status-tag / pipeline counts for the currently filtered result set.
- Enough row context to open application 360.
- Export-ready list data matching the current scope.

**Actions**:
- Search applications.
- Filter applications.
- Open application details from a row.
- Create a new application.
- Export applications.
- Potentially launch downstream actions such as scheduling / decision / enrollment when the list evolves beyond current stubs.

**States to handle**:
- **Loading**: list, summaries, filters, or context are loading.
- **Empty**: no applications in scope.
- **Filtered empty**: no applications match current filters.
- **Read-only**: creation and edit-oriented actions disabled.
- **Partial data**: some applications may be missing optional demographic or guardian details.

**Business rules affecting UI**:
- Counts and table rows should stay aligned under the same filters and context.
- “Pending review” and “missing documents” need backend-owned definitions so the frontend is not inferring lifecycle rules inconsistently.
- Application status should be authoritative and stable enough to drive badges, counts, downstream actions, and exports.
- New application submission can proceed even with pending required documents, so the frontend needs a way to distinguish incomplete-but-created applications from fully submitted ones.

**Permissions / read-only behavior**:
- Create action should be permission-aware and respect closed-term read-only state.
- Export may need separate permission handling.

**Relationships to other admissions entities**:
- Applications connect to guardians, documents, tests, interviews, decisions, and enrollment.
- The list is the main entry point into application 360.

**Uncertainties**:
- The UI contains modal wiring for schedule / decision / enrollment actions from this page, but the selected application wiring is currently incomplete in the frontend implementation.
- It is not fully clear whether backend should provide KPI totals pre-aggregated or whether frontend will continue to derive some of them client-side.

**Questions for backend**:
- Can backend expose both filtered row data and summary counts from the same scoped query context so the page cannot drift out of sync?
- For application creation with missing required documents, what status model should frontend expect immediately after save?

### Application 360 / Application Profile
**Context**: This is the application-centric detail screen.

**Purpose**: Give admissions staff a full cross-entity view of one applicant and act on that application without jumping across unrelated screens.

**Data I need to display**:
- Header context for the selected application, including identifier, student name, requested grade, and current application status.
- Detail tab content for student/application information.
- Guardian tab content for all associated guardians and their relationship / communication context.
- Documents tab content for each application document, its requirement label / type, current status, upload presence, and related file/view context where relevant.
- Tests tab content for all linked tests with schedule details, status, and score summary where available.
- Interviews tab content for all linked interviews with schedule details, status, and evaluation summary where available.
- Timeline tab content for major lifecycle events such as submission, tests, interviews, and decision milestones.
- Enough cross-entity completeness that the page can serve as the single source of truth for the current application state.

**Actions**:
- Switch tabs.
- Schedule a test.
- Schedule an interview.
- Make a decision.
- Enroll the student when the application is eligible.
- Navigate back to the applications list.

**States to handle**:
- **Loading**: application detail and related records are loading.
- **Not found**: application id is invalid or inaccessible.
- **Empty tab states**: no guardians, no documents, no tests, no interviews, no timeline events, etc.
- **Read-only**: action buttons disabled while detail remains viewable.
- **Eligibility states**: enroll action shown only when decision/application status allows it.

**Business rules affecting UI**:
- The page needs one authoritative current status for the application header and downstream actions.
- Enrollment must not be available until the application is in the right decision/status state.
- Timeline ordering should be backend-driven or backed by trustworthy timestamps for lifecycle events.
- The frontend should not have to reconcile whether the “real” application state lives in the application itself or in related test/interview/decision records.

**Permissions / read-only behavior**:
- View access may differ from action permissions.
- Closed terms should disable schedule / decision / enrollment actions without breaking read access.

**Relationships to other admissions entities**:
- Application is the parent view for guardians, documents, tests, interviews, decisions, and enrollment.
- Timeline needs audit-friendly admissions events across those related entities.

**Uncertainties**:
- I did not inspect every sub-tab implementation in detail, so some tab-specific field expectations are inferred from the parent flow and linked entities.
- The screen exposes decision action and decision timeline state, but not a dedicated decision tab.

**Questions for backend**:
- Would it help to have an application detail response that already includes normalized related-record summaries for each tab?
- Should timeline events come as a dedicated ordered activity feed rather than being reconstructed from separate entities?

### Tests
**Context**: Tests have both a list screen and a detail screen, and also appear inside application 360.

**Purpose**: Support scheduling, rescheduling, status tracking, score capture, and navigation back to the parent application.

**Data I need to display**:
- Test list rows with test identifier, application identifier, student name, test type, subject, date, time, location, status, and score summary where available.
- KPI summaries for total tests, scheduled, completed, failed, and average score.
- Filterable values such as test status, test type, and date range.
- Test detail fields including date/time, duration, subject/type, location, proctor, guardian contact, linked application, requested grade, score, notes, and current status.
- Enough data to distinguish tests linked through the application record vs standalone test records without creating UI gaps.
- Export-ready list data.

**Actions**:
- Schedule a new test.
- Reschedule an existing test.
- Enter or update score / result.
- Cancel a test if that action remains supported.
- Open linked application from test detail.
- Export test list.

**States to handle**:
- **Loading**: list/detail data is loading.
- **Empty**: no tests in scope.
- **Filtered empty**: no tests match current filters.
- **Not found**: test id is invalid or inaccessible.
- **No score yet**: scheduled or otherwise incomplete tests without results.
- **Cancelled**: actions and messaging change for cancelled tests.
- **Read-only**: schedule, reschedule, cancel, and score capture disabled.

**Business rules affecting UI**:
- Test status drives which actions are available.
- Score entry is conditionally available depending on status.
- Reschedule / cancel actions appear only for certain statuses.
- Test detail needs enough linked application and guardian context to avoid extra fetches just to contact or identify the student.
- A test result should contribute to downstream readiness and decision evaluation in a trustworthy way.

**Permissions / read-only behavior**:
- View may be broader than schedule / score / cancel permissions.
- Closed terms should disable modifying actions even when the detail remains open.

**Relationships to other admissions entities**:
- Each test belongs to an application / student context.
- Test outcomes feed application review and decision making.
- Tests should appear both in the module-wide test list and on the application timeline/profile.

**Uncertainties**:
- Cancel action is visible in the detail UI, but the backend expectation is not clearly represented in current frontend wiring.
- The current UI mixes tests nested on applications with standalone test sources; it would be good to confirm the intended backend model.

**Questions for backend**:
- Should frontend expect tests to always be retrievable through the parent application, or is there a first-class test entity that should also stand on its own?
- For score entry, do you want frontend to work from a simple result status plus score, or should it also expect richer evaluation outcomes later?

### Interviews
**Context**: Interviews also have a list screen, a detail screen, and application 360 tab visibility.

**Purpose**: Support interview scheduling, rescheduling, evaluation capture, and progress tracking during application review.

**Data I need to display**:
- Interview list rows with interview identifier, application identifier, student name, date, time, interviewer, location, status, and rating where available.
- KPI summaries for total interviews, scheduled, completed, and average rating.
- Filterable values such as interview status and date range.
- Interview detail fields including date/time, duration, interviewer, interviewer contact, location, guardian contact, linked application, requested grade, rating, notes, and current status.
- Enough linked context to understand the interview in relation to the application.
- Export-ready list data.

**Actions**:
- Schedule a new interview.
- Reschedule an interview.
- Capture or update interview rating / evaluation.
- Cancel an interview if supported.
- Open linked application from interview detail.
- Export interview list.

**States to handle**:
- **Loading**: interview data is loading.
- **Empty**: no interviews in scope.
- **Filtered empty**: no interviews match current filters.
- **Not found**: interview id is invalid or inaccessible.
- **No rating yet**: interview exists but evaluation is not recorded.
- **Cancelled**: actions and messaging differ.
- **Read-only**: schedule/reschedule/evaluation actions disabled.

**Business rules affecting UI**:
- Interview status drives which actions are shown.
- Rating entry is conditionally available depending on status.
- Interview detail needs enough contextual information for both admissions staff and any follow-up workflow.
- Interview outcome should be usable during decision-making and timeline rendering.

**Permissions / read-only behavior**:
- View may be broader than scheduling or evaluation permissions.
- Closed terms should disable modifying actions.

**Relationships to other admissions entities**:
- Interviews belong to applications / students.
- Interview outcomes influence decisions and timeline state.
- Interview records should align between module-wide views and application 360.

**Uncertainties**:
- The list page includes schedule modal plumbing, but current visible CTA coverage is lighter than tests, so the intended entry points may still be evolving.
- Cancel action is visible in detail UI but not clearly wired end to end yet.

**Questions for backend**:
- Should frontend expect a lightweight rating plus notes only, or should interview evaluation support a richer rubric later?
- Should interviewer identity be treated as plain display information, or should frontend expect structured staff references it can reuse elsewhere?

### Decisions
**Context**: Decisions are visible in a decisions list and also initiated from application 360.

**Purpose**: Allow staff to record final or interim admissions outcomes and see their effect on downstream UI.

**Data I need to display**:
- Decision list rows with application identifier, student name, requested grade, decision outcome, decision date, decider identity, and reason.
- KPI summaries for total decisions, accepted, waitlisted, rejected, and acceptance rate.
- Decision filter values and export-ready decision rows.
- Decision-entry context summarizing application readiness, such as document completion and completed test/interview status.
- Enough decision state on the application to render current status, timeline events, and enrollment eligibility.

**Actions**:
- Record a decision for an application.
- Potentially revise a decision if the business allows reopening or changing the outcome.
- Optionally trigger guardian notification when recording the decision.
- Export decisions.

**States to handle**:
- **Loading**: list or decision context is loading.
- **Empty**: no decisions in scope.
- **Filtered empty**: no decisions match current filters.
- **Read-only**: decision creation/editing disabled.
- **Decision prerequisites incomplete**: UI may need warnings when tests/interviews/documents are incomplete.

**Business rules affecting UI**:
- Decision outcomes directly affect application status presentation.
- Decision outcomes directly affect enrollment availability.
- Decision recording may need an effective date, reason, actor, and optional notification intent.
- Waitlist must remain visually distinct from accepted/rejected because it behaves differently downstream.

**Permissions / read-only behavior**:
- Decision visibility may differ from decision-recording permission.
- Closed terms should disable the decision modal even if decisions remain visible.

**Relationships to other admissions entities**:
- Decisions consume application readiness signals from documents, tests, and interviews.
- Decisions change application state and enrollment eligibility.
- Decisions should appear in application timeline / profile state.

**Uncertainties**:
- The current frontend assumes decisions can be launched from the decisions list by selecting an application-backed row, but the exact edit/re-record rules are not represented clearly.
- The frontend shows a notification toggle, but the backend contract for notification outcome / failure handling is not yet clear.

**Questions for backend**:
- After a decision is recorded, should frontend treat the application’s current status as fully derived from the decision, or can they diverge?
- If a decision changes later, should backend preserve the prior decision in history while also giving frontend a single current decision?

### Enrollment
**Context**: Enrollment appears both as a module-wide list and as the terminal action on eligible applications.

**Purpose**: Transition accepted applicants into enrolled students with valid academic placement and enough final documentation for operations.

**Data I need to display**:
- Enrollment list rows with enrollment identifier, application identifier, student identity, grade, section, classroom, academic year, start date, and enrolled date.
- KPI summaries for total enrolled, recent enrollments, and basic context/grade coverage.
- Filter values such as grade, academic year, and date range.
- Enrollment form context for the accepted application, including student/application identity and requested grade.
- Academic structure choices that are valid for the selected academic year, including grade, section, and classroom options.
- Enough validation state so the form can know whether enrollment is complete and submittable.
- Export-ready enrollment data.

**Actions**:
- Open enrollment form for an eligible application.
- Choose academic year, grade, section, classroom, and start date.
- Confirm enrollment.
- Generate acceptance / contract style documents if those actions remain in scope.
- Export enrollment list.

**States to handle**:
- **Loading**: enrollment list or placement options are loading.
- **Empty**: no enrollments in scope.
- **Filtered empty**: no enrollments match current filters.
- **Read-only**: enrollment edits and confirmation disabled.
- **Validation incomplete**: missing grade/section/classroom/start date.
- **Invalid placement**: a selected academic structure option is no longer valid.

**Business rules affecting UI**:
- Enrollment should only be available for accepted / eligible applicants.
- Academic placement options depend on the chosen academic year.
- Enrollment converts an applicant into an enrolled student and should give frontend enough result state to reflect that transition everywhere else.
- Enrollment may depend on document readiness, application readiness, and/or decision readiness.
- The frontend should not have to infer whether enrollment succeeded by separately polling student records if backend can return a clear result.

**Permissions / read-only behavior**:
- Enrollment visibility may differ from enrollment-edit permission.
- Closed terms should disable enrollment edits and confirmation.

**Relationships to other admissions entities**:
- Enrollment consumes application + decision + academic structure context.
- Enrollment output must be traceable to downstream student records.
- Enrollment list is derived from enrolled students / enrollments, but users still need the admissions application linkage.

**Uncertainties**:
- The current frontend derives the enrollment list from student-side enrollment data, so it would be good to confirm the long-term source of truth.
- The exact readiness rule for enrollment is not fully explicit in the frontend beyond accepted-state visibility.
- Acceptance-letter / contract generation appears in the UI, but the expected backend document-generation workflow is not yet defined.

**Questions for backend**:
- On successful enrollment, can backend return both the new student linkage and enough updated application state so the UI can reconcile immediately?
- Should enrollment be blocked when required admissions documents remain incomplete, or is that only a warning?

### Admissions Document Settings / Required Documents
**Context**: Required admissions documents are managed from settings and then reused during application creation / document workflows.

**Purpose**: Let admins configure which admissions documents exist and how they behave so the application flow can resolve requirements consistently.

**Data I need to display**:
- The full list of configured admissions document definitions.
- For each definition: display labels, whether it is required or optional, whether it is active or inactive, and its current order.
- Stable identifiers so the frontend can preserve edits and map requirements into application document workflows.
- Dirty/saved state support so the screen knows whether anything changed.
- Export-ready settings rows.
- Permission metadata enough to distinguish view-only vs manage access.

**Actions**:
- View document requirement definitions.
- Add a new requirement definition.
- Edit existing definitions.
- Mark definitions required or optional.
- Mark definitions active or inactive.
- Reorder definitions.
- Remove definitions.
- Save changes.
- Cancel local changes.
- Export definitions.

**States to handle**:
- **Loading**: definitions are loading.
- **Empty**: no definitions configured.
- **Error**: settings load or save fails.
- **Dirty**: unsaved local changes exist.
- **Saving**: disable duplicate actions while save is in progress.
- **View-only**: editing controls disabled due to permission.
- **Validation error**: blank names, duplicate active names, or other invalid inputs.

**Business rules affecting UI**:
- Active definitions should be the ones that drive downstream admissions requirements.
- Required vs optional should affect warnings and completion rules during application creation and document collection.
- Sort order matters because the frontend renders requirements in that order.
- Validation for blank and duplicate names should be enforced clearly enough that the user knows what to fix.
- Save/cancel behavior should work against a stable backend source of truth.

**Permissions / read-only behavior**:
- View permission and manage permission are separate concerns here.
- Even with access to the screen, editing may need to be disabled.

**Relationships to other admissions entities**:
- These definitions influence the create-application documents step.
- They also affect how application document requirements should be resolved and displayed elsewhere in admissions.

**Uncertainties**:
- It is not fully clear whether requirements are global for all admissions contexts or can vary by academic year, stage, grade, or other criteria later.
- It is not fully clear whether deleting a requirement should be a hard delete, archival/inactive state, or soft removal only.

**Questions for backend**:
- Should document requirements remain global, or do you expect them to become context-aware later by stage/grade/year?
- If a requirement changes after applications already exist, should existing applications keep the old resolved set or update dynamically?

## Cross-Cutting Backend Needs Across the Module

### 1) Lifecycle / status transitions
The frontend needs a trustworthy lifecycle across:
- Lead
- Application creation
- Document collection
- Review
- Test / interview progression
- Decision
- Enrollment

The main need here is not a specific model, but a stable way for frontend to know the current lifecycle state and which next actions are allowed.

### 2) Consistent counts and KPIs
Dashboard cards, list KPIs, status summaries, chart totals, and exports should all agree when they are scoped to the same:
- academic year
- term
- date range
- filters

A single scoped backend interpretation would help a lot here.

### 3) Export-ready data
The frontend currently surfaces export affordances across dashboard, leads, applications, tests, interviews, decisions, enrollment, and settings.

Backend support should make sure exported datasets reflect:
- the same current filters/context the user sees
- stable human-readable values
- enough relationship context to be understandable outside the UI

### 4) Audit / timeline-friendly events
The application profile includes a timeline and the overall module clearly implies an audit trail.

The frontend needs event history for major admissions moments such as:
- lead created / contacted / converted
- application created / submitted
- document completion or missing-document reminders where tracked
- test scheduled / rescheduled / completed / failed / cancelled
- interview scheduled / rescheduled / completed / cancelled
- decision recorded / changed
- enrollment completed

### 5) Document requirement resolution per application
The frontend needs a clear resolved set of document requirements for each application, not just the global settings definitions.

That resolved set should be sufficient to answer:
- what is required for this application
- what is optional
- what is already uploaded
- what is still missing
- whether missing items should block submission, review, decision, or enrollment

### 6) Context-aware filtering by academic year / term
Every major admissions screen expects academic year / term context to affect its visible dataset.

The frontend needs backend to treat context scoping as first-class so records, counts, summaries, and options all move together when context changes.

### 7) Conditional action availability
The frontend needs clear action eligibility based on a combination of:
- permissions
- read-only term state
- current status / lifecycle stage
- completion state of related records

Examples include:
- can create lead/application
- can convert lead
- can schedule / reschedule tests or interviews
- can record a decision
- can enroll a student
- can edit settings
- can export

### 8) Notification-triggering events
The frontend clearly implies notification-worthy moments across admissions.

Backend does not need to expose notification internals to frontend, but the frontend does need a predictable outcome around events that may trigger notifications, especially when the UI explicitly presents notification intent or when the user expects guardian communication around:
- lead creation/contact
- application submission
- missing / completed documents
- test scheduling/result
- interview scheduling/completion
- under-review transitions
- decisions
- enrollment completion

### 9) Linked entity consistency
A single student/applicant may appear across leads, applications, tests, interviews, decisions, and enrollment.

The frontend needs stable linking so the user can navigate between records and trust that names, statuses, and related actions stay consistent.

### 10) Bilingual / user-facing display readiness
The module uses bilingual UI in multiple places.

Where backend owns labels or context metadata that is shown directly to users, it would help if display-ready multilingual values are available or if there is a clear convention for how frontend should render them.

## Uncertainties
- The current frontend still includes several stubbed actions and mock-data-driven flows, so some behaviors are implied rather than fully integrated.
- Lead detail expectations are only partially represented from the list page.
- Some application-list downstream action wiring appears unfinished even though the action concepts are clearly in scope.
- Tests and interviews are currently surfaced both through application-linked data and module-level records; it would be good to confirm the intended long-term source of truth.
- Decision editing / revision history rules are not clear from the current UI.
- Enrollment readiness rules beyond accepted status are not fully explicit.
- Document requirements appear global today, but future context-aware requirements may be needed.
- The exact export contract for each screen is not explicitly defined yet.

## Questions for Backend
- What should be the authoritative current-state representation across lead → application → review → decision → enrollment so frontend does not have to derive lifecycle state from scattered records?
- For academic year / term context, should backend define an “active admissions context,” or should frontend always derive defaults from the available year/term lists?
- Can backend provide list rows and KPI summaries from the same scoped source so counts and tables stay consistent?
- Should application detail come with an explicit related-record summary for documents/tests/interviews/decision/enrollment, or do you prefer frontend to compose that from multiple sources?
- How should resolved document requirements behave for existing applications when settings change later?
- What are the exact blockers vs warnings for decision eligibility and enrollment eligibility?
- Should decision history and timeline history be returned as dedicated event streams, or should frontend infer them from the latest entity states?
- When notifications are triggered by admissions events, does frontend need success/failure visibility, or should those workflows be treated as fire-and-forget from the UI perspective?
- For enrollment, can backend return both the admissions-side result and the resulting student linkage in one response so the UI can update immediately?
- Open to suggestions on a better approach if there is an easier way to keep these screens consistent without overcomplicating the backend surface.

## Discussion Log
- Initial handoff created from the current frontend implementation in the admissions module and related settings/context flows.
- This document intentionally avoids prescribing endpoint shapes, payload structures, field names, or persistence details.
- Backend feedback and agreed decisions should be added here as we refine the contract.
- Let me know if this doesn’t match how the data is modeled.
- Push back if this adds unnecessary complexity.
