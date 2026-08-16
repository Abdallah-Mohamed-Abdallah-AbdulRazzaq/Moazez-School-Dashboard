# Backend Registration Validations

This file summarizes the backend validations for the Student Registration Wizard in `Moazez-Backend`.

Repository reviewed:

- `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`
- Main endpoint: `POST /api/v1/students-guardians/registrations`
- Main DTO: `src/modules/students/registration/dto/school-registration.dto.ts`
- Main use case: `src/modules/students/registration/application/create-school-registration.use-case.ts`

---

## 1. Global Request Validation

The backend uses NestJS `ValidationPipe` globally with:

```ts
whitelist: true
forbidNonWhitelisted: true
transform: true
transformOptions: { enableImplicitConversion: false }
```

### Frontend implication

Do **not** send UI-only fields in the registration payload.

Do not send fields like:

- local row IDs
- selector display labels
- cached option objects
- staged-flow metadata
- frontend-only account state
- raw component state

The payload should only contain fields defined by the backend DTO.

---

## 2. Top-Level Registration Validation

The registration request must contain:

```ts
{
  student: {...},
  guardians: [...],
  enrollment: {...},
  studentAccount?: {...}
}
```

### Backend rules

- `student` is required.
- `guardians` is required.
- `guardians` must be an array.
- `guardians` must contain at least one guardian.
- `enrollment` is required.
- `studentAccount` is optional.
- Each guardian must include a `profile`.
- Guardian `relationship` is optional.
- Guardian `account` is optional.

### Frontend implication

Even though `studentAccount` and `guardian.account` are optional in the backend, the wizard product rule says accounts are mandatory. So the frontend must enforce account selection before submit.

---

## 3. Student DTO Validation

### Student fields

| Field | Backend validation |
|---|---|
| `name` | optional string, max 200 |
| `first_name_en` | optional string, max 120 |
| `father_name_en` | optional string, max 120 |
| `grandfather_name_en` | optional string, max 120 |
| `family_name_en` | optional string, max 120 |
| `first_name_ar` | optional string, max 120 |
| `father_name_ar` | optional string, max 120 |
| `grandfather_name_ar` | optional string, max 120 |
| `family_name_ar` | optional string, max 120 |
| `full_name_en` | optional string, max 200 |
| `full_name_ar` | optional string, max 200 |
| `dateOfBirth` | optional ISO date string |
| `date_of_birth` | optional ISO date string |
| `gender` | optional string, max 50 |
| `nationality` | optional string, max 120 |
| `status` | optional backend student status value |

### Student contact fields

| Field | Backend validation |
|---|---|
| `contact.address_line` | optional string, max 300 |
| `contact.city` | optional string, max 120 |
| `contact.district` | optional string, max 120 |
| `contact.student_phone` | optional phone number | must be a valid phone number
| `contact.student_email` | optional email, max 200 |

---

## 4. Student Domain Validation

DTO fields look optional, but the use case requires a valid resolvable student name.

### Backend rules

- Student must resolve to a first name and last/family name.
- Backend can derive names from:
  - `first_name_en` + `family_name_en`
  - `full_name_en`
  - `name`
  - Arabic name fields
  - `full_name_ar`
- If a full name is used, it must contain at least two parts.
- If both `dateOfBirth` and `date_of_birth` are sent, they must match.
- Birth date is parsed as midnight UTC.
- Invalid birth date is rejected.

### Frontend implication

Require one of these valid name combinations:

```ts
first_name_en + family_name_en
```

or:

```ts
full_name_en with at least two words
```

or the equivalent Arabic fields.

Do not send both `dateOfBirth` and `date_of_birth` unless they are identical. Prefer sending only `dateOfBirth`.

---

## 5. Guardian DTO Validation

### Guardian profile fields

| Field | Backend validation |
|---|---|
| `profile.full_name` | optional string, max 200 |
| `profile.first_name` | optional string, max 120 |
| `profile.last_name` | optional string, max 120 |
| `profile.relation` | optional string, max 100 |
| `profile.phone_primary` | optional phone number | must be a valid phone number
| `profile.phone_secondary` | optional phone number | must be a valid phone number
| `profile.email` | optional email, max 200 |
| `profile.national_id` | optional string, max 30 |
| `profile.job_title` | optional string, max 120 |
| `profile.workplace` | optional string, max 200 |
| `profile.can_pickup` | optional boolean |
| `profile.can_receive_notifications` | optional boolean |

### Guardian relationship fields

| Field | Backend validation |
|---|---|
| `relationship.is_primary` | optional boolean |

---

## 6. Guardian Domain Validation

Like student fields, guardian DTO fields look optional but the use case requires several fields.

### Backend rules

- Guardian must resolve to first name and last name.
- `full_name` must contain at least two parts if used.
- `relation` is required.
- `relation` is normalized to lowercase.
- `phone_primary` is required.
- Optional text fields are trimmed.
- Empty strings become `null`.

### Frontend implication

For each new guardian, require:

```ts
full_name with at least two words
```

or:

```ts
first_name + last_name
```

Also require:

```ts
relation
phone_primary
```

---

## 7. Primary Guardian Validation

### Backend behavior

The backend does **not** enforce exactly one primary guardian.

Instead:

- If one or more guardians have `relationship.is_primary === true`, the backend uses the first one.
- If none is marked primary, the backend makes the first guardian primary.

### Frontend implication

The wizard must enforce:

```ts
exactly one primary guardian
```

This is a frontend/product validation, not a backend validation.

---

## 8. Enrollment DTO Validation

### Enrollment fields

