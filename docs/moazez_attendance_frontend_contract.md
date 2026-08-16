# Moazez Backend — Attendance Module Frontend Contract

**Repository:** `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`  
**Generated:** 2026-07-02  
**Scope reviewed:** Core Attendance module under `src/modules/attendance/*` plus Teacher App attendance adapter under `src/modules/teacher-app/classroom/attendance/*`.

This is a frontend-facing contract for Attendance integration. It is based on the current controllers, DTOs, presenters, enums, validation rules, guards, and error envelope in the backend.

---

## 1. Global API Rules

### Base URL

All routes are under:

```http
/api/v1
```

Swagger is mounted at:

```http
/api/v1/docs
```

### Auth

Send bearer auth on every request:

```http
Authorization: Bearer <access_token>
```

The app globally registers `JwtAuthGuard`, `ScopeResolverGuard`, and `PermissionsGuard`.

### Validation

The backend global `ValidationPipe` uses:

```ts
whitelist: true
forbidNonWhitelisted: true
transform: true
transformOptions: { enableImplicitConversion: false }
```

Frontend implications:

- Do not send fields not present in the DTO.
- UUID fields must be valid UUIDs.
- Date fields must be ISO date strings. Prefer `YYYY-MM-DD` for attendance dates.
- Core `/attendance/*` routes use uppercase Prisma enum values.
- Teacher App `/teacher/classroom/:classId/attendance/*` routes use lowercase app-facing enum values.

---

## 2. Error Envelope

All errors are normalized like this:

```json
{
  "error": {
    "code": "validation.failed",
    "message": "Request validation failed",
    "details": {
      "fields": ["termId must be a UUID"]
    },
    "traceId": "uuid-or-x-trace-id"
  }
}
```

Common status/code mapping:

| HTTP | Code | Meaning |
| --- | --- | --- |
| `400` | `validation.failed` | DTO validation, invalid date, invalid scope, closed term, invalid period rules. |
| `401` | `auth.token.invalid` | Missing/invalid bearer token. |
| `403` | `auth.scope.missing` | Missing active scope or required permission. |
| `404` | `not_found` | Entity/context/session/student/scope not found or inaccessible. |
| `409` | `conflict` or module-specific code | Submitted/draft state conflict or duplicate policy. |
| `500` | `internal_error` | Unexpected backend error. |

Attendance-specific conflict/error codes:

| Code | HTTP | Meaning |
| --- | --- | --- |
| `attendance.session.already_submitted` | `409` | Attempted draft-only operation on submitted session. |
| `attendance.session.not_submitted` | `409` | Attempted submitted-only operation on non-submitted session. |
| `attendance.policy.conflict` | `409` | Active/name policy conflict in same context/scope. |

---

## 3. Enums

### Core Attendance enums

Use these exact values with `/attendance/*` endpoints:

```ts
type AttendanceScopeType = 'SCHOOL' | 'STAGE' | 'GRADE' | 'SECTION' | 'CLASSROOM';
type AttendanceMode = 'DAILY' | 'PERIOD';
type DailyComputationStrategy = 'MANUAL' | 'DERIVED_FROM_PERIODS';
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'EARLY_LEAVE' | 'UNMARKED';
type AttendanceSessionStatus = 'DRAFT' | 'SUBMITTED';
type AttendanceExcuseType = 'ABSENCE' | 'LATE' | 'EARLY_LEAVE';
type AttendanceExcuseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
```

Report scope breakdown `groupBy` values:

```ts
type AttendanceReportScopeGroupBy = 'stage' | 'grade' | 'section' | 'classroom';
```

### Teacher App enums

Use lowercase values with Teacher App attendance endpoints:

```ts
type TeacherAttendanceWriteStatus = 'present' | 'absent' | 'late' | 'excused';
type TeacherAttendanceReadStatus = 'present' | 'absent' | 'late' | 'excused' | 'early_leave' | 'unmarked';
type TeacherAttendanceSessionStatus = 'draft' | 'submitted';
```

Teacher App can read `early_leave` and `unmarked`, but cannot write them.

---

## 4. Shared Attendance Rules

### Academic year alias

Many DTOs accept both:

```ts
academicYearId?: string;
yearId?: string;
```

Frontend should prefer `academicYearId`. `yearId` is treated as an alias in attendance use cases.

### Scope selection

