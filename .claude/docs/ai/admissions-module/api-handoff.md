# API Handoff: admissions-module

## 1. Purpose and scope

This handoff documents the admissions domain as it exists in the current repository and is intended to help frontend developers align UI and integration work.

This repository is **not a backend-first admissions service**. The admissions module is primarily implemented as:

- domain types
- mock linked data
- local/mock service functions
- UI flows and modal forms
- settings persisted in local storage

Because of that, this document explicitly separates:

1. **Implemented contract visible in code** — actual types, local service functions, and behaviors currently implemented
2. **Inferred contract based on UI/types/mock data** — backend-facing DTOs and endpoints strongly implied by usage
3. **Missing backend details / TODO** — important backend contracts not actually implemented in this repo and requiring confirmation

Feature name: `admissions-module`

Primary workflow inferred from the codebase:

`Lead -> Application -> Test -> Interview -> Decision -> Enrollment -> Student`

Primary source files:

- `src/features/admissions/types/enums.ts`
- `src/features/admissions/applications/types/application.ts`
- `src/features/admissions/leads/types/lead.ts`
- `src/features/admissions/applications/types/guardian.ts`
- `src/features/admissions/applications/types/document.ts`
- `src/features/admissions/tests/types/test.ts`
- `src/features/admissions/interviews/types/interview.ts`
- `src/features/admissions/decisions/types/decision.ts`
- `src/features/admissions/enrollment/types/enrollment.ts`
- `src/data/mockDataLinked.ts`
- `src/features/admissions/applications/services/applicationCreationService.ts`
- `src/features/admissions/applications/components/ApplicationCreateStepper.tsx`
- `src/features/admissions/leads/services/mockLeadsApi.ts`
- `src/features/admissions/enrollment/services/enrollmentService.ts`
- `src/features/admissions/applications/pages/ApplicationsList.tsx`
- `src/app/[lang]/(dashboard)/admissions/applications/[id]/layout.tsx`
- `src/features/admissions/decisions/components/DecisionModal.tsx`
- `src/features/admissions/tests/components/ScheduleTestModal.tsx`
- `src/features/admissions/interviews/components/ScheduleInterviewModal.tsx`
- `src/features/admissions/enrollment/components/EnrollmentForm.tsx`
- `src/features/admissions/dashboard/views/AdmissionsDashboardView.tsx`
- `src/features/settings/services/settingsService.ts`
- `src/features/settings/constants/defaults.ts`
- `src/features/settings/admissions-documents/pages/SettingsAdmissionsDocumentsPage.tsx`
- `src/features/settings/types/index.ts`
- `src/hooks/usePermissions.ts`
- `src/features/admissions/shared/hooks/useAdmissionsYearTermContext.tsx`

---

## 2. Business context

The admissions module tracks a prospective student from first inquiry through enrollment.

At a business level the codebase models the following lifecycle:

1. **Lead**
   - A parent/guardian inquiry enters the system
   - Lead has channel, status, grade interest, notes, and conversation/activity history
2. **Application**
   - A formal student application is created, optionally linked to a lead
   - The application contains student profile data, guardians, uploaded/missing documents, and later linked assessments and decisions
3. **Test**
   - Placement/entrance tests can be scheduled and tracked per application
4. **Interview**
   - Interviews can be scheduled and tracked per application
5. **Decision**
   - Application can be accepted, waitlisted, or rejected
6. **Enrollment**
   - Accepted applicants can be assigned to academic year, grade, section, and classroom
7. **Student**
   - Accepted applications are converted into student records in the students/guardians domain

The module also includes:

- admissions dashboard analytics
- admissions document requirement configuration under settings
- year/term context that can force the module into read-only mode when the selected term is closed

---

## 3. Contract confidence legend

### A. Implemented contract visible in code

Use these as the most reliable contract sources in this repo:

- TypeScript domain types
- local/mock service payloads and return types
- validation rules enforced in components/services
- permissions checks and read-only checks

### B. Inferred contract based on UI/types/mock data

Use these as the most likely backend contract shape when building or aligning integrations:

- endpoint groups proposed below
- DTOs derived from modal forms and service payloads
- dashboard query/filter needs derived from UI
- document configuration contract derived from settings pages

### C. Missing backend details requiring confirmation

Not implemented in the repo and should **not** be treated as confirmed backend behavior:

- real REST/GraphQL endpoints
- real file upload/storage APIs
- real persistence for test scheduling, interview scheduling, and decisions
- real lead import pipeline
- real notification dispatch behavior
- audit, auth, and access token mechanics beyond local mock/session handling

---

## 4. Canonical enums and constants

## 4.1 Admissions enums implemented in code

Source: `src/features/admissions/types/enums.ts`

```ts
export type LeadChannel = "In-app" | "Referral" | "Walk-in" | "Other";
export type LeadStatus = "New" | "Contacted" | "Converted" | "Closed";
export type ActivityType = "Call" | "WhatsApp" | "Email" | "Note" | "StatusChange";

export type ApplicationStatus =
  | "submitted"
  | "documents_pending"
  | "under_review"
  | "accepted"
  | "waitlisted"
  | "rejected";

export type TestStatus =
  | "scheduled"
  | "completed"
  | "failed"
  | "cancelled"
  | "rescheduled";

export type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type DecisionType = "accept" | "waitlist" | "reject";
export type DocumentStatus = "complete" | "missing";
export type ApplicationSource = "in_app" | "referral" | "walk_in" | "other";
```

## 4.2 Default admissions document requirement constants

Source: `src/features/settings/constants/defaults.ts`

Implemented default settings:

