# Moazez Backend — Teacher Module Frontend Contract

**Audience:** SIS/Admin Dashboard frontend

**Repository:** `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`

**Generated:** 2026-07-02

---

## 1. Contract Status And Important Backend Reality

This document describes the contract needed by the **admin dashboard Teachers module**.

There are three related backend areas that the frontend must not mix together:

1. **Admin Teacher Directory/Profile contract**
   - Target base path: `/api/v1/teachers`
   - Source: `adr/School-Dashboard/sis_dashboard-teachers_backend_handoff_spec.md`
   - Status from repo review: this is a dashboard handoff/spec contract. It defines the required Teacher CRUD/profile API for the admin dashboard.

2. **Implemented dashboard user-account endpoints**
   - Base path: `/api/v1/settings/users`
   - Purpose: create/list/update dashboard user accounts, role membership, activation, invite, and password reset.
   - These endpoints manage school users, not the full teacher academic profile shape.

3. **Implemented academic teacher allocation endpoints**
   - Base path: `/api/v1/academics/allocations`
   - Purpose: assign teacher users to subjects/classrooms for a term.
   - These endpoints use `teacherUserId`, not a separate `teacherId` profile id.

The dashboard Teachers page should treat `/teachers` as the intended Teacher Directory/Profile API. Until that controller is implemented, the frontend may need a compatibility service that combines `settings/users`, `academics/allocations`, academic structure, and subjects.

Do **not** use `/api/v1/teacher/...` app-facing endpoints for the admin dashboard Teachers page. Those belong to the Teacher App experience.

---

## 2. Global API Rules

### Base URL

All routes are served under:

```txt
/api/v1
```

Examples:

```txt
GET /api/v1/teachers
GET /api/v1/settings/users
GET /api/v1/academics/allocations
```

### Auth

All admin dashboard teacher routes should use bearer auth:

```http
Authorization: Bearer <accessToken>
```

### Validation

The backend uses a strict NestJS `ValidationPipe` with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`
- `enableImplicitConversion: false`

Frontend serializers must therefore emit DTO-clean payloads:

- omit unknown fields
- omit `undefined`
- preserve meaningful values like `0`, `false`, and empty arrays only when the DTO allows them
- use exact enum casing

### Error Envelope

Current backend errors are normalized as:

```json
{
  "error": {
    "code": "validation.failed",
    "message": "Request validation failed",
    "details": {
      "fields": ["field must be a UUID"]
    },
    "traceId": "trace-id"
  }
}
```

Common current default codes:

| HTTP | Code |
|---:|---|
| 400 | `validation.failed` |
| 401 | `auth.token.invalid` |
| 403 | `auth.scope.missing` |
| 404 | `not_found` |
| 409 | `conflict` |
| 429 | `rate_limit.exceeded` |
| 500 | `internal_error` |

---

## 3. Admin Dashboard Teacher Profile Contract

> Source status: specified in the School Dashboard Teachers handoff spec. This is the recommended target contract for the Teachers page.

### 3.1 Domain Model

The recommended backend model separates:

- **global teacher profile**: identity, contact, employment, status
- **term-scoped teacher assignment profile**: subjects, stages, grades, sections for the selected academic year/term context

This is important because the current frontend displays assignment labels based on the selected year/term. If assignment IDs differ across terms, term-scoped mappings avoid drift.

### 3.2 Enums

```ts
export type TeacherStatus = "ACTIVE" | "INACTIVE";
export type TeacherGender = "MALE" | "FEMALE";
export type TeacherWorkDay =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";
```

### 3.3 Teacher Response Shape

```ts
export interface Teacher {
  id: string;
  code: string;
  firstNameAr: string;
  firstNameEn: string;
  lastNameAr: string;
  lastNameEn: string;
  fullNameAr: string;
  fullNameEn: string;
  email: string;
  phone?: string | null;
  gender: TeacherGender;
  status: TeacherStatus;

  // Term-scoped assignment ids for selected yearId/termId context.
  subjectIds: string[];
  stageIds: string[];
  gradeIds: string[];
  sectionIds: string[];