| `scopeType` | Required ID | Notes |
| --- | --- | --- |
| `SCHOOL` | none | Do not send stage/grade/section/classroom IDs. |
| `STAGE` | `stageId` or `scopeId` | Do not send grade/section/classroom IDs. |
| `GRADE` | `gradeId` or `scopeId` | Optional `stageId` must match actual parent. |
| `SECTION` | `sectionId` or `scopeId` | Optional `gradeId`/`stageId` must match parents. |
| `CLASSROOM` | `classroomId` or `scopeId` | Optional `sectionId`/`gradeId`/`stageId` must match parents. |

Invalid combinations return `400 validation.failed`.

### Dates and ranges

- Use `YYYY-MM-DD` for attendance screens.
- If both `dateFrom` and `dateTo` are sent, `dateFrom <= dateTo` is required.

### DAILY vs PERIOD sessions

- `DAILY` sessions use internal period key `daily`.
- `PERIOD` sessions require `periodKey`.
- Optional `periodId` must belong to the timetable period context when supplied.

---
# 5. Core Attendance — Dashboard/Admin Contract

Core routes are permission-gated and intended for dashboard/admin school-management surfaces.

---

## 5.1 Roll Call

**Base path:** `/api/v1/attendance/roll-call`

### Permissions

| Use case | Permission |
| --- | --- |
| Read roster/sessions | `attendance.sessions.view` |
| Resolve/create session | `attendance.sessions.manage` |
| Submit/unsubmit session | `attendance.sessions.submit` |
| Save/correct entries | `attendance.entries.manage` |

### Endpoints

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| `GET` | `/attendance/roll-call/roster` | Read roster for a scope/date. Does not create session. | `attendance.sessions.view` |
| `POST` | `/attendance/roll-call/session/resolve` | Find existing session or create it if missing. | `attendance.sessions.manage` |
| `GET` | `/attendance/roll-call/sessions` | List sessions by filters. | `attendance.sessions.view` |
| `GET` | `/attendance/roll-call/sessions/:id` | Get session with entries. | `attendance.sessions.view` |
| `POST` | `/attendance/roll-call/sessions/:id/submit` | Submit draft session. | `attendance.sessions.submit` |
| `POST` | `/attendance/roll-call/sessions/:id/unsubmit` | Reopen submitted session. | `attendance.sessions.submit` |
| `PUT` | `/attendance/roll-call/sessions/:id/entries` | Bulk save non-empty entries array. | `attendance.entries.manage` |
| `PUT` | `/attendance/roll-call/sessions/:id/entries/:studentId` | Upsert one student entry. | `attendance.entries.manage` |
| `POST` | `/attendance/roll-call/sessions/:sessionId/entries/:studentId/correct` | Correct one entry with `correctionReason`. | `attendance.entries.manage` |

### GET `/attendance/roll-call/roster`

Query:

```ts
interface RollCallRosterQuery {
  scopeType: AttendanceScopeType;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  academicYearId?: string;
  yearId?: string;
  termId: string;
  date: string;
  mode?: AttendanceMode;
  periodKey?: string;
}
```

Response:

```ts
interface RollCallRosterResponse {
  session: AttendanceRollCallSessionSummary | null;
  items: AttendanceRollCallRosterRow[];
}
```

### POST `/attendance/roll-call/session/resolve`

Body:

```ts
interface ResolveRollCallSessionBody {
  scopeType: AttendanceScopeType;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  academicYearId?: string;
  yearId?: string;
  termId: string;
  date: string;
  mode: AttendanceMode;
  periodKey?: string;       // required for PERIOD mode
  periodId?: string;
  periodLabelAr?: string;
  periodLabelEn?: string;
}
```

Response:

```ts
interface RollCallSessionResponse {
  session: AttendanceRollCallSessionSummary;
  entries: AttendanceRollCallEntry[];
}
```

### GET `/attendance/roll-call/sessions`

Query:

```ts
interface ListRollCallSessionsQuery {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  scopeType?: AttendanceScopeType;
  scopeKey?: string;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  status?: AttendanceSessionStatus;
  mode?: AttendanceMode;
}
```

Response:

```ts
interface RollCallSessionsListResponse {
  items: AttendanceRollCallSessionSummary[];
}
```

Current DTO has no `page` or `limit` fields for this core list endpoint.

### PUT `/attendance/roll-call/sessions/:id/entries`