```ts
[
  {
    id: "birth-certificate",
    nameEn: "Birth Certificate",
    nameAr: "شهادة الميلاد",
    required: true,
    active: true,
    sortOrder: 1,
  },
  {
    id: "passport-copy",
    nameEn: "Passport Copy",
    nameAr: "نسخة جواز السفر",
    required: true,
    active: true,
    sortOrder: 2,
  },
  {
    id: "medical-report",
    nameEn: "Medical Report",
    nameAr: "التقرير الطبي",
    required: false,
    active: true,
    sortOrder: 3,
  },
  {
    id: "previous-school-certificate",
    nameEn: "Previous School Certificate",
    nameAr: "شهادة المدرسة السابقة",
    required: false,
    active: true,
    sortOrder: 4,
  }
]
```

---

## 5. Implemented domain models

## 5.1 Lead

Sources:

- `src/features/admissions/leads/types/lead.ts`
- `src/data/mockDataLinked.ts`

### Implemented contract visible in code

```ts
interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  status: LeadStatus;
  createdAt: string;
  gradeInterest?: string;
  source?: string;
  notes?: string;
  [key: string]: unknown;
}
```

Related lead models:

```ts
interface ActivityLogItem {
  id: string;
  leadId: string;
  type: ActivityType;
  message: string;
  createdAt: string;
  createdBy: string;
}

interface Note {
  id: string;
  leadId: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

interface ApplicationDraft {
  id: string;
  leadId: string;
  studentName: string;
  gradeRequested?: string;
  status: "Draft";
  createdAt: string;
}
```

### Inferred additions used by mocks/UI

The linked mock dataset includes additional lead-like fields not declared in the core `Lead` interface but actively used in data:

- `studentName`
- `studentNameArabic`
- `source` values like `walk_in`, `in_app`, `referral`, `other`

These should be treated as **inferred contract** or a pending type cleanup.

## 5.2 Application

Source: `src/features/admissions/applications/types/application.ts`

### Implemented contract visible in code

```ts
interface Application {
  id: string;
  leadId?: string;
  source?: ApplicationSource;
  status: ApplicationStatus;
  submittedDate: string;

  first_name_ar?: string;
  father_name_ar?: string;
  grandfather_name_ar?: string;
  family_name_ar?: string;
  first_name_en?: string;
  father_name_en?: string;
  grandfather_name_en?: string;
  family_name_en?: string;
  full_name_ar: string;
  full_name_en: string;
  studentName: string;
  studentNameArabic?: string;
  gender: string;
  date_of_birth: string;
  dateOfBirth?: string;
  nationality: string;

  address_line?: string;
  city?: string;
  district?: string;
  student_phone?: string;
  student_email?: string;

  grade_requested: string;
  gradeRequested: string;
  stage?: string;
  section?: string;
  previous_school?: string;
  previousSchool?: string;
  join_date?: string;

  medical_conditions?: string;
  notes?: string;

  guardians: Guardian[];
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;

  documents: Document[];
  tests: Test[];
  interviews: Interview[];
  decision?: Decision;

  [key: string]: unknown;
}
```

## 5.3 Guardian

Source: `src/features/admissions/applications/types/guardian.ts`

```ts
interface Guardian {
  id?: string;
  full_name: string;
  relation: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  national_id: string;
  job_title: string;
  workplace: string;
  is_primary: boolean;
  can_pickup: boolean;
  can_receive_notifications: boolean;
}
```

## 5.4 Document

Source: `src/features/admissions/applications/types/document.ts`

```ts
interface Document {
  id: string;
  type: string;
  name: string;
  status: "complete" | "missing";
  configId?: string;
  labelEn?: string;
  labelAr?: string;
  required?: boolean;
  uploadedDate?: string;
  url?: string;
  fileType?: "pdf" | "image" | "doc";
}
```

## 5.5 Test

Source: `src/features/admissions/tests/types/test.ts`

```ts
interface Test {
  id: string;
  applicationId: string;
  type: string;
  subject: string;
  date: string;
  time: string;
  duration?: string;
  location: string;
  proctor?: string;
  proctorPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  status: TestStatus;
  score?: number;
  maxScore?: number;
  notes?: string;
}
```

## 5.6 Interview

Source: `src/features/admissions/interviews/types/interview.ts`

```ts
interface Interview {
  id: string;
  applicationId: string;
  date: string;
  time: string;
  duration?: string;
  interviewer: string;
  interviewerPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  location: string;
  status: InterviewStatus;
  notes?: string;
  rating?: number;
}
```

## 5.7 Decision

Source: `src/features/admissions/decisions/types/decision.ts`

```ts
interface Decision {
  id: string;
  applicationId: string;
  decision: "accept" | "waitlist" | "reject";
  reason: string;
  decisionDate: string;
  decidedBy: string;
}
```

## 5.8 Enrollment

Source: `src/features/admissions/enrollment/types/enrollment.ts`

```ts
interface Enrollment {
  id: string;
  applicationId: string;
  academicYear: string;
  grade: string;
  section: string;
  classroom?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  startDate: string;
  enrolledDate: string;
}
```

## 5.9 Admissions document configuration

Source: `src/features/settings/types/index.ts`

```ts
interface AdmissionsRequiredDocumentConfig {
  id: string;
  nameEn: string;
  nameAr: string;
  required: boolean;
  active: boolean;
  sortOrder: number;
}
```

---

## 6. Implemented workflow and business rules

## 6.1 Lead workflow

Sources:

- `src/features/admissions/leads/pages/LeadsList.tsx`
- `src/features/admissions/leads/services/mockLeadsApi.ts`

### Implemented contract visible in code

