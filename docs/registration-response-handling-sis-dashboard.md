# Handling Student Registration Response in `sis_dashboard`

This document explains the recommended way to handle the backend registration response in the `blackfalc0ns/sis_dashboard` dashboard.

Backend response includes:

- `registrationId`
- `student`
- `guardians`
- `enrollment`
- `parentAccounts`
- `studentAccount`
- `warnings`
- `createdAt`
- `completedAt`

The most important rule:

> The registration response should become a **result screen**, not just a toast.

This is because the response may contain **temporary passwords**, account statuses, warnings, and partial-success information.

---

## 1. Recommended Architecture

Do not handle the raw response directly inside the form submit component.

Create a dedicated registration response layer:

```text
src/features/students-guardians/registration/
  services/studentRegistrationApiService.ts
  types/registrationRequest.ts
  types/registrationResult.ts
  utils/registrationResultMapper.ts
  components/RegistrationResultPanel.tsx
  components/RegistrationCredentialsCard.tsx
```

The dashboard already uses response normalizers for students, guardians, and enrollments. The registration response should follow the same pattern.

---

## 2. Add Registration Result Types

Create:

```text
src/features/students-guardians/registration/types/registrationResult.ts
```

Suggested types:

```ts
import type {
  Student,
  StudentGuardian,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";

export type AccountStatus = "skipped" | "created" | "linked" | "failed";
export type AccountMode = "none" | "create" | "link";

export interface RegistrationAccountUser {
  fullName: string;
  username: string | null;
  loginEmail: string;
  contactEmail: string | null;
  userType: "parent" | "student";
  roleKey: string;
  roleName: string;
  credentialStatus: string;
  hasPassword: boolean;
  mustChangePassword: boolean;
}

export interface RegistrationAccountResult {
  target: "parent" | "student";
  guardianId?: string;
  mode: AccountMode;
  status: AccountStatus;
  user?: RegistrationAccountUser;
  temporaryPassword?: string;
}

export interface RegistrationResult {
  registrationId: string;
  student: Student;
  guardians: StudentGuardian[];
  enrollment: StudentEnrollment;
  parentAccounts: RegistrationAccountResult[];
  studentAccount: RegistrationAccountResult;
  warnings: string[];
  createdAt: string;
  completedAt: string;
}
```

---

## 3. Add a Registration Result Mapper

Create:

```text
src/features/students-guardians/registration/utils/registrationResultMapper.ts
```

Suggested implementation:

```ts
import {
  normalizeStudent,
  normalizeGuardian,
  normalizeEnrollment,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";
import type {
  RegistrationAccountResult,
  RegistrationAccountUser,
  RegistrationResult,
  AccountMode,
  AccountStatus,
} from "../types/registrationResult";

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickString(source: ApiRecord, key: string, fallback = ""): string {
  const value = source[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function pickOptionalString(source: ApiRecord, key: string): string | null {
  const value = source[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function pickBoolean(
  source: ApiRecord,
  key: string,
  fallback = false,
): boolean {
  return typeof source[key] === "boolean" ? source[key] : fallback;
}

export function normalizeRegistrationResult(raw: unknown): RegistrationResult {
  const item = unwrapItemResponse<ApiRecord>(raw, "Registration result");

  return {
    registrationId: pickString(item, "registrationId"),
    student: normalizeStudent(item.student),
    guardians: Array.isArray(item.guardians)
      ? item.guardians.map(normalizeGuardian)
      : [],
    enrollment: normalizeEnrollment(item.enrollment),
    parentAccounts: Array.isArray(item.parentAccounts)
      ? item.parentAccounts.map(normalizeAccountResult)
      : [],
    studentAccount: normalizeAccountResult(item.studentAccount),
    warnings: Array.isArray(item.warnings) ? item.warnings.map(String) : [],
    createdAt: pickString(item, "createdAt"),
    completedAt: pickString(item, "completedAt"),
  };
}

function normalizeAccountResult(raw: unknown): RegistrationAccountResult {
  const item = isRecord(raw) ? raw : {};

  return {
    target: pickString(item, "target") === "parent" ? "parent" : "student",
    guardianId: pickOptionalString(item, "guardianId") ?? undefined,
    mode: normalizeAccountMode(pickString(item, "mode", "none")),
    status: normalizeAccountStatus(pickString(item, "status", "skipped")),
    user: isRecord(item.user) ? normalizeAccountUser(item.user) : undefined,
    temporaryPassword:
      pickOptionalString(item, "temporaryPassword") ?? undefined,
  };
}

function normalizeAccountUser(item: ApiRecord): RegistrationAccountUser {
  return {
    fullName: pickString(item, "fullName"),
    username: pickOptionalString(item, "username"),
    loginEmail: pickString(item, "loginEmail"),
    contactEmail: pickOptionalString(item, "contactEmail"),
    userType: pickString(item, "userType") === "parent" ? "parent" : "student",
    roleKey: pickString(item, "roleKey"),
    roleName: pickString(item, "roleName"),
    credentialStatus: pickString(item, "credentialStatus"),
    hasPassword: pickBoolean(item, "hasPassword"),
    mustChangePassword: pickBoolean(item, "mustChangePassword"),
  };
}

function normalizeAccountMode(value: string): AccountMode {
  if (value === "create" || value === "link" || value === "none") {
    return value;
  }
  return "none";
}

function normalizeAccountStatus(value: string): AccountStatus {
  if (
    value === "created" ||
    value === "linked" ||
    value === "failed" ||
    value === "skipped"
  ) {
    return value;
  }
  return "skipped";
}
```