Body:

```ts
interface SaveRollCallEntriesBody {
  entries: Array<{
    studentId: string;
    enrollmentId?: string | null;
    status: AttendanceStatus;
    lateMinutes?: number | null;       // min 0
    earlyLeaveMinutes?: number | null; // min 0
    excuseReason?: string | null;      // max 1000
    note?: string | null;              // max 1000
  }>;
}
```

Response:

```ts
interface SaveRollCallEntriesResponse {
  session: AttendanceRollCallSessionSummary;
  entries: AttendanceRollCallEntry[];
}
```

### PUT `/attendance/roll-call/sessions/:id/entries/:studentId`

Body:

```ts
interface UpsertRollCallEntryBody {
  enrollmentId?: string | null;
  status: AttendanceStatus;
  lateMinutes?: number | null;
  earlyLeaveMinutes?: number | null;
  excuseReason?: string | null;
  note?: string | null;
}
```

Response: `AttendanceRollCallEntry`

### POST `/attendance/roll-call/sessions/:sessionId/entries/:studentId/correct`

Body:

```ts
interface CorrectAttendanceEntryBody {
  status: AttendanceStatus;
  lateMinutes?: number | null;
  earlyLeaveMinutes?: number | null;
  excuseReason?: string | null;
  note?: string | null;
  correctionReason: string; // required, max 1000
}
```

Response: `AttendanceRollCallEntry`

### Shared roll-call response types

```ts
interface AttendanceRollCallSessionSummary {
  id: string;
  academicYearId: string;
  yearId: string;
  termId: string;
  date: string;
  scopeType: AttendanceScopeType;
  scopeKey: string;
  scopeIds: { stageId: string | null; gradeId: string | null; sectionId: string | null; classroomId: string | null } | null;
  mode: AttendanceMode;
  periodId: string | null;
  periodKey: string;
  periodLabelAr: string | null;
  periodLabelEn: string | null;
  policyId: string | null;
  status: AttendanceSessionStatus;
  submittedAt: string | null;
  submittedById: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceRollCallEntry {
  id: string;
  sessionId: string;
  studentId: string;
  enrollmentId: string | null;
  status: AttendanceStatus;
  lateMinutes: number | null;
  minutesLate: number | null;
  earlyLeaveMinutes: number | null;
  minutesEarlyLeave: number | null;
  excuseReason: string | null;
  note: string | null;
  markedById: string | null;
  markedAt: string | null;
  student: AttendanceRollCallStudent | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 5.2 Absences / Incidents

**Base path:** `/api/v1/attendance/absences`

These rows are derived incident views from attendance entries. They cover absence, late, early-leave, and excused incidents.

### Permissions

| Endpoint | Permission |
| --- | --- |
| `GET /attendance/absences` | `attendance.absences.view` |
| `GET /attendance/absences/summary` | `attendance.absences.view` |
| `PATCH /attendance/absences/:id/excuse` | `attendance.entries.manage` |
| `PATCH /attendance/absences/:id/early-leave` | `attendance.entries.manage` |

### GET `/attendance/absences`

Query:

```ts
interface ListAttendanceAbsencesQuery {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  scopeType?: AttendanceScopeType;
  scopeKey?: string;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  studentId?: string;
  status?: AttendanceStatus;
}
```

Response:

```ts
interface AttendanceAbsencesListResponse {
  items: AttendanceAbsenceIncident[];
}
```

### GET `/attendance/absences/summary`

Same query as list.

Response:

```ts
interface AttendanceAbsenceSummaryResponse {
  totalIncidents: number;
  absentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  excusedCount: number;
  affectedStudentsCount: number;
}
```

### PATCH `/attendance/absences/:id/excuse`

Body:

```ts
interface MarkAttendanceAbsenceExcusedBody {
  excuseReason?: string | null;
  note?: string | null;
  correctionReason: string;
}
```

Response: `AttendanceAbsenceIncident`

### PATCH `/attendance/absences/:id/early-leave`

Body:

```ts
interface CorrectAttendanceAbsenceEarlyLeaveBody {
  earlyLeaveMinutes: number; // min 1
  note?: string | null;
  correctionReason: string;
}
```

Response: `AttendanceAbsenceIncident`

---
## 5.3 Formal Excuse Requests

**Base path:** `/api/v1/attendance/excuse-requests`

Formal excuse requests are separate from direct absence correction endpoints.

### Permissions

| Route group | Permission |
| --- | --- |
| Read requests/attachments | `attendance.excuses.view` |
| Create/update/delete/link attachments | `attendance.excuses.manage` |
| Approve/reject | `attendance.excuses.review` |

### Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/attendance/excuse-requests` | List requests. |
| `GET` | `/attendance/excuse-requests/:id` | Get one request. |
| `GET` | `/attendance/excuse-requests/:id/attachments` | List attachments. |
| `POST` | `/attendance/excuse-requests` | Create request. |
| `PATCH` | `/attendance/excuse-requests/:id` | Update request. |
| `POST` | `/attendance/excuse-requests/:id/attachments` | Link uploaded files by `fileIds`. |
| `POST` | `/attendance/excuse-requests/:id/approve` | Approve request. |
| `POST` | `/attendance/excuse-requests/:id/reject` | Reject request. |
| `DELETE` | `/attendance/excuse-requests/:id/attachments/:attachmentId` | Delete attachment link. |
| `DELETE` | `/attendance/excuse-requests/:id` | Delete request. |