- Leads are listed and filtered by:
  - search
  - status
  - channel
  - date range
- Lead actions include:
  - create lead
  - import leads (stub only)
  - convert lead to application draft
- Lead conversion currently returns an `ApplicationDraft`, not a full application.

Implemented service methods:

- `getLeads(): Lead[]`
- `getLeadById(id)`
- `createLead(leadData)`
- `getActivitiesByLeadId(leadId)`
- `addActivity(activityData)`
- `getNotesByLeadId(leadId)`
- `addNote(noteData)`
- `convertLeadToApplication(leadId): ApplicationDraft`

### Implemented behavior details

`convertLeadToApplication()` currently:

- validates lead exists
- creates `APP-DRAFT-${Date.now()}`
- copies:
  - `leadId`
  - `studentName` from `lead.name`
  - `gradeRequested` from `lead.gradeInterest`
- sets `status: "Draft"`
- logs a `StatusChange` activity

### Important note

This is **not** a real application creation API. It is a draft conversion helper in a mock service.

## 6.2 Application creation workflow

Sources:

- `src/features/admissions/applications/components/ApplicationCreateStepper.tsx`
- `src/features/admissions/applications/services/applicationCreationService.ts`

### Implemented UI flow

The application creation flow is a 3-step stepper:

1. Student info
2. Guardian info
3. Documents

During creation, the UI loads:

- admissions document requirements from settings
- academic structure (stages, grades, sections) from academic structure services
- current admissions year/term context

### Implemented service payload

```ts
interface ApplicationCreationPayload {
  student: {
    first_name_ar: string;
    father_name_ar: string;
    grandfather_name_ar: string;
    family_name_ar: string;
    first_name_en: string;
    father_name_en: string;
    grandfather_name_en: string;
    family_name_en: string;
    full_name_ar: string;
    full_name_en: string;
    gender: string;
    date_of_birth: string;
    nationality: string;
    stage: string;
    grade_requested: string;
    section?: string;
    address_line: string;
    city: string;
    district: string;
    status: string;
    join_date: string;
    notes: string;
    previous_school: string;
    medical_conditions: string;
  };
  guardians: Guardian[];
  documents: UploadedApplicationDocumentInput[];
}
```

```ts
interface UploadedApplicationDocumentInput {
  configId: string;
  labelEn: string;
  labelAr: string;
  required: boolean;
  uploaded: boolean;
  fileName?: string;
  fileType?: "pdf" | "image" | "doc";
}
```

### Implemented service behavior

`createApplication(payload)` currently:

- generates application ID as `APP-{currentYear}-{sequence}`
- transforms document inputs into `Document[]`
- derives primary guardian summary fields from `is_primary`
- sets application status by required-doc completeness:
  - `documents_pending` if any required document is missing
  - otherwise `submitted`
- creates guardian ids as `G-{applicationId}-{index}`
- inserts the application into local mock data via `mockApplications.unshift(application)`

### Important implemented limitation

The service currently hardcodes:

```ts
source: "walk_in"
```

That means source attribution is **not** being preserved from a lead or selected input in the implemented create flow.

Treat that as a backend/contract gap that needs confirmation.

## 6.3 Document requirement behavior during application creation

### Implemented behavior visible in code

The application create stepper loads document requirements with:

- `fetchAdmissionsDocumentRequirements()`
- only `active` requirements are shown
- active requirements are sorted by `sortOrder`

When the application is created:

- if a document is **not uploaded and not required**, it is omitted entirely from the created document list
- if a document is **required and not uploaded**, it is included with `status: "missing"`
- if uploaded, it is included with `status: "complete"`

### Important implemented UI behavior

The create stepper computes `missingRequiredDocuments`, but `validateStep3()` currently always returns `true`.

That means:

- missing required docs do **not** block submission
- instead, the application is created with status `documents_pending`

This is a key business rule that frontend should mirror unless product decides to make required docs blocking.

## 6.4 Test workflow

Sources:

- `src/features/admissions/tests/components/ScheduleTestModal.tsx`
- `src/app/[lang]/(dashboard)/admissions/applications/[id]/layout.tsx`
- `src/features/admissions/applications/pages/ApplicationDetailsPage.tsx`

### Implemented UI payload

```ts
{
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  type: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  proctor: string;
  proctorPhone: string;
  notes: string;
}
```

### Implemented validation visible in UI

Required fields:

- `studentName` (read-only, prefilled)
- `subject`
- `date`
- `time`
- `location`

Optional fields:

- guardianName
- guardianPhone
- proctor
- proctorPhone
- notes

Default values:

- `type = "Placement Test"`
- `duration = "60"`

### Missing backend details / TODO

In the currently implemented admissions detail page and layout, test submission only logs to console and closes the modal. There is no real persistence API in this repo for:

- create test
- update test
- cancel/reschedule test
- record test result

## 6.5 Interview workflow

Sources:

- `src/features/admissions/interviews/components/ScheduleInterviewModal.tsx`
- `src/app/[lang]/(dashboard)/admissions/applications/[id]/layout.tsx`
- `src/features/admissions/applications/pages/ApplicationDetailsPage.tsx`

### Implemented UI payload

```ts
{
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  date: string;
  time: string;
  interviewer: string;
  interviewerPhone: string;
  location: string;
  duration: string;
  notes: string;
}
```

### Implemented validation visible in UI

Required fields:

- `studentName` (read-only, prefilled)
- `date`
- `time`
- `interviewer`
- `location`

Optional fields:

- guardianName
- guardianPhone
- interviewerPhone
- notes

Default values:

- `duration = "30"`

### Missing backend details / TODO