---

## 4. Add Registration API Service

Create:

```text
src/features/students-guardians/registration/services/studentRegistrationApiService.ts
```

Suggested implementation:

```ts
import { apiPost } from "@/lib/api";
import { normalizeRegistrationResult } from "../utils/registrationResultMapper";
import type { RegistrationResult } from "../types/registrationResult";
import type { StudentRegistrationRequest } from "../types/registrationRequest";

const REGISTRATION_PATH = "/students-guardians/registrations";

export async function createStudentRegistration(
  payload: StudentRegistrationRequest,
): Promise<RegistrationResult> {
  const response = await apiPost<unknown>(REGISTRATION_PATH, payload);
  return normalizeRegistrationResult(response);
}
```

---

## 5. Keep the Wizard Open After Submit

Do not close the modal immediately after success.

Bad pattern:

```ts
showToast("Registration completed", "success");
onClose();
```

Better pattern:

```ts
const [registrationResult, setRegistrationResult] =
  useState<RegistrationResult | null>(null);

const submit = async () => {
  const result = await createStudentRegistration(payload);
  setRegistrationResult(result);
};
```

Then render:

```tsx
{
  registrationResult ? (
    <RegistrationResultPanel result={registrationResult} />
  ) : (
    <RegistrationWizardForm />
  );
}
```

---

## 6. Registration Result Screen

The result screen should contain four main sections.

### A. Registration Created

Show:

- Student name
- Registration ID
- Student profile link
- Created time
- Completed time

Primary action:

```text
View Student Profile
```

Route format:

```ts
`/${lang}/students-guardians/students/${result.student.id}`;
```

### B. Enrollment Summary

Show:

- Academic year
- Grade
- Section
- Classroom
- Enrollment date
- Status

Example:

```text
Academic Year: Sprint 1B Academic Year 1778166301757
Grade: Grade One
Section: Mathmatics Section
Classroom: Class 1/1
Enrollment Date: 2026-07-02
Status: active
```

### C. Guardian Summary

Show each guardian:

- Full name
- Relation
- Phone
- Primary badge
- Can pickup badge
- Can receive notifications badge

Example:

```text
Ahmed Mostafa
parent
+201001112233
Primary guardian
Can pickup
Receives notifications
```

### D. Account Credentials

For each created account, show a credential card.

Example parent account:

```text
Parent Account Created

Username: ahmed221
Login Email: ahmed221@school.edu
Contact Email: lofylofy56@gmail.com
Temporary Password: MZ-748B-XHVY-JCY7-MS6Z
```

Example student account:

```text
Student Account Created

Username: ahmedmostafa657
Login Email: ahmedmostafa657@school.edu
Contact Email: lofylofy56@gmail.com
Temporary Password: MZ-PXFH-LJQT-8UB3-ELMW
```

Actions:

- Copy username
- Copy login email
- Copy temporary password
- Copy all credentials
- Show/hide password

---

## 7. Temporary Password Handling

Temporary passwords are sensitive one-time information.

Rules:

- Do not show them in toast messages.
- Do not put them in the URL.
- Do not store them in `localStorage`.
- Do not persist them in global state.
- Do not log them.
- Keep them only in local React state while the result panel is open.
- Clear them when the modal/page closes.
- Mask passwords by default.
- Provide a show/hide toggle.
- Provide copy buttons.

Add a confirmation checkbox:

```text
I have copied/saved the temporary credentials.
```

Recommended behavior:

- Disable final close button until checked, or
- Show a confirmation dialog if the user closes without checking it.