### GET `/attendance/excuse-requests`

Query:

```ts
interface ListAttendanceExcuseRequestsQuery {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  studentId?: string;
  status?: AttendanceExcuseStatus;
  type?: AttendanceExcuseType;
  dateFrom?: string;
  dateTo?: string;
  search?: string; // max 200
}
```

Response:

```ts
interface AttendanceExcuseRequestsListResponse {
  items: AttendanceExcuseRequest[];
}
```

### POST `/attendance/excuse-requests`

Body:

```ts
interface CreateAttendanceExcuseRequestBody {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  studentId: string;
  type: AttendanceExcuseType;
  dateFrom: string;
  dateTo: string;
  selectedPeriodKeys?: string[] | null;
  selectedPeriodIds?: string[] | null;
  lateMinutes?: number | null;
  earlyLeaveMinutes?: number | null;
  reasonAr?: string | null;
  reasonEn?: string | null;
}
```

Response: `AttendanceExcuseRequest`

### PATCH `/attendance/excuse-requests/:id`

Body:

```ts
interface UpdateAttendanceExcuseRequestBody {
  type?: AttendanceExcuseType;
  dateFrom?: string;
  dateTo?: string;
  selectedPeriodKeys?: string[] | null;
  selectedPeriodIds?: string[] | null;
  lateMinutes?: number | null;
  earlyLeaveMinutes?: number | null;
  reasonAr?: string | null;
  reasonEn?: string | null;
}
```

Response: `AttendanceExcuseRequest`

### POST `/attendance/excuse-requests/:id/attachments`

This route links existing uploaded files to the request. The DTO expects `fileIds`; it is not a multipart upload contract.

```ts
interface LinkAttendanceExcuseAttachmentsBody {
  fileIds: string[]; // UUID[], non-empty
}
```

Response:

```ts
interface AttendanceExcuseAttachmentsListResponse {
  items: AttendanceExcuseAttachment[];
}
```

### Approve/reject body

For both:

```http
POST /attendance/excuse-requests/:id/approve
POST /attendance/excuse-requests/:id/reject
```

Body:

```ts
interface ReviewAttendanceExcuseRequestBody {
  decisionNote?: string | null;
}
```

Response: `AttendanceExcuseRequest`

### Delete response

```ts
interface DeleteAttendanceExcuseRequestResponse {
  ok: true;
}
```

### Excuse response types

```ts
interface AttendanceExcuseRequest {
  id: string;
  academicYearId: string;
  yearId: string;
  termId: string;
  studentId: string;
  student: AttendanceExcuseStudent | null;
  studentName: string | null;
  studentNameAr: string | null;
  studentNameEn: string | null;
  studentNumber: string | null;
  type: AttendanceExcuseType;
  status: AttendanceExcuseStatus;
  dateFrom: string;
  dateTo: string;
  selectedPeriodKeys: string[];
  selectedPeriodIds: string[];
  lateMinutes: number | null;
  minutesLate: number | null;
  earlyLeaveMinutes: number | null;
  minutesEarlyLeave: number | null;
  reasonAr: string | null;
  reasonEn: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  createdById: string | null;
  decidedById: string | null;
  linkedSessionIds: string[];
  attachmentCount: number;
  attachments?: AttendanceExcuseAttachment[];
  createdAt: string;
  updatedAt: string;
}

interface AttendanceExcuseAttachment {
  id: string;
  fileId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  createdAt: string;
  downloadUrl: string;
}
```