As with tests, interview submission currently logs to console and closes the modal. There is no real backend contract implemented for:

- create interview
- update interview
- cancel/reschedule interview
- save rating/notes outcome

## 6.6 Decision workflow

Sources:

- `src/features/admissions/decisions/components/DecisionModal.tsx`
- `src/app/[lang]/(dashboard)/admissions/applications/[id]/layout.tsx`

### Implemented UI payload

The modal emits:

```ts
onSubmit(decision: DecisionType, reason: string, date: string)
```

### Implemented evaluation summary logic

Before making a decision, the UI computes and displays:

- whether any application test has `status === "completed"`
- whether any application interview has `status === "completed"`
- whether all documents have `status === "complete"`

The modal also displays:

- first test score/max score if available
- first interview rating if available

### Important implemented limitation

The modal contains `sendNotification` state with default `true`, but that flag is **not passed** to `onSubmit`.

So current implementation does **not** carry notification intent into any service or backend layer.

### Missing backend details / TODO

Decision submit currently logs to console and closes the modal. No real persistence API is implemented for:

- create/update final decision
- trigger notification to guardians
- enforce preconditions before acceptance or rejection

## 6.7 Enrollment workflow

Sources:

- `src/features/admissions/enrollment/components/EnrollmentForm.tsx`
- `src/features/admissions/enrollment/services/enrollmentService.ts`
- `src/features/admissions/applications/pages/ApplicationDetailsPage.tsx`

### Implemented UI gating

The enroll action is only shown in the application detail layout when:

```ts
application.status === "accepted"
```

### Implemented enrollment payload

```ts
interface EnrollmentSubmission {
  academicYear: string;
  grade: string;
  section: string;
  classroom: string;
  startDate: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}
```

### Implemented behavior visible in code

`submitApplicationEnrollment(application, payload)`:

- resolves a student id from the students mock dataset using `applicationId`
- falls back to `STU-${application.id}` if no student exists
- delegates to students module `upsertEnrollment()`
- writes enrollment with:
  - `studentId`
  - academic year
  - grade / section / classroom
  - ids for grade / section / classroom
  - `enrollmentDate = payload.startDate`
  - `status = "active"`

### Important implemented note

This is an adapter into the students/guardians domain, not a dedicated admissions backend API.

### Additional implemented UI behaviors

Enrollment form also includes buttons for:

- generate acceptance
- generate contract

These are currently **alert stubs only**, with no backend implementation.

---

## 7. Read-only and permission-gated behavior

## 7.1 Admissions term read-only mode

Source: `src/features/admissions/shared/hooks/useAdmissionsYearTermContext.tsx`

### Implemented contract visible in code

The admissions context tracks:

- selected academic year
- selected term
- `termStatus`
- `isReadOnly`

Implemented rule:

```ts
isReadOnly = termStatus === "closed"
```

### Effects of read-only mode visible in UI

When `isReadOnly` is true:

- admissions action buttons are disabled in application detail layout
- new application button is disabled
- create/import lead buttons are disabled
- enrollment submission is disabled
- acceptance/contract generation buttons are disabled
- read-only banner is shown

### Integration implication

Any real backend contract should likely include server-side enforcement matching the selected academic year/term lock state. The UI already assumes term closure should block writes.

## 7.2 Settings permissions for admissions document configuration

Sources:

- `src/hooks/usePermissions.ts`
- `src/features/settings/admissions-documents/pages/SettingsAdmissionsDocumentsPage.tsx`
- `src/features/settings/constants/defaults.ts`

### Implemented permission keys

- `settings.admissionsDocuments.view`
- `settings.admissionsDocuments.manage`

### Implemented role assumptions in defaults

Roles that include both view and manage by default:

- `System Admin`
- `Operations Coordinator`

Role that does **not** include admissions document management by default:

- `IT Supervisor`

### Implemented UI behavior

- Entire settings page is guarded by `SettingsAccessGuard permission="settings.admissionsDocuments.view"`
- Save/add/remove/reorder/edit actions require `settings.admissionsDocuments.manage`

---

## 8. Validation rules frontend should mirror

## 8.1 Application student info validation

Source: `src/features/admissions/applications/components/ApplicationCreateStepper.tsx`

Required fields:

- `first_name_ar`
- `father_name_ar`
- `grandfather_name_ar`
- `family_name_ar`
- `first_name_en`
- `father_name_en`
- `grandfather_name_en`
- `family_name_en`
- `gender`
- `date_of_birth`
- `nationality`
- `grade_requested`

DOB rule:

- computed age must be between 3 and 20 years by year difference

## 8.2 Guardian validation

Required per guardian:

- `full_name`
- `phone_primary`
- `email`

Phone validation:

- regex: `/^[\d\s+()-]+$/`
- after stripping non-digits, must contain at least 10 digits

Email validation:

- regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

Additional rule:

- at least one guardian must have `is_primary = true`

## 8.3 Document upload validation in application create flow

Allowed MIME types:

- `application/pdf`
- `image/jpeg`
- `image/jpg`
- `image/png`

Max file size:

- `5 * 1024 * 1024` bytes = 5 MB

### Important note

The application creation payload passes `fileName` and inferred `fileType`, but not the actual binary file to a backend service. A real backend upload contract is still missing.

## 8.4 Admissions document settings validation

Source: `src/features/settings/admissions-documents/pages/SettingsAdmissionsDocumentsPage.tsx`

Before saving document requirements:

- `nameEn` cannot be blank
- `nameAr` cannot be blank
- among **active** requirements only:
  - English names must be unique case-insensitively
  - Arabic names must be unique case-insensitively

On save, the settings service normalizes:

- trims `id`
- trims `nameEn`
- trims `nameAr`
- rewrites `sortOrder` to match current UI order

---

## 9. Admissions dashboard contract

Sources:

- `src/features/admissions/dashboard/views/AdmissionsDashboardView.tsx`
- `src/features/admissions/applications/pages/ApplicationsList.tsx`

### Implemented in code

Dashboard view is a presenter component and expects precomputed props, not direct backend calls.

It renders:

- KPI cards
- conversion funnel chart
- applications by grade chart
- application sources chart
- weekly inquiries chart
- latest applications table
- export modal

### Expected/inferred data shape

```ts
interface AdmissionsDashboardViewProps {
  kpis: {
    applicationsInPeriod: number;
    conversionRate: number;
    approvedApplications: number;
    totalApplications: number;
    avgProcessingDisplay: string;
  };
  kpiChartData: {
    applicationsTrend: Array<{ label: string; value: number }>;
    conversionTrend: Array<{ label: string; value: number }>;
    processingTrend: Array<{ label: string; value: number }>;
  };
  analyticsData: {
    funnel: {
      leads: number;
      applications: number;
      accepted: number;
      enrolled: number;
    };
    gradeDistribution: Array<{ grade: string; count: number }>;
    weeklyInquiries: Array<{ weekStart: string; count: number }>;
  };
  applicationSourcesData: Array<{ source: string; count: number }>;
}
```

### Implemented list-page KPI logic that backend should align with

Applications list currently derives:

- pending review = `submitted + documents_pending`
- missing documents = any application with at least one document in `missing`
- approved = `accepted`
- rejected = `rejected`
- average processing time = difference between `submittedDate` and `decision.decisionDate`, with a mock fallback of 7 days if decision missing on a decided app

### Missing backend details / TODO

Real dashboard aggregation endpoints are not implemented in the repo.

---

## 10. Proposed / missing API contract by subdomain

The following endpoint groups are **inferred** from current UI/types/mock data and should be treated as proposed contracts requiring backend confirmation.

## 10.1 Leads API

### Implemented contract visible in code

Only local/mock service functions exist.

### Proposed / missing API contract

#### GET `/api/admissions/leads`

Purpose:

- list leads with filters used by leads table and dashboard

Suggested query params:

- `search`
- `status`
- `channel`
- `startDate`
- `endDate`
- `yearId`
- `termId`
- pagination/sorting params

Suggested response item:

```json
{
  "id": "L001",
  "name": "Hassan Ahmed",
  "phone": "+971-50-123-4567",
  "email": "hassan.ahmed@email.com",
  "channel": "Walk-in",
  "status": "Converted",
  "createdAt": "2026-01-05",
  "gradeInterest": "Grade 6",
  "source": "walk_in",
  "studentName": "Ahmed Hassan",
  "studentNameArabic": "أحمد حسن"
}
```

#### POST `/api/admissions/leads`

Suggested request DTO:

```json
{
  "name": "Parent Name",
  "phone": "+971-50-123-4567",
  "email": "parent@example.com",
  "channel": "Referral",
  "status": "New",
  "gradeInterest": "Grade 6",
  "source": "referral",
  "notes": "Interested in bilingual program"
}
```

#### GET `/api/admissions/leads/{leadId}`

Returns lead detail.

#### GET `/api/admissions/leads/{leadId}/activities`

Returns `ActivityLogItem[]`.

#### POST `/api/admissions/leads/{leadId}/activities`

Suggested request DTO:

```json
{
  "type": "Call",
  "message": "Initial phone call made",
  "createdBy": "Ahmed Al-Mansoori"
}
```

#### GET `/api/admissions/leads/{leadId}/notes`

Returns `Note[]`.

#### POST `/api/admissions/leads/{leadId}/notes`

Suggested request DTO:

```json
{
  "body": "Parent asked about class sizes",
  "createdBy": "Fatima Al-Zaabi"
}
```

#### POST `/api/admissions/leads/{leadId}/convert-to-application`

Suggested response DTO:

Either:

1. create a real application and return it, or
2. return a draft token/application draft object if product still wants a draft step

```json
{
  "id": "APP-DRAFT-1712345678901",
  "leadId": "L001",
  "studentName": "Ahmed Hassan",
  "gradeRequested": "Grade 6",
  "status": "Draft",
  "createdAt": "2026-04-12T10:30:00Z"
}
```

#### POST `/api/admissions/leads/import`

Missing in repo. Needs confirmed file format and async behavior.

## 10.2 Applications API

### Implemented contract visible in code

Application creation exists only as a local service.

### Proposed / missing API contract

#### GET `/api/admissions/applications`

Filters implied by UI:

- `search`
- `status`
- `grade`
- `gender`
- `nationality`
- `startDate`
- `endDate`
- `yearId`
- `termId`
- sort/pagination

Response items should match the `Application` read model.

#### POST `/api/admissions/applications`

Suggested request DTO based on implemented `ApplicationCreationPayload`:

```json
{
  "leadId": "L001",
  "source": "walk_in",
  "student": {
    "first_name_ar": "أحمد",
    "father_name_ar": "حسن",
    "grandfather_name_ar": "...",
    "family_name_ar": "...",
    "first_name_en": "Ahmed",
    "father_name_en": "Hassan",
    "grandfather_name_en": "...",
    "family_name_en": "...",
    "full_name_ar": "أحمد حسن ...",
    "full_name_en": "Ahmed Hassan ...",
    "gender": "Male",
    "date_of_birth": "2014-05-15",
    "nationality": "UAE",
    "stage": "Preparatory",
    "grade_requested": "Grade 6",
    "section": "A",
    "address_line": "...",
    "city": "Dubai",
    "district": "Jumeirah",
    "status": "pending",
    "join_date": "2026-09-01",
    "notes": "...",
    "previous_school": "Dubai International School",
    "medical_conditions": "None"
  },
  "guardians": [
    {
      "full_name": "Hassan Ahmed",
      "relation": "father",
      "phone_primary": "+971-50-123-4567",
      "phone_secondary": "+971-4-123-4567",
      "email": "hassan.ahmed@email.com",
      "national_id": "784-1990-1234567-1",
      "job_title": "Engineer",
      "workplace": "Emirates Engineering",
      "is_primary": true,
      "can_pickup": true,
      "can_receive_notifications": true
    }
  ],
  "documents": [
    {
      "configId": "birth-certificate",
      "labelEn": "Birth Certificate",
      "labelAr": "شهادة الميلاد",
      "required": true,
      "uploaded": true,
      "fileName": "birth_certificate.pdf",
      "fileType": "pdf"
    }
  ]
}
```

#### Important backend confirmation needed

The actual backend should confirm whether application creation:

- accepts uploaded binaries inline
- accepts previously uploaded file IDs instead of names
- should derive `status` server-side based on required docs
- should preserve `leadId` and `source`

#### GET `/api/admissions/applications/{applicationId}`

Should return full application detail including:

- student fields
- guardians
- documents
- tests
- interviews
- decision

#### PATCH `/api/admissions/applications/{applicationId}`

Needed for detail edits if application updates are supported.

## 10.3 Guardians API

### Implemented contract visible in code

No dedicated admissions guardians API exists in this repo; guardians are nested inside applications.

### Proposed / missing API contract

Option A: nested writes under application only

- `POST /api/admissions/applications/{applicationId}/guardians`
- `PATCH /api/admissions/applications/{applicationId}/guardians/{guardianId}`
- `DELETE /api/admissions/applications/{applicationId}/guardians/{guardianId}`

Option B: standalone guardians resource if cross-application dedupe is needed

- `GET /api/admissions/guardians/{guardianId}`
- `PATCH /api/admissions/guardians/{guardianId}`

Current repo evidence supports **nested under application** as the safer first contract.

## 10.4 Documents API

### Implemented contract visible in code

Application document objects exist, but no real upload/download backend contract exists.

### Proposed / missing API contract

#### GET `/api/admissions/applications/{applicationId}/documents`

Returns documents array.

#### POST `/api/admissions/applications/{applicationId}/documents`

Suggested request patterns:

Option A: multipart upload

- binary file
- `configId`
- optional metadata

Option B: metadata + uploaded storage object reference

```json
{
  "configId": "passport-copy",
  "name": "passport_ahmed.pdf",
  "fileType": "pdf",
  "storageKey": "...",
  "uploadedDate": "2026-04-12T10:30:00Z"
}
```

#### DELETE `/api/admissions/applications/{applicationId}/documents/{documentId}`

Needed if document removal is supported.

#### GET `/api/admissions/documents/config`

Return `AdmissionsRequiredDocumentConfig[]`.

#### PUT `/api/admissions/documents/config`

Save the ordered config list.

Suggested request DTO:

```json
[
  {
    "id": "birth-certificate",
    "nameEn": "Birth Certificate",
    "nameAr": "شهادة الميلاد",
    "required": true,
    "active": true,
    "sortOrder": 1
  }
]
```

## 10.5 Tests API

### Implemented contract visible in code

Only modal payload and test type exist.

### Proposed / missing API contract

#### GET `/api/admissions/tests`

Filters likely needed:

- `applicationId`
- `status`
- `date`
- `startDate`
- `endDate`
- year/term filters if applicable

#### POST `/api/admissions/tests`

Suggested request DTO from schedule modal:

```json
{
  "applicationId": "APP-2026-004",
  "studentName": "Layla Salem",
  "guardianName": "Salem Hassan",
  "guardianPhone": "+971-50-678-9012",
  "type": "Placement Test",
  "subject": "English",
  "date": "2026-02-19",
  "time": "14:00",
  "duration": "60",
  "location": "Main Campus - Room 103",
  "proctor": "Ms. Fatima Al-Zaabi",
  "proctorPhone": "+971-50-345-6789",
  "notes": "English language assessment"
}
```

#### PATCH `/api/admissions/tests/{testId}`

Needed for:

- reschedule
- cancel
- enter score
- enter notes
- set status

## 10.6 Interviews API

### Proposed / missing API contract

#### GET `/api/admissions/interviews`

List interviews with filters.

#### POST `/api/admissions/interviews`

Suggested request DTO:

```json
{
  "applicationId": "APP-2026-005",
  "studentName": "Noura Mariam",
  "guardianName": "Mariam Khalid",
  "guardianPhone": "+971-50-789-0123",
  "date": "2026-02-24",
  "time": "14:00",
  "interviewer": "Mr. Ahmed Al-Mansoori",
  "interviewerPhone": "+971-50-234-5678",
  "location": "Admin Building - Office 206",
  "duration": "30",
  "notes": "Initial interview"
}
```

#### PATCH `/api/admissions/interviews/{interviewId}`

Needed for:

- reschedule
- cancel
- store rating
- store notes
- mark completed

## 10.7 Decisions API

### Proposed / missing API contract

#### POST `/api/admissions/decisions`

Suggested request DTO:

```json
{
  "applicationId": "APP-2026-005",
  "decision": "waitlist",
  "reason": "Qualified candidate but no seat available",
  "decisionDate": "2026-05-24",
  "sendNotification": true
}
```

Suggested response DTO:

```json
{
  "id": "DEC-010",
  "applicationId": "APP-2026-014",
  "decision": "waitlist",
  "reason": "Qualified candidate, but Grade 9 capacity is currently full.",
  "decisionDate": "2026-05-24",
  "decidedBy": "Admissions Committee"
}
```

#### Important confirmation needed

Backend should clarify whether making a decision must also update application status atomically:

- `accept` -> `accepted`
- `waitlist` -> `waitlisted`
- `reject` -> `rejected`

The UI strongly suggests that relationship, but no implemented backend service enforces it in this repo.

## 10.8 Enrollment API

### Implemented contract visible in code

A local adapter exists that pushes enrollment into the students module.

### Proposed / missing API contract

#### POST `/api/admissions/enrollments`

Suggested request DTO:

```json
{
  "applicationId": "APP-2024-001",
  "academicYear": "2026-2027",
  "grade": "Grade 6",
  "section": "A",
  "classroom": "Classroom 1",
  "gradeId": "grade-6",
  "sectionId": "section-a",
  "classroomId": "classroom-1",
  "startDate": "2026-09-01"
}
```

Suggested response DTO:

- enrollment object
- resolved student id
- possibly created/linked student record summary

#### GET `/api/admissions/enrollments`

Needed for enrollment list screen if backed by server data.

## 10.9 Dashboard API

### Proposed / missing API contract

#### GET `/api/admissions/dashboard`

Suggested query params:

- `dateRange`
- `customStart`
- `customEnd`
- `yearId`
- `termId`

Suggested response shape:

```json
{
  "kpis": {
    "applicationsInPeriod": 120,
    "conversionRate": 42,
    "approvedApplications": 50,
    "totalApplications": 120,
    "avgProcessingDisplay": "5.3 days"
  },
  "kpiChartData": {
    "applicationsTrend": [{ "label": "W1", "value": 10 }],
    "conversionTrend": [{ "label": "W1", "value": 38 }],
    "processingTrend": [{ "label": "W1", "value": 6 }]
  },
  "analyticsData": {
    "funnel": {
      "leads": 200,
      "applications": 120,
      "accepted": 50,
      "enrolled": 40
    },
    "gradeDistribution": [{ "grade": "Grade 6", "count": 22 }],
    "weeklyInquiries": [{ "weekStart": "2026-04-01", "count": 15 }]
  },
  "applicationSourcesData": [{ "source": "walk_in", "count": 30 }],
  "latestApplications": []
}
```

---

## 11. DTO summary for frontend integration

## 11.1 Recommended application read model

This is the most useful consolidated read model for detail views and list/detail navigation:

```ts
interface ApplicationReadModel {
  id: string;
  leadId?: string;
  source?: "in_app" | "referral" | "walk_in" | "other";
  status:
    | "submitted"
    | "documents_pending"
    | "under_review"
    | "accepted"
    | "waitlisted"
    | "rejected";
  submittedDate: string;

  full_name_ar: string;
  full_name_en: string;
  studentName: string;
  studentNameArabic?: string;
  gender: string;
  date_of_birth: string;
  nationality: string;

  address_line?: string;
  city?: string;
  district?: string;
  student_phone?: string;
  student_email?: string;

  grade_requested: string;
  gradeRequested: string;
  stage?: string;
  section?: string;
  previous_school?: string;
  join_date?: string;
  medical_conditions?: string;
  notes?: string;

  guardians: Guardian[];
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;

  documents: Document[];
  tests: Test[];
  interviews: Interview[];
  decision?: Decision;
}
```

## 11.2 Recommended list row models

### Leads list row

```ts
interface LeadListRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  status: LeadStatus;
  gradeInterest?: string;
  createdAt: string;
}
```

### Applications list row

```ts
interface ApplicationListRow {
  id: string;
  studentName: string;
  full_name_ar: string;
  full_name_en: string;
  dateOfBirth?: string;
  gender: string;
  nationality: string;
  gradeRequested: string;
  status: ApplicationStatus;
  guardianName: string;
  submittedDate: string;
}
```

---

## 12. Business logic and edge cases

## 12.1 Required docs do not block application creation

Current implemented behavior is:

- create application anyway
- mark missing required docs with `status = "missing"`
- set application status to `documents_pending`

## 12.2 Application source is not reliably persisted in create flow

`createApplication()` currently hardcodes `source = "walk_in"`.

If the real product needs accurate source attribution from leads or direct channels, backend must confirm the real source field behavior.

## 12.3 Decision modal summary is advisory only

The UI surfaces whether test/interview/documents are complete, but nothing in the current repo prevents an acceptance decision without those conditions being met.

Server-side rule enforcement is therefore unconfirmed.

## 12.4 Enrollment is accepted-status driven in UI

Frontend only shows enrollment CTA when `application.status === "accepted"`. Backend should enforce the same rule if it is a real business requirement.

## 12.5 Read-only term state should be enforced server-side too

The UI blocks writes when the selected term is closed. If backend does not enforce the same rule, users could still write through direct API calls.

## 12.6 Lead conversion currently creates draft only

The lead conversion helper returns an `ApplicationDraft`, not a persisted application entity.

Backend needs product confirmation on whether lead conversion should:

- create draft only
- create full application shell immediately
- redirect to prefilled application creation flow without persistence

## 12.7 File upload contract is incomplete

The UI validates file type and size locally, but the create flow only sends filenames and file metadata into the mock service. Real backend file upload flow is missing.

## 12.8 Settings IDs for newly added document configs are client-generated

New settings document IDs are generated as `admissions-document-${Date.now()}` in the UI. Backend may instead want to own ids, slugs, or UUID generation.

