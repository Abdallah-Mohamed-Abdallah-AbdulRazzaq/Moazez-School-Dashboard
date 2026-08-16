# Dashboard Data Logic and Analytics

## 1. Summary card calculations

### Admissions

| Field | Calculation |
| --- | --- |
| `totalLeads` | Count all scoped leads. |
| `openApplications` | Applications in SUBMITTED, DOCUMENTS_PENDING, UNDER_REVIEW, or WAITLISTED. |
| `submittedApplications` | Applications currently SUBMITTED. |
| `acceptedApplications` | Applications currently ACCEPTED. |
| `pendingTests` | Placement tests in SCHEDULED. |
| `pendingInterviews` | Interviews in SCHEDULED. |
| `recentDecisions` | ACCEPTED, REJECTED, or WAITLISTED applications updated within last 30 days. |

### Students

| Field | Calculation |
| --- | --- |
| `activeStudents` | ACTIVE student records. |
| `activeEnrollments` | ACTIVE enrollments in resolved academic context. |
| `guardians` | Scoped guardian count. |
| `newEnrollmentsLast30Days` | Enrollments whose `enrolledAt` is within last 30 days. |
| `withdrawnEnrollments` | WITHDRAWN enrollments in resolved academic-year context. |

### Academics

- active academic years
- existence of current academic year
- terms
- stages
- grades
- sections
- classrooms
- subjects
- rooms
- teacher-subject allocations
- ACTIVE curricula
- ACTIVE lesson plans
- ACTIVE timetable entries
- PUBLISHED timetable publications

### Attendance

For the current school civil date:

- all attendance sessions
- submitted sessions
- draft/pending sessions
- absent entries
- late entries
- pending excuse requests

### Grades

- all assessments in resolved context
- DRAFT assessments
- PUBLISHED assessments
- APPROVED assessments
- locked assessments (`lockedAt` not null)
- grade items
- SUBMITTED grade submissions awaiting review
- submission answers whose correction status is PENDING

### Homework

- DRAFT assignments
- PUBLISHED assignments
- CLOSED assignments
- SUBMITTED or LATE submissions awaiting review
- REVIEWED submissions
- assignments linked to a grade assessment
- graded assignments with no grade-assessment link

### Behavior

- all records from last 30 days
- SUBMITTED records pending review
- POSITIVE records from last 30 days
- NEGATIVE records from last 30 days

### Reinforcement

- active tasks in NOT_COMPLETED, IN_PROGRESS, or UNDER_REVIEW
- SUBMITTED reinforcement submissions pending review
- COMPLETED assignments
- XP ledger entries from last 30 days
- REQUESTED reward redemptions

### Communication

- PUBLISHED non-expired announcements
- SENT messages from last 7 days
- ACTIVE conversations
- OPEN or IN_REVIEW moderation reports

## 2. Alert logic

Alerts are rebuilt on every request. They are not stored and have no user state.

Fixed keys:

1. `admissions.applications_waiting_decision`
2. `admissions.tests_pending`
3. `admissions.interviews_pending`
4. `academics.active_academic_year_missing`
5. `academics.active_term_missing`
6. `academics.timetable_draft_items`
7. `academics.lesson_plans_pending_activation`
8. `attendance.sessions_pending_submission`
9. `attendance.absent_entries_today`
10. `attendance.late_entries_today`
11. `attendance.excuses_pending`
12. `grades.assessments_in_draft`
13. `grades.assessments_pending_approval`
14. `grades.submissions_pending_review`
15. `grades.answers_pending_correction`
16. `homework.submissions_waiting_review`
17. `homework.grade_sync_link_missing`
18. `homework.missing_submissions_past_due`
19. `behavior.records_pending_review`
20. `behavior.negative_records_recent`
21. `reinforcement.submissions_pending_review`
22. `reinforcement.active_tasks_overdue`
23. `communication.moderation_reports_pending`
24. `communication.announcements_expiring_soon`
25. `settings.login_identity_missing`
26. `settings.email_connection_missing`

Notable definitions:

- past-due missing homework counts MISSING targets whose PUBLISHED assignment due date is before request time.
- overdue reinforcement counts active task statuses whose due date is before request time.
- expiring announcements are PUBLISHED announcements expiring within the next seven days.
- login readiness requires ACTIVE SchoolLoginSettings.
- email readiness requires ACTIVE or VERIFIED SchoolEmailConnection.

## 3. Activity Feed logic

Source is `AuditLog`, not a new Dashboard event table.

Repository eligibility:

- exact active `schoolId`
- outcome SUCCESS
- module in approved source mapping
- optional date, event, actor, and cursor filters

Source mapping:

- IAM and auth audit modules are normalized to `settings`.
- platform/applicant/dismissal modules are not part of the Dashboard activity-source registry.

Ordering:

1. `createdAt` descending
2. `id` ascending for equal timestamps

Cursor:

- Base64URL JSON containing `occurredAt` and `auditLogId`
- next page selects older timestamps, or greater IDs at the same timestamp according to the established ordering

Actor normalization:

- platform, organization, and school users -> `admin`
- teacher -> `teacher`
- student -> `student`
- parent -> `parent`
- service account or actor-less event -> `system`
- applicant, pickup delegate, or unresolved actor -> `unknown`

The use case contains explicit human text for important events and a safe humanized fallback for other approved, valid event paths.

## 4. Widget registry

Fixed order and keys:

1. `students.active`
2. `admissions.open_applications`
3. `attendance.pending_today`
4. `attendance.absences_today`
5. `homework.waiting_review`
6. `grades.pending_review`
7. `behavior.pending_review`
8. `reinforcement.pending_reviews`
9. `communication.moderation_queue`
10. `settings.email_connection`
11. `settings.login_identity`
12. `activity.recent`
13. `students.enrollment_growth`
14. `attendance.daily_trend`
15. `communication.message_volume`
16. `academics.teacher_allocation_coverage`
17. `grades.gradebook_completion`
18. `todos.today`
19. `calendar.today`

Dependency families:

- Summary: operational stat/action/risk widgets.
- Alerts: settings readiness widgets.
- Activity: recent activity timeline.
- Analytics: five fixed chart-backed widgets.
- Todos: today's personal Todo preview.
- Calendar: Academic Calendar + planner + Todo preview.

`grades.gradebook_completion` needs active academic year and term. If either is absent, the widget returns a neutral unavailable/not-configured state, not zero.

## 5. Module registry

Fixed module keys:

- admissions
- students
- academics
- attendance
- grades
- homework
- behavior
- reinforcement
- communication
- settings

Each definition owns:

- display metadata
- frontend module route
- source workspace route
- assigned widget keys
- assigned chart keys
- primary action
- section definitions
- capability metadata

Module detail uses Summary and Alerts plus assigned widgets. It does not fan out to every historical/category analytics repository. `availableData` is limited to the operational-snapshot data that can be composed from the already loaded Summary/Alert signals.

## 6. Analytics query model

### Ranges

- `7d`
- `30d`
- `90d`
- `term`
- `academic_year`
- `custom`

### Granularity

- day
- week
- month

### Hierarchy

- academic year
- term
- grade
- section
- classroom

The query-context service resolves references inside the active school and validates parent/child relationships. Mismatched hierarchy is intentionally indistinguishable from not-found.

### Time semantics

- fixed ranges derive school-timezone civil windows
- custom range requires explicit bounds
- term and academic-year ranges use persisted start/end dates
- period end dates become exclusive next-day boundaries
- bucket coordinates preserve date/category/snapshot/funnel semantics explicitly

## 7. Analytics catalog final state

### Total

- 37 chart definitions
- 33 computed
- 4 definition-only

### Operational snapshot pack

- `attendance.pending_sessions`
- `grades.pending_submission_reviews`
- `grades.pending_answer_reviews`
- `communication.moderation_queue`
- `settings.email_connection_readiness`
- `settings.login_identity_readiness`

### Attendance pack

- `attendance.daily_trend`
- `attendance.status_distribution`
- `attendance.absence_rate`
- `attendance.late_rate`
- `attendance.excuse_status`

Rate denominator:

`PRESENT + ABSENT + LATE + EXCUSED + EARLY_LEAVE`

The percentage is zero when denominator is zero and otherwise rounded to two decimals.

### Admissions and Students pack

- `admissions.applications_by_status`
- `admissions.applications_over_time`
- `students.enrollment_growth`
- `students.withdrawal_trend`
- `students.guardian_coverage`

Key semantics:

- application status is a current category distribution.
- application over time counts submitted and accepted lifecycle events.
- enrollment growth is active-enrollment stock at completed bucket close or current request instant for a partial bucket.
- guardian coverage divides active students into covered and missing.

### Academics pack

- `academics.teacher_allocation_coverage`
- `academics.timetable_publication_status`
- `academics.curriculum_activation`
- `academics.lesson_plan_activation`

These are current-category snapshots, not historical series.

### Grades and Homework pack

- `grades.assessment_status_distribution`
- `grades.gradebook_completion`
- `homework.assignment_status_distribution`
- `homework.submission_review_trend`
- `homework.grade_sync_coverage`

Gradebook completion categories are complete versus missing expected gradebook cells. Homework review trend counts submitted and reviewed events by bucket.

### Behavior and Reinforcement pack

- `behavior.positive_negative_trend`
- `behavior.pending_review`
- `behavior.records_by_category`
- `reinforcement.xp_activity_trend`
- `reinforcement.task_completion`
- `reinforcement.reward_redemption_status`

Only approved behavior records feed approved trend/category analytics. XP is net XP activity. Redemption status is represented as requested -> approved -> fulfilled funnel stages.

### Communication and Settings pack

- `communication.message_volume`
- `communication.announcement_status`

Message volume counts SENT messages. Announcement distribution includes draft, scheduled, published, archived, and cancelled.

## 8. Definition-only charts

| Chart | Why no computed data |
| --- | --- |
| `admissions.funnel` | No authoritative conversion cohort or immutable stage-history model. |
| `academics.structure_readiness` | No approved numerator, denominator, weighting, threshold, or empty-school rule. |
| `academics.subject_allocation_coverage` | No authoritative model of required-but-missing grade/subject pairs. |
| `settings.notification_readiness` | No approved school-level channel denominator/readiness policy. |

The data endpoint truthfully returns a definition-only/not-implemented state.

## 9. Light Mode and planner composition

### Planner sources

1. `academic_calendar`
2. `attendance_session`
3. `placement_test`
4. `interview`
5. `homework_due`
6. `grade_assessment`
7. `todo`

### Date behavior

Timed sources:

- placement tests
- interviews
- homework due dates
- timed Calendar events

Logical-date sources:

- attendance sessions
- grade assessments
- all-day Calendar events
- Todos

The selected-day interval uses an exclusive upper bound. Civil-date helpers are used for DST safety.

### IDs and no-leak rules

- Calendar event IDs remain their approved event IDs in full Light Mode.
- cross-module event IDs are source-prefixed.
- Todo IDs are present only in full planner/standalone Todo contracts.
- `calendar.today` widget strips event/source/Todo IDs and notes.

Maximum `calendar.today` widget preview:

- 5 Calendar events
- 5 cross-module events
- 5 Todos
- 15 total items