| Field | Backend validation |
|---|---|
| `academicYearId` | optional UUID |
| `academicYear` | optional string, max 120 |
| `grade` | optional string, max 120 |
| `section` | optional string, max 120 |
| `classroom` | optional string, max 120 |
| `gradeId` | optional UUID |
| `sectionId` | optional UUID |
| `classroomId` | required UUID |
| `termId` | optional UUID |
| `enrollmentDate` | required ISO date string |
| `status` | optional, must be `active` |

---

## 9. Enrollment Use-Case Validation

### Backend rules

- `academicYearId` or `academicYear` is required.
- If `academicYearId` is sent, it must exist.
- If `academicYear` is sent, it must resolve to an existing academic year.
- Academic year must be active.
- `termId`, if sent, must exist.
- `termId` must belong to the selected academic year.
- `classroomId` must exist.
- If `sectionId` is sent, the classroom must belong to that section.
- Backend loads the classroom section automatically.
- If `gradeId` is sent, the section must belong to that grade.
- `status`, if sent, must be `active`.

### Frontend implication

Use dependent selectors in this order:

```text
Academic Year → Term → Grade → Section → Classroom
```

Reset children whenever parent selection changes.

Example:

- Changing academic year resets term, grade, section, classroom.
- Changing grade resets section and classroom.
- Changing section resets classroom.

---

## 10. Account DTO Validation

### Account fields

| Field | Backend validation |
|---|---|
| `mode` | required, one of `none`, `create`, `link` |
| `userId` | required UUID only when `mode = link` |
| `fullName` | optional string, max 200 |
| `username` | required string max 64 only when `mode = create` |
| `contactEmail` | optional email, max 200 |
| `generatePassword` | optional boolean |
| `temporaryPasswordMode` | optional, one of `generate`, `none` |
| `roleId` | optional UUID |

### Registration use-case rules

Before creating records, the registration use case checks:

- invalid account mode is rejected.
- `create` mode without a non-empty `username` is rejected.
- `link` mode without `userId` is rejected.
- `none` mode is allowed by backend.

### Frontend implication

The wizard should not expose `none`.

For every required account card:

```ts
mode = create → username is required
mode = link → userId is required
```

---

## 11. Guardian Account Linking Validation

For guardian account creation/linking, backend validates:

- Guardian must exist.
- Guardian must not already have a linked `userId`.
- In `link` mode:
  - user must exist.
  - user must have `UserType.PARENT`.
  - user must not already be linked to another guardian.
- In `create` mode:
  - username is required.
  - parent role must exist.
  - provided `roleId`, if any, must resolve to a valid parent role.
- If password generation is enabled, backend generates a temporary password.
- Generated temporary password can be returned in the registration response.

### Frontend implication

For existing guardians with an already linked account, treat the account requirement as already satisfied/read-only. Do not submit another account link request.

---

## 12. Student Account Linking Validation

For student account creation/linking, backend validates:

- Student must exist.
- Student must not already have a linked `userId`.
- In `link` mode:
  - user must exist.
  - user must have `UserType.STUDENT`.
  - user must not already be linked to another student.
- In `create` mode:
  - username is required.
  - student role must exist.
  - provided `roleId`, if any, must resolve to a valid student role.
- If password generation is enabled, backend generates a temporary password.
- Generated temporary password can be returned in the registration response.

---

## 13. Account Failures After Core Registration

The backend creates the core registration first:

- student
- new guardian profiles
- student-guardian links
- enrollment

Then it attempts account operations.

If account creation/linking fails:

- the core registration remains durable.
- backend returns warning strings.
- account summary status becomes `failed`.

Possible warning formats:

```text
parent_account_failed:<guardianId>
student_account_failed
parent_account_skipped:<guardianId>
student_account_skipped
```

### Frontend implication

The result screen must support partial success:

- show student created
- show guardians created/linked
- show enrollment created
- show account failures clearly
- show retry/recovery context
- do not automatically recreate the student

---

## 14. Seat Limit Validation

Before creating registration records, backend calls the student seat limit policy:

```ts
assertCanIncreaseActiveStudentSeats({
  schoolId,
  reason: 'registration_wizard'
})
```

### Frontend implication

Registration may fail before creation if the school cannot add another active student. Show this as a form-level/backend error.

---

## 15. Recommended Frontend Validation Checklist

Use this checklist in the wizard implementation.

### Student step

- [ ] Require student first name and family name, or valid full name with at least two parts.
- [ ] Enforce max lengths.
- [ ] Validate ISO date.
- [ ] Do not send both birth date aliases unless equal.
- [ ] Validate email format.
- [ ] Validate phone format.

### Guardians step

- [ ] Require at least one guardian.
- [ ] For each new guardian, require first/last name or full name with at least two parts.
- [ ] Require relation.
- [ ] Require primary phone.
- [ ] Validate email format.
- [ ] Validate phone formats.
- [ ] Enforce max lengths.
- [ ] Enforce exactly one primary guardian.

### Accounts step

- [ ] Require account decision for student.
- [ ] Require account decision for every guardian unless existing guardian account is already linked and read-only.
- [ ] Do not expose backend `none`.
- [ ] For create mode, require username.
- [ ] For link mode, require selected user UUID.
- [ ] Validate contact email.
- [ ] Validate role ID if selected.
- [ ] Prevent linking parent account to student or student account to guardian.
- [ ] Prevent re-linking already linked student/guardian accounts.

### Enrollment step

- [ ] Require academic year.
- [ ] Require classroom.
- [ ] Require enrollment date.
- [ ] Keep status active.
- [ ] Validate dependent selector hierarchy.
- [ ] Reset child selectors when parent changes.

### Review / submit

- [ ] Strip UI-only fields.
- [ ] Submit atomic endpoint only when all guardians are new.
- [ ] Use staged flow when any existing guardian is selected.
- [ ] Disable duplicate submit.
- [ ] Map backend field errors to inputs where possible.
- [ ] Show account warnings as partial success, not generic failure.