---

## 13. Integration notes for frontend developers

## 13.1 Treat type files as canonical for read models

For UI alignment, prefer these source-of-truth models:

- application.ts
- guardian.ts
- document.ts
- test.ts
- interview.ts
- decision.ts
- enrollment.ts
- enums.ts

## 13.2 Treat local services as mock adapters, not backend truth

The following are useful for shaping integration but are not real backend implementations:

- `applicationCreationService.ts`
- `mockLeadsApi.ts`
- `settingsService.ts`
- `admissions/enrollment/services/enrollmentService.ts`

## 13.3 Frontend should preserve these UX rules

- accepted applications can enroll
- closed term => read only
- missing required docs => application allowed but status becomes `documents_pending`
- settings admissions document names must be unique among active items

## 13.4 Frontend should not assume currently stubbed actions are persisted

In the current repo, these actions are UI-only or mock-only and need real backend work:

- schedule test
- schedule interview
- make decision
- generate acceptance letter
- generate contract
- import leads

## 13.5 Frontend should be ready for localized labels but stable enum values

Observed pattern:

- stable backend-ish enum values are lower-case snake case for application source/status families
- labels shown to users are localized via translations

Prefer stable enums in API, translated labels in UI.

---

## 14. Acceptance criteria and test scenarios

## 14.1 Leads

1. User can list leads filtered by status, channel, and date range.
2. User can create a lead and immediately see it in the list.
3. User can fetch activity log and notes for a lead.
4. Converting a lead returns either a draft or a full application according to finalized backend contract.
5. Closed term blocks lead create/import actions if admissions context says read-only.

## 14.2 Applications

1. Application creation validates required student fields.
2. Guardian validation rejects invalid email and invalid primary phone.
3. At least one guardian must be primary.
4. Missing required docs create `documents_pending` application rather than failing submission, unless product changes this rule.
5. Application detail response includes nested guardians, documents, tests, interviews, and decision.

## 14.3 Documents

1. Only active document requirements appear in create flow.
2. Required but not uploaded documents appear as `missing` in the application.
3. Upload validation rejects unsupported MIME types.
4. Upload validation rejects files larger than 5 MB.
5. Document settings save rejects blank names.
6. Document settings save rejects duplicate active English/Arabic names.

## 14.4 Tests and interviews

1. Scheduling test requires subject, date, time, and location.
2. Scheduling interview requires date, time, interviewer, and location.
3. Backend supports cancel/reschedule state transitions matching current enum sets.
4. Detail view reflects newly created test/interview records after save.

## 14.5 Decisions

1. Decision API accepts only `accept`, `waitlist`, or `reject`.
2. Decision reason and decision date are required.
3. Application status updates consistently with decision outcome.
4. Notification behavior is explicitly confirmed and represented in API if needed.

## 14.6 Enrollment

1. Enrollment is only allowed for accepted applications.
2. Grade, section, classroom, and start date are required.
3. Enrollment returns or links a concrete student record.
4. Closed term blocks enrollment submission.

## 14.7 Dashboard

1. Dashboard endpoint returns KPI, chart, and latest-application payloads in one response or documented sub-responses.
2. Date range filtering works consistently with list pages.
3. Source breakdown uses canonical application source enum values.

---

## 15. Open questions / TODOs requiring backend confirmation

1. **What is the real file upload contract for admissions documents?**
   - multipart upload?
   - presigned upload + metadata save?
   - document service reuse?

2. **Should missing required documents block application creation or only set `documents_pending`?**
   - current implementation chooses status-based follow-up, not blocking

3. **Should lead conversion create a real application or only a draft?**
   - current mock returns `ApplicationDraft`

4. **What is the canonical source field when creating an application?**
   - current local service hardcodes `walk_in`

5. **Should tests/interviews/decisions be separate resources or nested under application?**
   - separate resources are recommended for scheduling and reporting

6. **Should decision submission include notification intent?**
   - UI has `sendNotification`, but current callback does not send it anywhere

7. **Must backend enforce preconditions before acceptance?**
   - e.g. completed test, completed interview, all required docs complete
   - current UI only displays those signals

8. **What is the real enrollment ownership boundary?**
   - admissions service creates enrollment directly?
   - students service owns enrollment creation?
   - current repo uses students-domain adapter

9. **What are the exact auth and role semantics for admissions write actions?**
   - current repo only clearly defines permissions for admissions document settings, not for the broader admissions actions

10. **Should document requirement IDs be backend-generated or client-supplied?**
    - current settings page generates new IDs in the UI

11. **What is the real audit strategy?**
    - settings writes create local audit entries in the mock settings store
    - admissions actions do not have a real backend audit implementation in this repo

12. **How should year/term locking be represented in backend APIs?**
    - current UI assumes closed term => no writes

---

## 16. Recommended implementation priorities for backend alignment

1. Finalize real contracts for:
   - application create/read/list
   - documents upload/list
   - decision submit
   - enrollment submit
2. Confirm whether missing required docs are blocking or status-based.
3. Confirm whether lead conversion creates draft vs real application.
4. Add real persistence for tests/interviews/decisions.
5. Add dashboard aggregation endpoint(s).
6. Add server-side enforcement for:
   - closed term read-only behavior
   - accepted-only enrollment
   - permissions on admissions document settings

---

## 17. Bottom line

This repo already provides a strong admissions domain model and a clear UI workflow, but it does **not** implement a complete backend API.

Use the type layer and local service payloads as the best current contract reference.

Treat the endpoint groups in this document as **proposed contracts inferred from frontend usage** and validate the open questions before backend implementation is finalized.
