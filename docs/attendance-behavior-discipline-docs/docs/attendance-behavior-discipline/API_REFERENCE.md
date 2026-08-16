# API Reference

All paths below are runtime paths after the global `/api/v1` prefix.

## Attendance Core — Roll Call

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/attendance/roll-call/roster` | Preview roster for scope/date. | `attendance.sessions.view` |
| POST | `/api/v1/attendance/roll-call/session/resolve` | Resolve or create roll-call session. | `attendance.sessions.manage` |
| GET | `/api/v1/attendance/roll-call/sessions` | List roll-call sessions. | `attendance.sessions.view` |
| GET | `/api/v1/attendance/roll-call/sessions/:id` | Get session detail. | `attendance.sessions.view` |
| POST | `/api/v1/attendance/roll-call/sessions/:id/submit` | Submit session. | `attendance.sessions.submit` |
| POST | `/api/v1/attendance/roll-call/sessions/:id/unsubmit` | Reopen submitted session. | `attendance.sessions.submit` |
| PUT | `/api/v1/attendance/roll-call/sessions/:id/entries` | Bulk save entries. | `attendance.entries.manage` |
| PUT | `/api/v1/attendance/roll-call/sessions/:id/entries/:studentId` | Save one entry. | `attendance.entries.manage` |
| POST | `/api/v1/attendance/roll-call/sessions/:sessionId/entries/:studentId/correct` | Correct submitted entry. | `attendance.entries.manage` |

## Attendance Core — Absences

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/attendance/absences` | List derived incidents from submitted entries. | `attendance.absences.view` |
| GET | `/api/v1/attendance/absences/summary` | Summary of derived incidents. | `attendance.absences.view` |
| PATCH | `/api/v1/attendance/absences/:id/excuse` | Mark source entry as excused. | `attendance.entries.manage` |
| PATCH | `/api/v1/attendance/absences/:id/early-leave` | Correct source entry to early leave. | `attendance.entries.manage` |

## Attendance Core — Excuse Requests

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/attendance/excuse-requests` | List formal excuse requests. | `attendance.excuses.view` |
| GET | `/api/v1/attendance/excuse-requests/:id` | Get request detail. | `attendance.excuses.view` |
| POST | `/api/v1/attendance/excuse-requests` | Create request. | `attendance.excuses.manage` |
| PATCH | `/api/v1/attendance/excuse-requests/:id` | Update request. | `attendance.excuses.manage` |
| GET | `/api/v1/attendance/excuse-requests/:id/attachments` | List request attachments. | `attendance.excuses.view` |
| POST | `/api/v1/attendance/excuse-requests/:id/attachments` | Link attachments. | `attendance.excuses.manage` |
| DELETE | `/api/v1/attendance/excuse-requests/:id/attachments/:attachmentId` | Delete attachment link. | `attendance.excuses.manage` |
| POST | `/api/v1/attendance/excuse-requests/:id/approve` | Approve request. | `attendance.excuses.review` |
| POST | `/api/v1/attendance/excuse-requests/:id/reject` | Reject request. | `attendance.excuses.review` |
| DELETE | `/api/v1/attendance/excuse-requests/:id` | Delete/cancel request. | `attendance.excuses.manage` |

## Attendance Core — Reports

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/attendance/reports/summary` | Summary report. | `attendance.reports.view` |
| GET | `/api/v1/attendance/reports/daily-trend` | Daily trend report. | `attendance.reports.view` |
| GET | `/api/v1/attendance/reports/scope-breakdown` | Scope breakdown report. | `attendance.reports.view` |

## Behavior Core

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/behavior/categories` | List categories. | `behavior.categories.view` |
| GET | `/api/v1/behavior/categories/:categoryId` | Get category. | `behavior.categories.view` |
| POST | `/api/v1/behavior/categories` | Create category. | `behavior.categories.manage` |
| PATCH | `/api/v1/behavior/categories/:categoryId` | Update category. | `behavior.categories.manage` |
| DELETE | `/api/v1/behavior/categories/:categoryId` | Delete category. | `behavior.categories.manage` |
| GET | `/api/v1/behavior/records` | List records. | `behavior.records.view` |
| GET | `/api/v1/behavior/records/:recordId` | Get record. | `behavior.records.view` |
| POST | `/api/v1/behavior/records` | Create record. | `behavior.records.create` |
| PATCH | `/api/v1/behavior/records/:recordId` | Update record. | `behavior.records.manage` |
| POST | `/api/v1/behavior/records/:recordId/submit` | Submit record. | `behavior.records.create` |
| POST | `/api/v1/behavior/records/:recordId/cancel` | Cancel record. | `behavior.records.manage` |
| GET | `/api/v1/behavior/review-queue` | List review queue. | `behavior.records.view` |
| GET | `/api/v1/behavior/review-queue/:recordId` | Get review item. | `behavior.records.view` |
| POST | `/api/v1/behavior/records/:recordId/approve` | Approve record. | `behavior.records.review` |
| POST | `/api/v1/behavior/records/:recordId/reject` | Reject record. | `behavior.records.review` |
| GET | `/api/v1/behavior/overview` | Behavior overview. | `behavior.overview.view` |
| GET | `/api/v1/behavior/students/:studentId/summary` | Student behavior summary. | `behavior.records.view` |
| GET | `/api/v1/behavior/classrooms/:classroomId/summary` | Classroom behavior summary. | `behavior.overview.view` |

## Teacher App Attendance

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/teacher/classroom/:classId/attendance/roster?date=YYYY-MM-DD` | Owned class roster attendance read. |
| GET | `/api/v1/teacher/classroom/:classId/attendance/today?date=YYYY-MM-DD` | Preferred read-only attendance screen model. |
| POST | `/api/v1/teacher/classroom/:classId/attendance/session/resolve` | Resolve/create DAILY class session. |
| GET | `/api/v1/teacher/classroom/:classId/attendance/sessions/:sessionId` | Read owned session. |
| PUT | `/api/v1/teacher/classroom/:classId/attendance/sessions/:sessionId/entries` | Update entries. |
| POST | `/api/v1/teacher/classroom/:classId/attendance/sessions/:sessionId/submit` | Submit session. |

## Student App

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/student/behavior` | Approved behavior records for current student. |
| GET | `/api/v1/student/behavior/summary` | Current student behavior summary. |
| GET | `/api/v1/student/behavior/:recordId` | Current student behavior detail. |
| GET | `/api/v1/student/discipline` | Derived Attendance + Behavior discipline timeline. |
| GET | `/api/v1/student/discipline/summary` | Derived discipline summary. |

## Parent App

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/parent/children/:studentId/behavior` | Approved behavior records for linked child. |
| GET | `/api/v1/parent/children/:studentId/behavior/summary` | Linked child behavior summary. |
| GET | `/api/v1/parent/children/:studentId/behavior/:recordId` | Linked child behavior detail. |
| GET | `/api/v1/parent/children/:studentId/discipline` | Linked child derived discipline timeline. |
| GET | `/api/v1/parent/children/:studentId/discipline/summary` | Linked child discipline summary. |
| GET | `/api/v1/parent/children/:studentId/reports` | Parent report cards including additive discipline counts. |
| GET | `/api/v1/parent/children/:studentId/reports/summary` | Parent report summary including discipline counts. |
