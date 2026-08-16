# Admissions Module — Backend/Frontend Compatibility Gaps

This document lists known gaps between the frontend admissions pages and the Moazez Backend API.

---

## Leads Page

### ✅ Fully Compatible

The leads page CRUD operations are fully wired and working:
- `GET /admissions/leads` — list (query: `status`, `channel`)
- `GET /admissions/leads/:id` — get by ID
- `POST /admissions/leads` — create
- `PATCH /admissions/leads/:id` — update

Enum values match exactly on both sides (Status: New/Contacted/Converted/Closed, Channel: In-app/Referral/Walk-in/Other).

### ⚠️ Minor Gaps

| Gap | Detail | Impact |
|-----|--------|--------|
| `search` query param | Frontend sends `?search=...` but backend `ListLeadsQueryDto` only accepts `status` and `channel` | Search is ignored server-side. Frontend does client-side filtering, so no breakage. |
| No pagination | Backend returns flat array, no pagination metadata | Works for now, may need pagination for large datasets. |

### 🗑️ Removed (No Backend Support)

The following frontend stubs were removed since no backend endpoints exist:
- **Activity Log** — No backend endpoint for lead activities
- **Notes** — No backend endpoint for lead notes
- **Import Leads** — No backend import endpoint

---

## Applications Page

### ✅ Working Endpoints

| Frontend Call | Backend Endpoint | Status |
|--------------|-----------------|--------|
| `GET /admissions/applications` | `ApplicationsController.listApplications` | ✅ Works |
| `GET /admissions/applications/:id` | `ApplicationsController.getApplication` | ✅ Works |
| `POST /admissions/applications` | `ApplicationsController.createApplication` | ✅ Works |
| `PATCH /admissions/applications/:id` | `ApplicationsController.updateApplication` | ✅ Works |
| `POST /admissions/applications/:id/submit` | `ApplicationsController.submitApplication` | ✅ Works |
| `POST /admissions/applications/:id/enroll` | `ApplicationsController.enrollApplication` | ✅ Works |
| `GET /admissions/tests` | `PlacementTestsController.listPlacementTests` | ✅ Works |
| `POST /admissions/tests` | `PlacementTestsController.createPlacementTest` | ✅ Works |
| `GET /admissions/tests/:id` | `PlacementTestsController.getPlacementTest` | ✅ Works |
| `PATCH /admissions/tests/:id` | `PlacementTestsController.updatePlacementTest` | ✅ Works |
| `GET /admissions/interviews` | `InterviewsController.listInterviews` | ✅ Works |
| `POST /admissions/interviews` | `InterviewsController.createInterview` | ✅ Works |
| `PATCH /admissions/interviews/:id` | `InterviewsController.updateInterview` | ✅ Works |
| `GET /admissions/decisions` | `DecisionsController.listDecisions` | ✅ Works |
| `POST /admissions/decisions` | `DecisionsController.createDecision` | ✅ Works |
| `GET /admissions/applications/:id/documents` | Documents list | ✅ Works |
| `POST /admissions/applications/:id/documents` | Link document | ✅ Works |
| `POST /files` | File upload | ✅ Works |

### ⚠️ Known Gaps

#### 1. No `applicationId` filter on list endpoints

**Affected endpoints:**
- `GET /admissions/tests` — `ListPlacementTestsQueryDto` accepts: `search`, `status`, `type`, `dateFrom`, `dateTo`, `page`, `limit`
- `GET /admissions/interviews` — `ListInterviewsQueryDto` accepts: `search`, `status`, `dateFrom`, `dateTo`, `page`, `limit`
- `GET /admissions/decisions` — `ListDecisionsQueryDto` accepts: `search`

**None of these accept `applicationId` as a query filter.**

**Current workaround:** Frontend fetches all records and filters client-side by `applicationId`. This works but is inefficient for schools with many tests/interviews/decisions.

**Recommended backend fix:** Add `@IsOptional() @IsUUID() applicationId?: string` to each list query DTO and filter in the repository.

---

#### 2. Guardians not available on Application response

**Backend `ApplicationResponseDto` returns:**
```
id, leadId, studentName, requestedAcademicYearId, requestedGradeId,
source, status, submittedAt, createdAt, updatedAt
```

**Frontend expects:** A `guardians[]` array with full guardian details (name, phone, email, national_id, job_title, workplace, permissions).

**Current state:** The backend's admissions module does not store or return guardian data on the application. Guardians are a Students module concept (created after enrollment via `POST /students-guardians/students/:studentId/guardians`).

**Impact:** The "Guardians" tab in the application detail page shows empty/fallback content.

**Frontend handling:** `GuardiansTab` gracefully falls back to showing `guardianName`, `guardianPhone`, `guardianEmail` from flat fields (also empty from backend).

**Recommended backend fix:** Either:
1. Store guardian draft data submitted during application creation and return it in `ApplicationResponseDto`
2. Or add a dedicated endpoint: `GET /admissions/applications/:id/guardians`