---

## 5.4 Reports

**Base path:** `/api/v1/attendance/reports`

Permission for all report endpoints:

```txt
attendance.reports.view
```

### Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/attendance/reports/summary` | Summary counts/rates. |
| `GET` | `/attendance/reports/daily-trend` | Daily trend rows. |
| `GET` | `/attendance/reports/scope-breakdown` | Breakdown by stage/grade/section/classroom. |
| `GET` | `/attendance/reports/derived-daily-absences` | Report-only derived daily absence rows. |

### Shared query

```ts
interface AttendanceReportBaseQuery {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  scopeType?: AttendanceScopeType;
  scopeKey?: string;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  mode?: AttendanceMode;
  periodKey?: string;
}
```

### GET `/attendance/reports/summary`

Response:

```ts
interface AttendanceSummaryReportResponse {
  totalSessions: number;
  totalEntries: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  excusedCount: number;
  unmarkedCount: number;
  incidentCount: number;
  attendanceRate: number; // 0..1, rounded to 4 decimals
  absenceRate: number;    // 0..1, rounded to 4 decimals
  lateRate: number;       // 0..1, rounded to 4 decimals
  affectedStudentsCount: number;
}
```

### GET `/attendance/reports/daily-trend`

Response:

```ts
interface AttendanceDailyTrendReportResponse {
  items: Array<{
    date: string;
    totalEntries: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    earlyLeaveCount: number;
    excusedCount: number;
    attendanceRate: number;
    incidentCount: number;
  }>;
}
```

### GET `/attendance/reports/scope-breakdown`

Query extends shared query:

```ts
interface AttendanceScopeBreakdownReportQuery extends AttendanceReportBaseQuery {
  groupBy: 'stage' | 'grade' | 'section' | 'classroom';
}
```

Response:

```ts
interface AttendanceScopeBreakdownReportResponse {
  items: Array<{
    scopeType: 'stage' | 'grade' | 'section' | 'classroom';
    scopeId: string;
    scopeNameAr: string;
    scopeNameEn: string;
    totalEntries: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    earlyLeaveCount: number;
    excusedCount: number;
    attendanceRate: number;
    incidentCount: number;
  }>;
}
```

### GET `/attendance/reports/derived-daily-absences`

Response:

```ts
interface DerivedDailyAbsencesReportResponse {
  items: Array<{
    date: string;
    studentId: string;
    scopeType: AttendanceScopeType;
    scopeKey: string;
    scopeIds: { stageId: string | null; gradeId: string | null; sectionId: string | null; classroomId: string | null };
    policyId: string;
    missedPeriodCount: number;
    requiredMissedPeriodsCount: number;
    missedPeriodIds: string[];
    evidencePeriodCount: number;
    sourcePeriodIds: string[];
    derivedStatus: AttendanceStatus;
    source: DailyComputationStrategy;
    reportOnly: true;
  }>;
}
```

---
## 5.5 Policies

**Base path:** `/api/v1/attendance/policies`

### Permissions

| Use case | Permission |
| --- | --- |
| List/effective/validate-name | `attendance.policies.view` |
| Create/update/delete | `attendance.policies.manage` |

### Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/attendance/policies` | List policies. |
| `GET` | `/attendance/policies/effective` | Resolve effective policy for a context/scope/date. |
| `GET` | `/attendance/policies/validate-name` | Validate duplicate names in context. |
| `POST` | `/attendance/policies` | Create policy. |
| `PATCH` | `/attendance/policies/:id` | Update policy. |
| `DELETE` | `/attendance/policies/:id` | Delete policy. |

### GET `/attendance/policies`

```ts
interface ListAttendancePoliciesQuery {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  scopeType?: AttendanceScopeType;
  scopeKey?: string;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  isActive?: boolean;
}
```

Response:

```ts
interface AttendancePoliciesListResponse {
  items: AttendancePolicy[];
}
```

### GET `/attendance/policies/effective`

```ts
interface EffectiveAttendancePolicyQuery {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  scopeType?: AttendanceScopeType;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  date?: string;
}
```

Response:

```ts
interface EffectiveAttendancePolicyResponse {
  policy: AttendancePolicy | null;
  requestedScope: { scopeType: AttendanceScopeType; scopeKey: string };
  matchedScope: { scopeType: AttendanceScopeType; scopeKey: string; priority: number } | null;
}
```

### GET `/attendance/policies/validate-name`

```ts
interface ValidateAttendancePolicyNameQuery {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  scopeType: AttendanceScopeType;
  scopeKey?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  nameAr?: string;
  nameEn?: string;
  excludeId?: string;
}
```

Response:

```ts
interface ValidateAttendancePolicyNameResponse {
  uniqueAr: boolean;
  uniqueEn: boolean;
  available: boolean;
}
```

### POST `/attendance/policies`

Body:

```ts
interface CreateAttendancePolicyBody {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  note?: string;

  scopeType: AttendanceScopeType;
  scopeKey?: string;
  scopeIds?: { stageId?: string; gradeId?: string; sectionId?: string; classroomId?: string };
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;

  mode: AttendanceMode;
  dailyComputationStrategy?: DailyComputationStrategy | null;
  selectedPeriodIds?: string[];

  lateThresholdMinutes?: number | null;
  earlyLeaveThresholdMinutes?: number | null;
  autoAbsentAfterMinutes?: number | null;
  absentIfMissedPeriodsCount?: number | null;

  requireExcuseAttachment?: boolean;
  requireAttachmentForExcuse?: boolean;
  requireExcuseReason?: boolean;
  allowParentExcuseRequests?: boolean;
  allowExcuses?: boolean;

  notifyGuardiansOnAbsence?: boolean;
  notifyTeachers?: boolean;
  notifyStudents?: boolean;
  notifyGuardians?: boolean;
  notifyOnAbsent?: boolean;
  notifyOnLate?: boolean;
  notifyOnEarlyLeave?: boolean;

  effectiveFrom?: string;
  effectiveStartDate?: string;
  effectiveTo?: string;
  effectiveEndDate?: string;
  isActive?: boolean;
}
```

Response: `AttendancePolicy`

### PATCH `/attendance/policies/:id`

Same fields as create, but all fields are optional.

Response: `AttendancePolicy`

### DELETE `/attendance/policies/:id`

```ts
interface DeleteAttendancePolicyResponse {
  ok: true;
}
```

### Policy response type

```ts
interface AttendancePolicy {
  id: string;
  academicYearId: string;
  yearId: string;
  termId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  note: string | null;
  scopeType: AttendanceScopeType;
  scopeKey: string;
  scopeIds: { stageId: string | null; gradeId: string | null; sectionId: string | null; classroomId: string | null } | null;
  mode: AttendanceMode;
  dailyComputationStrategy: DailyComputationStrategy;
  selectedPeriodIds: string[];
  lateThresholdMinutes: number | null;
  earlyLeaveThresholdMinutes: number | null;
  autoAbsentAfterMinutes: number | null;
  absentIfMissedPeriodsCount: number | null;
  requireExcuseAttachment: boolean;
  requireAttachmentForExcuse: boolean;
  requireExcuseReason: boolean;
  allowParentExcuseRequests: boolean;
  allowExcuses: boolean;
  notifyGuardiansOnAbsence: boolean;
  notifyTeachers: boolean;
  notifyStudents: boolean;
  notifyGuardians: boolean;
  notifyOnAbsent: boolean;
  notifyOnLate: boolean;
  notifyOnEarlyLeave: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  effectiveStartDate: string | null;
  effectiveEndDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

# 6. Teacher App Attendance Contract

Teacher App attendance is an app-facing adapter over Core Attendance roll-call.

**Base path:**

```http
/api/v1/teacher/classroom/:classId/attendance
```

Important integration notes:

- `classId` is the Teacher App allocation/class id used by `TeacherAppAccessService.assertTeacherOwnsAllocation`.
- Teacher routes are protected by global auth/scope guards.
- The controller does not declare explicit `@RequiredPermissions`; access is enforced by teacher allocation ownership in the use cases.
- Teacher App attendance resolves `DAILY` classroom sessions only.
- Teacher write statuses are only `present`, `absent`, `late`, and `excused`.
- `arrivalTime` and `dismissalTime` are accepted by DTO but the current presenter returns them as `null`, and the adapter does not persist them.
- Teacher adapter maps only `studentId`, status, and `note` into core attendance entries.

## 6.1 Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/teacher/classroom/:classId/attendance/roster` | Read roster for a date. No session creation. |
| `GET` | `/teacher/classroom/:classId/attendance/today` | Read attendance screen model with summary. |
| `POST` | `/teacher/classroom/:classId/attendance/session/resolve` | Resolve/create DAILY session. |
| `GET` | `/teacher/classroom/:classId/attendance/sessions/:sessionId` | Read one owned session. |
| `PUT` | `/teacher/classroom/:classId/attendance/sessions/:sessionId/entries` | Bulk update teacher-writeable entries. |
| `POST` | `/teacher/classroom/:classId/attendance/sessions/:sessionId/submit` | Submit owned DAILY session. |

