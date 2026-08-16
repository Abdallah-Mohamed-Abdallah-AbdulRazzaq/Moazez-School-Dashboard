# Dashboard Summary

## Endpoint

```http
GET /api/v1/dashboard/summary
```

Required permission:

```text
dashboard.summary.view
```

## Purpose

Dashboard Summary returns a compact operational snapshot for the active school. It is designed for the school dashboard landing page and combines several source modules into one read-only response.

## Response sections

| Section | Purpose |
| --- | --- |
| `generatedAt` | Server timestamp for the snapshot. |
| `school` | Display-level school information. |
| `academicContext` | Active academic year and term labels. |
| `cards` | Main KPI card object grouped by domain. |
| `alertsPreview` | Top computed alert preview derived from cards. |
| `deferred` | Explicit future capabilities not implemented in the summary contract. |

## School section

```json
{
  "name": "Example School",
  "timezone": "Africa/Cairo",
  "locale": null
}
```

Name resolution prefers school profile name, then profile short name, then the school record name. Locale is currently returned as `null`.

## Academic context section

```json
{
  "academicYear": {
    "id": "academic-year-id",
    "name": "2025/2026"
  },
  "term": {
    "id": "term-id",
    "name": "Term 1"
  }
}
```

If no active year or term exists, either value can be `null`.

## Cards

### Admissions

| Field | Meaning |
| --- | --- |
| `totalLeads` | Count of leads. |
| `openApplications` | Applications in submitted, documents pending, under review, or waitlisted states. |
| `submittedApplications` | Applications in submitted state. |
| `acceptedApplications` | Applications in accepted state. |
| `pendingTests` | Placement tests still scheduled. |
| `pendingInterviews` | Interviews still scheduled. |
| `recentDecisions` | Accepted, rejected, or waitlisted decisions updated in the last 30 days. |

### Students

| Field | Meaning |
| --- | --- |
| `activeStudents` | Active student records. |
| `activeEnrollments` | Active enrollments in the active academic context. |
| `guardians` | Guardian records. |
| `newEnrollmentsLast30Days` | Enrollments created in the last 30 days. |
| `withdrawnEnrollments` | Withdrawn enrollments in the active academic context. |

### Academics

| Field | Meaning |
| --- | --- |
| `activeAcademicYears` | Number of active academic years. |
| `hasCurrentAcademicYear` | Whether the current active academic year was resolved. |
| `terms` | Terms in the current academic context. |
| `stages` | Stage count. |
| `grades` | Grade count. |
| `sections` | Section count. |
| `classrooms` | Classroom count. |
| `subjects` | Subject count. |
| `rooms` | Room count. |
| `teacherAllocations` | Teacher subject allocation count. |
| `curricula` | Active curricula count in academic context. |
| `lessonPlans` | Active lesson plans count in academic context. |
| `timetableEntries` | Active timetable entries count in academic context. |
| `publishedTimetablePublications` | Published timetable publication count in academic context. |

### Attendance

| Field | Meaning |
| --- | --- |
| `todaySessions` | Attendance sessions for today. |
| `submittedSessionsToday` | Submitted attendance sessions today. |
| `pendingSessionsToday` | Draft attendance sessions today. |
| `absentEntriesToday` | Absent entries today. |
| `lateEntriesToday` | Late entries today. |
| `pendingExcuses` | Pending attendance excuse requests. |

### Grades

| Field | Meaning |
| --- | --- |
| `activeAssessments` | Assessments in the active academic context. |
| `draftAssessments` | Draft assessments. |
| `publishedAssessments` | Published assessments. |
| `approvedAssessments` | Approved assessments. |
| `lockedAssessments` | Assessments with a lock timestamp. |
| `gradeItems` | Grade items in the active term context. |
| `pendingSubmissions` | Submitted grade submissions pending review. |
| `pendingAnswerReviews` | Submission answers pending correction. |

### Homework

| Field | Meaning |
| --- | --- |
| `draftAssignments` | Draft homework assignments. |
| `publishedAssignments` | Published homework assignments. |
| `closedAssignments` | Closed homework assignments. |
| `submissionsWaitingReview` | Submitted or late homework submissions waiting for review. |
| `reviewedSubmissions` | Reviewed homework submissions. |
| `gradeSyncLinkedAssignments` | Homework assignments linked to a grade assessment. |
| `gradeSyncPendingAssignments` | Graded homework assignments missing a grade assessment link. |

### Behavior

| Field | Meaning |
| --- | --- |
| `recentRecords` | Behavior records from the last 30 days. |
| `pendingReviewRecords` | Submitted behavior records waiting for review. |
| `positiveRecords` | Positive behavior records from the last 30 days. |
| `negativeRecords` | Negative behavior records from the last 30 days. |

### Reinforcement

| Field | Meaning |
| --- | --- |
| `activeTasks` | Tasks in not completed, in progress, or under review states. |
| `pendingReviews` | Submitted reinforcement submissions. |
| `completedAssignments` | Completed reinforcement assignments. |
| `recentXpLedgerEntries` | XP ledger entries from the last 30 days. |
| `rewardsPending` | Reward redemptions in requested state. |

### Communication

| Field | Meaning |
| --- | --- |
| `activeAnnouncements` | Published announcements not expired. |
| `recentMessages` | Sent messages from the last 7 days. |
| `activeConversations` | Active conversations. |
| `pendingModerationReports` | Message reports in open or in-review states. |

## Alerts preview

`alertsPreview` is derived from summary cards. It includes only non-zero previews, sorts critical before warnings, sorts larger counts first within equal severity, and returns at most six items.

Implemented preview keys:

- `admissions.pending_work`
- `attendance.pending_today`
- `attendance.absences_today`
- `grades.pending_review`
- `homework.waiting_review`
- `behavior.pending_review`
- `reinforcement.pending_reviews`
- `communication.pending_moderation`

## Deferred markers

```json
{
  "activityFeed": "deferred",
  "alertsEngine": "deferred",
  "analyticsBuilder": "out_of_scope_v1"
}
```

These markers remain for contract stability even though separate Alerts and Activity Feed endpoints were later added.