  experienceYears?: number | null;
  workDayFrom?: TeacherWorkDay | null;
  workDayTo?: TeacherWorkDay | null;
  workStartTime?: string | null; // HH:mm
  workEndTime?: string | null;   // HH:mm
  hireDate?: string | null;      // YYYY-MM-DD
  notesAr?: string | null;
  notesEn?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 4. Teacher Profile Endpoints

### 4.1 List Teachers

```http
GET /api/v1/teachers
```

#### Query Params

```ts
export interface ListTeachersQuery {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  gender?: "MALE" | "FEMALE";
  subjectId?: string;
  stageId?: string;
  gradeId?: string;
  yearId?: string;
  termId?: string;
  page?: number;
  limit?: number;
}
```

#### Behavior

- If `yearId` and `termId` are supplied, return teacher records enriched with assignment arrays for that selected term.
- If they are omitted, backend may return core teacher profiles only or use the active/default term depending on product decision.
- Frontend should pass `yearId` and `termId` when rendering assignment labels or filtering by academic structure.

#### Response

```ts
export interface TeachersListResponse {
  items: Teacher[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

---

### 4.2 Get Teacher Detail

```http
GET /api/v1/teachers/:id
```

#### Query Params

```ts
export interface GetTeacherDetailQuery {
  yearId?: string;
  termId?: string;
}
```

#### Response

```ts
export type TeacherDetailResponse = Teacher;
```

Frontend should pass `yearId` and `termId` when the detail drawer must show term-scoped subject/stage/grade/section assignments.

---

### 4.3 Create Teacher

```http
POST /api/v1/teachers
```

#### Request Body

```ts
export interface CreateTeacherRequest {
  yearId: string;
  termId: string;
  code: string;
  firstNameAr: string;
  firstNameEn: string;
  lastNameAr: string;
  lastNameEn: string;
  email: string;
  phone?: string;
  gender: "MALE" | "FEMALE";
  status: "ACTIVE" | "INACTIVE";
  subjectIds: string[];
  stageIds: string[];
  gradeIds: string[];
  sectionIds: string[];
  experienceYears?: number;
  workDayFrom?: TeacherWorkDay;
  workDayTo?: TeacherWorkDay;
  workStartTime?: string;
  workEndTime?: string;
  hireDate?: string;
  notesAr?: string;
  notesEn?: string;
}
```

#### Example

```json
{
  "yearId": "year-2",
  "termId": "term-2-1",
  "code": "TCH-001",
  "firstNameAr": "أحمد",
  "firstNameEn": "Ahmed",
  "lastNameAr": "خالد",
  "lastNameEn": "Khaled",
  "email": "ahmed.khaled@school.test",
  "phone": "+201001112233",
  "gender": "MALE",
  "status": "ACTIVE",
  "subjectIds": ["subj-1", "subj-2"],
  "stageIds": ["stage-1"],
  "gradeIds": ["grade-1", "grade-2"],
  "sectionIds": ["section-1", "section-3"],
  "experienceYears": 4,
  "workDayFrom": "SUNDAY",
  "workDayTo": "THURSDAY",
  "workStartTime": "07:30",
  "workEndTime": "14:30",
  "hireDate": "2022-08-18",
  "notesAr": "يركز على تبسيط المفاهيم الأساسية.",
  "notesEn": "Focuses on simplifying foundational concepts."
}
```

#### Response

```ts
export type CreateTeacherResponse = Teacher;
```

#### Backend Action

Backend should:

1. create global teacher profile
2. create or upsert term-scoped assignment for `(teacherId, termId)`
3. attach `subjectIds`, `stageIds`, `gradeIds`, `sectionIds`

---

### 4.4 Update Teacher

```http
PATCH /api/v1/teachers/:id
```

#### Request Body

Same fields as `CreateTeacherRequest`. For update, frontend should send only explicitly supplied editable fields if the backend supports partial updates. The original handoff example sends a full editable payload.

```ts
export type UpdateTeacherRequest = Partial<CreateTeacherRequest> & {
  yearId: string;
  termId: string;
};
```

#### Response

```ts
export interface UpdateTeacherResponse {
  id: string;
  updatedAt: string;
}
```

---

### 4.5 Update Teacher Status

```http
PATCH /api/v1/teachers/:id/status
```

#### Request Body

```ts
export interface UpdateTeacherStatusRequest {
  status: "ACTIVE" | "INACTIVE";
}
```

#### Response

```ts
export interface UpdateTeacherStatusResponse {
  id: string;
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
}
```

---

### 4.6 Delete Teacher

```http
DELETE /api/v1/teachers/:id
```

#### Response

```ts
export interface DeleteTeacherResponse {
  success: boolean;
}
```

#### Product Decision

Preferred backend behavior is soft delete/archive unless the product explicitly allows hard delete.

---

### 4.7 Reset Teacher Password

```http
POST /api/v1/teachers/:id/password/reset
```

#### Request Body

```ts
export interface ResetTeacherPasswordRequest {
  newPassword: string;
}
```

`confirmNewPassword` is UI-only and must not be sent.

#### Response

```ts
export interface ResetTeacherPasswordResponse {
  success: boolean;
  updatedAt: string;
}
```

#### Behavior

Backend should treat this as an admin password reset action:

- update teacher auth credential
- audit the action
- optionally invalidate current sessions

---

### 4.8 Validate Teacher Code

```http
GET /api/v1/teachers/validate-code
```

#### Query Params

```ts
export interface ValidateTeacherCodeQuery {
  code: string;
  excludeId?: string;
}
```

#### Response

```ts
export interface UniqueValidationResponse {
  isUnique: boolean;
}
```

---

### 4.9 Validate Teacher Email

```http
GET /api/v1/teachers/validate-email
```

#### Query Params

```ts
export interface ValidateTeacherEmailQuery {
  email: string;
  excludeId?: string;
}
```

#### Response

```ts
export interface UniqueValidationResponse {
  isUnique: boolean;
}
```

---

## 5. Teacher Profile Validation Rules

Frontend should mirror these rules for user experience, but backend remains the source of truth.

### Identity

| Field | Rule |
|---|---|
| `code` | required, max 20, normalized uppercase with whitespace removed, unique |
| `email` | required, lowercase, max 120, valid email, unique |

### Names

| Field | Rule |
|---|---|
| `firstNameAr` | required, max 50 |
| `firstNameEn` | required, max 50 |
| `lastNameAr` | required, max 50 |
| `lastNameEn` | required, max 50 |

### Phone

| Field | Rule |
|---|---|
| `phone` | optional, max 20, digits with optional leading `+` |

### Experience

| Field | Rule |
|---|---|
| `experienceYears` | optional integer, min 0, max 60 |

### Working Days And Times

| Fields | Rule |
|---|---|
| `workDayFrom`, `workDayTo` | both provided together or both omitted |
| `workStartTime`, `workEndTime` | both provided together or both omitted |
| `workDayTo` | cannot be earlier than `workDayFrom` |
| `workEndTime` | must be later than `workStartTime` |

### Assignment Arrays

For the full Teachers page contract:

| Field | Rule |
|---|---|
| `subjectIds` | at least one item |
| `stageIds` | at least one item |
| `gradeIds` | at least one item |
| `sectionIds` | at least one item |

### Notes

| Field | Rule |
|---|---|
| `notesAr` | optional, max 500 |
| `notesEn` | optional, max 500 |

### Password Reset

| Field | Rule |
|---|---|
| `newPassword` | required, min 8 |

---

## 6. Implemented Supporting Endpoint: Dashboard Users

> These endpoints are implemented today. Use them for school dashboard account management. They are not a full Teacher profile API.

### Base Path

```txt
/api/v1/settings/users
```

### Permissions

| Action | Required Permission |
|---|---|
| List users | `settings.users.view` |
| Invite/create/update/status/resend invite/reset password | `settings.users.manage` |

### 6.1 List Users

```http
GET /api/v1/settings/users
```

#### Query Params

```ts
export interface ListUsersQuery {
  search?: string;
  roleId?: string;
  status?: "active" | "invited" | "inactive";
  page?: number;  // default 1
  limit?: number; // default 20, max 100
}
```

#### Response

```ts
export interface SchoolUser {
  id: string;
  fullName: string;
  username: string | null;
  email: string;
  loginEmail: string;
  contactEmail: string | null;
  roleId: string;
  roleName: string;
  status: "active" | "invited" | "inactive";
  lastActiveAt: string | null;
  invitedAt: string | null;
  lastInviteSentAt: string | null;
}

export interface UsersListResponse {
  items: SchoolUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

### 6.2 Create Active User

```http
POST /api/v1/settings/users
```

```ts
export interface CreateUserRequest {
  fullName: string;      // 1..200 chars
  email?: string;        // legacy login email override
  username?: string;     // max 64
  contactEmail?: string; // personal/contact email
  roleId: string;
}
```

### 6.3 Invite User

```http
POST /api/v1/settings/users/invite
```

```ts
export interface InviteUserRequest extends CreateUserRequest {}
```

### 6.4 Update User

```http
PATCH /api/v1/settings/users/:id
```

```ts
export interface UpdateUserRequest {
  fullName?: string; // 1..200 chars
  roleId?: string;
}
```

### 6.5 Update User Status

```http
PATCH /api/v1/settings/users/:id/status
```

```ts
export interface UpdateUserStatusRequest {
  status: "active" | "inactive";
}
```

### 6.6 Resend Invite

```http
POST /api/v1/settings/users/:id/resend-invite
```

Response: `SchoolUser`.

### 6.7 Initiate Password Reset

```http
POST /api/v1/settings/users/:id/reset-password
```

```ts
export interface UserResetPasswordResponse {
  id: string;
  status: "queued";
  message: string;
}
```

### Frontend Mapping Notes

When `/api/v1/teachers` is not implemented yet, the Teachers module may temporarily map user accounts as follows:

| Teacher UI field | Temporary source from `settings/users` |
|---|---|
| `id` | `user.id` |
| `fullNameEn` or display name | `user.fullName` |
| `email` | `user.contactEmail ?? user.email` |
| login email | `user.loginEmail` |
| status | map `active -> ACTIVE`, `inactive -> INACTIVE`, `invited -> INACTIVE or invited badge` |
| role | `user.roleName` |

This fallback does **not** provide teacher-specific fields such as code, gender, work hours, experience, notes, or term-scoped assignment arrays.

---

## 7. Implemented Supporting Endpoint: Roles

Use this to discover the Teacher role id before creating/listing users by role.

```http
GET /api/v1/settings/roles
```

Permission: `settings.roles.view`

Response is an array of roles. The frontend can find the teacher role by `name`, `code`, or however the role response exposes it in the current app.

---

## 8. Implemented Supporting Endpoint: Academic Structure And Subjects

The Teachers page needs academic reference data for stage/grade/section/subject labels.

### 8.1 Structure Tree

```http
GET /api/v1/academics/structure/tree
```

Permission: `academics.structure.view`

Query:

```ts
export interface StructureTreeQuery {
  yearId: string;
  termId: string;
}
```

Use this for stages, grades, sections, and classrooms.

### 8.2 Subjects

```http
GET /api/v1/academics/subjects
```

Permission: `academics.subjects.view`

Current controller has no query DTO on list. It returns the school subject list. If the frontend needs term-scoped subjects, validate with backend/product before sending unsupported `termId`.

---

## 9. Implemented Supporting Endpoint: Teacher Allocations

> These endpoints are implemented and are useful for the academic allocation matrix. They are not the same as the `/teachers` profile CRUD contract.

### Base Path

```txt
/api/v1/academics/allocations
```

### Permissions

| Action | Required Permission |
|---|---|
| list, validation, teacher-loads | `academics.structure.view` |
| create, bulk save, apply-to-grade, clear-subject, delete | `academics.structure.manage` |

### 9.1 List Teacher Allocations

```http
GET /api/v1/academics/allocations
```

```ts
export interface ListTeacherAllocationsQuery {
  termId?: string;
  classroomId?: string;
}
```

```ts
export interface TeacherAllocation {
  id: string;
  teacher: {
    id: string;
    fullName: string;
    email: string;
  };
  subject: {
    id: string;
    name: string;
    nameAr: string;
    nameEn: string;
    code: string | null;
  };
  classroom: {
    id: string;
    name: string;
    nameAr: string;
    nameEn: string;
    sectionId: string;
    roomId: string | null;
  };
  term: {
    id: string;
    academicYearId: string;
    name: string;
    nameAr: string;
    nameEn: string;
    status: "open" | "closed";
  };
  createdAt: string;
}

export interface TeacherAllocationsListResponse {
  items: TeacherAllocation[];
}
```

### 9.2 Create Teacher Allocation

```http
POST /api/v1/academics/allocations
```

```ts
export interface CreateTeacherAllocationRequest {
  teacherUserId: string;
  subjectId: string;
  classroomId: string;
  termId: string;
}
```

Response: `TeacherAllocation`.

### 9.3 Bulk Save Teacher Allocations

```http
PUT /api/v1/academics/allocations/bulk
```

```ts
export interface BulkSaveTeacherAllocationsRequest {
  termId: string;
  items: Array<{
    teacherUserId: string;
    subjectId: string;
    classroomId: string;
  }>; // non-empty, max 500
}
```

```ts
export interface TeacherAllocationsBulkResponse {
  items: TeacherAllocation[];
  summary: {
    requestedCount: number;
    createdCount: number;
    existingCount: number;
  };
}
```

### 9.4 Apply Teacher Allocation To Grade

```http
POST /api/v1/academics/allocations/apply-to-grade
```

```ts
export interface ApplyTeacherAllocationToGradeRequest {
  termId: string;
  gradeId: string;
  subjectId: string;
  teacherUserId: string;
  classroomIds?: string[]; // optional, max 500
}
```

```ts
export interface ApplyTeacherAllocationToGradeResponse {
  items: TeacherAllocation[];
  summary: {
    requestedClassrooms: number;
    createdCount: number;
    existingCount: number;
  };
}
```

### 9.5 Clear Subject Allocations

```http
POST /api/v1/academics/allocations/clear-subject
```

```ts
export interface ClearTeacherAllocationsBySubjectRequest {
  termId: string;
  gradeId?: string;
  subjectId: string;
  classroomIds?: string[]; // optional, max 500
}
```

```ts
export interface ClearTeacherAllocationsResponse {
  ok: boolean;
  deletedCount: number;
}
```

### 9.6 Validate Teacher Allocations

```http
GET /api/v1/academics/allocations/validation
```

```ts
export interface ValidateTeacherAllocationsQuery {
  termId: string;
  gradeId?: string;
  subjectId?: string;
}
```

```ts
export type TeacherAllocationValidationStatus =
  | "complete"
  | "incomplete"
  | "missing_subject_allocation";

export interface TeacherAllocationValidationResponse {
  termId: string;
  academicYearId: string;
  summary: {
    gradesChecked: number;
    subjectAllocationRows: number;
    teacherAllocationRows: number;
    missingTeacherAssignments: number;
    missingSubjectAllocationRows: number;
    overAllocatedSubjects: number;
    underAllocatedSubjects: number;
  };
  items: Array<{
    gradeId: string | null;
    grade: { id: string; nameAr: string; nameEn: string } | null;
    subjectId: string | null;
    subject: {
      id: string;
      nameAr: string;
      nameEn: string;
      code: string | null;
      color: string | null;
    } | null;
    weeklyHours: number | null;
    classroomCount: number;
    allocatedClassroomCount: number;
    missingClassroomCount: number;
    status: TeacherAllocationValidationStatus;
    issues: Array<{
      code: string;
      message: string;
      classroomIds?: string[];
    }>;
  }>;
}
```

### 9.7 Teacher Loads

```http
GET /api/v1/academics/allocations/teacher-loads
```

```ts
export interface TeacherLoadsQuery {
  termId: string;
  teacherUserId?: string;
}
```

```ts
export interface TeacherLoadsResponse {
  termId: string;
  academicYearId: string;
  items: Array<{
    teacherUserId: string;
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
    };
    allocationCount: number;
    totalWeeklyHours: number;
    classroomsCount: number;
    subjectsCount: number;
    loads: Array<{
      allocationId: string;
      subjectId: string;
      subject: {
        id: string;
        nameAr: string;
        nameEn: string;
        code: string | null;
        color: string | null;
      };
      classroomId: string;
      classroom: { id: string; nameAr: string; nameEn: string };
      gradeId: string;
      grade: { id: string; nameAr: string; nameEn: string };
      weeklyHours: number | null;
    }>;
    warnings: Array<{
      code: string;
      message: string;
      allocationId?: string;
      subjectId?: string;
      classroomId?: string;
    }>;
  }>;
}
```

### 9.8 Delete Teacher Allocation

```http
DELETE /api/v1/academics/allocations/:id
```

```ts
export interface DeleteTeacherAllocationResponse {
  ok: boolean;
}
```

---

## 10. Recommended Frontend Service Boundaries

### 10.1 `teachersService.ts`

Owns target teacher profile contract:

- `fetchTeachers(query)` -> `GET /teachers`
- `fetchTeacher(id, query)` -> `GET /teachers/:id`
- `createTeacher(payload)` -> `POST /teachers`
- `updateTeacher(id, payload)` -> `PATCH /teachers/:id`
- `updateTeacherStatus(id, status)` -> `PATCH /teachers/:id/status`
- `deleteTeacher(id)` -> `DELETE /teachers/:id`
- `resetTeacherPassword(id, newPassword)` -> `POST /teachers/:id/password/reset`
- `validateTeacherCode(code, excludeId?)`
- `validateTeacherEmail(email, excludeId?)`

### 10.2 `teacherUsersService.ts`

Owns implemented dashboard account fallback:

- `fetchTeacherUsers(roleId, query)` -> `GET /settings/users?roleId=...`
- `createTeacherUser(payload)` -> `POST /settings/users`
- `inviteTeacherUser(payload)` -> `POST /settings/users/invite`
- `updateTeacherUser(id, payload)` -> `PATCH /settings/users/:id`
- `updateTeacherUserStatus(id, status)` -> `PATCH /settings/users/:id/status`
- `resetTeacherUserPassword(id)` -> `POST /settings/users/:id/reset-password`

### 10.3 `teacherAllocationsService.ts`

Owns implemented academic allocation APIs:

- `fetchTeacherAllocations(query)`
- `createTeacherAllocation(payload)`
- `bulkSaveTeacherAllocations(payload)`
- `applyTeacherAllocationToGrade(payload)`
- `clearTeacherAllocationsBySubject(payload)`
- `validateTeacherAllocations(query)`
- `fetchTeacherLoads(query)`
- `deleteTeacherAllocation(id)`

---

## 11. Frontend Integration Flow

### Full intended Teachers page flow

1. Load selected `yearId` and `termId` from dashboard academic context.
2. Load reference data:
   - `GET /api/v1/academics/structure/tree?yearId=&termId=`
   - `GET /api/v1/academics/subjects`
3. Load teachers:
   - `GET /api/v1/teachers?yearId=&termId=&page=&limit=&search=&status=&...`
4. Map assignment ids to labels from structure/subjects.
5. Create/edit teacher through `/teachers`.
6. Toggle status through `/teachers/:id/status`.
7. Reset password through `/teachers/:id/password/reset`.
8. Use allocation endpoints only for the allocation matrix/load views.

### Compatibility flow if `/teachers` is not implemented yet

1. Load roles from `/settings/roles` and find the Teacher role id.
2. Load teacher users from `/settings/users?roleId=<teacherRoleId>`.
3. Load structure and subjects.
4. Load allocations from `/academics/allocations?termId=<termId>`.
5. Build a temporary teacher table by joining:
   - user account info
   - allocation rows by `teacher.id` / `teacherUserId`
   - reference labels
6. Disable or clearly adapt UI fields that the backend cannot persist through implemented endpoints yet:
   - `code`
   - `gender`
   - `experienceYears`
   - working hours/days
   - `hireDate`
   - notes
   - full `/teachers` async uniqueness validation

---

## 12. Frontend Do / Do Not Checklist

### Do

- Prefix all calls with `/api/v1`.
- Send bearer auth.
- Keep Teacher App endpoints separate from Admin Dashboard endpoints.
- Keep `/teachers` profile CRUD separate from `/settings/users` account management.
- Use `teacherUserId` for `/academics/allocations`.
- Send uppercase teacher profile enums: `ACTIVE`, `INACTIVE`, `MALE`, `FEMALE`, weekday names.
- Send lowercase settings user statuses: `active`, `inactive`, `invited`.
- Omit unknown fields and `undefined` values.
- Treat `confirmNewPassword` as UI-only.

### Do Not

- Do not call `/api/v1/teacher/...` from the admin dashboard Teachers page.
- Do not send `termId` to `/academics/subjects` unless backend adds a query DTO.
- Do not send teacher profile fields to `/settings/users`; that DTO only supports account fields.
- Do not use `/settings/users/:id/reset-password` if the UI expects to set a password directly; that implemented endpoint only initiates a queued reset.
- Do not assume `/api/v1/teachers` is implemented unless backend adds the controller.

---

## 13. Contract Tests To Add In Frontend

### Teacher profile service tests

- `GET /teachers` sends only documented query params.
- Create/update serializers omit `undefined` and UI-only fields.
- Create/update use uppercase enums.
- Password reset sends only `{ newPassword }`.
- `confirmNewPassword` never leaves the frontend.
- Validation endpoints pass `excludeId` only for edit mode.

### Settings user fallback tests

- Teacher account creation sends only `fullName`, `email`, `username`, `contactEmail`, `roleId`.
- User status uses lowercase `active | inactive`.
- Password reset has no body and expects `{ id, status: "queued", message }`.

### Allocation service tests

- Allocation bodies use `teacherUserId`, not `teacherId`.
- Bulk save body includes non-empty `items` and `termId`.
- Validation query sends `termId`, optional `gradeId`, optional `subjectId`.
- Teacher loads query sends `termId` and optional `teacherUserId`.
- Delete expects `{ ok: true }`.

---

## 14. Source Files Reviewed

- `src/main.ts`
- `API_CONTRACT_RULES.md`
- `src/common/exceptions/global-exception.filter.ts`
- `src/app.module.ts`
- `src/modules/teacher-app/teacher-app.module.ts`
- `adr/School-Dashboard/sis_dashboard-teachers_backend_handoff_spec.md`
- `src/modules/settings/users/controller/users.controller.ts`
- `src/modules/settings/users/dto/create-user.dto.ts`
- `src/modules/settings/users/dto/list-users-query.dto.ts`
- `src/modules/settings/users/dto/update-user.dto.ts`
- `src/modules/settings/users/dto/update-user-status.dto.ts`
- `src/modules/settings/users/dto/user-response.dto.ts`
- `src/modules/settings/roles/controller/roles.controller.ts`
- `src/modules/academics/structure/controller/structure.controller.ts`
- `src/modules/academics/structure/dto/tree-query.dto.ts`
- `src/modules/academics/subjects/controller/subjects.controller.ts`
- `src/modules/academics/teacher-allocation/controller/teacher-allocation.controller.ts`
- `src/modules/academics/teacher-allocation/dto/teacher-allocation.dto.ts`
- `src/modules/academics/teacher-allocation/dto/teacher-allocation-response.dto.ts`