### GET `/teacher/classroom/:classId/attendance/roster`

Query:

```ts
interface GetTeacherClassroomAttendanceRosterQuery {
  date: string;
  search?: string;
  page?: number;  // min 1; presenter default 1
  limit?: number; // min 1, max 100; presenter default 20
}
```

Response:

```ts
interface TeacherClassroomAttendanceRosterResponse {
  classId: string;
  date: string;
  session: TeacherClassroomAttendanceSession | null;
  students: TeacherClassroomAttendanceRosterStudent[];
  pagination: { page: number; limit: number; total: number };
}
```

### GET `/teacher/classroom/:classId/attendance/today`

Query is the same as roster.

Response:

```ts
interface TeacherClassroomAttendanceTodayResponse {
  classId: string;
  date: string;
  session: (TeacherClassroomAttendanceSession & { mode: 'daily' }) | null;
  summary: {
    totalCount: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    earlyLeaveCount: number;
    unmarkedCount: number;
    markedCount: number;
  };
  students: TeacherClassroomAttendanceRosterStudent[];
}
```

### POST `/teacher/classroom/:classId/attendance/session/resolve`

Body:

```ts
interface ResolveTeacherClassroomAttendanceSessionBody {
  date: string;
}
```

Response: `TeacherClassroomAttendanceSessionResponse`

### GET `/teacher/classroom/:classId/attendance/sessions/:sessionId`

Response: `TeacherClassroomAttendanceSessionResponse`

### PUT `/teacher/classroom/:classId/attendance/sessions/:sessionId/entries`

Body:

```ts
interface UpdateTeacherClassroomAttendanceEntriesBody {
  entries: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    arrivalTime?: string | null;   // accepted by DTO, not persisted by current adapter
    dismissalTime?: string | null; // accepted by DTO, not persisted by current adapter
    note?: string | null;
  }>;
}
```

Response: `TeacherClassroomAttendanceSessionResponse`

### POST `/teacher/classroom/:classId/attendance/sessions/:sessionId/submit`

No body.

Response: `TeacherClassroomAttendanceSessionResponse`

### Teacher response types

```ts
interface TeacherClassroomAttendanceSession {
  id: string;
  status: 'draft' | 'submitted';
  submittedAt: string | null;
}

interface TeacherClassroomAttendanceRosterStudent {
  id: string; // studentId
  displayName: string;
  status: 'active';
  attendanceStatus: 'present' | 'absent' | 'late' | 'excused' | 'early_leave' | 'unmarked';
  arrivalTime: string | null;
  dismissalTime: string | null;
  lateMinutes: number | null;
  earlyLeaveMinutes: number | null;
  excuseReason: string | null;
  note: string | null;
}

interface TeacherClassroomAttendanceSessionResponse {
  classId: string;
  date: string;
  session: TeacherClassroomAttendanceSession;
  entries: Array<{
    id: string;
    studentId: string;
    displayName: string | null;
    attendanceStatus: 'present' | 'absent' | 'late' | 'excused' | 'early_leave' | 'unmarked';
    arrivalTime: string | null;
    dismissalTime: string | null;
    lateMinutes: number | null;
    earlyLeaveMinutes: number | null;
    excuseReason: string | null;
    note: string | null;
    markedAt: string | null;
  }>;
}
```

---

# 7. Suggested Frontend Flows

## 7.1 Dashboard/Admin roll-call flow

1. Select `academicYearId`, `termId`, date, scope, and mode.
2. Call `GET /attendance/roll-call/roster` to preview students and current state.
3. Call `POST /attendance/roll-call/session/resolve` only when user starts/resolves attendance.
4. Save entries with either:
   - `PUT /attendance/roll-call/sessions/:id/entries`
   - `PUT /attendance/roll-call/sessions/:id/entries/:studentId`