---

#### 3. Minimal Application response (missing student details)

**Backend returns:** Only IDs and status fields.

**Frontend expects:** Rich student data including `full_name_ar`, `full_name_en`, `gender`, `date_of_birth`, `nationality`, `grade_requested`, `stage`, `address_line`, `city`, `district`, `medical_conditions`, `notes`.

**Impact:** The "Details" tab shows mostly empty/N/A values. The applications list table shows empty columns for gender, nationality, date of birth.

**Frontend handling:** The `normalizeApplication` utility fills in empty string defaults so the UI doesn't crash.

**Recommended backend fix:** Include student profile data in `ApplicationResponseDto` or provide a separate endpoint for application student details.

---

#### 4. `search` and `page`/`limit` on applications list

**Backend `ListApplicationsQueryDto` only accepts:** `status`

**Frontend sends:** `search`, `status`, `page`, `limit`

**Impact:** Search and pagination params are silently ignored. Frontend does client-side filtering and pagination.

---

#### 5. Application creation stepper sends minimal data to backend

**Frontend stepper collects (3 steps, 30+ fields):**
- Step 1 — Student: full Arabic name (4 parts), full English name (4 parts), gender, DOB, nationality, stage, grade, section, address, city, district, previous school, medical conditions, notes
- Step 2 — Guardians: full_name, relation, phone_primary, phone_secondary, email, national_id, job_title, workplace, is_primary, can_pickup, can_receive_notifications (multiple guardians)
- Step 3 — Documents: file uploads with configId, labels, required flag

**What actually gets sent to `POST /admissions/applications`:**
```json
{
  "leadId": "uuid",
  "studentName": "Full Name",
  "requestedAcademicYearId": "uuid",
  "requestedGradeId": "uuid",
  "source": "referral"
}
```

**Backend `CreateApplicationDto` only accepts:** `leadId`, `studentName`, `requestedAcademicYearId`, `requestedGradeId`, `source`

**Impact:** All guardian data, student demographics (gender, DOB, nationality, address, medical info), and document uploads collected in the stepper are **discarded** — they never reach the backend. Users fill in 30+ fields but only 5 are persisted.

**Recommended backend fix:** Either:
1. Expand `CreateApplicationDto` to accept nested student details, guardians, and document references
2. Or create a multi-step API: create application → attach student details → attach guardians → link documents (using existing document endpoints)

---

#### 6. `requestedGradeId` is a UUID, not a display name

**Backend returns:** `requestedGradeId: "uuid-string"` and `requestedGradeId` only.

**Frontend expects:** A human-readable grade name like "Grade 6" or "الصف السادس".

**Impact:** The grade field in the application detail page displays a raw UUID instead of a readable grade name.