---

## 8. Account Status Handling

The account result can have these statuses:

```ts
"created" | "linked" | "failed" | "skipped";
```

Recommended UI behavior:

| Status    | UI treatment                                                     |
| --------- | ---------------------------------------------------------------- |
| `created` | Green success card with credentials if temporary password exists |
| `linked`  | Green success card, no password                                  |
| `failed`  | Red/amber warning card with retry/recovery note                  |
| `skipped` | Amber warning card                                               |

Example status logic:

```ts
const hasAccountFailures =
  result.studentAccount.status === "failed" ||
  result.parentAccounts.some((account) => account.status === "failed");

const hasWarnings = result.warnings.length > 0;

const isFullSuccess = !hasAccountFailures && !hasWarnings;
```

---

## 9. Warning and Partial-Success Handling

The backend can return a valid registration with account warnings.

Possible warnings:

```text
parent_account_failed:<guardianId>
student_account_failed
parent_account_skipped:<guardianId>
student_account_skipped
```

Important:

If `registrationId` exists, the core registration succeeded.

Do not show:

```text
Registration failed
```

Instead show:

```text
Registration completed with warnings
```

The result screen should make clear:

- student was created
- guardian records were created or linked
- enrollment was created
- one or more account steps failed or were skipped

---

## 10. Recommended Result State Logic

```ts
const coreCreated = Boolean(
  result.registrationId &&
  result.student?.id &&
  result.enrollment?.enrollmentId,
);

const hasWarnings = result.warnings.length > 0;

const hasAccountFailures =
  result.studentAccount.status === "failed" ||
  result.parentAccounts.some((account) => account.status === "failed");

const resultTone = !coreCreated
  ? "error"
  : hasWarnings || hasAccountFailures
    ? "warning"
    : "success";
```

UI labels:

```ts
const title =
  resultTone === "success"
    ? "Registration completed"
    : resultTone === "warning"
      ? "Registration completed with warnings"
      : "Registration failed";
```

---

## 11. Refresh Students List After Closing

The Students page currently loads data into local state.

After closing the result screen, reload the students list.

Recommended pattern:

```ts
const loadStudents = useCallback(async () => {
  const data =
    yearId && termId
      ? await studentsService.fetchStudentsWithEnrollmentForContext(
          yearId,
          termId,
        )
      : await studentsService.fetchStudentsWithEnrollment();

  setStudentsWithEnrollment(data);
}, [yearId, termId]);
```

Then after registration result closes:

```ts
await loadStudents();
```

---

## 12. Enable the Add Student Button

The Students page currently has an Add Student button that is disabled / coming soon.

Recommended behavior:

- Enable Add Student.
- Open the Student Registration Wizard.
- Submit to `/students-guardians/registrations`.
- Show `RegistrationResultPanel`.
- On close, reload students list.
- Provide `View Student Profile` action.

---

## 13. Suggested `RegistrationResultPanel` Structure

Create:

```text
src/features/students-guardians/registration/components/RegistrationResultPanel.tsx
```

Responsibilities:

- display final success / warning state
- show student summary
- show enrollment summary
- show guardians summary
- show account statuses
- show credentials safely
- expose final actions

Props:

```ts
interface RegistrationResultPanelProps {
  result: RegistrationResult;
  onViewStudentProfile: (studentId: string) => void;
  onClose: () => void;
}
```

---

## 14. Suggested `RegistrationCredentialsCard` Structure

Create:

```text
src/features/students-guardians/registration/components/RegistrationCredentialsCard.tsx
```

Responsibilities:

- show account target
- show account status
- show username
- show login email
- show temporary password, masked by default
- copy values
- handle failed/skipped/linked states

Props:

```ts
interface RegistrationCredentialsCardProps {
  account: RegistrationAccountResult;
  guardianName?: string;
}
```

---

## 15. Example Final UX

```text
Registration completed

Student
Ahmed Mostafa
View Student Profile

Enrollment
Sprint 1B Academic Year 1778166301757
Grade One / Mathmatics Section / Class 1/1

Guardians
Ahmed Mostafa — parent — Primary

Accounts

Student account created
Login: ahmedmostafa657@school.edu
Username: ahmedmostafa657
Temporary password: ••••••••••••••••••••
[Show] [Copy]

Parent account created
Login: ahmed221@school.edu
Username: ahmed221
Temporary password: ••••••••••••••••••••
[Show] [Copy]

[ ] I have copied the temporary credentials

[View Student Profile] [Close]
```

---

## 16. Implementation Summary

Best implementation:

1. Add registration response types.
2. Add registration result mapper.
3. Add registration API service.
4. Submit registration through the service.
5. Store result in local component state.
6. Replace the wizard form with a result panel after success.
7. Show credentials in secure cards.
8. Treat warnings as partial success.
9. Keep modal/page open until credentials are copied or acknowledged.
10. Reload students list after close.
11. Add `View Student Profile` action.

---

## Final Recommendation

Handle this backend response {
"registrationId": "8738ba42-992f-4755-bc82-00f7fcca9fb1",
"student": {
"id": "8738ba42-992f-4755-bc82-00f7fcca9fb1",
"student_id": null,
"name": "Ahmed Mostafa",
"first_name_en": "Ahmed",
"father_name_en": null,
"grandfather_name_en": null,
"family_name_en": "Mostafa",
"first_name_ar": "Ahmed",
"father_name_ar": null,
"grandfather_name_ar": null,
"family_name_ar": "Mostafa",
"full_name_en": "Ahmed Mostafa",
"full_name_ar": "Ahmed Mostafa",
"dateOfBirth": "2020-02-02",
"date_of_birth": "2020-02-02",
"gender": "male",
"nationality": "adfdaf",
"status": "Active",
"contact": {
"address_line": "Fayoum - Al Gharaq Rd, Massara Arafa",
"city": "Atsa",
"district": "dafadfadf",
"student_phone": "+201001112233",
"student_email": "lofylofy456@gmail.com"
},
"created_at": "2026-07-02T05:05:15.218Z",
"updated_at": "2026-07-02T05:05:15.218Z"
},
"guardians": [
{
"guardianId": "5384ae79-49ce-4cbc-9123-6d86f2aec693",
"full_name": "Ahmed Mostafa",
"relation": "parent",
"phone_primary": "+201001112233",
"phone_secondary": "+201001112233",
"email": "lofylofy456@gmail.com",
"national_id": "5445345345",
"job_title": "jhkfg",
"workplace": "fhjkhjk",
"is_primary": true,
"can_pickup": true,
"can_receive_notifications": true
}
],
"enrollment": {
"enrollmentId": "009a9e32-5ccc-4e1d-8b49-4921d5dd2e07",
"studentId": "8738ba42-992f-4755-bc82-00f7fcca9fb1",
"academicYear": "Sprint 1B Academic Year 1778166301757",
"academicYearId": "96118bb1-c65b-4b14-9f74-e051ddb79c1d",
"grade": "Grade One",
"section": "Mathmatics Section",
"classroom": "Class 1/1",
"gradeId": "ee67a2a5-d5f5-4174-b05b-5977bdc5e47a",
"sectionId": "2c2d4904-3074-4ce2-9d17-6ad4bbdb148d",
"classroomId": "955cec0e-0511-4336-a6b8-5fde8f8ac46b",
"enrollmentDate": "2026-07-02",
"status": "active"
},
"parentAccounts": [
{
"target": "parent",
"guardianId": "5384ae79-49ce-4cbc-9123-6d86f2aec693",
"mode": "create",
"status": "created",
"user": {
"fullName": "Ahmed Mostafa",
"username": "ahmed221",
"loginEmail": "ahmed221@school.edu",
"contactEmail": "lofylofy56@gmail.com",
"userType": "parent",
"roleKey": "parent",
"roleName": "Parent",
"credentialStatus": "temporary_or_must_change",
"hasPassword": true,
"mustChangePassword": true
},
"temporaryPassword": "MZ-748B-XHVY-JCY7-MS6Z"
}
],
"studentAccount": {
"target": "student",
"mode": "create",
"status": "created",
"user": {
"fullName": "Ahmed Mostafa",
"username": "ahmedmostafa657",
"loginEmail": "ahmedmostafa657@school.edu",
"contactEmail": "lofylofy56@gmail.com",
"userType": "student",
"roleKey": "student",
"roleName": "Student",
"credentialStatus": "temporary_or_must_change",
"hasPassword": true,
"mustChangePassword": true
},
"temporaryPassword": "MZ-PXFH-LJQT-8UB3-ELMW"
},
"warnings": [],
"createdAt": "2026-07-02T05:05:15.218Z",
"completedAt": "2026-07-02T05:05:15.403Z"
} as a **structured registration result** with a dedicated success / partial-success screen.

A toast is not enough because the response contains:

- created student data
- created guardian data
- created enrollment data
- account status data
- temporary passwords
- possible warnings

The safest and cleanest UX is:

```text
Submit → Normalize response → Show result panel → Copy credentials → View student profile / close → Reload list
```