5. Submit using `POST /attendance/roll-call/sessions/:id/submit`.
6. After submit, use correction endpoint with `correctionReason` instead of normal draft save.

## 7.2 Teacher app classroom flow

1. Open screen using `GET /teacher/classroom/:classId/attendance/today?date=YYYY-MM-DD`.
2. If `session` is `null` and teacher starts attendance, call `POST /teacher/classroom/:classId/attendance/session/resolve`.
3. Save lowercase statuses with `PUT /teacher/classroom/:classId/attendance/sessions/:sessionId/entries`.
4. Submit with `POST /teacher/classroom/:classId/attendance/sessions/:sessionId/submit`.

## 7.3 Absence management flow

1. List incidents with `GET /attendance/absences`.
2. Show counters with `GET /attendance/absences/summary`.
3. Directly excuse an incident using `PATCH /attendance/absences/:id/excuse`.
4. Correct early leave using `PATCH /attendance/absences/:id/early-leave`.
5. Use `/attendance/excuse-requests/*` for the formal approval/rejection lifecycle.

---

# 8. Frontend Checklist

## Do

- Use `/api/v1` prefix.
- Use bearer auth.
- Use uppercase enums for core `/attendance/*` endpoints.
- Use lowercase enums for Teacher App attendance endpoints.
- Prefer `academicYearId` over `yearId`.
- Use roster/today endpoints for read-only screen rendering.
- Use `session/resolve` only when the UI intentionally starts attendance.
- Include `correctionReason` on correction endpoints.
- Treat report rates as `0..1` decimals, not `0..100` percentages.

## Do not

- Do not send unknown fields; they are rejected.
- Do not send `PERIOD` roll-call without `periodKey`.
- Do not send mismatched scope parent IDs.
- Do not write `early_leave` from Teacher App; use core/admin correction flows.
- Do not expect Teacher App `arrivalTime`/`dismissalTime` persistence in the current adapter.
- Do not expect pagination on core list endpoints unless the DTO explicitly includes `page`/`limit`.

---

# 9. Source Files Reviewed

- `src/main.ts`
- `src/app.module.ts`
- `src/common/exceptions/domain-exception.ts`
- `src/common/exceptions/global-exception.filter.ts`
- `src/common/decorators/required-permissions.decorator.ts`
- `prisma/schema.prisma`
- `src/modules/attendance/attendance.module.ts`
- `src/modules/attendance/roll-call/controller/attendance-roll-call.controller.ts`
- `src/modules/attendance/roll-call/dto/attendance-roll-call.dto.ts`
- `src/modules/attendance/roll-call/domain/session-key.ts`
- `src/modules/attendance/roll-call/domain/roll-call.exceptions.ts`
- `src/modules/attendance/roll-call/application/resolve-roll-call-session.use-case.ts`
- `src/modules/attendance/roll-call/application/roll-call-use-case.helpers.ts`
- `src/modules/attendance/absences/controller/attendance-absences.controller.ts`
- `src/modules/attendance/absences/dto/attendance-absences.dto.ts`
- `src/modules/attendance/excuses/controller/attendance-excuses.controller.ts`
- `src/modules/attendance/excuses/dto/attendance-excuse.dto.ts`
- `src/modules/attendance/reports/controller/attendance-reports.controller.ts`
- `src/modules/attendance/reports/dto/attendance-reports.dto.ts`
- `src/modules/attendance/reports/domain/attendance-report.ts`
- `src/modules/attendance/policies/controller/attendance-policies.controller.ts`
- `src/modules/attendance/policies/dto/attendance-policy.dto.ts`
- `src/modules/attendance/policies/application/create-attendance-policy.use-case.ts`
- `src/modules/attendance/policies/domain/policy.exceptions.ts`
- `src/modules/teacher-app/classroom/attendance/controller/teacher-classroom-attendance.controller.ts`
- `src/modules/teacher-app/classroom/attendance/dto/teacher-classroom-attendance.dto.ts`
- `src/modules/teacher-app/classroom/attendance/infrastructure/teacher-classroom-attendance.adapter.ts`
- `src/modules/teacher-app/classroom/attendance/presenters/teacher-classroom-attendance.presenter.ts`