**Frontend handling:** The normalizer reads from `requestedGradeName` first (doesn't exist), then falls back to `requestedGradeId` (the UUID).

**Recommended backend fix:** Include `requestedGradeName` (or resolve the grade name from the academic structure) in `ApplicationResponseDto`.

---

#### 7. No `maxScore` field on placement tests

**Backend `UpdatePlacementTestDto` accepts:** `score` (number 0-999.99), `result`, `status`, `scheduledAt`

**Backend `PlacementTestResponseDto` returns:** `score` (number | null) — no `maxScore` field.

**Frontend expects:** Both `score` and `maxScore` to calculate percentage and display "85/100".

**Current state:** The frontend's `TestScoreModal` collects `maxScore` from the user but it's never sent to the backend. The `normalizeTest` utility defaults `maxScore` to 100. The value is purely client-side and lost on page reload.

**Frontend is ready:** If the backend adds a `maxScore` field to `UpdatePlacementTestDto` and `PlacementTestResponseDto`, the frontend will pick it up automatically via `normalizeTest` which reads `maxScore` from the response.

**Recommended backend fix:** Add `maxScore` (number, optional, default 100) to both the update DTO and response DTO.

---

#### 8. No `rating` field on interviews

**Backend `UpdateInterviewDto` accepts:** `scheduledAt?`, `interviewerUserId?`, `status?`, `notes?`

**Backend `InterviewResponseDto` returns:** `id`, `applicationId`, `studentName`, `scheduledAt`, `interviewerUserId`, `interviewerName`, `status`, `notes`, `createdAt`, `updatedAt`

**Frontend expects:** A `rating` field (number 1-5) to store interview quality assessment.

**Current state:** The backend has no `rating` field. The frontend's `InterviewRatingModal` collects a rating but it cannot be persisted. The rating value is lost on page reload.

**Frontend handling:** The complete interview action sends `{ status: "completed", notes }` to the backend. The rating number is not sent (would be rejected by whitelist validation).

**Recommended backend fix:** Add `rating` (integer 1-5, optional) to both `UpdateInterviewDto` and `InterviewResponseDto`.

---

#### 9. Decisions are immutable — no update or delete endpoint

**Backend controller only has:** `GET /admissions/decisions`, `POST /admissions/decisions`, `GET /admissions/decisions/:id`

**No `PATCH` or `DELETE` endpoint exists.**

**Impact:** Once a decision is created for an application, it cannot be changed. If an admin wants to move a student from "waitlisted" to "accepted", or reverse a "rejected" decision, there's no way to do it through the API.

**Use case:** Admin initially waitlists a student, then later wants to accept them when a spot opens. Or a rejection was made in error and needs to be reversed.

**Current state:** The backend rejects duplicate decisions with 409 ("A decision already exists for this application"). There's no way to update the existing decision's type (accept/waitlist/reject) or reason.

**Recommended backend fix:** Add `PATCH /admissions/decisions/:id` accepting:
```typescript
{
  decision?: "accept" | "waitlist" | "reject";
  reason?: string;
}
```

Or alternatively, add a "revoke and re-decide" flow: `DELETE /admissions/decisions/:id` + create a new one.

---

#### 10. Enrollment is a preview-only endpoint — full enrollment flow not automated

**Backend `POST /admissions/applications/:id/enroll`** is a **handoff preview only**. It validates eligibility and returns draft data but does NOT create a student, guardian, or enrollment record.

**Handoff response returns:**
```json
{
  "applicationId": "uuid",
  "eligible": true,
  "handoff": {
    "studentDraft": { "fullName": "..." },
    "guardianDrafts": [{ "fullName": "...", "phone": "...", "email": "..." }],
    "enrollmentDraft": {
      "requestedAcademicYearId": "uuid",
      "requestedAcademicYearName": "...",
      "requestedGradeId": "uuid",
      "requestedGradeName": "..."
    }
  }
}
```

**To actually enroll, the frontend would need to:**
1. `POST /admissions/applications/:id/enroll` → get handoff preview
2. `POST /students-guardians/students` → create student (requires: `full_name_en`, optional: name parts, DOB, gender, nationality, contact)
3. `POST /students-guardians/students/:studentId/guardians` → create/link guardian (requires: `full_name`, `phone_primary`, `relation`)
4. `POST /students-guardians/enrollments` → create enrollment (requires: `studentId`, `classroomId` (required!), `enrollmentDate`)

**Blocker:** `CreateEnrollmentDto` requires `classroomId` (UUID, required) which is NOT in the handoff preview. The admin must select a classroom manually. This requires fetching available classrooms from the academics module for the requested grade/year.

**Current frontend behavior:** Shows an alert saying "Enrollment handoff preview created successfully" — doesn't actually enroll.

**Recommended approach:** Build a multi-step enrollment modal that:
1. Calls handoff preview
2. Shows student/guardian draft data for review
3. Lets admin select a classroom (fetched from academics)
4. On confirm: creates student → links guardian → creates enrollment
5. Handles errors and partial failures gracefully

---

#### 11. No "enrolled" status on application — enrollment state not queryable

**Backend `ApplicationResponseDto` status values:** `documents_pending`, `submitted`, `under_review`, `accepted`, `waitlisted`, `rejected`

**No "enrolled" status exists.** The backend doesn't update the application status after enrollment.

**`ListEnrollmentsQueryDto` accepts:** `studentId`, `academicYearId`, `academicYear`, `status` — but NOT `applicationId`.

**Impact:** After enrolling a student, there's no way to query "is this application's student enrolled?" from the API. The frontend tracks enrollment locally (in component state) which is lost on page reload.

**Current frontend handling:** After successful enrollment, the action bar shows "Student Enrolled Successfully" badge and hides all action buttons. This state is lost on page refresh.

**Recommended backend fix:** Either:
1. Add an `enrolled` status to `ApplicationStatus` and update it after enrollment
2. Or add `applicationId` filter to `ListEnrollmentsQueryDto` so the frontend can check

---

## Summary — What Works Today

| Feature | Status |
|---------|--------|
| Leads CRUD | ✅ Fully working |
| Lead → Application conversion | ✅ Working |
| Applications CRUD | ✅ Working (minimal response) |
| Application submit | ✅ Working |
| Schedule placement test | ✅ Working |
| Schedule interview | ✅ Working |
| Make decision | ✅ Working |
| Enrollment handoff | ✅ Working |
| Upload & link documents | ✅ Working |
| Application detail — student info | ⚠️ Empty (backend doesn't return it) |
| Application detail — guardians | ⚠️ Empty (backend doesn't return it) |
| Application detail — tests tab | ✅ Working (client-side filter) |
| Application detail — interviews tab | ✅ Working (client-side filter) |
| Application detail — documents tab | ✅ Working |
| Application detail — timeline | ⚠️ Derived from available data |
| Application list — search | ⚠️ Client-side only |
| Application list — pagination | ⚠️ Client-side only |
